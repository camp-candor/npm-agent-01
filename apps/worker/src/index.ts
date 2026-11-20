import { Hono } from 'hono'
import { coreTools, type Env } from './tools.core.js'
import agent, { ActAgt, getActiveWorker } from '@camp_candor/100.agent/hunt'
// import { customTools } from './tools.custom.js'

// ----------------------------------------------------------------------------
// :: DETERMINISTIC LLM & DEVOPS SYSTEM PROMPT
// ----------------------------------------------------------------------------

const cfModel: any = {
    id: '@cf/meta/llama-3.2-3b-instruct',
    api: 'openai-completions',
    provider: 'openai',
    baseUrl: '',
    reasoning: false,
    input: ['text'],
    temperature: 0.1,
    compat: {
        supportsStore: false,
        supportsDeveloperRole: false,
        supportsStrictMode: false,
    },
}

const agentPrompt = `
You are repo-bot, the deterministic DevOps Control Plane and Git Mechanic.
You possess a suite of deterministic Git and CI surveillance instruments:
1. 'get_commit_sha': Captures the immutable base rollback anchor (S_clean) before modifying branches.
2. 'create_ephemeral_branch': Creates an isolated work branch (spec/TASK-XX-<short-sha>). Direct commits to main are forbidden.
3. 'write_repo_file': Writes bounded UTF-8 content to an ephemeral branch.
4. 'create_pull_request': Opens a Pull Request from an ephemeral branch to trunk for validation.
5. 'inspect_repo_checks': Queries repository commits and evaluates check-run CI outcomes.

OPERATIONAL INVARIANTS:
- Always capture S_clean via get_commit_sha before creating branches.
- Never modify files directly on main or production tracking branches.
- Output deterministic, structured summaries following tool execution.
`

agent.hunt(ActAgt.INIT_AGENT, {
    src: agentPrompt,
    dat: { cfModel, coreTools },
})

// ----------------------------------------------------------------------------
// :: HONO ROUTER
// ----------------------------------------------------------------------------

const app = new Hono<{ Bindings: Env }>()

// Root Health & Verification Endpoint
app.get('/', (c) => c.text('REPO-BOT EDGE CONTROL PLANE IS LIVE'))

// Structured Diagnostics Endpoint (Satisfies packages/000.agent switchboard probe)
app.get('/health', async (c) => {
    const bit = await agent.hunt(ActAgt.HEALTH_AGENT, { dat: { c } })
    return c.json(bit.agnBit.dat, 200)
})

// Fast-Path Oracle Endpoint
app.get('/oracle', async (c) => {
    const src = '@cf/meta/llama-3.2-3b-instruct'
    const bit = await agent.hunt(ActAgt.ORACLE_AGENT, { src, dat: { c } })
    return c.text(bit.agnBit.dat)
})

// Durable Object Session Ingress
app.all('/agent/*', async (c) => {
    const bit = await agent.hunt(ActAgt.CATCHALL_AGENT, { dat: { c } })
    return bit.agnBit.dat
})

export const AgentSessionDO = getActiveWorker().AgentSessionDO
export default app
