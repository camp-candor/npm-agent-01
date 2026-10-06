# 🤖 AGENTS.md — Workspace Guidelines & Architecture

> Operational manual, monorepo architecture, invariant specifications, and
> coding standards for the `camp-candor/000.repo-bot` ecosystem.

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
│   │   ├── src/index.ts                 # Hono router + RepoBotDO + edge endpoints
│   │   └── test/                        # Vitest pool worker & E2E audit suites
│   └── 995.library/                     # Terminal Runner Harness (@camp_candor/995.library)
│       ├── run.ts                       # [SOLE MODIFIABLE PATH] Dynamic package loader & CLI entry
│       └── 995.library/                 # [IMMUTABLE] Base Blessed Curses UI primitives & engine
│
├── packages/
│   ├── 000.agent/                       # Core Agent Domain & State Unit (@camp_candor/000.agent)
│   │   ├── BEE.ts                       # Unit registration & central wiring
│   │   ├── 00.agent.unit/               # Agent core actions, reducers, WS connections
│   │   └── 98.menu.unit/                # Agent Menu Screen, Sub-routes, Local/Live Switchboard
│   ├── 001.lore/                        # 🏛️ Compile-Time Narrative Legislature (@camp_candor/001.lore)
│   │   ├── schemas/                     # Pure Zod Meta-Ontology (Agent, Debt, Spatial, Unresolved)
│   │   ├── src/compiler.ts              # Deterministic Three-Pass Compiler Engine
│   │   ├── 00.lore.unit/                # Compiler execution buzzers & reducers
│   │   ├── 01.series.unit/              # Series scaffolding, integrity testing, & lifecycle management
│   │   └── 98.menu.unit/                # Interactive Lore Blessed HUD (Create Series & Dynamic Compile)
│   ├── 821.repobot/                     # DevOps Domain & Git Control Unit (@camp_candor/821.repobot)
│   └── 822.cloudflare/                  # Cloudflare Management Unit (@camp_candor/822.cloudflare)
│
```

### 2.1 Workspace Roles & Modification Permissions

| Workspace / Directory | Package Name         | Modifiable? | Primary Role & Governance                                                |
| --------------------- | -------------------- | ----------- | ------------------------------------------------------------------------ |
| `apps/worker`         | `@camp_candor/agent` | **YES**     | Cloudflare Worker AI Control Plane (Hono, RepoBotDO, GitHub REST tools). |

| | `apps/995.library/run.ts` | `@camp_candor/995.library` | **YES
(RESTRICTED)** | CLI runner harness, package discovery, and terminal route
orchestrator.

| | `apps/995.library/995.library/**` | `@camp_candor/995.library` | **NEVER** |
Static Blessed UI layout primitives, Grid, Console, and Core Bus engine.

| | `packages/000.agent` | `@camp_candor/000.agent` | **YES** | Agent
Redux/Buzzer Units, Menu Screens, Process Spawning, State Store.

| | `packages/001.lore` | `@camp_candor/001.lore` | **YES** | Narrative
Legislative Authority: Zod schemas, 3-pass compiler, authoring wizards.

| | `packages/821.repobot` | `@camp_candor/821.repobot` | **YES** | Repobot
Redux/Buzzer Units, CI Inspection, PR checks, Git tools.

| | `packages/822.cloudflare` | `@camp_candor/822.cloudflare` | **YES** |
Cloudflare worker status inspection and target mode toggles.

|

---

## 3. DevOps Control Plane ($S_{\text{clean}}$ Protocol)

The autonomous agent must operate strictly within the bounds of deterministic
CI/CD and Git protocols.

### 3.1 S_clean State Invariant

Before provisioning any ephemeral branch, the agent must evaluate the current
repository state ($S_{\text{clean}}$). Direct modification of main branch code
without first establishing an $S_{\text{clean}}$ anchor via `get_commit_sha` is
forbidden.

### 3.2 TypeBox Schema Integrity

All AI-generated schemas for tool calling and data validation must strictly
enforce `additionalProperties: false`. Open-ended schema definitions are
rejected.

---

## 5. Terminal Extension & Runner Protocol

To extend the Blessed Curses interface without violating the immutable runner
boundary:

1. **Package Discovery in `run.ts`:**

- `apps/995.library/run.ts` automatically discovers directories in `packages/`
  that contain a `tsconfig.json`.

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
   `::`). Multi-byte unicode emojis (`🎯`, `⏳`, `🟢`) are forbidden in terminal
   output to prevent character corruption (`?`) in Windows `cmd.exe`.

---

## 6. Verification Gauntlet & Quality Gates

Before pushing code or opening Pull Requests, execute the local verification
gauntlet:

```bash
# 1. Typecheck and Build all workspaces
npm run check:all

# 2. Run Worker and Lore unit test suites
npm run test:worker
npm run test:lore

# 3. Assert Immutable Boundary Integrity (Must return 0 modified files in 995.library/)
git status -s apps/995.library/995.library/

# 4. Execute Lore Compiler and verify Zero-Drift
npm run audit:lore

```

### 6.1 The Zero-Drift Tripwire

In CI/CD, the following command runs to ensure that hand-authored Markdown
dossiers match the committed canonical snapshot:

```bash
npm run compile:lore && git diff --exit-code compiled/

```
