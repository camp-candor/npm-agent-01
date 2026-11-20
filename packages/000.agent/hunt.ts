var sim: {
    hunt: (typ: string, obj?: any) => Promise<any>
    state: any
} = {
    hunt: null as any,
    state: null,
}

sim.hunt = (typ, obj) => {
    return host(obj, typ)
}

var host = (obj: any, typ: string) => {
    init()

    var slv: (value?: any) => void
    const promo = new Promise((rslv) => (slv = rslv))

    if (obj == null) obj = {}
    if (obj.slv == null) obj.slv = (val0: any) => slv(val0)

    sim.state.dispatch({ type: typ, bale: obj })
    return promo
}

var init = () => {
    if (sim.state != null) return
    sim.state = new State()
    sim.state.pivot = sim
    sim.state.hunt = sim.hunt
    for (var k in Import.list) new Import.list[k](sim.state)
}

import * as Import from './BEE.js'
import State from './99.core/state.js'

export * as ActAgt from './00.agent.unit/agent.action.js'
export { getActiveWorker } from './00.agent.unit/buz/agent.buzz.js'
export default sim
