// Web Search Integration — Serper.dev
// Uses Google's search results via Serper API

const https = require('https')

const SERPER_API_KEY = process.env.SERPER_API_KEY || '9d9adc971a98ec58fd8bacb31056c9abff3306f2'
const SERPER_URL = 'google.serper.dev'

async function search(query) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      q: query,
      num: 10
    })

    const options = {
      hostname: SERPER_URL,
      port: 443,
      path: '/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': SERPER_API_KEY
      }
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          resolve(parseSerperResult(query, result))
        } catch (e) {
          reject(new Error(`Failed to parse Serper response: ${e.message}`))
        }
      })
    })

    req.on('error', (e) => {
      reject(new Error(`Serper request failed: ${e.message}`))
    })

    req.write(postData)
    req.end()
  })
}

// Parse Serper response into our format
function parseSerperResult(query, result) {
  const parsed = {
    query,
    name: extractCompanyName(query),
    domain: null,
    size: null,
    industry: null,
    funding: null,
    fundingDate: null,
    hiringGrowth: null,
    jobCount: null,
    newExecutive: null,
    snippets: []
  }

  // Extract company name from query
  parsed.name = query
    .replace(/company overview|about|info|executive team|vp sales|director|engineering manager|funding raised|hiring growth|new hire/gis, '')
    .trim()

  // Parse knowledge graph if present
  if (result.knowledgeGraph) {
    const kg = result.knowledgeGraph
    parsed.name = kg.title || parsed.name
    parsed.domain = kg.domain
    if (kg.type) parsed.industry = kg.type
    if (kg.description) {
      const sizeMatch = kg.description.match(/(\d+,?\d*)\s*(employees?|people)/i)
      if (sizeMatch) parsed.size = sizeMatch[0]
    }
  }

  // Parse organic search results
  const organic = result.organic || []
  for (const item of organic) {
    const snippet = item.snippet || ''
    const title = item.title || ''

    // Funding detection
    if (!parsed.funding) {
      const fundingMatch = snippet.match(/\$[\d.]+\s*(million|billion|thousand)/i)
      if (fundingMatch) {
        parsed.funding = fundingMatch[0]
        parsed.fundingDate = item.date || null
      }
    }

    // Hiring detection
    if (snippet.includes('hiring') || snippet.includes('jobs') || snippet.includes('careers')) {
      if (!parsed.hiringGrowth) {
        const jobsMatch = snippet.match(/(\d+)\s*(jobs?|open positions)/i)
        if (jobsMatch) {
          parsed.hiringGrowth = true
          parsed.jobCount = parseInt(jobsMatch[1])
        }
      }
    }

    // Executive detection
    if (!parsed.newExecutive && (
        title.includes('CEO') || title.includes('CTO') || title.includes('CFO') ||
        title.includes('Chief') || title.includes('VP of'))) {
      const execMatch = title.match(/(CEO|CTO|CFO|Chief|Vice President|VP)\s+(\w+\s+){0,3}(\w+)/i)
      if (execMatch) {
        parsed.newExecutive = {
          role: execMatch[0],
          name: item.title
        }
      }
    }

    parsed.snippets.push({
      title: item.title,
      snippet: snippet,
      link: item.link
    })
  }

  return parsed
}

// Extract company name from query
function extractCompanyName(query) {
  return query
    .replace(/company overview|about|info/g, '')
    .replace(/executive team|vp sales|director|engineering manager/g, '')
    .replace(/funding raised|hiring growth|new hire executive/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
}

// Search for company contacts
async function searchContacts(query) {
  return search(query)
}

module.exports = {
  search,
  searchContacts
}