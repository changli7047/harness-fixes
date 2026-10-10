# dsh-custom-plugins

Out-of-tree plugins and bundle patches for **DeepSeek Harness 0.2+**, ported from the custom
`harness-fixes` build (0.1.0-rc.5 era). Nothing here modifies the official harness checkout:
packages install into a `dsh` profile either as a **bundle** (declares `dsh.bundle` and a
`cordis.patch.yml` layer that `dsh plugin add` appends automatically) or as a **plain plugin**
(mounted by some bundle's layer, installed as a profile dependency).

## Requirements

- Node.js `^22.19` or `>=24`
- pnpm 11 (via corepack is fine)
- A local official checkout used for types and testing, by default
  `D:\deepseek-aideepseek-harness` (pnpm `link:` devDependencies point there; edit the paths in
  each package's `devDependencies` for a different checkout, or replace `link:` with published
  versions).

## Layout

```
packages/<name>/    one plugin or bundle package
  src/              TypeScript sources
  cordis.patch.yml  bundle layer (when the package declares dsh.bundle)
  lib/              built output (git-ignored)
```

## Build and test

```sh
pnpm install
pnpm build       # tsdown → lib/ (all @deepseek-ai/* stay external)
pnpm typecheck   # tsc against the linked official checkout's built types
```

## Install into a profile

From the official checkout (so the `dsh` launcher resolves):

```sh
# Self-contained bundles (one add installs the plugin and its layer):
dsh plugin --profile <name> add D:\dsh-plugins\packages\rheostat
dsh plugin --profile <name> add D:\dsh-plugins\packages\tool-evolve

# Grouped layers: add the bundle plus its plain plugin packages:
dsh plugin --profile <name> add D:\dsh-plugins\packages\observer-loop
dsh plugin --profile <name> add D:\dsh-plugins\packages\observer
dsh plugin --profile <name> add D:\dsh-plugins\packages\context-handoff

dsh plugin --profile <name> add D:\dsh-plugins\packages\codewhale
dsh plugin --profile <name> add D:\dsh-plugins\packages\codewhale-constitution
dsh plugin --profile <name> add D:\dsh-plugins\packages\codewhale-snapshot
dsh plugin --profile <name> add D:\dsh-plugins\packages\codewhale-fleet

dsh --profile <name> --dump-config   # shows each "# == <bundle>" layer
dsh --profile <name>                 # boots with the rows mounted
```

Set `DSH_HOME` first if you want an isolated home (recommended while testing).

## Porting notes (0.1.0-rc.5 → 0.2.x)

| 0.1 construct | 0.2 equivalent |
|---|---|
| `dsh-invariants` + `src/invariant.ts` | removed in 0.2; no replacement |
| `session.events` | `session.snapshotEvents()`（deprecated but present） |
| `session.append(type, data, { ignorable: true })` | `appendPluginRecord(session, 'plugin:<owner>/<name>', data)` + `PluginRecordMap` augmentation |
| `SessionEventMap` entries for plugin events | `PluginRecordMap` entries under `@deepseek-ai/dsh-session/types` |
| `source: { kind: 'plugin', plugin: ... }` | declare your own kind: `interface MessageSourceMap { <name>: { kind: '<name>' } & ContextFormed }` |
| `ctx.llm.prepareCall(route)` then `stream({ ...route, ... })` | dispatch with `...prepared.config`: 0.2 compares the dispatch config against the resolved config and rejects mismatches (`INVALID_PREPARED_CALL`) |

## Status

| Package | Port state |
|---|---|
| `rheostat` | **verified end-to-end on 0.2**: typecheck + build, installs as a bundle, mounts at boot, prompt section renders, `rheostat_get` executes (session log `tool/result` isError:false) |
| `observer` | **verified end-to-end on 0.2**: `plugin:observer/notice` record written, steer spliced into the agent inbox (`repeated-tool` rule) |
| `context-handoff` | **verified end-to-end on 0.2**: threshold crossed → automatic backup (git bundle + tarball + HANDOFF note), `plugin:context-handoff/handoff` record with artifact paths, reminder injected |
| `tool-evolve` | ported + workflow verified: typecheck/build, `evolve` registers in the tool list, the workflow script parses and executes in the PTC worker, a child spawns, and its result maps through the tool. Also fixes an upstream script bug (an unescaped apostrophe made `EVOLVE_SCRIPT` invalid JavaScript — it could never parse). The structured-node success path still needs a capable model or a schema-aware mock |
| `codewhale-constitution` | **verified end-to-end on 0.2**: the workspace `codewhale.constitution.yml` renders as the `codewhale:constitution` system-prompt section (marker found in `system/message`) |
| `codewhale-snapshot` | **verified end-to-end on 0.2 (Web UI)**: per-turn workspace copy written with `meta.json`; `/undo` restored the workspace and — after a port fix — removed the file the agent created after the snapshot (the original restore only overwrote recorded files, so created files survived; restore now deletes unrecorded current files) |
| `codewhale-fleet` | **verified end-to-end on 0.2 (Web UI)**: `/fleet run` opened a run, steered the task, the reviewer produced `plugin:codewhale-fleet/review` records (fix verdicts) and the run closed `fixes-exhausted`. Port fix: reviewer/judge calls now dispatch with `prepared.config` (spreading the raw route tripped 0.2's `INVALID_PREPARED_CALL` config guard) |
| `codewhale` (bundle) | verified: one layer inserts the three rows (configs mirrored from the original bundle) |
| `observer-loop` (bundle) | verified: one layer inserts the observer + context-handoff rows exactly once; boots cleanly with the plain plugin packages installed |

## Testing notes

- On Windows the ACL sandbox cannot grant write on the checkout root, which kills PTC-backed workflow workers; run such tests with `DSH_PERMISSION_MODE=danger-full-access` (test-only) or from a directory whose ACLs allow the grant.
- The LLM mock server returns plain text, so schema-constrained children cannot form structured nodes; use a real key for those paths.
- Timer-driven plugins need a fast-tick profile overlay for short runs; async flows (context-handoff backups) need a longer-lived session.
