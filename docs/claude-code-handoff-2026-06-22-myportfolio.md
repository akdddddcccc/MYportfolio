# MYportfolio Demo Handoff - 2026-06-22

## Canonical Repository

- Repository: `akdddddcccc/MYportfolio`
- Production branch: `main`
- Current integration commit: `1233676 Complete Task Map and sticker demo interactions`
- Local integration checkout: `/Users/eeo/Documents/作品集架构更改/myportfolio-integration`

Do not use `/Users/eeo/ClaudeProjects/test-project/portfolio` as a push target. It is a different repository (`akdddddcccc.github.io`) that contains historical source material only.

Before every Git write, verify:

```bash
git remote get-url myportfolio
git branch --show-current
git status --short
```

Only push to `myportfolio` after the user explicitly asks. Never force-push `main`.

## Current Demo Scope

### Task Map

- Only one root goal is allowed.
- AI breakdown is leaf-node only and returns 3-6 direct children.
- Task Map uses DeepSeek by default, controlled by `TASKMAP_PROVIDER=deepseek`.
- AI returns `title`, `note`, `startRatio`, `endRatio`, and `dependsOn`.
- Generated children inherit their parent range, then receive initial relative dates and dependency IDs. Users can drag and edit afterward.
- Mind map supports marquee multi-selection and deletion, drag ghosts, hierarchy drag/drop, and keyboard shortcuts.
- Gantt dependency lines only represent explicit generated dependencies when dependency data exists. Legacy manual rows retain sequential same-lane links.

### Livestream Sticker Workflow

- Generation order is always top -> bottom -> side.
- Each generated sticker has single-image regeneration.
- Background stickers request JPEG first for latency and retry PNG when a non-timeout image request fails.
- Text drafts and transparent cutouts are always PNG.
- `textColorMode` is `auto`, `dark`, or `light`; dark lettering never uses pure `#000000`.
- Text generation uses a black or white matte based on mode/brightness and removes only matte connected to the outer canvas border, preserving interior highlights and dark detail.
- Text layer starts at at least 800px wide in the 1080px composition.
- Holding Shift while drawing a fade locks the stroke to a horizontal line.
- Completed fade/text/side actions switch their controls to redo/reset behavior.

## EdgeOne Variables

Both provider credential groups may exist in EdgeOne. The selector is `STICKER_IMAGE_PROVIDER`, not the display label.

```env
STICKER_IMAGE_PROVIDER=ofox

OFOX_API_KEY=
OFOX_BASE_URL=https://api.ofox.io/v1
OFOX_IMAGE_MODEL=openai/gpt-image-2

OPENAI_OFFICIAL_API_KEY=
OPENAI_OFFICIAL_BASE_URL=https://api.openai.com/v1
OPENAI_OFFICIAL_IMAGE_MODEL=gpt-image-2

TASKMAP_PROVIDER=deepseek
DEEPSEEK_TASKMAP_API_KEY=
DEEPSEEK_TASKMAP_BASE_URL=https://api.deepseek.com
DEEPSEEK_TASKMAP_MODEL=deepseek-v4-flash
```

Never put a real key in repository files, browser code, logs, or documentation. See `.env.example` for the optional provider tuning variables. Do not create blank variables in EdgeOne; omit optional variables to use their code defaults.

## Validation

Run before any commit or push:

```bash
node --check scripts/ai-workflow-server.mjs
node scripts/text-layer-matte.test.mjs
npm run build
git diff --check
```

When local keys are unavailable, still verify `/api/ai-workflow/status`, the missing-key Task Map response, and the text-layer matte mode response. Real image API calls must be tested only through configured EdgeOne environment variables.

## Claude Code Guardrails

- Modify only files explicitly named in the current task.
- Do not change visual UI unless the user requests it.
- Preserve the separate OFOX/OpenAI adapters and the independent DeepSeek Task Map provider.
- Do not alter top-bottom-side ordering, the 800px text start width, or the nested Task Map data contract without user approval.
- Do not run `git reset`, `git checkout`, force-push, or write API keys.
- Before reporting completion, state changed files and validation results. If the task is too large, stop before editing and split it into smaller file-scoped tasks.
