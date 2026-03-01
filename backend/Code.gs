// ================================================
// AUTOVEICOLI - Google Apps Script Backend
// Incolla questo codice in Apps Script e fai Deploy
// ================================================

const SS = SpreadsheetApp.getActiveSpreadsheet()

// Nomi fogli
const SHEET_VEICOLI    = 'Veicoli'
const SHEET_COSTI      = 'Costi'
const SHEET_TAGLIANDI  = 'Tagliandi'

// Intestazioni
const HDR_VEICOLI   = ['id', 'nome', 'targa', 'tipo', 'anno', 'nota', 'dataImmatricolazione', 'carburante', 'intervaloRevisione', 'kmAttuali', 'createdAt']
const HDR_COSTI     = ['id', 'veicoloId', 'data', 'categoria', 'importo', 'nota', 'litri', 'km', 'createdAt']
const HDR_TAGLIANDI = ['id', 'veicoloId', 'tipo', 'data', 'km', 'dataProssima', 'kmProssimi', 'importo', 'nota', 'createdAt']

// ── Utilities ──────────────────────────────────────────────────────────────

function getOrCreateSheet(name, headers) {
  let sheet = SS.getSheetByName(name)
  if (!sheet) {
    sheet = SS.insertSheet(name)
    sheet.appendRow(headers)
    sheet.setFrozenRows(1)
  }
  return sheet
}

function sheetToObjects(sheet, headers) {
  const data = sheet.getDataRange().getValues()
  if (data.length <= 1) return []
  return data.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => {
      const val = row[i]
      if (val instanceof Date) {
        // Formatta solo la data (yyyy-MM-dd) senza ora né fuso orario
        obj[h] = val.getFullYear() === 1899 ? '' : Utilities.formatDate(val, 'Europe/Rome', 'yyyy-MM-dd')
      } else {
        obj[h] = val === undefined ? '' : String(val)
      }
    })
    return obj
  }).filter(o => o.id !== '')
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function corsResponse(data) {
  // Apps Script non supporta CORS headers su exec, ma in "anyone" funziona via fetch
  return jsonResponse(data)
}

// ── VEICOLI ────────────────────────────────────────────────────────────────

function getVeicoli() {
  const sheet = getOrCreateSheet(SHEET_VEICOLI, HDR_VEICOLI)
  return sheetToObjects(sheet, HDR_VEICOLI)
}

function addVeicolo(p) {
  const sheet = getOrCreateSheet(SHEET_VEICOLI, HDR_VEICOLI)
  const id = generateId()
  sheet.appendRow([id, p.nome||'', p.targa||'', p.tipo||'auto', p.anno||'', p.nota||'',
    p.dataImmatricolazione||'', p.carburante||'', p.intervaloRevisione||'', p.kmAttuali||'',
    new Date().toISOString()])
  SpreadsheetApp.flush()
  return { ok: true, id }
}

function updateVeicolo(p) {
  const sheet = getOrCreateSheet(SHEET_VEICOLI, HDR_VEICOLI)
  const data = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      if (p.nome !== undefined) sheet.getRange(i+1, 2).setValue(p.nome)
      if (p.targa !== undefined) sheet.getRange(i+1, 3).setValue(p.targa)
      if (p.tipo !== undefined) sheet.getRange(i+1, 4).setValue(p.tipo)
      if (p.anno !== undefined) sheet.getRange(i+1, 5).setValue(p.anno)
      if (p.nota !== undefined) sheet.getRange(i+1, 6).setValue(p.nota)
      if (p.dataImmatricolazione !== undefined) sheet.getRange(i+1, 7).setValue(p.dataImmatricolazione)
      if (p.carburante !== undefined) sheet.getRange(i+1, 8).setValue(p.carburante)
      if (p.intervaloRevisione !== undefined) sheet.getRange(i+1, 9).setValue(p.intervaloRevisione)
      if (p.kmAttuali !== undefined) sheet.getRange(i+1, 10).setValue(p.kmAttuali)
      SpreadsheetApp.flush()
      return { ok: true }
    }
  }
  return { ok: false, error: 'not found' }
}

function deleteVeicolo(id) {
  // Elimina il veicolo
  deleteFromSheet(SHEET_VEICOLI, HDR_VEICOLI, id)
  // Elimina costi associati
  const sheetC = getOrCreateSheet(SHEET_COSTI, HDR_COSTI)
  const dataC = sheetC.getDataRange().getValues()
  for (let i = dataC.length - 1; i >= 1; i--) {
    if (String(dataC[i][1]) === String(id)) sheetC.deleteRow(i + 1)
  }
  // Elimina tagliandi associati
  const sheetT = getOrCreateSheet(SHEET_TAGLIANDI, HDR_TAGLIANDI)
  const dataT = sheetT.getDataRange().getValues()
  for (let i = dataT.length - 1; i >= 1; i--) {
    if (String(dataT[i][1]) === String(id)) sheetT.deleteRow(i + 1)
  }
  return { ok: true }
}

// ── COSTI ──────────────────────────────────────────────────────────────────

function getCosti() {
  const sheet = getOrCreateSheet(SHEET_COSTI, HDR_COSTI)
  return sheetToObjects(sheet, HDR_COSTI)
}

function addCosto(p) {
  const sheet = getOrCreateSheet(SHEET_COSTI, HDR_COSTI)
  const id = generateId()
  sheet.appendRow([
    id,
    p.veicoloId || '',
    p.data || new Date().toISOString().slice(0,10),
    p.categoria || '',
    parseFloat(p.importo) || 0,
    p.nota || '',
    parseFloat(p.litri) || '',
    parseFloat(p.km) || '',
    new Date().toISOString()
  ])
  SpreadsheetApp.flush()
  return { ok: true, id }
}

function updateCosto(p) {
  const sheet = getOrCreateSheet(SHEET_COSTI, HDR_COSTI)
  // HDR_COSTI = ['id','veicoloId','data','categoria','importo','nota','litri','km','createdAt']
  //                0       1        2        3           4        5      6      7       8
  const data = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      if (p.data !== undefined)      sheet.getRange(i+1, 3).setValue(p.data)
      if (p.categoria !== undefined) sheet.getRange(i+1, 4).setValue(p.categoria)
      if (p.importo !== undefined)   sheet.getRange(i+1, 5).setValue(parseFloat(p.importo) || '')
      if (p.nota !== undefined)      sheet.getRange(i+1, 6).setValue(p.nota)
      if (p.km !== undefined)        sheet.getRange(i+1, 8).setValue(parseFloat(p.km) || '')
      SpreadsheetApp.flush()
      return { ok: true }
    }
  }
  return { ok: false, error: 'not found' }
}

function deleteCosto(id) {
  return deleteFromSheet(SHEET_COSTI, HDR_COSTI, id)
}

// ── TAGLIANDI ──────────────────────────────────────────────────────────────

function getTagliandi() {
  const sheet = getOrCreateSheet(SHEET_TAGLIANDI, HDR_TAGLIANDI)
  return sheetToObjects(sheet, HDR_TAGLIANDI)
}

function addTagliando(p) {
  const sheet = getOrCreateSheet(SHEET_TAGLIANDI, HDR_TAGLIANDI)
  const id = generateId()
  sheet.appendRow([
    id,
    p.veicoloId || '',
    p.tipo || '',
    p.data || new Date().toISOString().slice(0,10),
    parseFloat(p.km) || '',
    p.dataProssima || '',
    parseFloat(p.kmProssimi) || '',
    parseFloat(p.importo) || '',
    p.nota || '',
    new Date().toISOString()
  ])
  SpreadsheetApp.flush()
  return { ok: true, id }
}

function updateTagliando(p) {
  const sheet = getOrCreateSheet(SHEET_TAGLIANDI, HDR_TAGLIANDI)
  // HDR_TAGLIANDI = ['id','veicoloId','tipo','data','km','dataProssima','kmProssimi','importo','nota','createdAt']
  //                    0      1          2     3     4       5              6           7        8       9
  const data = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      if (p.tipo !== undefined)        sheet.getRange(i+1, 3).setValue(p.tipo)
      if (p.data !== undefined)        sheet.getRange(i+1, 4).setValue(p.data)
      if (p.km !== undefined)          sheet.getRange(i+1, 5).setValue(parseFloat(p.km) || '')
      if (p.dataProssima !== undefined) sheet.getRange(i+1, 6).setValue(p.dataProssima)
      if (p.kmProssimi !== undefined)  sheet.getRange(i+1, 7).setValue(parseFloat(p.kmProssimi) || '')
      if (p.importo !== undefined)     sheet.getRange(i+1, 8).setValue(parseFloat(p.importo) || '')
      if (p.nota !== undefined)        sheet.getRange(i+1, 9).setValue(p.nota)
      SpreadsheetApp.flush()
      return { ok: true }
    }
  }
  return { ok: false, error: 'not found' }
}

function deleteTagliando(id) {
  return deleteFromSheet(SHEET_TAGLIANDI, HDR_TAGLIANDI, id)
}

// ── Helper delete ──────────────────────────────────────────────────────────

function deleteFromSheet(sheetName, headers, id) {
  const sheet = getOrCreateSheet(sheetName, headers)
  const data = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1)
      return { ok: true }
    }
  }
  return { ok: false, error: 'not found' }
}

// ── NOTIFICHE TELEGRAM ─────────────────────────────────────────────────────

function saveTelegramConfig(p) {
  const props = PropertiesService.getScriptProperties()
  if (p.botToken !== undefined) props.setProperty('TG_BOT_TOKEN', p.botToken)
  if (p.chatId !== undefined)   props.setProperty('TG_CHAT_ID',   p.chatId)
  return { ok: true }
}

function sendTelegramMessage(text) {
  const props = PropertiesService.getScriptProperties()
  const token  = props.getProperty('TG_BOT_TOKEN')
  const chatId = props.getProperty('TG_CHAT_ID')
  if (!token || !chatId) throw new Error('Telegram non configurato: imposta Bot Token e Chat ID nelle Impostazioni')

  const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' }),
    muteHttpExceptions: true
  })
  const data = JSON.parse(res.getContentText())
  if (!data.ok) throw new Error('Telegram API error: ' + data.description)
  return data
}

function testTelegram() {
  sendTelegramMessage('✅ <b>Autoveicoli</b> — connessione Telegram funzionante!')
  return { ok: true }
}

// ── NOTIFICHE MENSILI ──────────────────────────────────────────────────────

function checkScadenzeMensili() {
  const oggi = new Date()
  const mese = oggi.getMonth()
  const anno = oggi.getFullYear()

  const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno',
                'Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

  const veicoli = getVeicoli()
  const tagliandi = getTagliandi()

  const scadute = []
  const questoMese = []

  tagliandi.forEach(t => {
    if (!t.dataProssima) return
    const d = new Date(t.dataProssima)
    const v = veicoli.find(v => v.id === t.veicoloId)
    const nome = v ? v.nome + (v.targa ? ' (' + v.targa + ')' : '') : 'Veicolo sconosciuto'
    const item = { nome, tipo: t.tipo, data: t.dataProssima }

    if (d < oggi) {
      scadute.push(item)
    } else if (d.getMonth() === mese && d.getFullYear() === anno) {
      questoMese.push(item)
    }
  })

  if (scadute.length === 0 && questoMese.length === 0) return

  const meseTitolo = MESI[mese] + ' ' + anno
  let msg = '🚗 <b>Autoveicoli — Scadenze ' + meseTitolo + '</b>\n'

  if (scadute.length > 0) {
    msg += '\n🔴 <b>Già scadute</b>\n'
    scadute.forEach(s => {
      msg += '• <b>' + s.nome + '</b> — ' + s.tipo + ' — ' + s.data + '\n'
    })
  }

  if (questoMese.length > 0) {
    msg += '\n🟡 <b>In scadenza questo mese</b>\n'
    questoMese.forEach(s => {
      msg += '• <b>' + s.nome + '</b> — ' + s.tipo + ' — ' + s.data + '\n'
    })
  }

  sendTelegramMessage(msg)
}

// Esegui questa funzione UNA SOLA VOLTA dall'editor Apps Script per attivare il trigger
function setupMonthlyTrigger() {
  // Rimuove eventuali trigger precedenti per questa funzione
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkScadenzeMensili')
    .forEach(t => ScriptApp.deleteTrigger(t))

  // Crea il trigger: 1° del mese alle 8:00
  ScriptApp.newTrigger('checkScadenzeMensili')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create()

  Logger.log('✅ Trigger attivato: ogni 1° del mese alle 8:00')
  return { ok: true, message: 'Trigger attivato: ogni 1° del mese alle 8:00' }
}

// ── Migrazione colonne Veicoli ─────────────────────────────────────────────

function migrateVeicoli() {
  const sheet = SS.getSheetByName(SHEET_VEICOLI)
  if (!sheet) return { ok: false, error: 'Sheet non trovato' }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  // Se ha già 11 colonne, migrazione già fatta
  if (headers.length >= 11) return { ok: true, message: 'Già aggiornato' }
  // Ha 7 colonne: id,nome,targa,tipo,anno,nota,createdAt
  // Inserisco 4 colonne vuote dopo la col 6 (nota), prima di createdAt
  sheet.insertColumnsAfter(6, 4)
  // Aggiorno l'intestazione
  sheet.getRange(1, 1, 1, 11).setValues([HDR_VEICOLI])
  return { ok: true, message: 'Migrazione completata: aggiunte 4 colonne' }
}

// ── Router GET ─────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    const action = e.parameter.action
    let result
    switch (action) {
      case 'getVeicoli':   result = getVeicoli(); break
      case 'getCosti':     result = getCosti(); break
      case 'getTagliandi': result = getTagliandi(); break
      case 'setupTrigger':  result = setupMonthlyTrigger(); break
      case 'testTelegram':  result = testTelegram(); break
      case 'migrate':       result = migrateVeicoli(); break
      default:             result = { error: 'Unknown action: ' + action }
    }
    return corsResponse(result)
  } catch (err) {
    return corsResponse({ error: err.toString() })
  }
}

// ── Router POST ────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const action = body.action
    let result
    switch (action) {
      case 'addVeicolo':      result = addVeicolo(body); break
      case 'updateVeicolo':   result = updateVeicolo(body); break
      case 'deleteVeicolo':   result = deleteVeicolo(body.id); break
      case 'addCosto':        result = addCosto(body); break
      case 'updateCosto':     result = updateCosto(body); break
      case 'deleteCosto':     result = deleteCosto(body.id); break
      case 'addTagliando':        result = addTagliando(body); break
      case 'updateTagliando':     result = updateTagliando(body); break
      case 'deleteTagliando':     result = deleteTagliando(body.id); break
      case 'saveTelegramConfig':  result = saveTelegramConfig(body); break
      default:                    result = { error: 'Unknown action: ' + action }
    }
    return corsResponse(result)
  } catch (err) {
    return corsResponse({ error: err.toString() })
  }
}
