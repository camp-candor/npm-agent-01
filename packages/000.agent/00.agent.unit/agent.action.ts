import { Action } from '../99.core/interface/action.interface.js'
import AgentBit from './fce/agent.bit.js'

// agent actions

export const INIT_AGENT = '[agent action] Init agent'
export class Initagent implements Action {
    readonly type = INIT_AGENT
    constructor(public bale: AgentBit) {}
}

export const UPDATE_AGENT = '[agent action] Update agent'
export class Updateagent implements Action {
    readonly type = UPDATE_AGENT
    constructor(public bale: AgentBit) {}
}

export const TEST_AGENT = '[Test action] Test agent'
export class Testagent implements Action {
    readonly type = TEST_AGENT
    constructor(public bale: AgentBit) {}
}

export const INTELLECT_AGENT = '[Intellect action] Intellect agent'
export class Intellectagent implements Action {
    readonly type = INTELLECT_AGENT
    constructor(public bale: AgentBit) {}
}

export const VISION_AGENT = '[Vision action] Vision agent'
export class Visionagent implements Action {
    readonly type = VISION_AGENT
    constructor(public bale: AgentBit) {}
}

export const LIST_AGENT = '[List action] List agent'
export class Listagent implements Action {
    readonly type = LIST_AGENT
    constructor(public bale: AgentBit) {}
}

export const CONNECT_AGENT = '[Connect action] Connect agent'
export class Connectagent implements Action {
    readonly type = CONNECT_AGENT
    constructor(public bale: AgentBit) {}
}

export const DISCONNECT_AGENT = '[Disconnect action] Disconnect agent'
export class Disconnectagent implements Action {
    readonly type = DISCONNECT_AGENT
    constructor(public bale: AgentBit) {}
}

export const CATCHALL_AGENT = '[Agent action] CATCH ALL agent'
export class CatchallAgent implements Action {
    readonly type = CATCHALL_AGENT
    constructor(public bale: AgentBit) {}
}

export const HEALTH_AGENT = '[Health action] Health Agent'
export class HealthAgent implements Action {
    readonly type = HEALTH_AGENT
    constructor(public bale: AgentBit) {}
}

export const ORACLE_AGENT = '[OracleAgent action] OracleAgent Agent'
export class OracleAgent implements Action {
    readonly type = ORACLE_AGENT
    constructor(public bale: AgentBit) {}
}

export type Actions =
    | Initagent
    | Updateagent
    | Testagent
    | Intellectagent
    | Visionagent
    | Listagent
    | Connectagent
    | Disconnectagent
    | CatchallAgent
    | HealthAgent
    | OracleAgent
