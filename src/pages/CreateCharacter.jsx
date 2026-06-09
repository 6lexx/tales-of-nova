import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCharacter } from '../services/characterService'
import { ESPECES, CLASSES, HISTORIQUES, CARACTERISTIQUES, pvSuggeres } from '../data/dnd'

const initial = {
  nom: '', espece: '', classe: '', sous_classe: '', historique: '', niveau: 1,
  force: 10, dexterite: 10, constitution: 10, intelligence: 10, sagesse: 10, charisme: 10,
  pv_max: '',
}

export default function CreateCharacter() {
  const navigate = useNavigate()
  const [p, setP] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState('')

  const maj = (champ) => (e) => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setP((prev) => ({ ...prev, [champ]: val }))
  }

  const suggestionPV = pvSuggeres(p.classe, p.constitution, p.niveau)

  async function submit(e) {
    e.preventDefault()
    setErreur('')
    setBusy(true)
    const pv = p.pv_max === '' ? suggestionPV || null : Number(p.pv_max)
    try {
      await createCharacter({ ...p, pv_max: pv, pv_actuels: pv })
      navigate('/personnages')
    } catch (err) {
      setErreur(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <h1 className="brand">Tales of Nova</h1>
        <button className="btn-ghost" onClick={() => navigate('/personnages')}>Annuler</button>
      </header>

      <form className="form" onSubmit={submit}>
        <h2>Nouveau personnage</h2>

        <label className="field">Nom
          <input value={p.nom} onChange={maj('nom')} required />
        </label>

        <div className="row">
          <label className="field">Espèce
            <select value={p.espece} onChange={maj('espece')} required>
              <option value="" disabled>—</option>
              {ESPECES.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>

          <label className="field">Classe
            <select value={p.classe} onChange={maj('classe')} required>
              <option value="" disabled>—</option>
              {Object.keys(CLASSES).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        <div className="row">
          <label className="field">Historique
            <select value={p.historique} onChange={maj('historique')}>
              <option value="">—</option>
              {HISTORIQUES.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </label>

          <label className="field">Niveau
            <input type="number" min={1} max={20} value={p.niveau} onChange={maj('niveau')} />
          </label>
        </div>

        <fieldset className="abilities">
          <legend>Caractéristiques</legend>
          {CARACTERISTIQUES.map(({ cle, label }) => (
            <label key={cle} className="ability">
              {label}
              <input type="number" min={1} max={30} value={p[cle]} onChange={maj(cle)} />
            </label>
          ))}
        </fieldset>

        <label className="field">Points de vie max
          <input type="number" min={1} value={p.pv_max} onChange={maj('pv_max')}
            placeholder={suggestionPV ? `suggéré : ${suggestionPV}` : ''} />
        </label>

        {erreur && <p className="error">{erreur}</p>}

        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Création…' : 'Créer le personnage'}
        </button>
      </form>
    </div>
  )
}