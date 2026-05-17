// Sales Agent - Direct Integration
// Load and run from OpenClaw main session

let salesAgent = null

async function getAgent() {
  if (!salesAgent) {
    try {
      const { SalesAgent } = require('/Users/markcope/.openclaw/workspace/sales-agent/core/agent')
      salesAgent = new SalesAgent({
        name: 'Sales Agent',
        crm: process.env.CRM || 'hubspot',
        senderEmail: process.env.SENDER_EMAIL || 'mark@gtmrevolution.com',
        senderName: process.env.SENDER_NAME || 'Mark'
      })
      console.log('[SalesAgent] Initialized successfully')
    } catch (e) {
      console.error('[SalesAgent] Load error:', e.message)
      throw e
    }
  }
  return salesAgent
}

async function run(command) {
  const agent = await getAgent()
  return await agent.handle(command)
}

// Test function
async function test() {
  console.log('[SalesAgent] Running test...')
  try {
    const result = await run('check test_account')
    console.log('[SalesAgent] Test result:', result)
    return result
  } catch (e) {
    console.error('[SalesAgent] Test failed:', e.message)
    return `Error: ${e.message}`
  }
}

module.exports = { run, test, getAgent }