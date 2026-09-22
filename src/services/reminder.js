/**
 * Quali promemoria mostrare.
 *
 * Regola: di un intervento che per natura è UNICO su un veicolo (revisione, bollo,
 * assicurazione, tagliando…) vale solo l'ultima scadenza. Se la revisione è stata
 * rifatta, quella vecchia non si mostra più — anche se la sua data non è ancora passata.
 *
 * ⚠️ 15/09/2026 — PERCHÉ NON BASTAVA «nascondi lo scaduto se ne esiste uno valido»
 * (criterio v0.6.7): copriva solo i promemoria GIÀ SCADUTI. Il Mitsubishi L200 aveva la
 * revisione vecchia in scadenza il 30/09 e quella nuova, fatta il 15/09, al 2028: la prima
 * non era ancora scaduta, quindi restava in elenco e continuava a segnalare un lavoro già
 * fatto. Luca: «Vendite ha segnato la revisione, ma vedo ancora questo segnale».
 *
 * ⚠️ E perché NON si può applicare a TUTTI i tipi: il Doblò ha due promemoria di tipo
 * "Altro" — bombole metano FABER e bollo — che sono cose diverse, entrambe valide.
 * "Altro" è un contenitore, non un intervento: lì si mostra tutto, e si torna al criterio
 * vecchio (via solo lo scaduto che ha un successore valido).
 *
 * Le date sono stringhe ISO (yyyy-MM-dd): il confronto alfabetico è anche cronologico.
 */

// tipi di cui, su uno stesso veicolo, può valerne uno solo per volta
const GENERICO = 'Altro'

export function reminderAttivi(tagliandi, oggi = new Date()) {
  const conScadenza = (tagliandi || []).filter(t => t.dataProssima)
  const oggiISO = oggi.toISOString().slice(0, 10)
  const chiave = t => `${t.veicoloId}__${t.tipo}`

  // per i tipi unici: qual è la scadenza più avanti nel tempo, veicolo per veicolo
  const ultima = new Map()
  for (const t of conScadenza) {
    if (t.tipo === GENERICO) continue
    const k = chiave(t)
    if (!ultima.has(k) || t.dataProssima > ultima.get(k)) ultima.set(k, t.dataProssima)
  }

  const hannoUnSuccessoreValido = new Set(
    conScadenza.filter(t => t.dataProssima >= oggiISO).map(chiave)
  )

  return conScadenza.filter(t => {
    if (t.tipo !== GENERICO) return t.dataProssima === ultima.get(chiave(t))
    return t.dataProssima >= oggiISO || !hannoUnSuccessoreValido.has(chiave(t))
  })
}
