import fs from 'fs'
import path from 'path'

export interface RepoIdentity {
    name: string
    label: string
    version: string
    titleBanner: string
}

let cachedIdentity: RepoIdentity | null = null

/**
 * Ascends from startDir to discover the monorepo root package.json.
 */
export function resolveRootPackageJson(startDir: string = process.cwd()): {
    pkg: Record<string, any>
    rootDir: string
} {
    let curr = path.resolve(startDir)
    while (curr && curr !== path.dirname(curr)) {
        const candidate = path.join(curr, 'package.json')
        if (fs.existsSync(candidate)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'))
                const parentName = path.basename(path.dirname(curr))
                const isWorkspaceSubpackage =
                    parentName === 'packages' || parentName === 'apps'

                // Identify root: contains workspaces, has .git, or is a standalone project
                if (
                    pkg.workspaces ||
                    fs.existsSync(path.join(curr, '.git')) ||
                    !isWorkspaceSubpackage
                ) {
                    return { pkg, rootDir: curr }
                }
            } catch {
                // Ignore parse errors on intermediate manifests
            }
        }
        curr = path.dirname(curr)
    }

    return {
        pkg: { name: 'npm-agent-01', version: '0.1.0' },
        rootDir: process.cwd(),
    }
}

/**
 * Returns dynamic repository identity formatted for Blessed TUI headers and CLI telemetry.
 */
export function getRepoIdentity(startDir?: string): RepoIdentity {
    if (cachedIdentity && !startDir) {
        return cachedIdentity
    }

    const { pkg, rootDir } = resolveRootPackageJson(startDir)

    const rawName =
        pkg.name || pkg.label || path.basename(rootDir) || 'npm-agent-01'

    // Clean scope prefix (@camp_candor/000.repo-bot -> 000.repo-bot)
    const cleanName = String(rawName)
        .replace(/^@[^/]+\//, '')
        .trim()

    // Uppercase label
    const label = cleanName.toUpperCase()

    // Semantic version with clean fallback
    const version = pkg.version ? `v${pkg.version.replace(/^v/, '')}` : 'v0.1.0'

    const titleBanner = `${label} ${version.toUpperCase()}`

    const identity: RepoIdentity = {
        name: cleanName,
        label,
        version,
        titleBanner,
    }

    if (!startDir) {
        cachedIdentity = identity
    }

    return identity
}
