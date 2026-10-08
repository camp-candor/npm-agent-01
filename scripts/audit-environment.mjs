// scripts/audit-environment.mjs
import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

console.log('>> [ENV] Starting Phase 4 Environment & Secret Injection Audit...');

const cwd = process.cwd();
const rootEnvPath = path.join(cwd, '.env');
const rootEnvExamplePath = path.join(cwd, '.env.example');
const workerVarsPath = path.join(cwd, 'apps/worker/.dev.vars');
const workerVarsExamplePath = path.join(cwd, 'apps/worker/.dev.vars.example');

// 1. Template Existence Check
if (!fs.existsSync(rootEnvExamplePath)) {
    console.error(':: [FAIL] Root .env.example template missing.');
    process.exit(1);
}
if (!fs.existsSync(workerVarsExamplePath)) {
    console.error(':: [FAIL] Worker apps/worker/.dev.vars.example template missing.');
    process.exit(1);
}
console.log('>> [OK] Environment template files verified.');

// 2. Local Environment File Presence Check
if (!fs.existsSync(rootEnvPath)) {
    console.error(':: [FAIL] Root .env file missing. Run: cp .env.example .env');
    process.exit(1);
}
if (!fs.existsSync(workerVarsPath)) {
    console.error(':: [FAIL] apps/worker/.dev.vars missing. Run: cp apps/worker/.dev.vars.example apps/worker/.dev.vars');
    process.exit(1);
}
console.log('>> [OK] Local .env and .dev.vars files present on disk.');

// 3. Parser & Quotation Leak Sanitizer
const parseEnvFile = (filePath) => {
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const lines = rawContent.split('\n');
    const entries = {};
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        
        // Quotation leak detection and sanitization
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1).trim();
        }
        entries[key] = val;
    }
    return entries;
};

const rootEnv = parseEnvFile(rootEnvPath);
const workerVars = parseEnvFile(workerVarsPath);

// 4. Required Keys Audit
const requiredRootKeys = [
    'GITHUB_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_AI_GATEWAY',
    'LIVE_WORKER_URL'
];

for (const key of requiredRootKeys) {
    if (!(key in rootEnv)) {
        console.error(`:: [FAIL] Root .env is missing required declaration: ${key}`);
        process.exit(1);
    }
}
console.log('>> [OK] Root .env required key contracts satisfied.');

const requiredWorkerKeys = [
    'GITHUB_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN'
];

for (const key of requiredWorkerKeys) {
    if (!(key in workerVars)) {
        console.error(`:: [FAIL] apps/worker/.dev.vars missing required declaration: ${key}`);
        process.exit(1);
    }
}
console.log('>> [OK] Worker .dev.vars required key contracts satisfied.');

// 5. Git Exclusion & Gitignore Fence Audit
let gitIgnored = false;
try {
    const checkRootEnv = execSync('git check-ignore .env', { encoding: 'utf8' }).trim();
    const checkWorkerVars = execSync('git check-ignore apps/worker/.dev.vars', { encoding: 'utf8' }).trim();
    if (checkRootEnv === '.env' && checkWorkerVars.includes('.dev.vars')) {
        gitIgnored = true;
    }
} catch {
    gitIgnored = false;
}

if (!gitIgnored) {
    console.error(':: [FAIL] Security violation: .env or .dev.vars is NOT matched by .gitignore!');
    process.exit(1);
}
console.log('>> [OK] Gitignore fence confirmed: credentials excluded from git tracking.');

// 6. Assert Git Tracking Status (Zero Tracked Secrets)
try {
    const trackedFiles = execSync('git ls-files .env apps/worker/.dev.vars', { encoding: 'utf8' }).trim();
    if (trackedFiles.length > 0) {
        console.error(':: [FAIL] CRITICAL LEAK: Credential files are tracked in git index:');
        console.error(trackedFiles);
        process.exit(1);
    }
} catch (err) {
    console.error(':: [FAIL] Failed to evaluate git tracking status:', err.message);
    process.exit(1);
}
console.log('>> [OK] Index verified clean: credential files not staged or tracked.');

// 7. Assert Immutable Runner Boundary Cleanliness
try {
    const harnessDiff = execSync('git status -s apps/995.library/995.library/', { encoding: 'utf8' }).trim();
    if (harnessDiff.length > 0) {
        console.error(':: [FAIL] Immutable runner boundary breached:');
        console.error(harnessDiff);
        process.exit(1);
    }
} catch (err) {
    console.error(':: [FAIL] Failed to check harness boundary status:', err.message);
    process.exit(1);
}
console.log('>> [OK] Immutable runner boundary untouched (0 lines modified).');

console.log('>> [OK] Phase 4 Environment Initialization & Secret Injection Certified.');
process.exit(0);
