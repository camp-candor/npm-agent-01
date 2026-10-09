import { Action } from '../99.core/interface/action.interface.js'
import MenuBit from './fce/menu.bit.js'

export const INIT_MENU = '[Menu action] Init Menu'
export class InitMenu implements Action {
    readonly type = INIT_MENU
    constructor(public bale: MenuBit) {}
}

export const UPDATE_MENU = '[Menu action] Update Menu'
export class UpdateMenu implements Action {
    readonly type = UPDATE_MENU
    constructor(public bale?: MenuBit) {}
}

export const RUN_DOCTOR = '[Menu action] Run Doctor'
export class RunDoctor implements Action {
    readonly type = RUN_DOCTOR
    constructor(public bale?: MenuBit) {}
}

export const SYSTEM_INFO = '[Menu action] System Info'
export class SystemInfo implements Action {
    readonly type = SYSTEM_INFO
    constructor(public bale?: MenuBit) {}
}

export type Actions = InitMenu | UpdateMenu | RunDoctor | SystemInfo
