# AGENTS.md -- Workspace Guidelines & Architecture

> Operational manual, monorepo architecture, invariant specifications, and
> coding standards for the npm-agent-01 ecosystem.

---

## 1. Core Directives & Immutability Boundaries

- **System:** Standard NPM Monorepo (`workspaces: ["packages/*", "apps/*"]`). Do
  NOT introduce Nx, Lerna, Yarn, or PNPM.

- **Privacy:** Private repository (`"private": true`). Do NOT publish packages
  to public npm registries.

- **Git Commits:** Use standard conventional commit format via git directly:
  `git commit -m "type: description"`. Husky hooks automatically enforce build
  and staged linting.

- **TypeScript Integrity:** Strict mode is enforced (`strict: true`, pure ESM
  exports). Avoid `any` where possible; handle `null` and `undefined` strictly.

- **HARNESS BOUNDARY CONFIRMATION (`apps/995.library`):**
- `apps/995.library/995.library/**` is the **canonical upstream terminal
  harness** and is **STRICTLY IMMUTABLE**. Never add, modify, or delete models,
  reducers, actions, buzzers, interfaces, or UI components inside
  `apps/995.library/995.library/`.

- **Sole Modification Exception (`apps/995.library/run.ts`):**
  `apps/995.library/run.ts` is the **only permitted modification path** inside
  `apps/995.library/`. Its role is strictly restricted to workspace
  orchestration, dynamic package discovery, TypeScript compilation targeting,
  and registering top-level Blessed menu routes (`ROUTE_MENU`). All domain
  features, ChatOps, actions, and reducers must live in `packages/` or
  `apps/worker/`.

---

## 2. Monorepo Architecture & Workspace Roles

```text
.
├── apps/
│   ├── worker/                          # Cloudflare Worker Edge Control Plane (@camp_candor/agent)
│   │   ├── src/index.ts                 # Hono router + AgentSessionDO + edge endpoints
│   │   ├── src/tools.core.ts            # Deterministic DevOps tools (get_commit_sha, write_repo_file, etc.)
│   │   ├── src/tools.custom.ts          # Extensible tool baseline
│   │   └── test/                        # Vitest pool worker & E2E audit suites
│   └── 995.library/                     # Terminal Runner Harness (@camp_candor/995.library)
│       ├── run.ts                       # [SOLE MODIFIABLE PATH] Dynamic package loader & CLI entry
│       └── 995.library/                 # [IMMUTABLE] Base Blessed Curses UI primitives & engine
│
└── packages/
    └── 000.agent/                       # Core Agent Domain & State Unit (@camp_candor/000.agent)
        ├── BEE.ts                       # Unit registration & central wiring
        ├── 00.agent.unit/               # Agent core actions, reducers, WS connections
        └── 98.menu.unit/                # Agent Menu Screen, Sub-routes, Local/Live Switchboard
```

### 2.1 Workspace Roles & Modification Permissions

| Workspace / Directory             | Package Name               | Modifiable?          | Primary Role & Governance                                                     |
| :-------------------------------- | :------------------------- | :------------------- | :---------------------------------------------------------------------------- |
| `apps/worker`                     | `@camp_candor/agent`       | **YES**              | Cloudflare Worker AI Control Plane (Hono, AgentSessionDO, GitHub REST tools). |
| `apps/995.library/run.ts`         | `@camp_candor/995.library` | **YES (RESTRICTED)** | CLI runner harness, package discovery, and terminal route orchestrator.       |
| `apps/995.library/995.library/**` | `@camp_candor/995.library` | **NEVER**            | Static Blessed UI layout primitives, Grid, Console, and Core Bus engine.      |
| `packages/000.agent`              | `@camp_candor/000.agent`   | **YES**              | Agent Redux/Buzzer Units, Menu Screens, Process Spawning, State Store.        |

---

## 3. The S_clean Protocol & TypeBox Schema Firewall

`apps/worker` establishes the deterministic DevOps Edge Control Plane for
automated repository management.

### 3.1 The S_clean Rollback Anchor Invariant

All automated code modifications and ephemeral branch creations must strictly
preserve rollback idempotence:

1. **State Anchor Capture (S_clean):** Before creating an ephemeral branch or
   modifying repository content, the agent must invoke `get_commit_sha` to
   record the base immutable commit SHA ($S_{\text{clean}}$).
2. **Ephemeral Branch Quarantine:** Direct commits to `main` or production trunk
   branches are strictly prohibited. Modifications must be isolated in ephemeral
   branches matching `spec/TASK-<ID>-<short-sha>`.
3. **Structured Audit Receipts:** Every tool execution must emit a
   deterministic, structured receipt describing the operation, payload hash, and
   target branch.

### 3.2 TypeBox Schema Firewall

All tool parameter schemas registered in `apps/worker/src/tools.core.ts` and
`apps/worker/src/tools.custom.ts` must enforce strict input boundaries:

- **Strict Property Validation:** Every schema definition must explicitly
  declare `{ additionalProperties: false }`. Unrecognized properties, extraneous
  payload keys, or prototype tampering must cause immediate schema validation
  rejection.
- **Fail-Closed Gateways:** AI Gateway routing must strictly resolve valid
  tokens (`getGatewayToken`) and fallback to deterministic error receipts upon
  network disconnects or upstream rate limits.

---

## 4. Terminal Extension & Runner Protocol

To extend the Blessed Curses interface without violating the immutable runner
boundary:

1. **Package Discovery in `run.ts`:**
   - `apps/995.library/run.ts` automatically discovers directories in
     `packages/` that contain a `tsconfig.json`.
   - It builds package targets, imports their `hunt.js` entry, and dispatches
     `ROUTE_MENU` to mount them into the Blessed UI.

2. **Package Anatomy Requirements:** Every package providing terminal
   interactions must expose:
   - `BEE.ts`: Unit registration and reducer manifest.
   - `hunt.ts`: Reactive state dispatcher exporting `sim.hunt(type, bale)`.
   - `98.menu.unit/`: Standardized menu unit containing `menu.action.ts`,
     `menu.model.ts`, `menu.reduce.ts`, `menu.buzzer.ts`, and
     `buz/00.menu.buzz.ts`.

3. **Windows CLI Compatibility:** All menu labels, telemetry markers, and
   console logs must use ASCII-safe tokens (`>>`, `[OK]`, `[FAIL]`, `[ONLINE]`,
   `::`). Multi-byte unicode emojis are forbidden in terminal output and
   codebase comments to prevent character corruption in Windows `cmd.exe`.

---

## 5. Verification Gauntlet & Quality Gates

Before pushing code or opening Pull Requests, execute the local verification
gauntlet:

```bash
# 1. Typecheck project references across workspaces
npm run check:types

# 2. Run Worker, Agent, and Library unit test suites
npm test

# 3. Assert Immutable Boundary Integrity (Must return 0 modified files in 995.library/)
git status -s apps/995.library/995.library/

# 4. Execute Local Contract Audit
npm run audit:local
```
