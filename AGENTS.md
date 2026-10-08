# AGENTS.md — Workspace Architecture & Operational Guidelines

> Operational manual, monorepo architecture, invariant specifications, and
> coding standards for the `npm-agent-01` ecosystem.

---

## 1. Core Directives & Immutability Boundaries

- **System:** Standard NPM Monorepo (`workspaces: ["packages/*", "apps/*"]`). Do
  NOT introduce Nx, Lerna, Yarn, or PNPM.
- **Privacy:** Private repository (`"private": true`). Do NOT publish packages
  to public npm registries.
- **Git Commits:** Use standard conventional commit format via git directly:
  `git commit -m "type: description"`.
- **TypeScript Integrity:** Strict mode is enforced (`strict: true`, pure ESM
  exports). Never emit compiled `.js` or `.d.ts` files side-by-side into `src/`
  directories.
- **HARNESS IMMUTABILITY BOUNDARY (`apps/995.library`):**
  `apps/995.library/995.library/**` is the canonical upstream terminal harness
  and is **STRICTLY IMMUTABLE**. Never add, modify, or delete models, reducers,
  actions, buzzers, or UI components inside `apps/995.library/995.library/`.
  `apps/995.library/run.ts` is the **only permitted modification path**.

---

## 2. Monorepo Architecture & Workspace Roles

```text
.
├── apps/
│   ├── worker/              # Cloudflare Worker Edge Control Plane (@camp_candor/agent)
│   │   ├── src/index.ts     # Hono router + AgentSessionDO + edge endpoints
│   │   ├── src/tools.core.ts# Deterministic Git & DevOps tools (S_clean anchor)
│   │   ├── src/tools.custom.ts # Pluggable domain tool extension boundary
│   │   ├── src/redaction.ts # In-flight secret redaction firewall
│   │   ├── src/rollbackEngine.ts # 4-Stage compensating saga rollback engine
│   │   └── test/            # Vitest worker pool and E2E audit suites
│   └── 995.library/         # Blessed Terminal UI Harness (@camp_candor/995.library)
│       ├── run.ts           # Dynamic package loader & CLI entrypoint
│       └── 995.library/     # [IMMUTABLE] Core Blessed Curses engine
│
└── packages/
    └── 000.agent/           # Core Agent Domain & Terminal Cockpit
        ├── BEE.ts           # Unit registration & state manifest
        ├── src/cascade.ts   # 4-tier endpoint resolution cascade & WS derivation
        ├── 00.agent.unit/   # Agent core actions, reducers, WS connections
        └── 98.menu.unit/    # Blessed Menu Screen, Local/Live Switchboard
```

---

## 3. The Deterministic DevOps Protocol & S_clean Firewall

All automated operations executed by agents must obey the deterministic state
machine:

1. **Rollback Anchor Capture (S_clean):** Before provisioning changes, the agent
   must query `get_commit_sha` on trunk (`main`). The returned SHA
   ($S_{\text{clean}}$) acts as the immutable rollback point.
2. **Ephemeral Branch Isolation:** Direct mutations to `main` are structurally
   prohibited. All changes must be written to an ephemeral branch matching
   `spec/TASK-XX-<short-sha>` via `create_ephemeral_branch`.
3. **Bounded File Commits:** Files are committed strictly to the ephemeral
   branch via `write_repo_file` using safe Base64 encoding:
   `btoa(unescape(encodeURIComponent(content)))`.
4. **Trunk Promotion via Pull Request:** Changes are merged to trunk exclusively
   via `create_pull_request`, requiring automated CI validation and human
   sign-off.
5. **Watchdog Circuit Breaker & Saga Rollback:** If CI runs fail or checks
   divergence, `executeSagaRollback` invalidates task execution, closes open PRs
   with tombstones, and obliterates the ephemeral tracking branch.

---

## 4. Schema Integrity & Terminal Standards

- **Strict TypeBox Schemas:** All tool parameters must be declared using
  `@sinclair/typebox` with `{ additionalProperties: false }` explicitly
  configured.
- **7-Bit Pure ASCII Compliance:** All terminal labels, console messages, and
  log tokens must use ASCII characters (`>>`, `[OK]`, `[FAIL]`, `[ONLINE]`,
  `::`). Unicode emojis are prohibited to prevent character corruption in
  terminal emulators.

---

## 5. Verification Gauntlet & Quality Gates

Execute the local verification gauntlet before pushing code or opening PRs:

```bash
# 1. Typecheck all project references
npm run check:types

# 2. Run full monorepo sequential test battery
npm test

# 3. Assert Immutable Boundary Integrity (Must return 0 lines)
npm run check:boundary

# 4. Verify Unified Code Quality
npm run check:all
```
