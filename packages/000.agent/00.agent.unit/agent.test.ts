import { describe, it, expect, vi } from 'vitest'
import { initAgent } from './buz/agent.buzz.js'
import { AgentModel } from './agent.model.js'

describe('agent unit buzzers', () => {
    it('should initialize agent worker and resolve agnBit on initAgent', () => {
        const model = new AgentModel()
        const state = {} as any
        const slv = vi.fn()
        const cfModel = { id: '@cf/meta/llama-3.2-3b-instruct', baseUrl: '' }
        const bal = {
            src: 'System prompt',
            dat: { cfModel, coreTools: () => [] },
            slv,
        } as any

        const result = initAgent(model, bal, state)

        expect(result.agent).toBeDefined()
        expect(typeof result.agent.AgentSessionDO).toBe('function')
        expect(typeof result.agent.handler.fetch).toBe('function')
        expect(slv).toHaveBeenCalledWith({
            agnBit: {
                idx: 'init-agent',
                dat: result.agent,
            },
        })
    })
})
