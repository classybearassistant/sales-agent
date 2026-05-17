// Short-term memory — resets each session
// Stores current context, active task, recent preferences

const shortTermFile = './memory/short_term.json'
const fs = require('fs')

function createEmpty() {
  return {
    sessionId: Date.now().toString(),
    createdAt: new Date().toISOString(),
    currentTask: null,
    context: {},
    recentPreferences: [],
    lastActivity: null
  }
}

function load() {
  try {
    if (fs.existsSync(shortTermFile)) {
      const data = fs.readFileSync(shortTermFile, 'utf8')
      return JSON.parse(data)
    }
  } catch (e) {
    console.log('Short-term memory not found or corrupted, creating fresh')
  }
  return createEmpty()
}

function save(data) {
  data.lastActivity = new Date().toISOString()
  fs.writeFileSync(shortTermFile, JSON.stringify(data, null, 2))
}

function updateContext(key, value) {
  const mem = load()
  mem.context[key] = value
  save(mem)
}

function getContext(key) {
  const mem = load()
  return mem.context[key]
}

function setCurrentTask(task) {
  const mem = load()
  mem.currentTask = task
  save(mem)
}

function getCurrentTask() {
  const mem = load()
  return mem.currentTask
}

module.exports = {
  load,
  save,
  updateContext,
  getContext,
  setCurrentTask,
  getCurrentTask
}