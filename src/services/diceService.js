// Jets de dés. Le joueur lance lui-même ; on renvoie brut + total à l'IA
// pour qu'elle détecte échec/réussite critique (brut) et la marge (total).

export function lancerD20(modificateur = 0) {
  const brut = Math.floor(Math.random() * 20) + 1
  return {
    brut,
    total: brut + modificateur,
    critEchec: brut === 1,
    critReussite: brut === 20,
  }
}

// Format renvoyé à l'IA, ex : "[RESULTAT_JET: brut:3 | total:8]"
export function formatPourIA({ brut, total }) {
  return `[RESULTAT_JET: brut:${brut} | total:${total}]`
}

/* ────────────────────────────────────────────────────────────
   Dés de dégâts — formule « NdM+X », « NdM-X », « NdM »
   Le MJ fournit la formule FINALE (critique inclus : il écrit
   2d6+3 au lieu de 1d6+3). On ne double rien ici.
   ──────────────────────────────────────────────────────────── */

const FORMULE_RE = /^\s*(\d+)?\s*d\s*(\d+)\s*(?:([+-])\s*(\d+))?\s*$/i

export function parseFormule(formule = '') {
  const m = String(formule).match(FORMULE_RE)
  if (!m) return null
  const nombre = parseInt(m[1] || '1', 10)
  const faces = parseInt(m[2], 10)
  const signe = m[3] === '-' ? -1 : 1
  const modificateur = m[4] ? signe * parseInt(m[4], 10) : 0
  if (!faces || nombre < 1 || nombre > 50) return null
  return { nombre, faces, modificateur }
}

export function estFormule(v) {
  return parseFormule(v) !== null
}

// lancerDes("2d6+3") → { formule: "2d6+3", des: [4, 1], faces: 6, modificateur: 3, total: 8 }
export function lancerDes(formule) {
  const p = parseFormule(formule)
  if (!p) return null
  const des = Array.from({ length: p.nombre }, () => 1 + Math.floor(Math.random() * p.faces))
  const somme = des.reduce((a, b) => a + b, 0)
  return {
    formule: String(formule).trim(),
    des,
    faces: p.faces,
    modificateur: p.modificateur,
    total: Math.max(0, somme + p.modificateur),
  }
}