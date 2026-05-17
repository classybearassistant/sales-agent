# Memory Layer — Sales Agent Memory System

## 3 Memory Types

### 1. Short-Term (session memory)
Resets every session. Holds:
- Current conversation context
- What task we're working on
- User preferences learned this session

File: `memory/short_term.json`

### 2. Long-Term (account memory)
Persists forever. Holds:
- Everything we know about each account
- Contact history
- Past research results
- Email threads

File: `memory/long_term/{account_id}.json`

### 3. Working Memory (task memory)
Transient. Holds:
- Current research being gathered
- Prospect lists in flight
- Draft emails being worked on

File: `memory/working/{task_id}.json`

## How Memory Flows

```
New Task → Check Long-Term (do we know this account?) → Check Short-Term (what's the context?)
         → Do work → Update Working Memory → Write results to Long-Term → Clear Working
```

## Key Principle
Don't re-research what we already know. Before any task, check if we already have the info in long-term memory.

## Memory Operations

```javascript
// Save to long-term
memory.saveAccount(accountId, { name, contacts, notes, lastUpdated })

// Load account
memory.loadAccount(accountId)

// Save working data
memory.saveWorking(taskId, { prospects: [], drafts: [], research: {} })

// Load working data
memory.loadWorking(taskId)

// Clear working (after task complete)
memory.clearWorking(taskId)
```

## File Storage
All memory is JSON files in `memory/` directory. Simple, portable, no database needed.