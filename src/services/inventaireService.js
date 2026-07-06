// Service d'inventaire — table inventory + bourse (characters.fiche.bourse) +
// recomposition de fiche.mecanique.equipement pour guerrierService.
import { supabase } from "../lib/supabase";
import { ARMURES } from "../data/equipement/armures.js";
import { ARMES } from "../data/equipement/armes.js";
import { OBJETS_COMMUNS } from "../data/equipement/objets_communs.js";
import { PAQUETAGE_AVENTURIER } from "../data/equipement/paquetages.js";
import { bourseDepart } from "../data/depart.js";

/* ── Lecture ── */
export async function listerInventaire(characterId) {
  const { data, error } = await supabase
    .from("inventory").select("*")
    .eq("character_id", characterId)
    .order("categorie", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

/* ── Ajout / retrait ── */
export async function ajouter(characterId, item) {
  const { categorie = "commun", ref = null, nom, description = null, quantite = 1, meta = {} } = item;
  // Empilement si même ref+catégorie déjà présent.
  if (ref) {
    const { data: exist } = await supabase
      .from("inventory").select("id, quantite")
      .eq("character_id", characterId).eq("ref", ref).eq("categorie", categorie).limit(1);
    if (exist && exist.length) {
      const { data } = await supabase
        .from("inventory").update({ quantite: exist[0].quantite + quantite })
        .eq("id", exist[0].id).select().single();
      return data;
    }
  }
  const { data, error } = await supabase
    .from("inventory")
    .insert({ character_id: characterId, categorie, ref, nom, description, quantite, meta })
    .select().single();
  if (error) throw error;
  return data;
}

export async function retirer(itemId) {
  const { error } = await supabase.from("inventory").delete().eq("id", itemId);
  if (error) throw error;
}

export async function majQuantite(itemId, quantite) {
  if (quantite <= 0) return retirer(itemId);
  const { data, error } = await supabase
    .from("inventory").update({ quantite }).eq("id", itemId).select().single();
  if (error) throw error;
  return data;
}

/* ── Équipement ── */
export async function equiper(characterId, itemId, emplacement) {
  // Emplacements exclusifs : armure. (main/off/accessoire cumulables.)
  if (emplacement === "armure") {
    await supabase.from("inventory")
      .update({ equipe: false, emplacement: null })
      .eq("character_id", characterId).eq("emplacement", "armure");
  }
  const { error } = await supabase.from("inventory")
    .update({ equipe: true, emplacement }).eq("id", itemId);
  if (error) throw error;
  await recomposerEquipement(characterId);
}

export async function desequiper(characterId, itemId) {
  const { error } = await supabase.from("inventory")
    .update({ equipe: false, emplacement: null }).eq("id", itemId);
  if (error) throw error;
  await recomposerEquipement(characterId);
}

// Reconstruit fiche.mecanique.equipement depuis les objets équipés.
export async function recomposerEquipement(characterId) {
  const rows = (await listerInventaire(characterId)).filter((r) => r.equipe);
  const armure = rows.find((r) => r.categorie === "armure" && r.ref && ARMURES[r.ref])?.ref || null;
  const bouclier = rows.some((r) => r.ref === "bouclier");
  const armes = rows
    .filter((r) => r.categorie === "arme" && r.ref && ARMES[r.ref])
    .map((r) => ({
      ref: r.ref,
      main: ARMES[r.ref]?.proprietes?.deuxMains ? "deux_mains" : r.emplacement === "off" ? "off" : "une_main",
    }));
  const accessoires = rows
    .filter((r) => r.categorie === "objet_magique" && r.emplacement === "accessoire")
    .map((r) => ({ id: r.ref, nom: r.nom }));
  await patchFiche(characterId, (fiche) => ({
    ...fiche,
    mecanique: { ...(fiche.mecanique || {}), equipement: { armure, bouclier, armes, accessoires } },
  }));
}

/* ── Bourse (fiche.bourse) ── */
export function getBourse(fiche) {
  const b = fiche?.bourse || {};
  return { po: b.po ?? 0, pa: b.pa ?? 0, pc: b.pc ?? 0 };
}

export async function majBourse(characterId, bourse) {
  await patchFiche(characterId, (fiche) => ({ ...fiche, bourse: { ...getBourse(fiche), ...bourse } }));
  return bourse;
}

/* ── Départ ── */
export async function equiperPaquetageDepart(characterId, { classe, historique }) {
  for (const it of PAQUETAGE_AVENTURIER) {
    const cat = OBJETS_COMMUNS[it.ref];
    await ajouter(characterId, {
      categorie: cat?.categorie || "commun",
      ref: it.ref,
      nom: cat?.nom || it.ref,
      quantite: it.quantite,
    });
  }
  await majBourse(characterId, bourseDepart(classe, historique));
}

/* ── Interne : read-modify-write de la fiche ── */
async function patchFiche(characterId, fn) {
  const { data, error } = await supabase
    .from("characters").select("fiche").eq("id", characterId).single();
  if (error) throw error;
  const { error: e2 } = await supabase
    .from("characters").update({ fiche: fn(data?.fiche || {}) }).eq("id", characterId);
  if (e2) throw e2;
}