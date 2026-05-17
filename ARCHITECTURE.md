# Sales Agent — Architecture Spec

## Overview
Autonomous AI sales agent that researches accounts, prospects, drafts emails, and builds lead lists. Integrates with HubSpot, Salesforce, and email.

## Principles
- Single-threaded execution (one task at a time)
- File-based memory for simplicity
- Clear separation: Core → Memory → Capabilities → Integrations

## 4 Layers

```
┌─────────────────────────────────────────┐
│           AGENT CORE                    │
│  Task queue, decision logic, main loop  │
├─────────────────────────────────────────┤
│           MEMORY LAYER                  │
│  Short-term | Long-term | Working      │
├─────────────────────────────────────────┤
│         CAPABILITY MODULES              │
│  Research | Prospecting | Email | Lists │
├─────────────────────────────────────────┤
│         INTEGRATION LAYER               │
│  HubSpot | Salesforce | Email | Web     │
└─────────────────────────────────────────┘
```

## Layer 1 — Agent Core
- **Main loop:** receives task → breaks down → executes → reports
- **Task queue:** FIFO, one task at a time
- **Decision engine:** decides which capability to use for a given task

## Layer 2 — Memory
- **Short-term:** current session context (resets each session)
- **Working memory:** in-progress research, current prospect lists
- **Long-term:** account histories, past interactions, learned preferences

## Layer 3 — Capabilities
- **account_research:** gather company info, key contacts, news
- **prospecting:** find decision-makers, build lead lists
- **email_drafting:** generate personalized outreach emails
- **list_building:** compile and format prospect lists

## Layer 4 — Integrations
- **hubspot:** CRM read/write
- **salesforce:** CRM read/write
- **email:** Gmail/SMTP for sending
- **web:** search and scraping

## File Structure
```
sales-agent/
├── core/
│   ├── agent.js          # Main loop & decision engine
│   ├── task_queue.js     # FIFO task execution
│   └── skills.js         # Skill definitions
├── memory/
│   ├── short_term.js     # Session memory
│   ├── long_term.js      # Persistent account memory
│   └── working.js        # Current task working data
├── capabilities/
│   ├── research.js
│   ├── prospecting.js
│   ├── email.js
│   └── list_builder.js
├── integrations/
│   ├── hubspot.js
│   ├── salesforce.js
│   └── email.js
└── config/
    └── settings.js       # API keys, preferences
```

## Task Flow Example
1. User: "Research Acme Corp and find the VP of Sales"
2. Core breaks into: [search web for Acme → find contacts → identify VP of Sales → save to memory]
3. Core executes each step sequentially
4. Returns result with sources

## Next Steps
- Build Agent Core (task queue + main loop)
- Add first capability: Account Research
- Wire up memory layer