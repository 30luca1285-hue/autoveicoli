// Script di seed dati iniziali - eseguito una sola volta
const URL = 'https://script.google.com/macros/s/AKfycbz4Uh3Mb8rXeJQkeZ4cGMZsxpuL9Ca2rgMhnEw9O4xaa3p55dfEs2s8Ska6ZI-Cvyu0OQ/exec'

async function post(body) {
  const res = await fetch(URL, { method: 'POST', body: JSON.stringify(body) })
  return res.json()
}

async function main() {
  console.log('Inserimento veicoli...')

  const doblo = await post({ action: 'addVeicolo', nome: 'Fiat Doblo', targa: 'FR552GL', tipo: 'furgone', anno: '2018', nota: 'Metano CNG - bombole FABER' })
  console.log('✓ Fiat Doblo:', doblo.id)

  const talento = await post({ action: 'addVeicolo', nome: 'Fiat Talento', targa: 'FZ6726H', tipo: 'furgone', anno: '2020', nota: 'Diesel' })
  console.log('✓ Fiat Talento:', talento.id)

  const pickup = await post({ action: 'addVeicolo', nome: 'Mitsubishi L200', targa: 'AN597152', tipo: 'pickup', anno: '1993', nota: 'Diesel cassone - immatricolato 20/03/1993' })
  console.log('✓ Mitsubishi L200:', pickup.id)

  const carrello = await post({ action: 'addVeicolo', nome: 'Carrello Z.P.Z.', targa: 'XA133EE', tipo: 'carrello', anno: '2016', nota: 'Rimorchio RG1000 cassone - uso proprio' })
  console.log('✓ Carrello Z.P.Z.:', carrello.id)

  console.log('\nInserimento revisioni...')

  await post({ action: 'addTagliando', veicoloId: doblo.id, tipo: 'Revisione periodica', data: '2024-05-17', km: '112055', dataProssima: '2026-09-30', nota: 'Revisione del 17/05/2024 - esito regolare' })
  console.log('✓ Revisione Doblo')

  await post({ action: 'addTagliando', veicoloId: doblo.id, tipo: 'Altro', data: '2024-01-01', dataProssima: '2026-09-30', nota: 'Scadenza bombole metano FABER (5 bombole tot. 438 lt)' })
  console.log('✓ Bombole metano Doblo')

  await post({ action: 'addTagliando', veicoloId: talento.id, tipo: 'Revisione periodica', data: '2024-05-29', km: '123463', dataProssima: '2026-05-31', nota: 'Revisione del 29/05/2024 - esito regolare' })
  console.log('✓ Revisione Talento')

  await post({ action: 'addTagliando', veicoloId: pickup.id, tipo: 'Revisione periodica', data: '2023-08-17', km: '134345', dataProssima: '2025-09-30', nota: 'Revisione del 17/08/2023 - SCADUTA' })
  console.log('✓ Revisione Mitsubishi (SCADUTA)')

  await post({ action: 'addTagliando', veicoloId: carrello.id, tipo: 'Revisione periodica', data: '2024-04-03', dataProssima: '2026-04-30', nota: 'Revisione del 03/04/2024 - esito regolare' })
  console.log('✓ Revisione Carrello')

  console.log('\n✅ Tutto inserito! Puoi eliminare questo file.')
}

main().catch(console.error)
