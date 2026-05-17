// Working memory — transient, per-task
// Stores current work in progress: prospect lists, draft emails, research gathered

const workingDir = './memory/working'
const fs = require('fs')

function ensureDir() {
  if (!fs.existsSync(workingDir)) {
    fs.mkdirSync(workingDir, { recursive: true })
  }
}

function getFilePath(taskId) {
  return `${workingDir}/${taskId}.json`
}

function createEmpty(taskId) {
  return {
    taskId,
    createdAt: new Date().toISOString(),
    prospects: [],
    drafts: [],
    research: {},
    status: 'in_progress'
  }
}

function loadWorking(taskId) {
  ensureDir()
  const filePath = getFilePath(taskId)
  
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.log(`Error loading working memory for ${taskId}:`, e.message)
  }
  
  return createEmpty(taskId)
}

function saveWorking(taskId, data) {
  ensureDir()
  const existing = loadWorking(taskId)
  const updated = {
    ...existing,
    ...data,
    taskId,
    updatedAt: new Date().toISOString()
  }
  
  const filePath = getFilePath(taskId)
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2))
  return updated
}

function addProspect(taskId, prospect) {
  const working = loadWorking(taskId)
  const newProspect = {
    id: Date.now().toString(),
    addedAt: new Date().toISOString(),
    ...prospect
  }
  working.prospects.push(newProspect)
  saveWorking(taskId, { prospects: working.prospects })
  return newProspect
}

function addDraft(taskId, draft) {
  const working = loadWorking(taskId)
  const newDraft = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    ...draft
  }
  working.drafts.push(newDraft)
  saveWorking(taskId, { drafts: working.drafts })
  return newDraft
}

function updateResearch(taskId, researchData) {
  const working = loadWorking(taskId)
  working.research = { ...working.research, ...researchData }
  saveWorking(taskId, { research: working.research })
  return working.research
}

function clearWorking(taskId) {
  const filePath = getFilePath(taskId)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

function markComplete(taskId) {
  saveWorking(taskId, { status: 'completed' })
}

function markFailed(taskId, error) {
  saveWorking(taskId, { status: 'failed', error: error })
}

function getStatus(taskId) {
  const working = loadWorking(taskId)
  return working.status
}

module.exports = {
  loadWorking,
  saveWorking,
  addProspect,
  addDraft,
  updateResearch,
  clearWorking,
  markComplete,
  markFailed,
  getStatus
}