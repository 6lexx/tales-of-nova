import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Sparkles, Swords, ScrollText, BookOpen, ShieldCheck,
  Plus, Minus, Wand2, Tag, Heart, Shield, Footprints, Eye, Zap, Star,
} from "lucide-react";
import { genererHistoire as genererHistoireIA } from "../services/histoireService";
import { createCharacter } from "../services/characterService";
import { initFicheGuerrier } from "../services/guerrierService";
import { STYLES_COMBAT } from "../data/classes/guerrier.js";
import { ARMURES } from "../data/equipement/armures.js";
import { ARMES } from "../data/equipement/armes.js";
import { supabase } from "../lib/supabase";
import { equiperPaquetageDepart } from "../services/inventaireService";

/* ──────────────────────────────────────────────────────────
   CHARTE GRAPHIQUE — alignée sur l'écran de jeu principal
   ────────────────────────────────────────────────────────── */
const C = {
  bg: "#0a0b0f",
  bgPanel: "#0f1118",
  bgCard: "#13161f",
  bgInput: "#1a1e2b",
  border: "#252a3a",
  borderGlow: "#4a3a6e",
  violet: "#7b5ea7",
  violetDim: "#3d2f5a",
  gold: "#c9a84c",
  goldDim: "#6b5520",
  red: "#b84040",
  teal: "#3a8a8a",
  textPrime: "#e8e0f0",
  textSub: "#8a8aaa",
  textMuted: "#4a4a6a",
  gradGold: "linear-gradient(135deg, #c9a84c 0%, #8a6020 100%)",
  gradViolet: "linear-gradient(135deg, #7b5ea7 0%, #3d2060 100%)",
  gradPage: "radial-gradient(1200px 600px at 50% -10%, #160f24 0%, #0a0b0f 55%)",
};

/* ── DONNÉES DE JEU ───────────────────────────────────────── */
/* Sous-races SRD dont les traits existent dans features (par id d'espèce) */
const SUB_RACES = {
  elfe: ["Haut-elfe", "Elfe des bois", "Elfe noir (Drow)"],
  nain: ["Nain des collines", "Nain des montagnes"],
};

const ESPECES = [
  { id: "humain", nom: "Humain", desc: "Polyvalents, ambitieux, partout chez eux.", bonus: "+1 à toutes les caractéristiques", trait: "Don supplémentaire au niveau 1",
    bonusStats: { FOR: 1, DEX: 1, CON: 1, INT: 1, SAG: 1, CHA: 1 }, bonusLibres: 0 },
  { id: "elfe", nom: "Elfe", desc: "Gracieux, perspicaces, liés à la magie.", bonus: "+2 DEX · +1 INT", trait: "Vision dans le noir · Sens aiguisés",
    bonusStats: { DEX: 2, INT: 1 }, bonusLibres: 0 },
  { id: "nain", nom: "Nain", desc: "Robustes, tenaces, gardiens de la pierre.", bonus: "+2 CON · +1 FOR", trait: "Résistance au poison · Démarche assurée",
    bonusStats: { CON: 2, FOR: 1 }, bonusLibres: 0 },
  { id: "orc", nom: "Demi-orc", desc: "Puissants, endurants, jamais à terre.", bonus: "+2 FOR · +1 CON", trait: "Acharnement · Charge agressive",
    bonusStats: { FOR: 2, CON: 1 }, bonusLibres: 0 },
  { id: "tieffelin", nom: "Tieffelin", desc: "Marqués par un héritage infernal.", bonus: "+2 CHA · +1 INT", trait: "Résistance au feu · Legs infernal",
    bonusStats: { CHA: 2, INT: 1 }, bonusLibres: 0 },
  { id: "demi-elfe", nom: "Demi-elfe", desc: "Entre deux mondes, charismatiques.", bonus: "+2 CHA · +1 au choix ×2", trait: "Ascendance féerique",
    bonusStats: { CHA: 2 }, bonusLibres: 2 },
];

const CLASSES = [
  { id: "guerrier", nom: "Guerrier", icon: Swords, de: 10, prim: "FOR / DEX", desc: "Maître des armes et des armures.", sauv: ["FOR", "CON"] },
  { id: "mage", nom: "Magicien", icon: ScrollText, de: 6, prim: "INT", desc: "Érudit des arcanes, façonneur de sorts.", sauv: ["INT", "SAG"] },
  { id: "voleur", nom: "Roublard", icon: Eye, de: 8, prim: "DEX", desc: "Discret, agile, mortel dans l'ombre.", sauv: ["DEX", "INT"] },
  { id: "clerc", nom: "Clerc", icon: ShieldCheck, de: 8, prim: "SAG", desc: "Canalise la faveur d'une divinité.", sauv: ["SAG", "CHA"] },
];

const HISTORIQUES = ["Acolyte", "Artisan", "Criminel", "Ermite", "Noble", "Sage", "Soldat", "Vagabond"];
const ALIGNEMENTS = [
  "Loyal Bon", "Neutre Bon", "Chaotique Bon",
  "Loyal Neutre", "Neutre", "Chaotique Neutre",
  "Loyal Mauvais", "Neutre Mauvais", "Chaotique Mauvais",
];

const STATS = [
  { id: "FOR", nom: "Force" },
  { id: "DEX", nom: "Dextérité" },
  { id: "CON", nom: "Constitution" },
  { id: "INT", nom: "Intelligence" },
  { id: "SAG", nom: "Sagesse" },
  { id: "CHA", nom: "Charisme" },
];

const COMPETENCES = {
  FOR: ["Athlétisme"],
  DEX: ["Acrobaties", "Discrétion", "Escamotage"],
  CON: [],
  INT: ["Arcanes", "Histoire", "Investigation", "Nature", "Religion"],
  SAG: ["Dressage", "Médecine", "Perception", "Perspicacité", "Survie"],
  CHA: ["Intimidation", "Persuasion", "Représentation", "Tromperie"],
};

const LANGUES = ["Commun", "Elfique", "Nain", "Orc", "Draconique", "Infernal", "Céleste", "Sylvestre"];

/* Point-buy D&D : coût par valeur (table "Ability Score Point Cost") */
const COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POOL = 27;
const mod = (v) => Math.floor((v - 10) / 2);
const fmtMod = (m) => (m >= 0 ? `+${m}` : `${m}`);

/* Tableau standard (PHB) — 6 valeurs à répartir */
const TABLEAU_STANDARD = [15, 14, 13, 12, 10, 8];

/* Bonus de maîtrise par niveau (table "Character Advancement"), index = niveau-1 */
const MAITRISE_NIVEAU = [2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6];
const bonusMaitrise = (niv) => MAITRISE_NIVEAU[Math.min(20, Math.max(1, niv || 1)) - 1];

/* XP requis pour atteindre chaque niveau (table "Character Advancement") */
const XP_NIVEAU = [0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];

/* Caractéristique importante par classe (table "Ability Score Summary") */
const CARAC_IMPORTANTE = {
  guerrier: ["FOR"],   // fighter → Force
  mage: ["INT"],       // wizard → Intelligence
  voleur: ["DEX"],     // rogue → Dextérité
  clerc: ["SAG"],      // cleric → Sagesse
};

/* Lancer 4d6 en gardant les 3 meilleurs */
const lancer4d6 = () => {
  const des = Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6)).sort((a, b) => b - a);
  return des[0] + des[1] + des[2];
};
const lancerSix = () => Array.from({ length: 6 }, lancer4d6);

/* Valeurs encore disponibles dans un pool, en tenant compte de celles déjà assignées */
function valeursDisponibles(pool, stats, statCourant, STATS) {
  const restant = {};
  pool.forEach((v) => { restant[v] = (restant[v] || 0) + 1; });
  STATS.forEach((s) => {
    const v = stats[s.id];
    if (s.id !== statCourant && v != null && restant[v] != null) restant[v]--;
  });
  return Object.entries(restant).filter(([, n]) => n > 0).map(([v]) => Number(v)).sort((a, b) => b - a);
}

/* ── ONGLET HISTOIRE : champs guidés + amorces ────────────── */
const CHAMPS_HISTOIRE = [
  { id: "origine", label: "Origine", hint: "D'où vient votre personnage ?",
    amorces: ["Un hameau oublié des Marches de Cendre", "Les bas-quartiers d'une cité portuaire", "Une lignée noble déchue", "Un monastère reculé en haute montagne"] },
  { id: "declencheur", label: "Évènement déclencheur", hint: "Ce qui l'a jeté sur les routes",
    amorces: ["Sa maison fut réduite en cendres une nuit", "Une trahison de son mentor", "Une prophétie murmurée à sa naissance", "La disparition d'un être cher"] },
  { id: "motivation", label: "Motivation profonde", hint: "Le pourquoi de tout",
    amorces: ["Venger les siens", "Racheter une faute impardonnable", "Percer un secret enfoui", "Protéger le dernier être qui lui reste"] },
  { id: "lien", label: "Lien encore vivant", hint: "Un proche, un mentor, un ennemi — un PNJ potentiel",
    amorces: ["Une sœur disparue qu'il cherche encore", "Le maître qui l'a trahi", "Un rival d'enfance devenu puissant", "Une dette envers une figure de l'ombre"] },
  { id: "secret", label: "Secret ou fardeau", hint: "La graine d'une quête",
    amorces: ["Il porte une marque qu'il dissimule", "Une relique volée dort dans son sac", "Un pacte scellé dans le sang", "Il a survécu à ce qui aurait dû le tuer"] },
  { id: "faille", label: "Peur ou faille", hint: "La tension dramatique",
    amorces: ["La peur d'être à nouveau abandonné", "Une colère qu'il ne maîtrise pas", "L'incapacité à faire confiance", "Le poids d'une promesse non tenue"] },
];

const TAGS = [
  "Vengeance", "Noblesse déchue", "Dette de sang", "Prophétie", "Exil",
  "Rédemption", "Soif de savoir", "Protéger un proche", "Malédiction",
  "Ambition dévorante", "Quête d'identité", "Fuir le passé",
];

const PERSONNALITE = [
  { id: "trait", label: "Trait de personnalité", ph: "Je garde toujours mon calme, même face au pire." },
  { id: "ideal", label: "Idéal", ph: "La liberté avant tout — nul ne devrait porter de chaînes." },
  { id: "lienPerso", label: "Lien", ph: "Je donnerais ma vie pour ceux qui m'ont recueilli." },
  { id: "defaut", label: "Défaut", ph: "Je ne sais pas reculer, même quand je le devrais." },
];

const TABS = [
  { id: "identite", nom: "Identité", icon: User },
  { id: "apparence", nom: "Apparence", icon: Sparkles },
  { id: "attributs", nom: "Attributs", icon: Swords },
  { id: "competences", nom: "Compétences", icon: ShieldCheck },
  { id: "histoire", nom: "Histoire", icon: BookOpen },
  { id: "recap", nom: "Récapitulatif", icon: ScrollText },
];

export default function CharacterCreator() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("identite");

  const [id, setId] = useState({ nom: "", espece: null, classe: null, sousClasse: "", historique: "", alignement: "" });
  const [app, setApp] = useState({ portrait: 0, taille: "Moyenne", cheveux: "#6a4a2a", yeux: "#3a8a8a", peau: "#c9a072", desc: "" });
  const [stats, setStats] = useState({ FOR: 8, DEX: 8, CON: 8, INT: 8, SAG: 8, CHA: 8 });
  const [methode, setMethode] = useState("achat");   // achat | standard | lancer
  const [lancers, setLancers] = useState([]);        // 6 valeurs pour la méthode "lancer"
  const [bonusChoisis, setBonusChoisis] = useState([]); // demi-elfe : +1 au choix ×2
  const [skills, setSkills] = useState([]);
  const [sousEspece, setSousEspece] = useState(null); // sous-race choisie
  const [sortsConnus, setSortsConnus] = useState([]); // slugs des sorts appris (casters)
  const [sortsDispo, setSortsDispo] = useState([]);   // sorts niveau <=1 de la classe
  const [survol, setSurvol] = useState(null);         // { sort, x, y } tooltip de sort
  const [styleCombat, setStyleCombat] = useState(null); // Guerrier : id du style
  const [equip, setEquip] = useState({ armure: "", arme: "", bouclier: false }); // Guerrier
  const selCss = { width: "100%", padding: "10px 12px", background: "#0f1116", border: "1px solid #2c313d", borderRadius: 8, color: "#e7e3d6", fontSize: 14 };
  const [langues, setLangues] = useState(["Commun"]);
  const [histoire, setHistoire] = useState({});
  const [perso, setPerso] = useState({});
  const [tags, setTags] = useState([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genErreur, setGenErreur] = useState("");
  const [forgeLoading, setForgeLoading] = useState(false);
  const [forgeErreur, setForgeErreur] = useState("");

  const classe = CLASSES.find((c) => c.id === id.classe);
  const espece = ESPECES.find((e) => e.id === id.espece);

  // Sorts disponibles au niveau 1 pour la classe (mineurs + niveau 1). Vide si non-caster.
  useEffect(() => {
    let annule = false;
    setSortsConnus([]);
    if (!classe?.nom) { setSortsDispo([]); return; }
    supabase
      .from("spells").select("slug, nom, niveau, ecole, description")
      .contains("classes", [classe.nom]).lte("niveau", 1)
      .order("niveau", { ascending: true }).order("nom", { ascending: true })
      .then(({ data }) => { if (!annule) setSortsDispo(data || []); });
    return () => { annule = true; };
  }, [classe?.nom]);

  // Coût point-buy (uniquement en méthode "achat")
  const used = methode === "achat"
    ? Object.values(stats).reduce((s, v) => s + (COST[v] || 0), 0)
    : 0;
  const restant = POOL - used;

  const adjust = (k, d) => setStats((p) => {
    const v = p[k] + d;
    if (v < 8 || v > 15) return p;
    const newUsed = used - COST[p[k]] + COST[v];
    if (newUsed > POOL) return p;
    return { ...p, [k]: v };
  });

  // Pool de valeurs pour les méthodes standard / lancer
  const pool = methode === "standard" ? TABLEAU_STANDARD : methode === "lancer" ? lancers : [];

  // Changement de méthode : on remet à zéro l'assignation
  const changerMethode = (m) => {
    setMethode(m);
    if (m === "achat") setStats({ FOR: 8, DEX: 8, CON: 8, INT: 8, SAG: 8, CHA: 8 });
    else setStats({ FOR: null, DEX: null, CON: null, INT: null, SAG: null, CHA: null });
    setLancers(m === "lancer" ? lancerSix() : []);
  };

  const assignerStat = (sid, valeur) => {
    setStats((p) => ({ ...p, [sid]: valeur === "" ? null : Number(valeur) }));
  };

  const toggle = (arr, set, val, max) => {
    if (arr.includes(val)) set(arr.filter((x) => x !== val));
    else if (!max || arr.length < max) set([...arr, val]);
  };

  const choisirEspece = (e) => {
    setId({ ...id, espece: e.id });
    setBonusChoisis([]); // reset des bonus libres quand l'espèce change
    setSousEspece(null);
  };

  /* Bonus d'espèce réellement appliqués */
  const racialFixed = espece?.bonusStats || {};
  const libres = espece?.bonusLibres || 0;
  const bonusDe = (sid) => (racialFixed[sid] || 0) + (bonusChoisis.includes(sid) ? 1 : 0);
  const valeurFinale = (sid) => (stats[sid] == null ? null : stats[sid] + bonusDe(sid));

  /* Caps de sélection au niveau 1 (spécifiques classe/race) */
  const capSkills = ({ guerrier: 2, mage: 2, voleur: 4, clerc: 2 })[id.classe] ?? 2;
  const capMineurs = ({ mage: 3, clerc: 3 })[id.classe] ?? 0;
  const capNiveau1 =
    id.classe === "mage" ? 6
    : id.classe === "clerc" ? Math.max(1, mod(valeurFinale("SAG") ?? 10) + 1)
    : 0;
  const nbMineurs = sortsConnus.filter((sl) => sortsDispo.find((s) => s.slug === sl)?.niveau === 0).length;
  const nbNiveau1 = sortsConnus.filter((sl) => sortsDispo.find((s) => s.slug === sl)?.niveau === 1).length;
  const toggleSort = (slug, niveau) => {
    if (sortsConnus.includes(slug)) { setSortsConnus(sortsConnus.filter((s) => s !== slug)); return; }
    const cap = niveau === 0 ? capMineurs : capNiveau1;
    const n = niveau === 0 ? nbMineurs : nbNiveau1;
    if (n >= cap) return;
    setSortsConnus([...sortsConnus, slug]);
  };

  /* Stats dérivées (niveau 1) — calculées sur les valeurs finales (— si non assignées) */
  const finCon = valeurFinale("CON");
  const finDex = valeurFinale("DEX");
  const finSag = valeurFinale("SAG");
  const pdv = (classe && finCon != null) ? classe.de + mod(finCon) : "—";
  const ca = finDex != null ? 10 + mod(finDex) : "—";
  const init = finDex != null ? fmtMod(mod(finDex)) : "—";
  const perceptionP = finSag != null ? 10 + mod(finSag) : "—";
  const maitrise = fmtMod(bonusMaitrise(1));   // niveau 1 → +2 (table de progression)

  /* Génération assistée — appel réel à l'API via l'edge function */
  const genererHistoire = async () => {
    setGenErreur("");
    setGenLoading(true);
    try {
      const res = await genererHistoireIA({
        identite: {
          nom: id.nom,
          espece: espece?.nom,
          classe: classe?.nom,
          historique: id.historique,
          alignement: id.alignement,
        },
        themes: tags,
        histoire,
        personnalite: perso,
      });
      setHistoire((prev) => ({ ...prev, ...res.histoire }));
      setPerso((prev) => ({ ...prev, ...res.personnalite }));
    } catch (e) {
      setGenErreur(e.message);
    } finally {
      setGenLoading(false);
    }
  };

  /* Sauvegarde en base et redirige */
  const forgerPersonnage = async () => {
    if (!id.nom || !id.espece || !id.classe) {
      setForgeErreur("Remplis au moins le nom, l'espèce et la classe.");
      setTab("identite");
      return;
    }
    if (["FOR", "DEX", "CON", "INT", "SAG", "CHA"].some((k) => stats[k] == null)) {
      setForgeErreur("Assigne une valeur à chaque caractéristique.");
      setTab("attributs");
      return;
    }
    setForgeErreur("");
    setForgeLoading(true);
    try {
      const ficheBase = {
        alignement: id.alignement,
        apparence: app,
        sousEspece: SUB_RACES[espece?.id]?.includes(sousEspece) ? sousEspece : null,
        sorts: sortsConnus,
        competences: skills,
        langues,
        histoire,
        personnalite: perso,
        themes: tags,
        bonusChoisis,
      };
      const ficheFinale =
        classe?.id === "guerrier"
          ? initFicheGuerrier(
              { niveau: 1, sous_classe: id.sousClasse, fiche: ficheBase },
              { styleCombat: styleCombat ? STYLES_COMBAT[styleCombat] : null, competences: skills },
            )
          : ficheBase;

      if (classe?.id === "guerrier") {
        ficheFinale.mecanique.equipement = {
          armure: equip.armure || null,
          bouclier: !!equip.bouclier,
          armes: equip.arme
            ? [{ ref: equip.arme, main: ARMES[equip.arme]?.proprietes?.deuxMains ? "deux_mains" : "une_main" }]
            : [],
        };
      }

      const nouveau = await createCharacter({
        nom: id.nom,
        espece: espece?.nom,
        classe: classe?.nom,
        sous_classe: id.sousClasse,
        historique: id.historique,
        niveau: 1,
        force:        valeurFinale("FOR"),
        dexterite:    valeurFinale("DEX"),
        constitution: valeurFinale("CON"),
        intelligence: valeurFinale("INT"),
        sagesse:      valeurFinale("SAG"),
        charisme:     valeurFinale("CHA"),
        pv_max:     pdv !== "—" ? pdv : null,
        pv_actuels: pdv !== "—" ? pdv : null,
        fiche: ficheFinale,
      });
      // Paquetage de l'aventurier + bourse de départ (classe + historique).
      await equiperPaquetageDepart(nouveau.id, { classe: classe?.nom, historique: id.historique });
      navigate("/personnages");
    } catch (e) {
      setForgeErreur(e.message);
    } finally {
      setForgeLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      <div style={S.frame}>
        <header style={S.header}>
          <div style={{ position: "absolute", left: 20, top: 20 }}>
            <button style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textSub, padding: "6px 12px", fontSize: 13 }}
              onClick={() => navigate("/personnages")}>← Retour</button>
          </div>
          <div style={S.eyebrow}>✦ Forge des âmes ✦</div>
          <h1 style={S.title}>Création de personnage</h1>
          <p style={S.subtitle}>Donnez vie à celui ou celle dont vous écrirez la légende.</p>
        </header>

        <nav style={S.tabs}>
          {TABS.map((t, i) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ ...S.tab, ...(active ? S.tabActive : {}) }}>
                <span style={S.tabNum}>{String(i + 1).padStart(2, "0")}</span>
                <Icon size={15} />
                <span>{t.nom}</span>
              </button>
            );
          })}
        </nav>

        <main style={S.body}>
          {/* ── IDENTITÉ ── */}
          {tab === "identite" && (
            <div style={S.col}>
              <Field label="Nom du personnage">
                <input style={S.input} value={id.nom} onChange={(e) => setId({ ...id, nom: e.target.value })} placeholder="Aelric le Errant" />
              </Field>

              <Field label="Espèce">
                <div style={S.grid}>
                  {ESPECES.map((e) => (
                    <Card key={e.id} active={id.espece === e.id} onClick={() => choisirEspece(e)}
                      title={e.nom} desc={e.desc} tag={e.bonus} sub={e.trait} />
                  ))}
                </div>
              </Field>

              {(SUB_RACES[id.espece] || []).length > 0 && (
                <Field label="Sous-race">
                  <div style={S.tagRow}>
                    {SUB_RACES[id.espece].map((sr) => (
                      <button key={sr} onClick={() => setSousEspece(sr)}
                        style={{ ...S.tag, ...(sousEspece === sr ? S.tagOn : {}) }}>
                        {sousEspece === sr && <span style={S.dot} />}{sr}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Classe">
                <div style={S.grid}>
                  {CLASSES.map((c) => {
                    const Icon = c.icon;
                    return (
                      <Card key={c.id} active={id.classe === c.id} onClick={() => setId({ ...id, classe: c.id })}
                        title={c.nom} desc={c.desc} tag={`Dé de vie d${c.de} · ${c.prim}`} icon={<Icon size={18} />} />
                    );
                  })}
                </div>
              </Field>

              <div style={S.row2}>
                <Field label="Historique">
                  <Select value={id.historique} onChange={(v) => setId({ ...id, historique: v })} options={HISTORIQUES} ph="Choisir…" />
                </Field>
                <Field label="Alignement">
                  <Select value={id.alignement} onChange={(v) => setId({ ...id, alignement: v })} options={ALIGNEMENTS} ph="Choisir…" />
                </Field>
              </div>
            </div>
          )}

          {/* ── APPARENCE ── */}
          {tab === "apparence" && (
            <div style={S.col}>
              <Field label="Portrait">
                <div style={S.portraitRow}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <button key={i} onClick={() => setApp({ ...app, portrait: i })}
                      style={{ ...S.portrait, ...(app.portrait === i ? S.portraitActive : {}) }}>
                      <User size={26} color={app.portrait === i ? C.gold : C.textMuted} />
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Stature">
                <Pills value={app.taille} options={["Petite", "Moyenne", "Grande"]} onChange={(v) => setApp({ ...app, taille: v })} />
              </Field>

              <div style={S.row3}>
                <Field label="Cheveux"><ColorInput value={app.cheveux} onChange={(v) => setApp({ ...app, cheveux: v })} /></Field>
                <Field label="Yeux"><ColorInput value={app.yeux} onChange={(v) => setApp({ ...app, yeux: v })} /></Field>
                <Field label="Peau"><ColorInput value={app.peau} onChange={(v) => setApp({ ...app, peau: v })} /></Field>
              </div>

              <Field label="Description physique">
                <textarea style={S.textarea} value={app.desc} onChange={(e) => setApp({ ...app, desc: e.target.value })}
                  placeholder="Une silhouette élancée, le regard dur, une cicatrice barrant la joue gauche…" />
              </Field>
            </div>
          )}

          {/* ── ATTRIBUTS ── */}
          {tab === "attributs" && (
            <div style={S.col}>
              {/* Sélecteur de méthode (PHB étape 3) */}
              <div style={S.methodeRow}>
                {[
                  ["achat", "Achat de points"],
                  ["standard", "Tableau standard"],
                  ["lancer", "Lancer de dés"],
                ].map(([m, lbl]) => (
                  <button key={m} onClick={() => changerMethode(m)}
                    style={{ ...S.methodeBtn, ...(methode === m ? S.methodeBtnOn : {}) }}>{lbl}</button>
                ))}
              </div>

              {/* Achat de points : compteur */}
              {methode === "achat" && (
                <div style={S.pointsBar}>
                  <span style={S.pointsLbl}>Points de répartition restants</span>
                  <span style={{ ...S.pointsVal, color: restant === 0 ? C.gold : C.textPrime }}>{restant}<span style={S.pointsMax}> / {POOL}</span></span>
                </div>
              )}

              {/* Lancer : valeurs obtenues + relance */}
              {methode === "lancer" && (
                <div style={S.libresBox}>
                  <div style={S.libresLbl}>Valeurs obtenues (4d6, on garde les 3 meilleurs)</div>
                  <div style={S.tagRow}>
                    {lancers.map((v, i) => <span key={i} style={S.tagOnGold}>{v}</span>)}
                  </div>
                  <button style={{ ...S.methodeBtn, marginTop: 10 }} onClick={() => changerMethode("lancer")}>
                    Relancer les dés
                  </button>
                </div>
              )}

              {methode === "standard" && (
                <p style={S.help}>Répartis les valeurs <b style={{ color: C.gold }}>15, 14, 13, 12, 10, 8</b> entre tes caractéristiques.</p>
              )}

              {/* Bonus d'espèce à répartir (demi-elfe) */}
              {libres > 0 && (
                <div style={S.libresBox}>
                  <div style={S.libresLbl}>Bonus d'espèce à répartir — +1 × {libres}</div>
                  <div style={S.tagRow}>
                    {STATS.filter((s) => !racialFixed[s.id]).map((s) => (
                      <button key={s.id} onClick={() => toggle(bonusChoisis, setBonusChoisis, s.id, libres)}
                        style={{ ...S.tag, ...(bonusChoisis.includes(s.id) ? S.tagOnGold : {}) }}>{s.id}</button>
                    ))}
                  </div>
                  <div style={S.tagCount}>{bonusChoisis.length} / {libres} attribué(s)</div>
                </div>
              )}

              {STATS.map((s) => {
                const base = stats[s.id];
                const bonus = bonusDe(s.id);
                const fin = base == null ? null : base + bonus;
                const m = fin == null ? null : mod(fin);
                const importante = (CARAC_IMPORTANTE[id.classe] || []).includes(s.id);
                return (
                  <div key={s.id} style={S.statRow}>
                    <div style={S.statInfo}>
                      <span style={S.statName}>{s.nom}</span>
                      <div style={{ display: "flex", gap: 8 }}>
                        {importante && <span style={S.statImportante}>★ clé pour {classe?.nom}</span>}
                        {bonus > 0 && <span style={S.statRacial}>+{bonus} d'espèce</span>}
                      </div>
                    </div>
                    <div style={S.statRight}>
                      <span style={S.statModBadge}>{m == null ? "—" : fmtMod(m)}</span>
                      {methode === "achat" ? (
                        <div style={S.stepper}>
                          <button style={S.stepBtn} onClick={() => adjust(s.id, -1)}><Minus size={14} /></button>
                          <span style={S.statVal}>{base}</span>
                          <button style={S.stepBtn} onClick={() => adjust(s.id, 1)}><Plus size={14} /></button>
                        </div>
                      ) : (
                        <select style={S.statSelect} value={base ?? ""} onChange={(e) => assignerStat(s.id, e.target.value)}>
                          <option value="">—</option>
                          {valeursDisponibles(pool, stats, s.id, STATS).map((v, i) => (
                            <option key={`${v}-${i}`} value={v}>{v}</option>
                          ))}
                        </select>
                      )}
                      <span style={S.statFinal}>{fin == null ? "" : `= ${fin}`}</span>
                    </div>
                  </div>
                );
              })}

              <div style={S.derived}>
                <Derived icon={<Heart size={16} />} label="Points de vie" value={pdv} />
                <Derived icon={<Shield size={16} />} label="Classe d'armure" value={ca} />
                <Derived icon={<Zap size={16} />} label="Initiative" value={init} />
                <Derived icon={<Footprints size={16} />} label="Vitesse" value="9 m" />
                <Derived icon={<Eye size={16} />} label="Perception pass." value={perceptionP} />
                <Derived icon={<Star size={16} />} label="Maîtrise" value={maitrise} />
              </div>
            </div>
          )}

          {/* ── COMPÉTENCES ── */}
          {tab === "competences" && (
            <div style={S.col}>
              <p style={S.help}>
                {classe ? <>Jets de sauvegarde maîtrisés : <b style={{ color: C.gold }}>{classe.sauv.join(" · ")}</b></> : "Choisissez une classe pour vos jets de sauvegarde."}
              </p>

              <Field label={`Compétences maîtrisées (${skills.length}/${capSkills})`}>
                <div style={S.skillWrap}>
                  {STATS.filter((s) => COMPETENCES[s.id].length).map((s) => (
                    <div key={s.id} style={S.skillGroup}>
                      <div style={S.skillGroupTitle}>{s.nom}</div>
                      {COMPETENCES[s.id].map((sk) => {
                        const sel = skills.includes(sk);
                        const bloque = !sel && skills.length >= capSkills;
                        return (
                          <button key={sk} onClick={() => toggle(skills, setSkills, sk, capSkills)}
                            style={{ ...S.skillChip, ...(sel ? S.skillChipOn : {}), opacity: bloque ? 0.4 : 1 }}>
                            {sel && <span style={S.dot} />}{sk}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </Field>

              {sortsDispo.length > 0 && (
                <Field label="Sorts connus">
                  <div style={S.skillWrap}>
                    {[0, 1].map((niv) => {
                      const groupe = sortsDispo.filter((s) => s.niveau === niv);
                      if (!groupe.length) return null;
                      const cap = niv === 0 ? capMineurs : capNiveau1;
                      const n = niv === 0 ? nbMineurs : nbNiveau1;
                      return (
                        <div key={niv} style={S.skillGroup}>
                          <div style={S.skillGroupTitle}>{niv === 0 ? "Sorts mineurs" : "Niveau 1"} ({n}/{cap})</div>
                          {groupe.map((s) => {
                            const sel = sortsConnus.includes(s.slug);
                            const bloque = !sel && n >= cap;
                            return (
                              <button key={s.slug}
                                onClick={() => toggleSort(s.slug, niv)}
                                onMouseEnter={(e) => setSurvol({ sort: s, x: e.clientX, y: e.clientY })}
                                onMouseMove={(e) => setSurvol((v) => (v && v.sort.slug === s.slug ? { ...v, x: e.clientX, y: e.clientY } : v))}
                                onMouseLeave={() => setSurvol(null)}
                                style={{ ...S.skillChip, ...(sel ? S.skillChipOn : {}), opacity: bloque ? 0.4 : 1 }}>
                                {sel && <span style={S.dot} />}{s.nom}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </Field>
              )}

              {classe?.id === "guerrier" && (
                <Field label="Style de combat">
                  <div style={S.tagRow}>
                    {Object.values(STYLES_COMBAT).map((st) => (
                      <button key={st.id} onClick={() => setStyleCombat(st.id)}
                        title={st.description}
                        style={{ ...S.tag, ...(styleCombat === st.id ? S.tagOn : {}) }}>{st.nom}</button>
                    ))}
                  </div>
                </Field>
              )}

              {classe?.id === "guerrier" && (
                <Field label="Équipement de départ">
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <select value={equip.armure} onChange={(e) => setEquip({ ...equip, armure: e.target.value })} style={selCss}>
                      <option value="">Sans armure</option>
                      {Object.values(ARMURES).map((a) => (
                        <option key={a.ref} value={a.ref}>{a.nom} — CA {a.ca} ({a.categorie})</option>
                      ))}
                    </select>
                    <select value={equip.arme} onChange={(e) => setEquip({ ...equip, arme: e.target.value })} style={selCss}>
                      <option value="">À mains nues</option>
                      {Object.values(ARMES).map((w) => (
                        <option key={w.ref} value={w.ref}>{w.nom} — {w.dm} {w.typeDegats}</option>
                      ))}
                    </select>
                    <button onClick={() => setEquip({ ...equip, bouclier: !equip.bouclier })}
                      style={{ ...S.tag, ...(equip.bouclier ? S.tagOn : {}), alignSelf: "flex-start" }}>
                      {equip.bouclier && <span style={S.dot} />}Bouclier (+2 CA)
                    </button>
                  </div>
                </Field>
              )}

              <Field label="Langues">
                <div style={S.tagRow}>
                  {LANGUES.map((l) => (
                    <button key={l} onClick={() => toggle(langues, setLangues, l)}
                      style={{ ...S.tag, ...(langues.includes(l) ? S.tagOn : {}) }}>{l}</button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── HISTOIRE ── */}
          {tab === "histoire" && (
            <div style={S.col}>
              <div style={S.aiBanner}>
                <div>
                  <div style={S.aiTitle}><Wand2 size={16} style={{ marginRight: 6 }} />Le maître du jeu s'inspirera de cette histoire</div>
                  <div style={S.aiSub}>Remplissez les crochets ci-dessous, ou laissez le MJ vous proposer une trame.</div>
                  {genErreur && <div style={S.aiErr}>{genErreur}</div>}
                </div>
                <button style={S.aiBtn} onClick={genererHistoire} disabled={genLoading}>
                  {genLoading ? "Inspiration…" : "Générer une proposition"}
                </button>
              </div>

              {CHAMPS_HISTOIRE.map((c) => (
                <div key={c.id} style={S.storyBlock}>
                  <div style={S.storyHead}>
                    <span style={S.storyLabel}>{c.label}</span>
                    <span style={S.storyHint}>{c.hint}</span>
                  </div>
                  <textarea style={S.storyInput} value={histoire[c.id] || ""}
                    onChange={(e) => setHistoire({ ...histoire, [c.id]: e.target.value })}
                    placeholder="À vous d'écrire, ou piochez une amorce ci-dessous…" />
                  <div style={S.amorces}>
                    {c.amorces.map((a) => (
                      <button key={a} style={S.amorce} onClick={() => setHistoire({ ...histoire, [c.id]: a })}>{a}</button>
                    ))}
                  </div>
                </div>
              ))}

              <Field label={<><Tag size={13} style={{ marginRight: 6, verticalAlign: "-2px" }} />Thèmes narratifs <span style={S.lblHint}>(exploités par le MJ)</span></>}>
                <div style={S.tagRow}>
                  {TAGS.map((t) => (
                    <button key={t} onClick={() => toggle(tags, setTags, t, 5)}
                      style={{ ...S.tag, ...(tags.includes(t) ? S.tagOnGold : {}) }}>{t}</button>
                  ))}
                </div>
                <div style={S.tagCount}>{tags.length} / 5 thèmes sélectionnés</div>
              </Field>

              <Field label="Personnalité">
                <div style={S.persoGrid}>
                  {PERSONNALITE.map((p) => (
                    <div key={p.id}>
                      <div style={S.persoLabel}>{p.label}</div>
                      <textarea style={S.persoInput} value={perso[p.id] || ""} placeholder={p.ph}
                        onChange={(e) => setPerso({ ...perso, [p.id]: e.target.value })} />
                    </div>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── RÉCAP ── */}
          {tab === "recap" && (
            <div style={S.col}>
              <div style={S.recap}>
                <div style={S.recapHead}>
                  <div style={S.recapPortrait}><User size={34} color={C.gold} /></div>
                  <div>
                    <h2 style={S.recapName}>{id.nom || "Sans nom"}</h2>
                    <p style={S.recapSub}>
                      {espece?.nom || "—"} · {classe?.nom || "—"} · Niveau 1
                    </p>
                    <p style={S.recapSub2}>{id.historique || "—"}{id.alignement ? ` · ${id.alignement}` : ""}</p>
                  </div>
                </div>

                <div style={S.recapStats}>
                  {STATS.map((s) => {
                    const fin = valeurFinale(s.id);
                    return (
                      <div key={s.id} style={S.recapStat}>
                        <span style={S.recapStatVal}>{fin ?? "—"}</span>
                        <span style={S.recapStatMod}>{fin == null ? "—" : fmtMod(mod(fin))}</span>
                        <span style={S.recapStatLbl}>{s.id}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={S.recapDerived}>
                  <span><Heart size={13} color={C.red} /> {pdv} PV</span>
                  <span><Shield size={13} color={C.teal} /> CA {ca}</span>
                  <span><Zap size={13} color={C.gold} /> Init {init}</span>
                  <span><Star size={13} color={C.violet} /> Maîtrise {maitrise}</span>
                </div>

                {tags.length > 0 && (
                  <div style={S.recapTags}>
                    {tags.map((t) => <span key={t} style={S.recapTag}>{t}</span>)}
                  </div>
                )}
              </div>

              {forgeErreur && <p style={{ color: C.red, fontSize: 13, textAlign: "center" }}>{forgeErreur}</p>}
              <button style={{ ...S.cta, opacity: forgeLoading ? 0.7 : 1 }}
                onClick={forgerPersonnage} disabled={forgeLoading}>
                {forgeLoading ? "Forge en cours…" : "Forger le personnage"}
              </button>
            </div>
          )}
        </main>

        {survol && (
          <div style={{
            position: "fixed", zIndex: 200, width: 300, pointerEvents: "none",
            left: Math.min(survol.x + 14, (typeof window !== "undefined" ? window.innerWidth : 1200) - 320),
            top: survol.y + 14,
            background: "#12141c", border: "1px solid #2c313d", borderRadius: 8,
            padding: "10px 12px", boxShadow: "0 12px 34px rgba(0,0,0,.6)",
          }}>
            <div style={{ color: "#c9a84c", fontFamily: "'Cinzel', serif", fontSize: 13, marginBottom: 4 }}>{survol.sort.nom}</div>
            <div style={{ color: "#8a8a99", fontSize: 11, marginBottom: 6 }}>
              {survol.sort.niveau === 0 ? "Sort mineur" : `Niveau ${survol.sort.niveau}`}{survol.sort.ecole ? ` · ${survol.sort.ecole}` : ""}
            </div>
            <div style={{ color: "#d8d4c8", fontSize: 12, lineHeight: 1.5, maxHeight: 220, overflow: "hidden" }}>
              {survol.sort.description || "—"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SOUS-COMPOSANTS ──────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function Card({ active, onClick, title, desc, tag, sub, icon }) {
  return (
    <button onClick={onClick} style={{ ...S.card, ...(active ? S.cardActive : {}) }}>
      <div style={S.cardHead}>
        {icon && <span style={{ color: active ? C.gold : C.violet }}>{icon}</span>}
        <span style={S.cardTitle}>{title}</span>
      </div>
      <p style={S.cardDesc}>{desc}</p>
      {tag && <span style={S.cardTag}>{tag}</span>}
      {sub && <span style={S.cardSub}>{sub}</span>}
    </button>
  );
}

function Select({ value, onChange, options, ph }) {
  return (
    <select style={S.input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{ph}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Pills({ value, options, onChange }) {
  return (
    <div style={S.tagRow}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} style={{ ...S.tag, ...(value === o ? S.tagOn : {}) }}>{o}</button>
      ))}
    </div>
  );
}

function ColorInput({ value, onChange }) {
  return <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={S.color} />;
}

function Derived({ icon, label, value }) {
  return (
    <div style={S.derivedCell}>
      <span style={S.derivedIcon}>{icon}</span>
      <span style={S.derivedVal}>{value}</span>
      <span style={S.derivedLbl}>{label}</span>
    </div>
  );
}

/* ── STYLES ───────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  ::placeholder { color: ${C.textMuted}; }
  input:focus, textarea:focus, select:focus { outline: none; border-color: ${C.borderGlow} !important; box-shadow: 0 0 0 2px ${C.violetDim}55; }
  button { cursor: pointer; font-family: 'Inter', sans-serif; transition: all .15s ease; }
  select option { background: ${C.bgInput}; color: ${C.textPrime}; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
`;

const inputBase = {
  width: "100%", padding: "11px 13px", background: C.bgInput,
  border: `1px solid ${C.border}`, borderRadius: 8, color: C.textPrime,
  fontSize: 15, fontFamily: "'Inter', sans-serif",
};

const S = {
  page: { minHeight: "100vh", background: C.gradPage, padding: "32px 16px", fontFamily: "'Inter', sans-serif", color: C.textPrime },
  frame: { maxWidth: 760, margin: "0 auto", background: C.bgPanel, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.6)" },

  header: { position: "relative", padding: "34px 32px 26px", textAlign: "center", borderBottom: `1px solid ${C.border}`, background: "linear-gradient(180deg, #140e22 0%, #0f1118 100%)" },
  eyebrow: { fontSize: 12, letterSpacing: 4, color: C.gold, marginBottom: 10, fontFamily: "'Cinzel', serif" },
  title: { margin: 0, fontSize: 34, fontWeight: 600, fontFamily: "'Cinzel', serif", letterSpacing: 1, color: C.textPrime },
  subtitle: { margin: "10px 0 0", fontSize: 14, color: C.textSub },

  tabs: { display: "flex", borderBottom: `1px solid ${C.border}`, background: C.bgCard, overflowX: "auto" },
  tab: { flex: 1, minWidth: 104, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "13px 6px", border: "none", borderBottom: "2px solid transparent", background: "transparent", color: C.textSub, fontSize: 12.5, fontWeight: 500 },
  tabActive: { color: C.gold, background: C.bgPanel, borderBottom: `2px solid ${C.gold}` },
  tabNum: { fontSize: 9, letterSpacing: 1, opacity: .6, fontFamily: "'Cinzel', serif" },

  body: { padding: 30, minHeight: 420 },
  col: { display: "flex", flexDirection: "column", gap: 22 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  row3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },

  label: { display: "block", fontSize: 11.5, letterSpacing: 2, textTransform: "uppercase", color: C.gold, marginBottom: 10, fontFamily: "'Cinzel', serif" },
  lblHint: { color: C.textMuted, textTransform: "none", letterSpacing: 0, fontSize: 10, fontFamily: "'Inter', sans-serif" },
  input: { ...inputBase },
  textarea: { ...inputBase, minHeight: 90, resize: "vertical", lineHeight: 1.5 },
  help: { fontSize: 13.5, color: C.textSub, margin: 0, padding: "12px 14px", background: C.bgCard, borderRadius: 8, border: `1px solid ${C.border}` },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))", gap: 11 },
  card: { textAlign: "left", padding: 14, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 },
  cardActive: { borderColor: C.gold, background: "#1a160f", boxShadow: `0 0 0 1px ${C.gold}, 0 6px 18px ${C.goldDim}33` },
  cardHead: { display: "flex", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15.5, fontWeight: 600, fontFamily: "'Cinzel', serif", color: C.textPrime },
  cardDesc: { margin: 0, fontSize: 12.5, color: C.textSub, lineHeight: 1.45 },
  cardTag: { fontSize: 11, color: C.gold, fontWeight: 500 },
  cardSub: { fontSize: 10.5, color: C.textMuted, fontStyle: "italic" },

  portraitRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  portrait: { width: 62, height: 62, borderRadius: 12, background: C.bgCard, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center" },
  portraitActive: { borderColor: C.gold, boxShadow: `0 0 0 1px ${C.gold}` },

  color: { width: "100%", height: 42, border: `1px solid ${C.border}`, borderRadius: 8, background: C.bgInput, padding: 3, cursor: "pointer" },

  pointsBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", background: C.gradViolet, borderRadius: 12, boxShadow: "inset 0 1px 0 rgba(255,255,255,.08)" },
  pointsLbl: { fontSize: 12.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#e8e0f0", fontFamily: "'Cinzel', serif" },
  pointsVal: { fontSize: 30, fontWeight: 700, fontFamily: "'Cinzel', serif" },
  pointsMax: { fontSize: 16, color: "#c8b8e0", fontWeight: 400 },

  libresBox: { padding: "14px 16px", background: C.bgCard, border: `1px solid ${C.borderGlow}`, borderRadius: 10 },
  methodeRow: { display: "flex", gap: 8 },
  methodeBtn: { flex: 1, padding: "10px 12px", borderRadius: 9, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSub, fontSize: 13, fontWeight: 500, fontFamily: "'Inter', sans-serif" },
  methodeBtnOn: { borderColor: C.gold, background: "#1a160f", color: C.gold },
  statSelect: { width: 72, padding: "7px 8px", background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 8, color: C.textPrime, fontSize: 15, fontFamily: "'Inter', sans-serif", textAlign: "center" },
  statImportante: { fontSize: 10, color: C.gold },
  libresLbl: { fontSize: 12.5, color: C.teal, marginBottom: 10, fontFamily: "'Cinzel', serif", letterSpacing: 1 },

  statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10 },
  statInfo: { display: "flex", flexDirection: "column", gap: 2 },
  statName: { fontSize: 15, fontWeight: 600, fontFamily: "'Cinzel', serif" },
  statRacial: { fontSize: 10, color: C.teal },
  statRight: { display: "flex", alignItems: "center", gap: 14 },
  statModBadge: { fontSize: 13, fontWeight: 600, color: C.gold, minWidth: 30, textAlign: "center", fontFamily: "monospace" },
  stepper: { display: "flex", alignItems: "center", gap: 10 },
  stepBtn: { width: 30, height: 30, borderRadius: 8, background: C.bgInput, border: `1px solid ${C.border}`, color: C.textPrime, display: "flex", alignItems: "center", justifyContent: "center" },
  statVal: { fontSize: 20, fontWeight: 700, minWidth: 26, textAlign: "center", fontFamily: "'Cinzel', serif" },
  statFinal: { fontSize: 13, color: C.textSub, minWidth: 38, textAlign: "right", fontFamily: "monospace" },

  derived: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 6 },
  derivedCell: { display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "14px 8px", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10 },
  derivedIcon: { color: C.violet },
  derivedVal: { fontSize: 22, fontWeight: 700, fontFamily: "'Cinzel', serif", color: C.textPrime },
  derivedLbl: { fontSize: 10.5, color: C.textSub, textAlign: "center" },

  skillWrap: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 },
  skillGroup: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 },
  skillGroupTitle: { fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.violet, marginBottom: 10, fontFamily: "'Cinzel', serif" },
  skillChip: { display: "block", width: "100%", textAlign: "left", padding: "8px 11px", marginBottom: 6, background: C.bgInput, border: `1px solid ${C.border}`, borderRadius: 7, color: C.textSub, fontSize: 13 },
  skillChipOn: { background: "#1a160f", borderColor: C.gold, color: C.textPrime },
  dot: { display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: C.gold, marginRight: 8, verticalAlign: "1px" },

  tagRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  tag: { padding: "8px 14px", borderRadius: 20, background: C.bgCard, border: `1px solid ${C.border}`, color: C.textSub, fontSize: 13 },
  tagOn: { background: C.violetDim, borderColor: C.violet, color: C.textPrime },
  tagOnGold: { background: "#1a160f", borderColor: C.gold, color: C.gold },
  tagCount: { fontSize: 11.5, color: C.textMuted, marginTop: 8 },

  aiBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 18px", background: "linear-gradient(135deg, #1a1228 0%, #14101c 100%)", border: `1px solid ${C.borderGlow}`, borderRadius: 12 },
  aiTitle: { fontSize: 14.5, fontWeight: 600, color: C.textPrime, display: "flex", alignItems: "center" },
  aiSub: { fontSize: 12.5, color: C.textSub, marginTop: 4 },
  aiErr: { fontSize: 12.5, color: C.red, marginTop: 6 },
  aiBtn: { whiteSpace: "nowrap", padding: "11px 18px", borderRadius: 9, border: "none", background: C.gradGold, color: "#1a1206", fontSize: 13.5, fontWeight: 600 },

  storyBlock: { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 },
  storyHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, flexWrap: "wrap", gap: 4 },
  storyLabel: { fontSize: 13.5, fontWeight: 600, fontFamily: "'Cinzel', serif", color: C.gold },
  storyHint: { fontSize: 11.5, color: C.textMuted, fontStyle: "italic" },
  storyInput: { ...inputBase, minHeight: 56, resize: "vertical", fontSize: 14, lineHeight: 1.5 },
  amorces: { display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 },
  amorce: { padding: "6px 11px", borderRadius: 7, background: C.bgInput, border: `1px dashed ${C.border}`, color: C.textSub, fontSize: 12, textAlign: "left" },

  persoGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  persoLabel: { fontSize: 12, color: C.violet, marginBottom: 6, fontWeight: 500 },
  persoInput: { ...inputBase, minHeight: 54, fontSize: 13.5, resize: "vertical" },

  recap: { background: "linear-gradient(180deg, #16111f 0%, #0f1118 100%)", border: `1px solid ${C.borderGlow}`, borderRadius: 14, padding: 24 },
  recapHead: { display: "flex", gap: 16, alignItems: "center", marginBottom: 22 },
  recapPortrait: { width: 70, height: 70, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.gold}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  recapName: { margin: 0, fontSize: 26, fontFamily: "'Cinzel', serif", fontWeight: 600 },
  recapSub: { margin: "4px 0 0", fontSize: 14, color: C.gold },
  recapSub2: { margin: "2px 0 0", fontSize: 12.5, color: C.textSub },
  recapStats: { display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 18 },
  recapStat: { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 0", background: C.bgCard, borderRadius: 9, border: `1px solid ${C.border}` },
  recapStatVal: { fontSize: 20, fontWeight: 700, fontFamily: "'Cinzel', serif" },
  recapStatMod: { fontSize: 11, color: C.gold, fontFamily: "monospace" },
  recapStatLbl: { fontSize: 9.5, color: C.textMuted, marginTop: 2, letterSpacing: 1 },
  recapDerived: { display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center", paddingTop: 16, borderTop: `1px solid ${C.border}`, fontSize: 13.5, color: C.textPrime },
  recapTags: { display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", marginTop: 16 },
  recapTag: { padding: "5px 11px", borderRadius: 14, background: "#1a160f", border: `1px solid ${C.goldDim}`, color: C.gold, fontSize: 11.5 },

  cta: { width: "100%", padding: 17, borderRadius: 11, border: "none", background: C.gradGold, color: "#1a1206", fontSize: 16, fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: 1, boxShadow: `0 8px 24px ${C.goldDim}44` },
};