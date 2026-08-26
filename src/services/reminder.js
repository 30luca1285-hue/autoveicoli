/**
 * Quali promemoria mostrare.
 *
 * Un promemoria scaduto sparisce SOLO se, per lo stesso veicolo e lo stesso tipo,
 * ne esiste un altro ancora valido: vuol dire che l'intervento è stato rifatto
 * (es. revisione del carrello scaduta il 30/04/2026 + revisione fatta il 01/07/2026
 * con prossima al 2028 → resta solo la seconda).
 *
 * ⚠️ Perché NON basta "tieni solo la scadenza più lontana per tipo" (criterio usato
 * fino alla v0.6.6 nella Dashboard): il Doblò ha due promemoria di tipo "Altro" —
 * bombole metano FABER e bollo — entrambi validi e con date diverse. Quel criterio
 * ne faceva sparire uno, cioè nascondeva una scadenza vera.
 *
 * Le date sono stringhe ISO (yyyy-MM-dd): il confronto alfabetico è anche cronologico.
 */
export function reminderAttivi(tagliandi, oggi = new Date()) {
  const conScadenza = (tagliandi || []).filter(t => t.dataProssima)
  const oggiISO = oggi.toISOString().slice(0, 10)
  const chiave = t => `${t.veicoloId}__${t.tipo}`

  const hannoUnSuccessoreValido = new Set(
    conScadenza.filter(t => t.dataProssima >= oggiISO).map(chiave)
  )

  return conScadenza.filter(
    t => t.dataProssima >= oggiISO || !hannoUnSuccessoreValido.has(chiave(t))
  )
}
