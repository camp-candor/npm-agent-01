export * as ActAgt from './00.agent.unit/agent.action.js'
export declare function getActiveWorker(): any

declare const sim: {
    hunt: (typ: string, obj?: any) => Promise<any>
    state: any
}

export default sim
