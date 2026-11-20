import clone from 'clone-deep'
import * as Act from './agent.action.js'
import { AgentModel } from './agent.model.js'
import * as Buzz from './agent.buzzer.js'
import State from '../99.core/state.js'

export function reducer(
    model: AgentModel = new AgentModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_AGENT:
            return Buzz.updateAgent(clone(model), act.bale, state)

        case Act.INIT_AGENT:
            return Buzz.initAgent(clone(model), act.bale, state)

        case Act.TEST_AGENT:
            return Buzz.testAgent(clone(model), act.bale, state)

        case Act.LIST_AGENT:
            return Buzz.listAgent(clone(model), act.bale, state)

        case Act.CONNECT_AGENT:
            return Buzz.connectAgent(clone(model), act.bale, state)

        case Act.DISCONNECT_AGENT:
            return Buzz.disconnectAgent(clone(model), act.bale, state)
        case Act.HEALTH_AGENT:
            return Buzz.healthAgent(clone(model), act.bale, state)
        case Act.ORACLE_AGENT:
            return Buzz.oracleAgent(clone(model), act.bale, state)
        case Act.CATCHALL_AGENT:
            return Buzz.catchAllAgent(clone(model), act.bale, state)

        default:
            return model
    }
}
