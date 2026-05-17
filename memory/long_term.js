// Long-term memory — persists forever
// Stores account histories, contact records, all research forever

const longTermDir = './memory/long_term'
const fs = require('fs')

function ensureDir() {
  if (!fs.existsSync(longTermDir)) {
    fs.mkdirSync(longTermDir, { recursive: true })
  }
}

function getFilePath(accountId) {
  return `${longTermDir}/${accountId}.json`
}

function createEmpty(accountId) {
  return {
    accountId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    name: null,
    domain: null,
    contacts: [],
    research: [],
    notes: [],
    emails: [],
    tags: []
  }
}

function loadAccount(accountId) {
  ensureDir()
  const filePath = getFilePath(accountId)
  
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.log(`Error loading account ${accountId}:`, e.message)
  }
  
  return createEmpty(accountId)
}

function saveAccount(accountId, data) {
  ensureDir()
  const existing = loadAccount(accountId)
  const updated = {
    ...existing,
    ...data,
    accountId,
    updatedAt: new Date().toISOString()
  }
  
  const filePath = getFilePath(accountId)
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2))
  return updated
}

function addContact(accountId, contact) {
  const account = loadAccount(accountId)
  const newContact = {
    id: Date.now().toString(),
    addedAt: new Date().toISOString(),
    ...contact
  }
  account.contacts.push(newContact)
  saveAccount(accountId, { contacts: account.contacts })
  return newContact
}

function addResearch(accountId, researchItem) {
  const account = loadAccount(accountId)
  const newResearch = {
    id: Date.now().toString(),
    addedAt: new Date().toISOString(),
    ...researchItem
  }
  account.research.push(newResearch)
  saveAccount(accountId, { research: account.research })
  return newResearch
}

function addNote(accountId, note) {
  const account = loadAccount(accountId)
  const newNote = {
    id: Date.now().toString(),
    addedAt: new Date().toISOString(),
    text: note
  }
  account.notes.push(newNote)
  saveAccount(accountId, { notes: account.notes })
  return newNote
}

function listAccounts() {
  ensureDir()
  const files = fs.readdirSync(longTermDir).filter(f => f.endsWith('.json'))
  return files.map(f => {
    const accountId = f.replace('.json', '')
    const data = JSON.parse(fs.readFileSync(`${longTermDir}/${f}`, 'utf8'))
    return {
      accountId,
      name: data.name,
      domain: data.domain,
      updatedAt: data.updatedAt,
      contactCount: data.contacts ? data.contacts.length : 0
    }
  })
}

module.exports = {
  loadAccount,
  saveAccount,
  addContact,
  addResearch,
  addNote,
  listAccounts
}