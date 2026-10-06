import { Hono } from 'hono'
import { createAgentWorker } from '@funtuantw/pi-agent-cf'
import { coreTools, type Env } from './tools.core.js'
import { customTools } from './tools.custom.js'

// ----------------------------------------------------------------------------
// THE BRAIN: DETERMINISTIC LLM & DEVOPS SYSTEM PROMPT
// ----------------------------------------------------------------------------

const cfModel: any = {
    id: '@cf/meta/llama-3.2-3b-instruct',
    api: 'openai-completions',
    provider: 'openai',
    baseUrl: '', // Configured dynamically per request env
    reasoning: false,
    input: ['text'],
    temperature: 0.1, // Deterministic tool execution
    compat: {
        supportsStore: false,
        supportsDeveloperRole: false,
        supportsStrictMode: false,
    },
}

const dynamicWorker = createAgentWorker<Env>({
    systemPrompt: (env) => {
        cfModel.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`

        return `
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
- Output deterministic, structured receipts following tool execution.
        `.trim()
    },
    model: cfModel,
    tools: (env) => [...coreTools(env), ...customTools(env)],
    getApiKey: (provider, env) => {
        if (provider === 'openai') return env.CLOUDFLARE_API_TOKEN
        return undefined
    },
})

// ----------------------------------------------------------------------------
// THE MIXING BOARD: HONO ROUTER
// ----------------------------------------------------------------------------

const app = new Hono<{ Bindings: Env }>()

// Root Health & Audit Assertion Endpoint (Matches apps/worker/test/audit/audit.test.ts)
app.get('/', (c) => c.text('REPO-BOT EDGE CONTROL PLANE IS LIVE'))

// Structured Diagnostics Probe (Matches packages/000.agent local switchboard)
app.get('/health', (c) =>
    c.json({
        status: 'healthy',
        service: 'repo-bot-edge',
        timestamp: new Date().toISOString(),
        hasGithubToken: Boolean(c.env.GITHUB_TOKEN),
        aiGateway: c.env.CLOUDFLARE_AI_GATEWAY || 'default',
    }),
)

// Fast-Path Oracle Inference Route
app.get('/oracle', async (c) => {
    try {
        const prompt = c.req.query('prompt') || 'Inspect system status'
        const response = await c.env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
            messages: [
                { role: 'user', content: `${prompt}. Output ONLY raw JSON.` },
            ],
        })
        return c.text(response.response || JSON.stringify(response))
    } catch (error: any) {
        console.error('Oracle Error:', error)
        return c.text(`Error: ${error.message}`, 500)
    }
})

// Fallback to pi-agent-cf Durable Object Session Handler
app.all('/*', async (c) => {
    if (!dynamicWorker.handler.fetch) return c.text('Handler missing', 500)
    return await dynamicWorker.handler.fetch(
        c.req.raw as any,
        c.env,
        c.executionCtx,
    )
})

export const AgentSessionDO = dynamicWorker.AgentSessionDO
export default app
