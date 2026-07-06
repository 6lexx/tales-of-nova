// ============================================================================
//  translate_spells.mjs — Passe de traduction FR des sorts (local, dev only)
// ----------------------------------------------------------------------------
//  Lit les sorts non traduits (source = 'SRD 5.1'), traduit nom + description
//  (+ aux_niveaux_superieurs) via l'API Anthropic en batch, met à jour par slug
//  et bascule source → 'SRD 5.1 FR'. Reprenable, idempotent.
//
//  ⚠ Script LOCAL uniquement : utilise la clé service_role et la clé API
//  Anthropic — ne jamais embarquer côté client.
//
//  Prérequis : Node ≥ 20, @supabase/supabase-js.
//  Variables d'env (via .env) :
//    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
//    ANTHROPIC_MODEL (optionnel, défaut ci-dessous)
//
//  Lancement :
//    node --env-file=.env scripts/spells/translate_spells.mjs --limit 50 --batch 8
//    node --env-file=.env scripts/spells/translate_spells.mjs --dry-run --limit 4
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const {
  SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL = "claude-haiku-4-5-20251001", // suffisant et économique pour de la traduction
} = process.env;
// URL : réutilise VITE_SUPABASE_URL du .env existant (sinon SUPABASE_URL)
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

// --- Args CLI ---------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (nom, defaut) => {
  const i = args.indexOf(nom);
  return i >= 0 && args[i + 1] ? args[i + 1] : defaut;
};
const LIMIT = parseInt(getArg("--limit", "50"), 10); // sorts max à traiter ce run
const BATCH = parseInt(getArg("--batch", "8"), 10); // sorts par appel API
const DRY_RUN = args.includes("--dry-run");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error("Variables d'env manquantes (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ANTHROPIC_API_KEY).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, n) =>
  Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

// --- Prompt de traduction ---------------------------------------------------
const SYSTEME = `Tu es traducteur spécialisé D&D 5e (SRD 5.1) EN→FR.
Traduis fidèlement en français, avec la terminologie officielle française :
"saving throw" → "jet de sauvegarde", "spell attack" → "attaque de sort",
"hit points" → "points de vie", "creature" → "créature", "cast" → "lancer", etc.
Règles impératives :
- NE MODIFIE JAMAIS les valeurs chiffrées, dés (ex. 1d6, 3d8), distances, durées.
- Conserve les sauts de ligne et la mise en forme.
- Traduis le nom du sort par son nom officiel français.
Réponds UNIQUEMENT par un tableau JSON, sans texte ni balises Markdown autour :
[{"slug":"...","nom":"...","description":"...","aux":"... ou null"}]`;

async function traduireBatch(lot) {
  const payload = lot.map((s) => ({
    slug: s.slug,
    nom_en: s.nom_en ?? s.nom,
    description: s.description,
    aux: s.aux_niveaux_superieurs ?? null,
  }));

  for (let tentative = 1; tentative <= 4; tentative++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        system: SYSTEME,
        messages: [{ role: "user", content: JSON.stringify(payload) }],
      }),
    });

    if (res.status === 429 || res.status >= 500) {
      const attente = 2000 * tentative;
      console.warn(`  ⏳ ${res.status}, nouvelle tentative dans ${attente}ms…`);
      await sleep(attente);
      continue;
    }
    if (!res.ok) throw new Error(`API ${res.status} : ${await res.text()}`);

    const data = await res.json();
    const texte = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    const m = texte.match(/\[[\s\S]*\]/); // extraire le tableau JSON
    if (!m) throw new Error("Réponse sans JSON exploitable : " + texte.slice(0, 200));
    return JSON.parse(m[0]);
  }
  throw new Error("Échec après plusieurs tentatives (429/5xx).");
}

// --- Boucle principale ------------------------------------------------------
async function main() {
  const { data: sorts, error } = await supabase
    .from("spells")
    .select("slug, nom, nom_en, description, aux_niveaux_superieurs")
    .eq("source", "SRD 5.1")
    .order("niveau", { ascending: true })
    .limit(LIMIT);

  if (error) throw error;
  if (!sorts.length) {
    console.log("Rien à traduire (aucune ligne source = 'SRD 5.1').");
    return;
  }
  console.log(`${sorts.length} sort(s) à traduire — ${DRY_RUN ? "DRY-RUN" : "écriture"} — modèle ${ANTHROPIC_MODEL}`);

  let ok = 0;
  for (const [idx, lot] of chunk(sorts, BATCH).entries()) {
    process.stdout.write(`Lot ${idx + 1} (${lot.length}) … `);
    let trad;
    try {
      trad = await traduireBatch(lot);
    } catch (e) {
      console.error("échec :", e.message);
      continue;
    }
    const parSlug = new Map(trad.map((t) => [t.slug, t]));

    for (const s of lot) {
      const t = parSlug.get(s.slug);
      if (!t?.nom || !t?.description) {
        console.warn(`\n  ⚠ traduction absente pour ${s.slug}`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`\n  ${s.nom_en} → ${t.nom}`);
        ok++;
        continue;
      }
      const { error: upErr } = await supabase
        .from("spells")
        .update({
          nom: t.nom,
          description: t.description,
          aux_niveaux_superieurs: t.aux ?? s.aux_niveaux_superieurs ?? null,
          source: "SRD 5.1 FR",
        })
        .eq("slug", s.slug);
      if (upErr) console.error(`\n  ✗ update ${s.slug} :`, upErr.message);
      else ok++;
    }
    console.log("ok");
    await sleep(500); // respiration entre lots
  }
  console.log(`Terminé : ${ok}/${sorts.length} traité(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
