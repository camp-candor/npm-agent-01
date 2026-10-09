import { AgentModel } from '../agent.model.js'
import agentBit from '../fce/agent.bit.js'
import State from '../../99.core/state.js'
import { getRepoIdentity } from '../../src/identity.js'

export const initagent = (cpy: AgentModel, bal: agentBit, ste: State) => {
    const identity = getRepoIdentity()
    const payload = {
        status: 'local',
        service: identity.name,
        timestamp: new Date().toISOString(),
    }

    if (bal.slv != null) {
        bal.slv({
            intBit: {
                idx: 'init-agent',
                dat: payload,
            },
        })
    }
    return cpy
}

export const updateagent = (cpy: AgentModel, bal: agentBit, ste: State) => {
    if (bal.slv != null) bal.slv({ intBit: { idx: 'update-agent' } })
    return cpy
}

export const testagent = (cpy: AgentModel, bal: agentBit, ste: State) => {
    if (bal.slv != null) bal.slv({ mytBit: { idx: 'test-agent', val: 1 } })
    return cpy
}

export const listagent = async (cpy: AgentModel, bal: agentBit, ste: State) => {
    if (bal.slv != null) {
        bal.slv({
            olmBit: {
                idx: 'list-agent',
                lst: ['local-cockpit', 'terminal-curses'],
            },
        })
    }
    return cpy
}

export const connectagent = (cpy: AgentModel, bal: agentBit, ste: State) => {
    if ((global as any).LIBRARY) {
        ;(global as any).LIBRARY.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: '>> [OK] Local Terminal Cockpit Connected',
        }).catch(() => {})
    }

    if (bal.slv != null) bal.slv({ olmBit: { idx: 'connect-agent', lst: [] } })
    return cpy
}

export const disconnectagent = (cpy: AgentModel, bal: agentBit, ste: State) => {
    if ((global as any).LIBRARY) {
        ;(global as any).LIBRARY.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: '>> [OK] Local Terminal Cockpit Disconnected',
        }).catch(() => {})
    }

    if (bal.slv != null) {
        bal.slv({ olmBit: { idx: 'disconnect-agent', lst: [] } })
    }
    return cpy
}
