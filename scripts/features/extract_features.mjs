// ============================================================================
//  extract_features.mjs — Extraction des capacités (traits raciaux + capacités
//  de classe) depuis les chunks, via l'API Anthropic. (local, dev only)
// ----------------------------------------------------------------------------
//  Entrée  : features_sections.json (produit par build_sections.py)
//  Sorties : features.json      (lignes = table `features`)
//            seed_features.sql   (upsert idempotent sur slug)
//
//  La source (race/classe) est DÉDUITE par le modèle depuis le contenu.
//  Le modèle ignore l'ambiance, les listes de sorts, l'OGL, les tables brutes.
//
//  Variables d'env : ANTHROPIC_API_KEY, ANTHROPIC_MODEL (optionnel).
//  Lancement :
//    node --env-file=.env scripts/features/extract_features.mjs
//    node --env-file=.env scripts/features/extract_features.mjs --dry-run --limit 3
// ============================================================================

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL = "claude-haiku-4-5-20251001" } = process.env;
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY manquant.");
  process.exit(1);
}

const ICI = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const getArg = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const LIMIT = parseInt(getArg("--limit", "0"), 10) || Infinity; // nb de chunks
const DRY_RUN = args.includes("--dry-run");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

const SYSTEME = `Tu extrais les CAPACITÉS de personnage du SRD 5e (français) depuis un extrait de texte brut (races et classes).
Pour chaque capacité RÉELLE (trait racial ou capacité de classe), renvoie un objet :
- "nom" : nom exact de la capacité (ex. "Vision dans le noir", "Second souffle").
- "type" : "race" ou "classe".
- "source" : la race ou la classe d'origine, déduite du contenu (ex. "Gnome", "Guerrier", "Barbare"). Les capacités sont distinctives (Rage→Barbare, Ki→Moine, Attaque sournoise→Roublard, Conduit divin→Clerc…).
- "sous_source" : sous-race ou sous-classe si précisée, sinon null.
- "niveau" : entier si la capacité de classe est obtenue à un niveau donné, sinon null.
- "description" : le texte de la capacité, fidèle, en français.

IGNORE : texte d'ambiance/narratif, listes de sorts, tables d'aptitudes brutes (colonnes de niveaux), la licence OGL, et tout ce qui n'est pas une capacité. Si l'extrait n'en contient aucune, renvoie [].
Si tu ne peux pas déterminer la source avec confiance, mets "source" à null.
Réponds UNIQUEMENT par un tableau JSON, sans texte ni Markdown autour.`;

async function extraireChunk(texte) {
  for (let t = 1; t <= 4; t++) {
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
        messages: [{ role: "user", content: texte }],
      }),
    });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * t); continue; }
    if (!res.ok) throw new Error(`API ${res.status} : ${await res.text()}`);
    const data = await res.json();
    const txt = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const m = txt.match(/\[[\s\S]*\]/);
    if (!m) return [];
    try { return JSON.parse(m[0]); } catch { return []; }
  }
  throw new Error("Échec après plusieurs tentatives.");
}

function sqlVal(v) {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

async function main() {
  const sections = JSON.parse(readFileSync(join(ICI, "features_sections.json"), "utf-8"));
  const parSlug = new Map();
  let vus = 0;

  for (const sec of sections) {
    if (vus >= LIMIT) break;
    vus++;
    process.stdout.write(`Chunk ${sec.i} … `);
    let caps;
    try { caps = await extraireChunk(sec.texte); }
    catch (e) { console.error("échec :", e.message); continue; }

    let ajoutes = 0;
    for (const c of caps) {
      if (!c?.nom || !c?.source || !c?.description) continue; // source/nom requis
      const type = c.type === "race" ? "race" : "classe";
      const slug = slugify(`${c.source}-${c.sous_source ? c.sous_source + "-" : ""}${c.nom}`);
      if (parSlug.has(slug)) continue;
      parSlug.set(slug, {
        slug, nom: c.nom, type, source: c.source,
        sous_source: c.sous_source ?? null,
        niveau: Number.isInteger(c.niveau) ? c.niveau : null,
        description: c.description,
      });
      ajoutes++;
    }
    console.log(`${caps.length} lus, ${ajoutes} nouveaux (total ${parSlug.size})`);
    await sleep(300);
  }

  const lignes = [...parSlug.values()].sort(
    (a, b) => a.type.localeCompare(b.type) || a.source.localeCompare(b.source) ||
      (a.niveau ?? 0) - (b.niveau ?? 0) || a.nom.localeCompare(b.nom));

  if (DRY_RUN) {
    console.log(`\n[DRY-RUN] ${lignes.length} capacités extraites :`);
    for (const l of lignes.slice(0, 40))
      console.log(`  [${l.type}] ${l.source}${l.sous_source ? "/" + l.sous_source : ""}${l.niveau ? " niv." + l.niveau : ""} — ${l.nom}`);
    return;
  }

  writeFileSync(join(ICI, "features.json"), JSON.stringify(lignes, null, 2), "utf-8");

  const cols = ["slug", "nom", "type", "source", "sous_source", "niveau", "description"];
  const sql = ["-- Seed idempotent de la table `features` (SRD 5.1 FR, AideDD).", "begin;"];
  for (const l of lignes) {
    const vals = cols.map((c) => sqlVal(l[c])).join(", ");
    sql.push(
      `insert into features (${cols.join(", ")}) values (${vals})\n` +
      `on conflict (slug) do update set ` +
      cols.filter((c) => c !== "slug").map((c) => `${c} = excluded.${c}`).join(", ") + ";");
  }
  sql.push("commit;");
  writeFileSync(join(ICI, "seed_features.sql"), sql.join("\n"), "utf-8");
  console.log(`\nÉcrit : features.json + seed_features.sql (${lignes.length} capacités).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
