import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    createGetCommitShaTool,
    createEphemeralBranchTool,
    createWriteRepoFileTool,
    createPullRequestTool,
    createInspectRepoChecksTool,
    GetCommitShaParams,
    CreateEphemeralBranchParams,
    WriteRepoFileParams,
    CreatePullRequestParams,
    InspectRepoChecksParams,
    RollDice,
    createRollDiceTool,
    ModulateVibe,
    createModulateVibeTool,
    type Env,
} from '../../src/tools.js'

describe('Deterministic Git Tools (apps/worker)', () => {
    const mockEnv = {
        CLOUDFLARE_ACCOUNT_ID: 'mock_acc',
        CLOUDFLARE_API_TOKEN: 'mock_cf_token',
        CLOUDFLARE_AI_GATEWAY: 'test-gateway',
        GITHUB_TOKEN: 'ghp_mock_token_123',
        AI: {},
        AGENT_SESSION: {} as any,
    } as Env

    const parseReceipt = (result: any) => {
        const item = result.content[0]
        if (item.type === 'text') {
            return JSON.parse(item.text)
        }
        throw new Error('Expected text content')
    }

    const originalFetch = globalThis.fetch

    beforeEach(() => {
        vi.restoreAllMocks()
    })

    afterEach(() => {
        globalThis.fetch = originalFetch
    })

    describe('Schema Invariants', () => {
        it('ensures all parameter schemas enforce additionalProperties: false', () => {
            expect(GetCommitShaParams.additionalProperties).toBe(false)
            expect(CreateEphemeralBranchParams.additionalProperties).toBe(false)
            expect(WriteRepoFileParams.additionalProperties).toBe(false)
            expect(CreatePullRequestParams.additionalProperties).toBe(false)
            expect(InspectRepoChecksParams.additionalProperties).toBe(false)
        })
    })

    describe('get_commit_sha', () => {
        it('queries git ref and returns structured receipt with s_clean', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    object: { sha: 'a1b2c3d4e5f67890' },
                }),
            } as any)

            const tool = createGetCommitShaTool(mockEnv)
            const result = await tool.execute('call_1', {
                owner: 'camp-candor',
                repo: '000.repo-bot',
                branch: 'main',
            })

            expect(globalThis.fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/camp-candor/000.repo-bot/git/ref/heads/main',
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer ghp_mock_token_123',
                    }),
                }),
            )

            const receipt = parseReceipt(result)
            expect(receipt.action).toBe('COMMIT_SHA_CAPTURED')
            expect(receipt.s_clean).toBe('a1b2c3d4e5f67890')
            expect(receipt.repo).toBe('camp-candor/000.repo-bot')
            expect(result.details.sha).toBe('a1b2c3d4e5f67890')
        })

        it('handles errors gracefully with status FAILED', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => ({ message: 'Not Found' }),
            } as any)

            const tool = createGetCommitShaTool(mockEnv)
            const result = await tool.execute('call_1', {
                owner: 'camp-candor',
                repo: '000.repo-bot',
                branch: 'main',
            })

            const receipt = parseReceipt(result)
            expect(receipt.status).toBe('FAILED')
            expect(receipt.error).toContain('404')
        })
    })

    describe('create_ephemeral_branch', () => {
        it('prefixes branch with refs/heads/ and anchors to base_sha', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    ref: 'refs/heads/spec/TASK-01-abc1234',
                }),
            } as any)

            const tool = createEphemeralBranchTool(mockEnv)
            const result = await tool.execute('call_1', {
                owner: 'camp-candor',
                repo: '000.repo-bot',
                branch_name: 'spec/TASK-01-abc1234',
                base_sha: 'a1b2c3d4e5f67890',
            })

            expect(globalThis.fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/camp-candor/000.repo-bot/git/refs',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        ref: 'refs/heads/spec/TASK-01-abc1234',
                        sha: 'a1b2c3d4e5f67890',
                    }),
                }),
            )

            const receipt = parseReceipt(result)
            expect(receipt.action).toBe('EPHEMERAL_BRANCH_CREATED')
            expect(receipt.ref).toBe('refs/heads/spec/TASK-01-abc1234')
            expect(receipt.anchored_sha).toBe('a1b2c3d4e5f67890')
        })
    })

    describe('write_repo_file', () => {
        it('encodes content to base64 using btoa/unescape and commits file', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    commit: { sha: 'commit_sha_999' },
                }),
            } as any)

            const tool = createWriteRepoFileTool(mockEnv)
            const rawContent = 'Hello World 🚀'
            const expectedBase64 = btoa(
                unescape(encodeURIComponent(rawContent)),
            )

            const result = await tool.execute('call_1', {
                owner: 'camp-candor',
                repo: '000.repo-bot',
                path: 'docs/TASK-01.md',
                content: rawContent,
                commit_message: 'chore(spec): task 01',
                branch: 'spec/TASK-01-abc1234',
            })

            expect(globalThis.fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/camp-candor/000.repo-bot/contents/docs/TASK-01.md',
                expect.objectContaining({
                    method: 'PUT',
                    body: JSON.stringify({
                        message: 'chore(spec): task 01',
                        content: expectedBase64,
                        branch: 'spec/TASK-01-abc1234',
                    }),
                }),
            )

            const receipt = parseReceipt(result)
            expect(receipt.action).toBe('FILE_COMMITTED')
            expect(receipt.commit_sha).toBe('commit_sha_999')
            expect(receipt.path).toBe('docs/TASK-01.md')
        })
    })

    describe('create_pull_request', () => {
        it('opens PR to trunk and returns structured receipt', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    number: 42,
                    html_url:
                        'https://github.com/camp-candor/000.repo-bot/pull/42',
                }),
            } as any)

            const tool = createPullRequestTool(mockEnv)
            const result = await tool.execute('call_1', {
                owner: 'camp-candor',
                repo: '000.repo-bot',
                title: 'spec(TASK-01): add implementation spec',
                body: 'Full spec details',
                head_branch: 'spec/TASK-01-abc1234',
                base_branch: 'main',
            })

            expect(globalThis.fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/camp-candor/000.repo-bot/pulls',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        title: 'spec(TASK-01): add implementation spec',
                        body: 'Full spec details',
                        head: 'spec/TASK-01-abc1234',
                        base: 'main',
                    }),
                }),
            )

            const receipt = parseReceipt(result)
            expect(receipt.action).toBe('PULL_REQUEST_OPENED')
            expect(receipt.pr_number).toBe(42)
            expect(receipt.html_url).toBe(
                'https://github.com/camp-candor/000.repo-bot/pull/42',
            )
        })
    })

    describe('inspect_repo_checks', () => {
        it('queries latest commit and check-runs, computing all_passed: true when all checks succeed', async () => {
            const mockCommit = {
                sha: 'abc123commit',
                commit: {
                    message: 'feat: add repobot',
                    author: {
                        name: 'Brad Henderson',
                        date: '2026-09-21T21:00:00Z',
                    },
                },
            }

            const mockCheckRuns = {
                total_count: 2,
                check_runs: [
                    {
                        name: 'ci/test',
                        status: 'completed',
                        conclusion: 'success',
                        details_url: 'https://github.com/ci/1',
                    },
                    {
                        name: 'ci/lint',
                        status: 'completed',
                        conclusion: 'success',
                        details_url: 'https://github.com/ci/2',
                    },
                ],
            }

            globalThis.fetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('/commits?per_page=1')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => [mockCommit],
                    })
                }
                if (url.includes('/check-runs')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => mockCheckRuns,
                    })
                }
                return Promise.reject(new Error(`Unexpected url: ${url}`))
            })

            const tool = createInspectRepoChecksTool(mockEnv)
            const result = await tool.execute('call_inspect_1', {
                owner: 'camp-candor',
                repo: '000.repo-bot',
            })

            expect(result.details.commit).toEqual({
                sha: 'abc123commit',
                message: 'feat: add repobot',
                author: 'Brad Henderson',
                timestamp: '2026-09-21T21:00:00Z',
            })
            expect(result.details.checks.all_passed).toBe(true)
            expect(result.details.checks.total_count).toBe(2)
            expect(result.details.checks.status).toBe('completed')
            expect(result.details.checks.runs).toHaveLength(2)
        })

        it('computes all_passed: false and status: in_progress when a run is still running', async () => {
            const mockCommit = {
                sha: 'def456commit',
                commit: {
                    message: 'test: ongoing run',
                    author: {
                        name: 'Developer',
                        date: '2026-09-21T21:05:00Z',
                    },
                },
            }

            const mockCheckRuns = {
                total_count: 2,
                check_runs: [
                    {
                        name: 'ci/test',
                        status: 'completed',
                        conclusion: 'success',
                        details_url: 'https://github.com/ci/1',
                    },
                    {
                        name: 'ci/build',
                        status: 'in_progress',
                        conclusion: null,
                        details_url: 'https://github.com/ci/2',
                    },
                ],
            }

            globalThis.fetch = vi.fn().mockImplementation((url: string) => {
                if (url.includes('/commits?per_page=1')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => [mockCommit],
                    })
                }
                if (url.includes('/check-runs')) {
                    return Promise.resolve({
                        ok: true,
                        json: async () => mockCheckRuns,
                    })
                }
                return Promise.reject(new Error(`Unexpected url: ${url}`))
            })

            const tool = createInspectRepoChecksTool(mockEnv)
            const result = await tool.execute('call_inspect_2', {
                owner: 'camp-candor',
                repo: '000.repo-bot',
            })

            expect(result.details.checks.all_passed).toBe(false)
            expect(result.details.checks.status).toBe('in_progress')
        })
    })

    describe('roll_dice', () => {
        it('executes dice roll and returns valid receipt with totals and rolls', async () => {
            const tool = createRollDiceTool(mockEnv)
            const result = await tool.execute('call_dice_1', {
                number_of_dice: 2,
                sides_per_die: 6,
                reason: 'Combat initiative check',
            })

            const receipt = parseReceipt(result)
            expect(receipt.action).toBe('DICE_ROLLED')
            expect(receipt.reason).toBe('Combat initiative check')
            expect(receipt.rolls).toHaveLength(2)
            expect(receipt.total).toBe(receipt.rolls[0] + receipt.rolls[1])
            expect(result.details.rolls).toHaveLength(2)
            expect(result.details.total).toBe(receipt.total)
        })

        it('falls back to default 1 die of 20 sides when not specified', async () => {
            const result = await RollDice.execute('call_dice_2', {
                number_of_dice: 0,
                sides_per_die: 0,
                reason: 'Default roll',
            })

            const receipt = parseReceipt(result)
            expect(receipt.action).toBe('DICE_ROLLED')
            expect(receipt.rolls).toHaveLength(1)
            expect(receipt.rolls[0]).toBeGreaterThanOrEqual(1)
            expect(receipt.rolls[0]).toBeLessThanOrEqual(20)
        })
    })

    describe('modulate_vibe', () => {
        it('shifts atmosphere and returns structured receipt', async () => {
            const tool = createModulateVibeTool(mockEnv)
            const result = await tool.execute('call_vibe_1', {
                hex_color: '#ff0000',
                shader_intensity: 0.8,
                ambient_audio: 'static',
            })

            const receipt = parseReceipt(result)
            expect(receipt.action).toBe('VIBE_SHIFTED')
            expect(receipt.new_color).toBe('#ff0000')
            expect(receipt.audio_track).toBe('static')
            expect(result.details.shader_intensity).toBe(0.8)

            const directResult = await ModulateVibe.execute('call_vibe_2', {
                hex_color: '#00ff00',
                shader_intensity: 0.5,
                ambient_audio: 'rain',
            })
            const directReceipt = parseReceipt(directResult)
            expect(directReceipt.action).toBe('VIBE_SHIFTED')
            expect(directReceipt.new_color).toBe('#00ff00')
        })
    })
})
