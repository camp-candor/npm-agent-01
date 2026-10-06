import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getBaseUrl, getBaseWsUrl } from '../src/cascade.js'

describe('4-Tier Resolution Cascade & Protocol Derivation (000.agent)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    delete (global as any).agentBaseUrl
    delete (global as any).packageBaseUrl
    delete process.env.LIVE_WORKER_URL
    delete process.env.WORKER_URL
  })

  afterEach(() => {
    delete (global as any).agentBaseUrl
    delete (global as any).packageBaseUrl
    process.env = { ...originalEnv }
  })

  it('Tier 1: prioritizes (global as any).agentBaseUrl over all other layers', () => {
    ;(global as any).agentBaseUrl = 'http://127.0.0.1:8787/'
    ;(global as any).packageBaseUrl = 'https://package-override.com'
    process.env.LIVE_WORKER_URL = 'https://live-env.com'

    expect(getBaseUrl()).toBe('http://127.0.0.1:8787')
    expect(getBaseWsUrl()).toBe('ws://127.0.0.1:8787')
  })

  it('Tier 2: falls back to (global as any).packageBaseUrl when agentBaseUrl is absent', () => {
    ;(global as any).packageBaseUrl = 'https://package-domain.com/'
    process.env.LIVE_WORKER_URL = 'https://live-env.com'

    expect(getBaseUrl()).toBe('https://package-domain.com')
    expect(getBaseWsUrl()).toBe('wss://package-domain.com')
  })

  it('Tier 3: falls back to LIVE_WORKER_URL or WORKER_URL when globals are absent', () => {
    process.env.LIVE_WORKER_URL = 'https://env-worker.workers.dev///'

    expect(getBaseUrl()).toBe('https://env-worker.workers.dev')
    expect(getBaseWsUrl()).toBe('wss://env-worker.workers.dev')
  })

  it('Tier 4: resolves canonical staging default when all pointers are missing', () => {
    expect(getBaseUrl()).toBe(
      'https://npm-agent-01-staging.berad4000.workers.dev',
    )
    expect(getBaseWsUrl()).toBe(
      'wss://npm-agent-01-staging.berad4000.workers.dev',
    )
  })

  it('The Never-Cache Invariant: resolves dynamically across successive dispatches', () => {
    expect(getBaseUrl()).toBe(
      'https://npm-agent-01-staging.berad4000.workers.dev',
    )

    ;(global as any).agentBaseUrl = 'http://127.0.0.1:8787'
    expect(getBaseUrl()).toBe('http://127.0.0.1:8787')

    delete (global as any).agentBaseUrl
    expect(getBaseUrl()).toBe(
      'https://npm-agent-01-staging.berad4000.workers.dev',
    )
  })
})