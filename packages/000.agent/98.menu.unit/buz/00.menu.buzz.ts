import os from 'os'
import process from 'process'
import { MenuModel } from '../menu.model.js'
import MenuBit from '../fce/menu.bit.js'
import State from '../../99.core/state.js'
import * as Act from '../menu.action.js'
import { getRepoIdentity } from '../../src/identity.js'

export const initMenu = (cpy: MenuModel, bal: MenuBit, ste: State) => {
    cpy.status = 'ONLINE'
    if (bal.slv != null) bal.slv({ mnuBit: { idx: 'init-menu', dat: cpy } })
    return cpy
}

export const runDoctor = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    const identity = getRepoIdentity()
    const memory = process.memoryUsage()
    const heapUsedMb = Math.round(memory.heapUsed / 1024 / 1024)
    const heapTotalMb = Math.round(memory.heapTotal / 1024 / 1024)

    const lines = [
        ':: [DOCTOR] Local Environment Audit',
        `>> Repository Identity : ${identity.titleBanner}`,
        `>> Node Runtime       : ${process.version}`,
        `>> Platform / Arch    : ${os.platform()} (${os.arch()})`,
        `>> Heap Allocation    : ${heapUsedMb}MB / ${heapTotalMb}MB`,
        `>> Process Uptime     : ${Math.round(process.uptime())}s`,
        '>> Status             : [OK] Cockpit Operational',
    ]

    cpy.lastDoctorTimestamp = new Date().toISOString()
    cpy.doctorPassed = true

    if ((global as any).LIBRARY) {
        for (const line of lines) {
            await (global as any).LIBRARY.hunt(
                '[Console action] Update Console',
                {
                    idx: 'cns00',
                    src: line,
                },
            ).catch(() => {})
        }
    }

    if (bal?.slv != null) {
        bal.slv({ mnuBit: { idx: 'run-doctor', dat: { lines, passed: true } } })
    }
    return cpy
}

export const systemInfo = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    const identity = getRepoIdentity()
    const cpus = os.cpus()
    const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : 'Unknown CPU'

    const lines = [
        ':: [SYSTEM INFO] Hardware & Host Telemetry',
        `>> Hostname    : ${os.hostname()}`,
        `>> CPU Core(s) : ${cpus.length} x ${cpuModel}`,
        `>> Free Memory : ${Math.round(os.freemem() / 1024 / 1024)}MB`,
        `>> Total RAM   : ${Math.round(os.totalmem() / 1024 / 1024)}MB`,
        `>> Target Host : ${identity.name}`,
    ]

    if ((global as any).LIBRARY) {
        for (const line of lines) {
            await (global as any).LIBRARY.hunt(
                '[Console action] Update Console',
                {
                    idx: 'cns00',
                    src: line,
                },
            ).catch(() => {})
        }
    }

    if (bal?.slv != null) {
        bal.slv({ mnuBit: { idx: 'system-info', dat: { lines } } })
    }
    return cpy
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    const lst = ['RUN DOCTOR', 'SYSTEM INFO', 'ROOT MENU']

    if (!(global as any).LIBRARY) {
        if (bal?.slv != null)
            bal.slv({ mnuBit: { idx: 'update-menu-headless' } })
        return cpy
    }

    const bit = await (global as any).LIBRARY.hunt(
        '[Grid action] Update Grid',
        {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 8,
        },
    )

    const choiceBit = await (global as any).LIBRARY.hunt(
        '[Open action] Open Choice',
        {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst,
            net: bit.grdBit.dat,
        },
    )

    const src = choiceBit?.chcBit?.src

    switch (src) {
        case 'RUN DOCTOR':
            await runDoctor(cpy, { idx: 'run-doctor' }, ste)
            break
        case 'SYSTEM INFO':
            await systemInfo(cpy, { idx: 'system-info' }, ste)
            break
        case 'ROOT MENU':
            if (bal?.slv != null) bal.slv({ mnuBit: { idx: 'root-menu' } })
            return cpy
    }

    return cpy
}
