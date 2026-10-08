# AGENTS.md -- Workspace Architecture & Operational Guidelines

> Operational manual, monorepo architecture, invariant specifications, and
> coding standards for the `955.library` ecosystem.
>
> `955.library` provides a deterministic Blessed terminal cockpit with a
> Redux-pattern state engine. Downstream packages are mounted dynamically, and
> all additions must stay generic, identity-agnostic, and template-safe.

---

## 0. Agent Onboarding -- Read This First

Before writing code, orient yourself in this order:

1. **This file** -- laws, boundaries, and the verification gauntlet.
2. **`data/overview/`** -- architectural intent and design rationale.
3. **`data/building/`** -- chronological session transcripts.
4. **`data/directive/`** -- task specifications and audit dossiers.
5. **The code** -- verify claims against live source before relying on them.

---

## 1. Core Directives & Immutability Boundaries

- **System:** Standard NPM Monorepo (`workspaces: ["packages/*", "apps/*"]`). Do
  NOT introduce Nx, Lerna, Yarn, or PNPM.
- **Privacy:** Private repository (`"private": true`). Do NOT publish packages
  to public npm registries.
- **Git Commits:** Use standard conventional commit format:
  `git commit -m "type: description"` (`feat`, `fix`, `chore`, `refactor`,
  `test`, `docs`, `ci`).
- **TypeScript Integrity:** Strict mode is enforced (`strict: true`, pure ESM
  exports). Never emit compiled `.js` or `.d.ts` files side-by-side into `src/`
  directories.
- **Cross-Platform Scripts:** `package.json` scripts must run identically on
  Windows and POSIX. Prefer `node -e` one-liners over raw shell built-ins.
- **Template Generalization Law:** Never hardcode repository identity (e.g.
  `"REPO-BOT"`, `"NPM-AGENT-01"`). Derive names/versions dynamically via
  `packages/000.agent/src/identity.ts` (`getRepoIdentity`).
- **HARNESS IMMUTABILITY BOUNDARY (`apps/995.library`):**
  `apps/995.library/995.library/**` is the canonical upstream terminal harness
  and is **STRICTLY IMMUTABLE**. Never add, modify, or delete models, reducers,
  actions, buzzers, or UI components inside `apps/995.library/995.library/`.
  `apps/995.library/run.ts` is the **only permitted modification path**.
- **Fail-Safe Exit:** If compilation, types, lint, tests, or boundary checks
  fail, halt and emit `CONFLICT_BLOCKED` with diagnostic traces.

---

## 2. Monorepo Architecture & Workspace Roles

```text
.
├── apps/
│   └── 995.library/            # Blessed Terminal UI Harness (@camp_candor/995.library)
│       ├── run.ts              # Dynamic package loader & CLI entrypoint (ONLY mutable file)
│       └── 995.library/        # [IMMUTABLE] Core Blessed Curses engine
│
├── packages/
│   └── 000.agent/              # Core Agent Domain & Terminal Cockpit (@camp_candor/000.agent)
│       ├── BEE.ts              # Unit registration & state manifest
│       ├── src/cascade.ts      # Endpoint resolution cascade
│       ├── src/identity.ts     # Dynamic repo identity
│       ├── 00.agent.unit/      # Agent core actions, reducers, and tests
│       └── 98.menu.unit/       # Blessed Menu Screen
│
└── data/                       # Historical record & generated artifacts
    ├── overview/               # Architectural intent
    ├── building/               # Session build logs
    ├── directive/              # Executed directives and audits
    ├── flat/                   # [GENERATED] Flattened library snapshots
    └── unit/                   # [GENERATED] Scaffolded unit templates
```

---

## 3. Terminal Standards

- **7-Bit Pure ASCII Compliance:** All terminal labels, console messages, and
  log tokens must use ASCII characters (`>>`, `[OK]`, `[FAIL]`, `[ONLINE]`,
  `::`). Unicode emojis are prohibited to prevent character corruption in
  terminal emulators.
- **Dynamic Mounting:** Packages in `packages/` that export a valid unit
  structure are auto-discovered by `apps/995.library/run.ts` and registered into
  the Blessed menu.

---

## 4. Verification Gauntlet & Quality Gates

Execute the verification gauntlet before pushing code or opening PRs:

```bash
# 1. Typecheck all project references
npm run check:types

# 2. Run full monorepo sequential test battery (agent -> library)
npm test

# 3. Assert Immutable Boundary Integrity (Must return 0 lines)
npm run check:boundary

# 4. Verify Unified Code Quality (types + prettier + eslint)
npm run check:all
```

### Quick Reference -- Common Scripts

| Script                 | Purpose                             |
| ---------------------- | ----------------------------------- |
| `npm run tui`          | Launch the Blessed terminal cockpit |
| `npm run test:agent`   | `000.agent` vitest suites           |
| `npm run test:library` | `995.library` AVA suites            |
| `npm run fix`          | Auto-fix prettier + eslint          |
