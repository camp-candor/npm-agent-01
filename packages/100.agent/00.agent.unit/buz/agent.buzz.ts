import { AgentModel } from '../agent.model.js'
import AgentBit from '../fce/agent.bit.js'
import State from '../../99.core/state.js'
import { getBaseUrl, getBaseWsUrl } from '../../src/cascade.js'

import { createAgentWorker } from '@funtuantw/pi-agent-cf'

const agent = {
    list: async () => ({ models: [] as any[] }),
}

//import contactSim from '@camp_candor/010.contact/hunt'
//import * as ActCnk from '@camp_candor/010.contact/action'
// import { customTools } from './tools.custom.js'

// ----------------------------------------------------------------------------
// :: DETERMINISTIC LLM & DEVOPS SYSTEM PROMPT
// ----------------------------------------------------------------------------

let activeWorker: any = null

export const getActiveWorker = () => activeWorker

export const initAgent = (cpy: AgentModel, bal: AgentBit, ste: State) => {
    const cfModel = bal.dat?.cfModel ?? bal.dat
    const getCoreTools = bal.dat?.coreTools

    activeWorker = createAgentWorker<any>({
        systemPrompt: (env) => {
            cfModel.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`
            return bal.src.trim()
        },
        model: cfModel,
        tools: (env) => (getCoreTools ? [...getCoreTools(env)] : []),
        getApiKey: (provider, env) => {
            if (provider === 'openai') return env.CLOUDFLARE_API_TOKEN
            return undefined
        },
    })
    cpy.agent = activeWorker

    if (bal.slv != null)
        bal.slv({ agnBit: { idx: 'init-agent', dat: activeWorker } })

    return cpy
}

export const updateAgent = (cpy: AgentModel, bal: AgentBit, ste: State) => {
    bal.slv({ intBit: { idx: 'update-agent' } })
    return cpy
}

export const testAgent = (cpy: AgentModel, bal: AgentBit, ste: State) => {
    bal.slv({ mytBit: { idx: 'test-agent', val: 1 } })
    return cpy
}

export const listAgent = async (cpy: AgentModel, bal: AgentBit, ste: State) => {
    const response = await agent.list()
    if (bal.slv != null)
        bal.slv({
            olmBit: {
                idx: 'list-agent',
                lst: response.models.map((m: any) => m.name),
            },
        })
    return cpy
}

export const connectAgent = (cpy: AgentModel, bal: AgentBit, ste: State) => {
    const isLocal =
        bal.src === 'LOCAL' || (global as any).agentBaseUrl?.includes('8787')
    const prefix = isLocal ? '[LOCAL WORKER]' : '[REMOTE WORKER]'
    const wsUrl = `${getBaseWsUrl()}/ws`

    if (isLocal) {
        ;(global as any).agentBaseUrl = 'http://127.0.0.1:8787'
    } else {
        delete (global as any).agentBaseUrl
    }

    // Idempotent Socket Guard: Do not re-create if already open
    if ((global as any).agentWs) {
        try {
            ;(global as any).agentWs.close(1000, 'Reconnecting')
        } catch (e) {}
        ;(global as any).agentWs = null
    }

    try {
        const ws = new WebSocket(wsUrl)
        ;(global as any).agentWs = ws

        ws.onopen = () => {
            if ((global as any).LIBRARY) {
                ;(global as any).LIBRARY.hunt(
                    '[Console action] Update Console',
                    {
                        idx: 'cns00',
                        src: `${prefix} Connected to agent WS: ${wsUrl}`,
                    },
                ).catch(() => {})
            }
            ws.send('Hello from agent Model')
        }

        ws.onmessage = (event: any) => {
            if ((global as any).LIBRARY) {
                ;(global as any).LIBRARY.hunt(
                    '[Console action] Update Console',
                    {
                        idx: 'cns00',
                        src: `${prefix} WS Message: ${event.data}`,
                    },
                ).catch(() => {})
            }
        }

        ws.onerror = (_error: any) => {
            if ((global as any).LIBRARY) {
                ;(global as any).LIBRARY.hunt(
                    '[Console action] Update Console',
                    {
                        idx: 'cns00',
                        src: `${prefix} WS Error encountered`,
                    },
                ).catch(() => {})
            }
        }

        ws.onclose = () => {
            if ((global as any).LIBRARY) {
                ;(global as any).LIBRARY.hunt(
                    '[Console action] Update Console',
                    {
                        idx: 'cns00',
                        src: `${prefix} WS Connection Closed`,
                    },
                ).catch(() => {})
            }
        }
    } catch (err: any) {
        if ((global as any).LIBRARY) {
            ;(global as any).LIBRARY.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: `${prefix} WS Initialization Error: ${err.message}`,
            }).catch(() => {})
        }
    }

    if (bal.slv != null) bal.slv({ olmBit: { idx: 'connect-agent', lst: [] } })
    return cpy
}

export const disconnectAgent = (cpy: AgentModel, bal: AgentBit, ste: State) => {
    if ((global as any).agentWs) {
        try {
            ;(global as any).agentWs.close(1000, 'User Disconnected')
        } catch (e) {}
        ;(global as any).agentWs = null
    }

    if ((global as any).localagentProcess) {
        try {
            ;(global as any).localagentProcess.kill()
        } catch (e) {}
        ;(global as any).localagentProcess = null
    }

    delete (global as any).agentBaseUrl

    if ((global as any).LIBRARY) {
        ;(global as any).LIBRARY.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: 'Disconnected from agent control plane',
        }).catch(() => {})
    }

    if (bal.slv != null)
        bal.slv({ olmBit: { idx: 'disconnect-agent', lst: [] } })

    return cpy
}

export const healthAgent = async (
    cpy: AgentModel,
    bal: AgentBit,
    ste: State,
) => {
    var dat = {
        status: 'healthy',
        service: '000-contact-bot-worker',
        timestamp: new Date().toISOString(),
        hasGithubToken: Boolean(bal.dat.c.env.GITHUB_TOKEN),
        aiGateway: bal.dat.c.env.CLOUDFLARE_AI_GATEWAY || 'default',
    }

    if (bal.slv != null) bal.slv({ agnBit: { idx: 'healthy-agent', dat } })

    return cpy
}

export const catchAllAgent = async (
    cpy: AgentModel,
    bal: AgentBit,
    ste: State,
) => {
    const context = bal.dat.c
    const worker = activeWorker ?? cpy.agent

    try {
        if (!worker?.handler?.fetch) {
            if (bal.slv != null)
                bal.slv({
                    agnBit: {
                        idx: 'catchall-agent',
                        dat: context.text('Handler missing', 500),
                    },
                })
            return cpy
        }

        const url = new URL(context.req.url)
        url.pathname = url.pathname.replace(/^\/agent/, '') || '/'
        const res = await worker.handler.fetch(
            new Request(url.toString(), context.req.raw) as any,
            context.env,
            context.executionCtx,
        )

        if (bal.slv != null)
            bal.slv({ agnBit: { idx: 'catchall-agent', dat: res } })
    } catch (error: any) {
        if (bal.slv != null)
            bal.slv({
                agnBit: {
                    idx: 'catchall-agent-err',
                    dat: context.text(`Error: ${error.message}`, 500),
                },
            })
    }

    return cpy
}

export const oracleAgent = async (
    cpy: AgentModel,
    bal: AgentBit,
    ste: State,
) => {
    var context = bal.dat.c
    var modelName = bal.src

    try {
        const prompt = context.req.query('prompt') || 'Inspect system status'
        const response = await context.env.AI.run(modelName, {
            messages: [
                { role: 'user', content: `${prompt}. Output ONLY raw JSON.` },
            ],
        })

        if (bal.slv != null)
            bal.slv({
                agnBit: {
                    idx: 'oracle-agent',
                    dat: response.response || JSON.stringify(response),
                },
            })
    } catch (error: any) {
        if (bal.slv != null)
            bal.slv({
                agnBit: {
                    idx: 'oracle-agent-err',
                    dat: `Error: ${error.message}`,
                    val: 500,
                },
            })
    }

    return cpy
}
