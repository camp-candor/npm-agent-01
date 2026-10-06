import type { AgentTool } from '@funtuantw/pi-agent-cf'
import type { Env } from './tools.core.js'

/**
 * Downstream Sovereign Extension Boundary
 *
 * Populated by downstream fork developers with proprietary domain tools,
 * database connectors, or microservice integrations.
 * Upstream template maintains this file as an empty array protected by merge=ours.
 */
export const customTools = (_env: Env): AgentTool<any>[] => []
