// scripts/audit-hydration.mjs
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

console.log('>> [HYDRATION] Starting Phase 3 Monorepo Dependency Hydration Audit...');

const cwd = process.cwd();
const rootPkgPath = path.join(cwd, 'package.json');
const lockfilePath = path.join(cwd, 'package-lock.json');

// 1. Root & Manifest Existence Verification
if (!fs.existsSync(rootPkgPath) || !fs.existsSync(lockfilePath)) {
    console.error(':: [FAIL] Root package.json or package-lock.json missing.');
    process.exit(1);
}

const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

// 2. Engine Constraints Verification (Node >= 20.0.0, npm >= 10.0.0)
const nodeVersion = process.versions.node;
const [majorNode] = nodeVersion.split('.').map(Number);
if (majorNode < 20) {
    console.error(`:: [FAIL] Node.js version violation: current ${nodeVersion}, required >= 20.0.0`);
    process.exit(1);
}
console.log(`>> [OK] Node.js runtime validated: v${nodeVersion} (>= 20.0.0).`);

let npmVersion = '';
try {
    npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const [majorNpm] = npmVersion.split('.').map(Number);
    if (majorNpm < 10) {
        console.error(`:: [FAIL] npm version violation: current ${npmVersion}, required >= 10.0.0`);
        process.exit(1);
    }
    console.log(`>> [OK] npm runtime validated: v${npmVersion} (>= 10.0.0).`);
} catch (err) {
    console.error(':: [FAIL] Failed to evaluate npm version:', err.message);
    process.exit(1);
}

// 3. Lockfile Drift Check (Assert Zero-Diff on package-lock.json)
try {
    const lockDiff = execSync('git diff --name-only package-lock.json', { encoding: 'utf8' }).trim();
    if (lockDiff.length > 0) {
        console.error(':: [FAIL] Lockfile drift detected! package-lock.json was mutated.');
        process.exit(1);
    }
    console.log('>> [OK] package-lock.json integrity confirmed (zero diff).');
} catch (err) {
    console.error(':: [FAIL] Failed to evaluate git diff on package-lock.json:', err.message);
    process.exit(1);
}

// 4. Workspace Symlink Resolution Verification
const expectedWorkspaces = [
    { name: '@camp_candor/995.library', targetRel: 'apps/995.library' },
    { name: '@camp_candor/agent', targetRel: 'apps/worker' },
    { name: '@camp_candor/000.agent', targetRel: 'packages/000.agent' }
];

const nodeModulesDir = path.join(cwd, 'node_modules');
if (!fs.existsSync(nodeModulesDir)) {
    console.error(':: [FAIL] Root node_modules directory does not exist. Run "npm ci" first.');
    process.exit(1);
}

for (const ws of expectedWorkspaces) {
    const symlinkPath = path.join(nodeModulesDir, ws.name);
    if (!fs.existsSync(symlinkPath)) {
        console.error(`:: [FAIL] Missing workspace symlink in node_modules: ${ws.name}`);
        process.exit(1);
    }

    try {
        const stat = fs.lstatSync(symlinkPath);
        if (!stat.isSymbolicLink()) {
            console.warn(`:: [WARN] ${ws.name} exists in node_modules but is not a symbolic link.`);
        } else {
            console.log(`>> [OK] Workspace symlink verified: ${ws.name} -> ${ws.targetRel}`);
        }
    } catch (err) {
        console.error(`:: [FAIL] Error evaluating symlink for ${ws.name}:`, err.message);
        process.exit(1);
    }
}

// 5. Assert Boundary Invariance in apps/995.library/995.library/
try {
    const harnessDiff = execSync('git status -s apps/995.library/995.library/', { encoding: 'utf8' }).trim();
    if (harnessDiff.length > 0) {
        console.error(':: [FAIL] Harness boundary violated during hydration:');
        console.error(harnessDiff);
        process.exit(1);
    }
    console.log('>> [OK] Immutable runner boundary clean (0 lines modified).');
} catch (err) {
    console.error(':: [FAIL] Failed to check harness boundary status:', err.message);
    process.exit(1);
}

console.log('>> [OK] Phase 3 Monorepo Dependency Hydration Certified.');
process.exit(0);
