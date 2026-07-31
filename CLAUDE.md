# Peakflow

Peakflow is an AI chat agent platform built on top of [typebot.io](https://github.com/baptisteArno/typebot.io). The goal is to extend the visual flow editor into a fully-featured AI agent builder — supporting multi-turn conversations, tool use, memory, RAG, and custom LLM routing — while keeping the no-code UX that typebot provides.

## Project Structure

Nx monorepo, Bun package manager.

- `apps/builder/` — Visual flow editor (port 3000)
- `apps/viewer/` — Runtime that executes bots (port 3001)
- `apps/workflows/` — Durable workflows server
- `packages/ai/` — Core AI utilities (completions, streaming, tool parsing)
- `packages/forge/blocks/` — LLM provider integrations (anthropic, openai, groq, mistral, etc.)
- `packages/` — All other feature modules, schemas, shared libs, UI

## Commands

All scripts run via `bunx nx`:

```bash
bunx nx dev builder          # start builder
bunx nx dev viewer           # start viewer
bunx nx typecheck            # typecheck all
bunx nx test <package>       # test a package
bunx nx test                 # run all tests via shared root runner
bunx nx format-and-lint      # check formatting/lint (--write --unsafe to fix)
bunx nx sync                 # update TS project references
```

- Never run plain `bunx tsc` — always `bunx nx`
- Don't run multiple Vitest targets in one Nx command; use root `bunx nx test` to share global setup

## Coding Style

- Write Effect code whenever possible (Effect V4 Beta). Always inspect via `bunx opensrc` first.
- Never use `as` — narrow/parse to get the right type
- Rely on type inference; avoid explicit type declarations
- One primary export per file; file name matches export name; main export at top, helpers below
- Very explicit variable names
- Extract a helper only if used ≥2 times; declare a variable only if used ≥2 times

## Development Workflow

**Spec → Approval → Implementation → Test → Approval → Compact note**

1. **Spec first**: For each feature, a spec is written and shared with the user before any code is written.
2. **Approval**: User approves (or iterates on) the spec.
3. **Spec added to CLAUDE.md**: Approved spec is committed as a section below under `## Active Specs`.
4. **Implementation**: Code is written following the spec. Unit tests are included.
5. **User testing**: User tests the feature and approves.
6. **Compact note**: Approved features are condensed to a one-liner in `## Shipped Features` and the spec is removed.

Keep unit tests for every feature to prevent regressions.

## Active Specs

## Shipped Features

- **Encrypted API Credentials for Script blocks + Shopify multi-auth-type support** — New generic `apiCredentials` credential type (`packages/credentials/src/schemas.ts`: `{ fields: {key, value}[] }`) lets Script blocks reference encrypted secrets instead of hardcoding them in `content`. Script block gains `credentialsId` (`packages/blocks/logic/src/script/schema.ts`), picker shown only for server-side execution; `executeScript.ts` decrypts server-side (same path as `executeForgedBlock.ts`) and `executeFunction.ts` injects it as a `globalThis.credentials` object in the isolate — scripts use `credentials.KEY` instead of a literal, so secrets never appear in exported bot JSON. New builder dialogs: `ApiCredentialsCreateDialog.tsx` / `ApiCredentialsUpdateDialogBody.tsx` / `ApiCredentialsFieldsForm.tsx`, wired into the generic `CredentialsCreateDialog.tsx`/`CredentialsUpdateDialog.tsx`/`CredentialsSettingsForm.tsx`. Shopify auth (`packages/forge/blocks/shopify/src/auth.ts`) gains an `apiType: "storefront" | "admin"` switch — Admin mode adds `adminAccessToken`, and `shopifyGraphqlRequest` (renamed from `storefrontRequest`) branches endpoint/header accordingly; existing credentials default to `storefront` (no migration). Bug found during manual testing: the credentials create/update dialogs never passed the live form state into `ZodObjectLayout`'s `blockOptions` prop, so any `auth` schema using `isHidden` (only Shopify's does) crashed on `undefined` destructuring — fixed by passing `blockOptions={data}` in `ForgedCredentialsCreateDialog.tsx`/`ForgedCredentialsUpdateDialogContent.tsx`. Unit tests: `executeFunction.test.ts` (new `packages/variables/vitest.config.ts`, since `isolated-vm` can't load under `bun test` on this machine — Windows/Bun limitation, not a code issue), `storefront.test.ts`.

- **Dynamic Cards** — Cards block gains explicit per-field dynamic data (schema: `dynamicItems` in `cardsOptionsSchema`; settings UI: `CardsBlockSettings.tsx`; runtime: `injectVariableValuesInCardsBlock.ts` uses `transformVariablesToList` like Buttons). Each field (Image URL, Title, Description, Button, Internal Value) maps to a list variable; unset fields fall back to the template card's defaults. Viewer carousel updated to always show ≥2 cards and extend full-width on both sides (`CardsCaroussel.tsx`).
- **Cards: extra descriptions + link paths + extra buttons** — `CardsItem` supports `extraDescriptions: string[]` (rendered as `<p>` rows in viewer, editable in builder canvas with hover-delete buttons); `dynamicItems` gains `extraDescriptionVariableIds: string[]` and `extraButtons: {variableId, type, text}[]`. `CardsItemPath` gains `type: "player-choice"|"link"` and `linkUrl`; link-type paths render as `<a target="_blank">` in the viewer. `buttonVariableId` drives button text (creates a path if template has none); `extraButtons` prepends additional paths per card — for player-choice the variable drives text, for link the variable drives `linkUrl` and `text` is a static label. Builder: per-path type-toggle icon + URL input; extra-description rows below the ghost stack with explicit × delete buttons; extra-button config rows in Dynamic Data settings. Settings panel uses `latestOptionsRef` to prevent stale-closure overwrites when multiple dynamic fields are updated in rapid succession.
- **Cards: JSON array source mode** — Dynamic Data panel gains a "Separate lists / JSON array" toggle. JSON array mode: pick one variable holding a JSON array of objects (`[{...}]` string or array of JSON strings) and type a key name per field; runtime plucks values at execution time with no Code block needed. Schema: `jsonArraySource` in `cardsOptionsSchema` (sibling of `dynamicItems`, never modifies it). Runtime: `getJsonArraySourceProps` in `injectVariableValuesInCardsBlock.ts` runs before the existing `dynamicItems` path; invalid JSON falls through gracefully. Switching modes clears the inactive config. Unit tests: `injectVariableValuesInCardsBlock.test.ts`.
- **JSON Array Remap block** — Logic block that maps over a JSON array variable and writes the result to an output variable. Two modes via `pickOnly` boolean: **remap** (default) clones all fields and applies JS expressions to listed ones; **pick** outputs only the listed fields (expression optional — blank copies value as-is). Schema: `jsonRemapOptionsSchema` (`inputVariableId`, `outputVariableId`, `transformations[]`, `pickOnly`). Expressions receive `$value`, `$item`, `$index`; run server-side in isolated-vm. Helpers: `parseJsonArrayInput`, `buildJsonRemapBody(transformations, outputVarName, pickOnly)` in `jsonRemapHelpers.ts`; unit tests in `executeJsonRemap.test.ts`.
- **OpenRouter: Generate Variables** — New `generateVariables` action on the OpenRouter block (`packages/forge/blocks/openRouter/src/actions/generateVariables.ts`), mirroring OpenAI's implementation; handler in `handlers.ts` uses `createOpenRouter({ apiKey }).chat(modelName)` as the model passed to `runGenerateVariables`.
- **Structured Output on Chat Completion (OpenAI & OpenRouter)** — Optional `structuredOutput` accordion in `parseChatCompletionOptions` (`packages/ai/src/parseChatCompletionOptions.ts`) with a `variablesToExtract` list; when populated, `runChatCompletion` calls `runGenerateVariables` instead of `generateText`, skipping `responseMapping`. Stream handlers return early with an error when structured output is active. `zodToSchema` extended with `requireAllProperties` post-processor to satisfy OpenAI's requirement that all properties appear in `required` even when nullable.
- **JSON Array Join block** — Logic block (`LogicBlockType.JSON_JOIN`) that cross-matches two JSON array variables on configurable top-level keys and outputs filtered items from Array 2 whose key value appears in Array 1. Schema: `jsonJoinOptionsSchema` (`input1Mode`, `inputVariable1Id`, `inputVariable2Id`, `matchKey1`, `matchKey2`, `outputVariableId`). Execution: pure TS, builds a Set from Array 1 values then filters Array 2 (string-coerced comparison). `input1Mode: "value"` lets Array 1 be a plain scalar variable (skips `matchKey1`; the raw value is used directly as the lookup). Builder: `JsonJoinSettings`, `JsonJoinNodeContent`, `JsonJoinIcon` (FilterIcon). Unit tests: `executeJsonJoin.test.ts`. `parseJsonArrayInput` (shared with JSON Remap) fixed to handle `string[]` input where each element is a JSON-stringified object — the format `updateVariablesInSession` produces when a Set Variable block stores an array result.
- **Block disable toggle** — `disabled: boolean` optional field added to `blockBaseSchema` (all block types) and `parseBlockSchema` in forge core (all forge blocks). Engine: `walkFlowForward.ts` skips disabled blocks with `continue` before setting `nextEdge`, so they produce no output, no input pause, and no edge traversal. Builder: eye icon button (`ViewIcon`/`ViewOffSlashIcon`) on each block node, visible on hover (hidden when enabled, always visible when disabled); block card renders at `opacity-50` when disabled; not shown in read-only/analytics mode.
- **Share page view mode toggle** — Share page Links section gains a "Full screen / Chat bubble" tab toggle. Full screen shows the existing editable viewer URL. Chat bubble shows a read-only `{viewerUrl}/{publicId}?view=bubble` link (and custom domain variant) with a Copy button. Viewer: `TypebotPageV3.tsx` detects `?view=bubble` via `router.query`; renders a gray preview page with `<Bubble autoShowDelay={1000}>` instead of `<Standard>`.
- **Free Text Input on Buttons & Cards** — `freeTextInput: { enabled, placeholder? }` added to `choiceInputOptionsSchema` and `cardsOptionsSchema`. Builder: toggle + placeholder field at the bottom of `ButtonsBlockSettings.tsx` and `CardsBlockSettings.tsx`. Viewer: `Buttons.tsx` and `CardsCaroussel.tsx` render a `ShortTextInput` + `SendButton` form below the choices when enabled; submits via the same `onSubmit` path as a button/card click.
- **Cards: 3-way exit nodes** — Cards block always shows a "Card selected" exit node (`options.cardClickedOutgoingEdgeId`); "Free text" node appears when `freeTextInput.enabled` (`options.freeTextOutgoingEdgeId`); "Skip" node when `skipButton.enabled` (`options.skipButton.outgoingEdgeId`). Per-path `BlockSourceEndpoint` removed from `CardsItemNode`. Engine: `validateAndParseInputMessage` uses `cardClickedOutgoingEdgeId` (falling back to per-path for old bots), `freeTextOutgoingEdgeId` for free text replies. Builder edge handlers: `__card_clicked__` and `__free_text__` reserved itemIds in `edges.ts`.
- **Shopify forge block** — New forge block (`packages/forge/blocks/shopify/`, id `shopify`) with two actions. **Fetch products** paginates the Storefront `products` query (50/page), optional `productType` filter, `maxProducts` cap, `onlyAvailableForSale` filter, picks the lowest-priced available variant per product, builds `url` from `storeUrl` + `handle`, writes `{ title, price, productType, url, description, image, variantId }[]` to `outputVariableId`. **Create cart** reads a JSON-array variable of variant ID strings (`variantIdsVariableId`), runs `cartCreate` (qty 1 each), maps `Cart ID`/`Checkout URL` via `responseMapping`, surfaces `userErrors` as logs. Auth (`auth.ts`): `storeDomain`, `storefrontAccessToken` (encrypted), `storeUrl`, `apiVersion` (default `2025-07`), and a `usePrivateToken` toggle sending `Shopify-Storefront-Private-Token` instead of `X-Shopify-Storefront-Access-Token` (for private `shpat_` tokens). `parseJsonArrayInput` moved to `@typebot.io/lib/parseJsonArray` (re-exported from `jsonRemapHelpers.ts`) so forge blocks can reuse it without a `bot-engine` dependency. Unit tests in `src/helpers/` (`products`, `variantIds`, `storefront`); demo flow at `builds/shopify-store-demo.json`.
- **AI-Driven Conversation Interruption** — Global bot/human transcript (`SessionState.conversationHistory`, capped at 60 entries) captured automatically in `walkFlowForward.ts` (bot bubbles + presented input summaries) and `continueBotFlow.ts` (human replies), via `appendConversationHistory.ts`. New `EventType.INTERRUPTION` (`packages/events`): draggable event, one outgoing edge, options for enable toggle, LLM provider/credentials/model, editable `instructions`, and `historyWindow` (default 20 turns). After a free-text human reply, `evaluateInterruptionEvent.ts` runs one structured-output LLM call over the recent transcript; on `shouldInterrupt: true`, `continueBotFlow.ts` sets `returnMark` to the paused resume point and redirects flow down the event's outgoing edge, reusing the Jump/Return mechanism so the bot resumes exactly where it left off. Builder: `InterruptionEventNode.tsx` / `InterruptionEventSettings.tsx` mirror the Command event's card + settings drawer.
- **Live-localized contact header** — `theme.chat.contact.availableMessage`/`unavailableMessage` and `theme.chat.header.status`/`tagline` now ride the existing `dynamicTheme` mechanism (schema: `dynamicThemeSchema` in `packages/theme/src/schemas.ts`; engine: `parseDynamicThemeInState.ts` + `parseDynamicTheme.ts`; client: `mergeThemes` in `packages/embeds/js/src/utils/dynamicTheme.ts`) — any of these fields set to a `{{variable}}` string is re-resolved against session variables after every turn and pushed to the client, same as the pre-existing avatar/background dynamic fields. `ChatHeader` now reads from `ChatContainer`'s reactive `latestTheme` memo (piped up via a new `onThemeUpdate` callback prop into a `BotContent`-owned signal in `Bot.tsx`) instead of the static `initialChatReply` snapshot, so all four fields — and the host avatar — update live mid-conversation. Applied to Maison la Fleur's bot (`builds/maison-lefleur-agent-v22-fixed.json`): `contact_available`/`contact_unavailable`/`header_status`/`header_tagline` keys added to `preset_translations` for all 5 languages, resolved by Code blocks in "Language Selection" (default) and "Occasion Question" (post-pick) into `localized_*` session variables that the theme fields reference.
- **Card carousel & choice-button grid alignment** — `CardsCaroussel.tsx`: the `Card` wrapper gets `h-full`, filling the height CSS Grid's default `align-items: stretch` already assigns to every `Carousel.Item` in a row (matching the tallest card) — so all cards in view end up equal height with no hardcoded pixel value. Title clamped to 2 lines (`line-clamp-2`), description to 3 (`line-clamp-3`); the path-buttons wrapper gets `mt-auto` to pin buttons to the card's bottom edge regardless of text length above them. `Buttons.tsx` (single-select choice input): the options list renders as `grid grid-cols-2 gap-2` instead of a right-aligned `flex flex-wrap` list whenever there are 2+ options (falls back to the old single-button layout for exactly one option), so left/right edges stay aligned instead of staggering; each `Button` gets `h-full` so two buttons sharing a grid row stretch to match whichever one wraps to more lines. `Button.tsx`'s shared `buttonVariants` gained `items-center` so text stays vertically centered once a button is stretched taller than its own content. Global change — affects every typebot's choice-input/cards rendering, not just one bot. Known pitfall hit twice while validating this: the `nx dev viewer` process caches compiled output for `packages/embeds/js`/`packages/embeds/react` and does not always pick up source edits to those packages without a manual restart (`nx dev viewer` won't reliably hot-reload embed-package changes) — if a verified-correct change doesn't show up in the browser, restart the viewer dev server before assuming the fix is wrong.

## Architecture Reference

### Flow execution

`packages/bot-engine` is the engine for both preview (builder) and live (viewer) chats.

- **`startSession.ts`** — loads the typebot, initialises `SessionState`, runs `startBotFlow`. Called once when a chat opens.
- **`continueBotFlow.ts`** — handles each user reply. Validates input, saves answer, calls `walkFlowForward` until the next input block (which pauses) or end of flow.
- **`executeForgedBlock.ts`** — generic dispatcher for all forge (LLM/integration) blocks. Resolves credentials, deep-parses variables into options, calls `handler.server()`. Streaming short-circuits here: if the block has `getStreamVariableId` and the next block is a text bubble with only `{{varName}}`, it emits a `stream` client-side action instead.

### API layer (oRPC)

All builder API routes live in `apps/builder/src/app/api/router.ts` and must be registered in the `AppRouter` type there.

Procedure builders from `packages/config/src/orpc/builder/middlewares.ts`:
- `publicProcedure` — no auth, Sentry error capture
- `publicProcedureWithOptionalUser` — auth optional
- `authenticatedProcedure` — auth required (throws `UNAUTHORIZED` otherwise)

Viewer has its own parallel set in `packages/config/src/orpc/viewer/`.

### Editor state

Builder state is managed by `TypebotProvider` (Immer). All mutations go through `setTypebot((typebot) => produce(typebot, draft => { ... }))`. The mutation helpers live in:
- `apps/builder/src/features/editor/providers/typebotActions/blocks.ts`
- `apps/builder/src/features/editor/providers/typebotActions/edges.ts`
- `apps/builder/src/features/editor/providers/typebotActions/groups.ts`
- `apps/builder/src/features/editor/providers/typebotActions/variables.ts`
- `apps/builder/src/features/editor/providers/typebotActions/events.ts`

### Forge block system

A forge block = a **definition** + **handlers**. Both are auto-registered.

**Definition** (`packages/forge/blocks/<name>/src/index.ts`):
```ts
export const myBlock = createBlock({ id, name, auth, options, actions: [...] })
```
Each action uses `createAction({ name, options: z.object({...}) })`.

**Handler** (`packages/forge/blocks/<name>/src/handlers/`):
```ts
export default [
  createActionHandler(myAction, { server: async ({ credentials, options, variables, logs }) => { ... } }),
]
```

After creating a new block, register it in two auto-generated files (ignore "do not edit" — add your entry):
- `packages/forge/repository/src/definitions.ts` — add to `forgedBlocks`
- `packages/forge/repository/src/handlers.ts` — add to `forgedBlockHandlers`
- `packages/forge/repository/src/constants.ts` — add the id to `forgedBlockIds`

Or use the scaffold CLI: `bun run create-new-block`.

### Database schema

Key models in `packages/prisma/postgresql/schema.prisma`:
- **`Typebot`** — `groups`, `edges`, `variables`, `events`, `settings`, `theme` are all JSON blobs. `publicId` is the slug used in viewer URLs.
- **`PublicTypebot`** — a snapshot copy created on "Publish". The viewer reads this, not `Typebot`.
- **`Result`** — one per conversation. Links to `Answer`/`AnswerV2` (user replies) and `Log`.
- **`Credentials`** — AES-encrypted API keys, scoped to a `Workspace`.

After editing the schema: `bunx nx db:generate prisma` then `bunx nx db:push prisma` (dev) or create a migration for prod.

### Variable system

Variables are defined in the typebot definition (name + id). At runtime they hold values in `SessionState`. Any string field in any block can reference them with `{{variableName}}`. Resolution is done by `parseVariables()` / `deepParseVariables()` from `packages/variables`.

### Script block variable access

`parseVariables` with `fieldToParse: "id"` replaces `{{varName}}` in script bodies with the variable's internal cuid2 ID. That ID is injected as a function parameter whose value is the actual variable value.

**Reading:** use `{{varName}}` as a bare expression — never in backticks/template literals.
```js
const raw = {{myVar}};        // correct — resolves to the actual value
const raw = `{{myVar}}`;      // WRONG — raw becomes the ID string (e.g. "vk5lgm8y..."), not the value
                              // JSON.parse(raw) then throws "Unexpected token 'v'"
```

**Writing (server-side Script block):** use the injected `setVariable(name, value)` — direct assignment to the local parameter does not propagate back to Typebot state.
```js
setVariable("myVar", newValue);   // correct
{{myVar}} = newValue;             // WRONG — only mutates the sandbox-local copy
```

**Writing (client-side Script block):** `setVariable` is not injected. Variable writes from client-side scripts need a different approach (redesign as server-side, or use a Set Variable block).

### Typebot versioning

The `version` field on `Typebot` / `PublicTypebot` gates new behaviour. Current is v6 (adds `events`). Use `isTypebotInSessionAtLeastV6(typebot)` to branch on it in the engine.

## Cloud Deployment

See [CLOUD_STRATEGY.md](./CLOUD_STRATEGY.md) for the full deployment plan.

Summary: Contabo VPS, shared Postgres in `/opt/infra`, builder on port 3100/`peakflow.gameloops.io`, viewer on port 3101/`viewer.peakflow.gameloops.io`, Redis on peakflow internal network. Workion's Caddy (in `/home/apps/workion`) handles TLS + reverse proxy for both domains — it joins `infra-net` so it can reach peakflow containers directly. Deploy via `.\deploy.ps1` (builds locally, pushes to GHCR `ghcr.io/rakibj/peakflow-*`, VPS pulls). No GitHub Actions currently. No PartyKit. Workflows deferred to v2.

Key runtime requirements:
- `HOSTNAME=0.0.0.0` in `.env.production` — Node.js must bind all interfaces so Caddy (on `infra-net`) can reach it
- `--max-old-space-size=900` in `NODE_OPTIONS` — builder needs 2 GB container limit; heap capped at 900 MB to avoid OOM crashes
- Builder container memory limit: 2048m

### Deploying to VPS (step-by-step)

Run each step sequentially via PowerShell. Use 10-minute timeouts for builds and pushes.

**1. Build builder image**
```powershell
docker build --build-arg SCOPE=builder -t "ghcr.io/rakibj/peakflow-builder:latest" D:\Projects\Web\peakflow
```

**2. Build viewer image**
```powershell
docker build --build-arg SCOPE=viewer -t "ghcr.io/rakibj/peakflow-viewer:latest" D:\Projects\Web\peakflow
```

**3. Push builder to GHCR**
```powershell
docker push "ghcr.io/rakibj/peakflow-builder:latest"
```

**4. Push viewer to GHCR**
```powershell
docker push "ghcr.io/rakibj/peakflow-viewer:latest"
```

**5. Copy compose file to VPS**
```powershell
scp "D:\Projects\Web\peakflow\docker-compose.prod.yml" "peakflow-vps:/home/apps/peakflow/docker-compose.yml"
```

**6. Pull new images on VPS** (do NOT use `docker compose pull` — it can fail silently; use explicit `docker pull` instead)
```powershell
ssh peakflow-vps "docker pull ghcr.io/rakibj/peakflow-builder:latest && docker pull ghcr.io/rakibj/peakflow-viewer:latest"
```

**7. Restart containers**
```powershell
ssh peakflow-vps "cd /home/apps/peakflow && docker compose up -d --no-build --force-recreate builder viewer"
```

**8. Verify** — image `Created` date must match today's date
```powershell
ssh peakflow-vps "docker inspect ghcr.io/rakibj/peakflow-builder:latest | grep Created"
```

## Source Reference

To read a dependency's source: `bunx opensrc path <package>` (e.g. `bunx opensrc path effect@<version>`). Do not use `node_modules/` as primary reference.

## Local Dev Environment

- **Docker**: run `docker compose -f docker-compose.dev.yml up -d` before starting dev servers
- **Postgres port**: mapped to **5433** (not 5432) because a local PostgreSQL 16 install occupies 5432. `DATABASE_URL` uses `localhost:5433`.
- **Prisma on Windows**: `bun install` may fail to link `prisma/build/index.js`. If it goes missing (Windows Defender may quarantine it as a false positive — it is safe), re-extract from the npm tarball via PowerShell: `Invoke-WebRequest "https://registry.npmjs.org/prisma/-/prisma-7.4.0.tgz" -OutFile "$env:TEMP\p.tgz"; tar -xzf "$env:TEMP\p.tgz" -C "$env:TEMP\pe"; Copy-Item "$env:TEMP\pe\package\build\index.js" "node_modules\prisma\build\index.js" -Force`. Add the project folder to Windows Defender exclusions to prevent re-quarantine.
- **Start dev**: `bun run dev` — builder on :3000, viewer on :3001

## Notes

- Use `trash` instead of `rm` when deleting files
- Playwright auth: inject cookies from `apps/viewer/src/test/.auth/user.json`; remap to `{ name, value, url: "http://localhost:3000", expires, httpOnly, secure, sameSite }`

### Demo / test JSON files

Block `type` fields in JSON files (under `builds/`) must match the exact TypeScript enum string, not a human-readable label. Wrong values silently pass JSON parsing but fail `importTypebotInputSchema` Zod validation at import time — each bad block produces one issue, so N bad blocks → N `Input validation failed` issues.

Key enum values to remember:
| Human label | Correct `type` string | Source |
|---|---|---|
| Text bubble | `"text"` | `BubbleBlockType.TEXT` |
| Image bubble | `"image"` | `BubbleBlockType.IMAGE` |
| Set Variable | `"Set variable"` | `LogicBlockType.SET_VARIABLE` |
| Condition | `"Condition"` | `LogicBlockType.CONDITION` |
| JSON Remap | `"JSON remap"` | `LogicBlockType.JSON_REMAP` |
| JSON Join | `"JSON join"` | `LogicBlockType.JSON_JOIN` |

Always look up the enum in `packages/blocks/*/src/constants.ts` before writing a block type string in JSON.
