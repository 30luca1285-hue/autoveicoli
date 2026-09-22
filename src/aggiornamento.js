/**
 * Tiene la PWA allineata alla versione pubblicata.
 *
 * ⚠️ 22/09/2026 — PERCHÉ ESISTE. Luca: «la revisione della L200 è già stata fatta, perché
 * sull'applicazione compare ancora?». Il dato era giusto (revisione del 15/09 con prossima al
 * 2028), il filtro era giusto e il sito pubblicato pure: sbagliata era la copia **sul telefono**.
 * Una PWA installata non riscarica il codice finché non viene chiusa davvero, e su iOS può
 * restare indietro per giorni. Era già successo l'08/09 con la categoria «lavaggio»: due
 * indagini partite da un difetto che nel codice non c'era più.
 *
 * Cosa fa: ogni volta che l'app torna in primo piano chiede al service worker di controllare se
 * c'è una versione nuova. Se c'è, `skipWaiting` la attiva e il browser cambia controller: a quel
 * punto si ricarica **una volta sola** e si riparte dal codice nuovo.
 */
export function tieniAggiornata() {
  if (!('serviceWorker' in navigator)) return

  const controlla = () => navigator.serviceWorker.getRegistration()
    .then(reg => reg?.update())
    .catch(() => {})   // offline o SW non ancora registrato: si riproverà al prossimo rientro

  document.addEventListener('visibilitychange', () => { if (!document.hidden) controlla() })
  window.addEventListener('focus', controlla)
  controlla()

  // ⛔ una volta sola: senza la guardia, un controller che cambia durante il reload rimanda il
  // reload e l'app entra in ciclo.
  let giaRicaricata = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (giaRicaricata) return
    giaRicaricata = true
    window.location.reload()
  })
}
