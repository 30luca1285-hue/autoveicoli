import { APPS_SCRIPT_URL as CONFIG_URL } from '../config'

function getUrl() {
  return localStorage.getItem('appsScriptUrl') || CONFIG_URL
}

async function call(params) {
  const url = new URL(getUrl())
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function post(body) {
  const res = await fetch(getUrl(), {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

// VEICOLI
export async function getVeicoli() {
  return call({ action: 'getVeicoli' })
}
export async function addVeicolo(data) {
  return post({ action: 'addVeicolo', ...data })
}
export async function updateVeicolo(data) {
  return post({ action: 'updateVeicolo', ...data })
}
export async function deleteVeicolo(id) {
  return post({ action: 'deleteVeicolo', id })
}

// COSTI
export async function getCosti() {
  return call({ action: 'getCosti' })
}
export async function addCosto(data) {
  return post({ action: 'addCosto', ...data })
}
export async function deleteCosto(id) {
  return post({ action: 'deleteCosto', id })
}

// TAGLIANDI
export async function getTagliandi() {
  return call({ action: 'getTagliandi' })
}
export async function addTagliando(data) {
  return post({ action: 'addTagliando', ...data })
}
export async function deleteTagliando(id) {
  return post({ action: 'deleteTagliando', id })
}
