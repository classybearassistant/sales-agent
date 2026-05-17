// Memory layer — unified interface
// Export all 3 memory types plus convenience functions

const shortTerm = require('./short_term')
const longTerm = require('./long_term')
const working = require('./working')

// Convenience: check long-term before doing research
async function remember(accountId, field) {
  const account = longTerm.loadAccount(accountId)
  return account[field]
}

// Convenience: save something to long-term
async function rememberForLater(accountId, field, value) {
  const update = {}
  update[field] = value
  longTerm.saveAccount(accountId, update)
}

// Check if we already know enough about an account
async function alreadyKnow(accountId, neededFields) {
  const account = longTerm.loadAccount(accountId)
  const known = neededFields.filter(f => account[f] && account[f].length > 0)
  return known.length === neededFields.length ? account : null
}

module.exports = {
  shortTerm,
  longTerm,
  working,
  remember,
  rememberForLater,
  alreadyKnow
}