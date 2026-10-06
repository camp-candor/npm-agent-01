import type { AgentTool } from '@funtuantw/pi-agent-cf'
import type { Env } from './tools.core.js'

/**
 * Downstream extension hook for npm-agent-01 consumers.
 *
 * Register proprietary domain tools, database connectors, or custom
 * validation instruments here. In upstream, this exports an empty array.
 */
export const customTools = (_env: Env): AgentTool<any>[] => []
