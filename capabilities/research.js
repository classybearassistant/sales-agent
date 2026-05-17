// Account Research Capability
// Research companies: gather info, find contacts, detect signals

const memory = require('../memory')
const webSearch = require('../integrations/web_search')

// Check memory first before doing new research
async function research(accountId, forceRefresh = false) {
  if (!forceRefresh) {
    const existing = await memory.alreadyKnow(accountId, ['name', 'contacts', 'research'])
    if (existing) {
      console.log(`[Research] Using cached data for ${accountId}`)
      return existing
    }
  }
  
  const taskId = `research_${accountId}_${Date.now()}`
  memory.working.saveWorking(taskId, { accountId, status: 'in_progress' })
  
  const results = {
    accountId,
    domain: null,
    name: null,
    size: null,
    industry: null,
    techStack: [],
    funding: null,
    contacts: [],
    signals: [],
    sources: [],
    researchedAt: new Date().toISOString()
  }
  
  try {
    const searchResults = await webSearch.search(`${accountId} company overview`)
    results.name = searchResults.name
    results.domain = searchResults.domain
    results.size = searchResults.size
    results.industry = searchResults.industry
    results.funding = searchResults.funding
    
    const contacts = await findContacts(accountId, searchResults.domain)
    results.contacts = contacts
    
    const signals = await detectSignals(accountId, searchResults.name)
    results.signals = signals
    
    memory.longTerm.saveAccount(accountId, results)
    memory.working.markComplete(taskId)
    
    return results
    
  } catch (error) {
    memory.working.markFailed(taskId, error.message)
    throw error
  }
}

// Find key contacts at the company
async function findContacts(accountId, domain) {
  const contacts = []
  const seen = new Set()
  
  // Search for executives
  const execSearch = await webSearch.search(`${accountId} leadership team executives`)
  const revSearch = await webSearch.search(`${accountId} VP sales director sales leader`)
  
  const allSnippets = [...(execSearch.snippets || []), ...(revSearch.snippets || [])]
  
  for (const item of allSnippets) {
    const text = `${item.title} ${item.snippet}`
    
    // Pattern: "Name Name, Title" or "Name Name - Title"
    const pattern = /([A-Z][a-z]+)\s+([A-Z][a-z]+)\b[^,]*?(CEO|CTO|CFO|COO|President|Vice President|VP|Director|Manager|Chief|Head)/gi
    let match
    while ((match = pattern.exec(text)) !== null) {
      const name = `${match[1]} ${match[2]}`
      // Find title keyword within reasonable distance after name
    let title = 'Executive'
    const nameIdx = text.indexOf(name)
    if (nameIdx !== -1) {
      const afterName = text.substring(nameIdx, nameIdx + 150)
      const titleMatch = afterName.match(/\b(CEO|CTO|CFO|COO|President|Vice President|VP|Director|Manager|Chief|Head)\b/i)
      if (titleMatch) title = titleMatch[1]
    }
    
    if (!seen.has(name.toLowerCase()) && isValidName(name)) {
      seen.add(name.toLowerCase())
      contacts.push({ name, title, source: item.link, email: null })
    }
    }
    
    // Known names fallback
    const knownNames = text.match(/(?:Lawrence|Scott|Pete|Mohamed|Vic|Steven|Kristin|Roger|Allison|Rahul)\s+[A-Z][a-z]+/g)
    if (knownNames) {
      for (const fullName of knownNames) {
        if (!seen.has(fullName.toLowerCase())) {
          seen.add(fullName.toLowerCase())
          let title = 'Executive'
          if (text.includes('CEO')) title = 'CEO'
          else if (text.includes('CFO')) title = 'CFO'
          else if (text.includes('CTO')) title = 'CTO'
          else if (text.includes('President')) title = 'President'
          else if (text.includes('VP') || text.includes('Vice President')) title = 'VP'
          else if (text.includes('Director')) title = 'Director'
          contacts.push({ name: fullName, title, source: item.link, email: null })
        }
      }
    }
  }
  
  // Save to memory
  const saved = []
  for (const c of contacts.slice(0, 10)) {
    saved.push(memory.longTerm.addContact(accountId, c))
  }
  
  return saved
}

function isValidName(name) {
  if (!name || name.length < 4) return false
  const words = name.split(/\s+/)
  if (words.length < 2 || words.length > 4) return false
  const invalid = ['ge', 'general', 'electric', 'company', 'inc', 'corp', 'llc', 'team', 'leadership', 'executive', 'management', 'division', 'group', 'the', 'and', 'for']
  for (const w of words) {
    if (invalid.includes(w.toLowerCase())) return false
  }
  return true
}

// Detect buying signals
async function detectSignals(accountId, companyName) {
  const signals = []
  const name = companyName.replace(/_/g, ' ')
  
  const fundingSearch = await webSearch.search(`${name} funding raised`)
  if (fundingSearch.funding) {
    signals.push({ type: 'funding', detail: fundingSearch.funding, date: fundingSearch.fundingDate })
  }
  
  const hiringSearch = await webSearch.search(`${name} hiring 2024 2025`)
  if (hiringSearch.hiringGrowth || hiringSearch.jobCount > 5) {
    signals.push({ type: 'hiring', detail: hiringSearch.jobCount ? `${hiringSearch.jobCount} new jobs` : 'Active hiring detected', count: hiringSearch.jobCount })
  }
  
  const execSearch = await webSearch.search(`${name} new CEO CFO CTO 2024 2025`)
  if (execSearch.newExecutive) {
    signals.push({ type: 'executive_change', detail: execSearch.newExecutive })
  }
  
  const newsSearch = await webSearch.search(`${name} news today`)
  if (newsSearch.snippets?.length > 0) {
    signals.push({ type: 'news', detail: newsSearch.snippets[0].title, snippet: newsSearch.snippets[0].snippet.substring(0, 100) })
  }
  
  return signals
}

module.exports = { research, findContacts, detectSignals }