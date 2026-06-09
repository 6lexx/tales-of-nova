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