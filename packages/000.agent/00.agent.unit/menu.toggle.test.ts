import { describe, it, expect } from 'vitest'
import { MenuModel } from '../98.menu.unit/menu.model.js'
import * as Act from '../98.menu.unit/menu.action.js'
import {
    runDoctor,
    systemInfo,
    initMenu,
} from '../98.menu.unit/buz/00.menu.buzz.js'

describe('Local Terminal Cockpit Switchboard (000.agent)', () => {
    it('initializes with default ONLINE cockpit state', () => {
        const model = new MenuModel()
        expect(model.status).toBe('ONLINE')
        expect(model.doctorPassed).toBe(true)
        expect(model.idx).toBe('98.menu')
    })

    it('has RUN_DOCTOR and SYSTEM_INFO actions defined correctly', () => {
        const docAct = new Act.RunDoctor()
        const sysAct = new Act.SystemInfo()
        expect(docAct.type).toBe('[Menu action] Run Doctor')
        expect(sysAct.type).toBe('[Menu action] System Info')
    })

    it('executes runDoctor buzzer and outputs structured telemetry lines', async () => {
        const model = new MenuModel()
        let receivedResult: any = null

        await runDoctor(
            model,
            {
                idx: 'test-doctor',
                slv: (res: any) => {
                    receivedResult = res
                },
            },
            {} as any,
        )

        expect(receivedResult).not.toBeNull()
        expect(receivedResult.mnuBit.idx).toBe('run-doctor')
        expect(receivedResult.mnuBit.dat.passed).toBe(true)
        expect(receivedResult.mnuBit.dat.lines.length).toBeGreaterThan(4)
        expect(receivedResult.mnuBit.dat.lines[0]).toContain(
            'Local Environment Audit',
        )
        expect(model.doctorPassed).toBe(true)
    })

    it('executes systemInfo buzzer and captures host architecture', async () => {
        const model = new MenuModel()
        let receivedResult: any = null

        await systemInfo(
            model,
            {
                idx: 'test-sys',
                slv: (res: any) => {
                    receivedResult = res
                },
            },
            {} as any,
        )

        expect(receivedResult).not.toBeNull()
        expect(receivedResult.mnuBit.idx).toBe('system-info')
        expect(receivedResult.mnuBit.dat.lines.length).toBeGreaterThan(3)
        expect(receivedResult.mnuBit.dat.lines[0]).toContain(
            'Hardware & Host Telemetry',
        )
    })

    it('dispatches initMenu and sets model status', () => {
        const model = new MenuModel()
        let receivedResult: any = null

        initMenu(
            model,
            {
                idx: 'test-init',
                slv: (res: any) => {
                    receivedResult = res
                },
            },
            {} as any,
        )

        expect(receivedResult).not.toBeNull()
        expect(receivedResult.mnuBit.idx).toBe('init-menu')
        expect(model.status).toBe('ONLINE')
    })
})
