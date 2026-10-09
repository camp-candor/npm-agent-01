import type Menu from './fce/menu.interface.js'

export class MenuModel implements Menu {
    idx: string = '98.menu'
    status: string = 'ONLINE'
    lastDoctorTimestamp: string = ''
    doctorPassed: boolean = true
}
