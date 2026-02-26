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
const HDR_VEICOLI   = ['id', 'nome', 'targa', 'tipo', 'anno', 'nota', 'createdAt']
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
    headers.forEach((h, i) => { obj[h] = row[i] === undefined ? '' : String(row[i]) })
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
  sheet.appendRow([id, p.nome||'', p.targa||'', p.tipo||'auto', p.anno||'', p.nota||'', new Date().toISOString()])
  return { ok: true, id }
}

function updateVeicolo(p) {
  const sheet = getOrCreateSheet(SHEET_VEICOLI, HDR_VEICOLI)
  const data = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(p.id)) {
      if (p.nome) sheet.getRange(i+1, 2).setValue(p.nome)
      if (p.targa) sheet.getRange(i+1, 3).setValue(p.targa)
      if (p.tipo) sheet.getRange(i+1, 4).setValue(p.tipo)
      if (p.anno) sheet.getRange(i+1, 5).setValue(p.anno)
      if (p.nota !== undefined) sheet.getRange(i+1, 6).setValue(p.nota)
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
  return { ok: true, id }
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
  return { ok: true, id }
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

// ── Router GET ─────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    const action = e.parameter.action
    let result
    switch (action) {
      case 'getVeicoli':   result = getVeicoli(); break
      case 'getCosti':     result = getCosti(); break
      case 'getTagliandi': result = getTagliandi(); break
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
      case 'deleteCosto':     result = deleteCosto(body.id); break
      case 'addTagliando':    result = addTagliando(body); break
      case 'deleteTagliando': result = deleteTagliando(body.id); break
      default:                result = { error: 'Unknown action: ' + action }
    }
    return corsResponse(result)
  } catch (err) {
    return corsResponse({ error: err.toString() })
  }
}
