# Maison la Fleur v23 — QA Review & Fix Plan

**Status:** Ongoing / not yet started
**Workflow reviewed:** [`builds/maison-lefleur-agent-v23.json`](./builds/maison-lefleur-agent-v23.json) (build `maison-lefleur-agent-v23-25uuu6d`, exported 2026-07-28)
**QA source:** [`builds/maison-lefleur-agent-v23-qa-report-28jul2026.txt`](./builds/maison-lefleur-agent-v23-qa-report-28jul2026.txt) — full regression report from Eyyub, 5 languages × 8 occasions × 7 design options × 4 budgets, cross-checked against the live Shopify catalogue (340 products)

This doc cross-references every finding in the QA report against the actual flow JSON and the platform source (`packages/embeds`, `packages/bot-engine`), to establish root cause and whether each fix belongs in the Typebot flow itself (no deploy needed) or requires a platform code change (needs a deploy). Items are not yet implemented — this is the triage pass. See "Next steps" at the bottom.

Group/file references below use IDs from `builds/maison-lefleur-agent-v23.json` unless noted.

---

## Blockers

### 1. Budget not respected
Fixed $200/$300/$400 buttons in `Budget Preference Question` (`cktg7cjfc51vnjqrrqh4z8jz`) don't reflect the catalogue (median bouquet price $455; only 4 items ≤$200). Nothing downstream filters by budget — `Preprocess Data` only filters by category tag, and the `AI Selection` system prompt explicitly ranks design match above budget, instructing the model to select an over-budget item anyway and just flag it in the reply.
**Fix type:** Flow.
**Recommended fix:** Change brackets to match real catalogue distribution (e.g. $300/$500/$800/$800+/Flexible), add a hard price-range filter (Code/JSON Remap) before the AI Selection call, sort results ascending, and only fall back to "nothing fits, here's the closest" when the filtered set is empty.

### 2. "Invalid message. Please, try again." not localized
Bot `settings.general` has no `systemMessages` block, so it falls through to the hardcoded English default in `packages/settings/src/constants.ts:33`. The engine already interpolates variables here (`packages/bot-engine/src/continueBotFlow.ts:792-797`).
**Fix type:** Flow.
**Recommended fix:** Add a `localized_invalid_message` computed variable (same pattern as every other `localized_*` var) and set `settings.general.systemMessages.invalidMessage` to `{{localized_invalid_message}}`.

### 3. Dead end at the handoff step
`Contact Options` (`g_mlf_contact_cards`) has a "Skip"/"Continue conversation" button wired to a `Return` block, but `freeTextInput` is not enabled on that cards block (unlike earlier steps). A customer who types instead of clicking gets stuck in the generic invalid-input retry loop with no way out.
**Fix type:** Flow.
**Recommended fix:** Enable `freeTextInput` on all contact-options cards groups (`g_mlf_contact_cards`, `_aventura`, `_miami`, `_boca`) and route it the same way as Skip, for consistency with every other step in the flow.

### 4. Cold start ~40 seconds, no loading indicator
Not a flow issue — runtime/container behavior (cold container start and/or missing loading state in the embed).
**Fix type:** Needs investigation (infra/runtime, separate from this doc's scope). Reproduce with cold container timing and check embed's initial-load state.

### 5. Occasion → "Other" opens a blank text field
`Design Preference → Other` (`eyn666u42kfonyoq5z0mxe4u`) correctly re-shows a localized text bubble before its input. `Occasion → Other` (`mln35owz6ct9nkrkqiiqm25s`) is just a bare `text input` block with nothing before it.
**Fix type:** Flow.
**Recommended fix:** Add the same localize-Code + text-bubble pattern to `Occasion → Other`, reusing `localized_occasion_question` (already computed upstream in `Occasion Question`).

### 6. Price formatting `$205.0` / `$305.0`, and $0 items shown
`Fetch Products` (`cmc1gr0001fetch`) writes Shopify's raw `price.amount` string (e.g. `"205.0"`) straight into `product_catalog`, unformatted. The AI Selection prompt is told not to modify catalog fields, so the raw value passes through untouched to both the card's price line (`descriptionKey: "price"` in `packages/bot-engine/src/blocks/cards/injectVariableValuesInCardsBlock.ts`, no formatting logic there) and the model's own prose.
**Fix type:** Flow (single point of fix).
**Recommended fix:** In the `Fetch Shopify Products` code block, format price as `'$' + Number(amount).toFixed(2)` and exclude `amount === 0` (excludes the "$0.00 Complimentary Voucher" item) at the source — fixes card display and AI text together.

---

## High priority

### 7. Agent invents operational facts (delivery, hours, etc.)
`AI Selection`'s system prompt has no guardrail language for delivery, cut-off times, hours, payment, or refunds — it answers conversationally on any topic.
**Fix type:** Flow.
**Recommended fix:** Add an explicit instruction: these topics must defer to human handoff, never be answered from the model or catalogue data.

### 8. Valid free-text answers rejected; silent escalation
`Validate custom occasion` (`g_mlf_validate_occasion`) is not AI-based — it's a hardcoded per-language keyword whitelist (English list has `birthday, anniversary, wedding, ...` but no `gift`), so "a small inexpensive gift under $100" fails outright. After 2 failures it `Jump`s straight to handoff (`g_mlf_proactive_handoff_jump_occasion`) with no acknowledgement of what happened. Notably `g_mlf_catalog_guard` (off-topic filter elsewhere in the same flow) does use an AI classifier — this validator is inconsistent with that pattern.
**Fix type:** Flow.
**Recommended fix:** Either broaden the term lists substantially or switch this validator to the same AI-classification approach as `g_mlf_catalog_guard`; have the pre-handoff message acknowledge the difficulty instead of abruptly pivoting topic. Same applies to `g_mlf_validate_design`.

### 9. Answered cards lose buttons and line-clamp
Confirmed component bug, not a flow issue. In `packages/embeds/js/src/components/bubbles/GuestBubble.tsx`, `CardSnapshotsRow` (the row of other cards echoed back after answering) renders title/description with no path buttons at all and no `line-clamp` classes — those only exist on the live `CardsCaroussel.tsx`. `CardSnapshotGuestBubble` (the selected-card echo) keeps other paths but renders link-type ones as disabled-looking `<div>`s, also with no line-clamp.
**Fix type:** Code — `packages/embeds/js/src/components/bubbles/GuestBubble.tsx`.
**Recommended fix:** Port `line-clamp-2`/`line-clamp-3` classes into both snapshot renderers, and keep link-type paths as working `<a>` links (matching `CardsCaroussel.tsx`) instead of disabled `<div>`s.

### 10. Flow ends dead after the checkout link
`Checkout Card` group ends on a thank-you text bubble with no outgoing content — no "anything else?", no restart, composer disappears.
**Fix type:** Flow.
**Recommended fix:** Add a follow-up prompt with a restart/continue-shopping path after `localized_checkout_thanks`.

### 11. No "No thanks" option at the upsell step — needs re-verification
The flow config actually already has a `skipButton` with label "No thanks" on `Show Card Options Addon` (`e3qcuqdqch2ywooq9plzjxhw`). This looks like the same rendering issue as #9 rather than a missing flow option.
**Fix type:** Re-test after #9 is fixed; not a separate flow change unless re-testing shows otherwise.

### 12. No Yes/No buttons for "want to see cheaper options?"
That's prose generated by the AI Selection structured-output reply, never a real button block.
**Fix type:** Flow.
**Recommended fix:** Largely resolved by #1 (hard budget filtering makes this a rare edge case). If kept, needs a real conditional `choice input` (Yes/No) after the AI flags a budget overage, driven by a structured `exceeds_budget` boolean from the model.

---

## Medium

| # | Finding | Root cause | Fix type | Notes |
|---|---|---|---|---|
| 13 | Cards not sorted by price | Cards render in whatever order the LLM returns them | Flow | Add explicit sort before the cards step |
| 14 | Placeholder "I'd like to see...." is English, has 4 dots | Confirmed hardcoded in `Show Card Options` (`lh2mtajvv13drs0y3676ka8m`), not localized | Flow | Localize via `preset_translations`, fix to 3 dots |
| 15 | Header line truncated, no tooltip | Not yet root-caused | Code (likely) | Needs a look at `ChatHeader` styling |
| 16 | VIEW FULL not centered (text-align: start) | `CardsCaroussel.tsx`'s link-type paths already have `flex items-center justify-center` in `sharedClass` — needs live/visual re-check, may be a CSS specificity issue with the raw `<a>` tag | Code (likely) | Needs browser verification |
| 17 | Phone numbers unformatted; confirm Aventura area code | Confirmed raw `tel:+19548748383` etc. in `Contact Options` | Flow (formatting) + business input (area code) | 954 is Broward, not Miami-Dade — confirm with client |
| 18 | WhatsApp link has no pre-filled message / UTM | Confirmed, static `https://wa.me/...` link with no query params | Flow | Add `?text=` and UTM params |
| 19 | Call-us dropdown doesn't close on Escape | Not yet root-caused | Code | |
| 20 | Duplicate `startChat` POST per page load | Not yet root-caused | Code | `packages/embeds/js/src/queries/startChatQuery.ts`, `Bot.tsx` |
| 21 | Some answers arrive as two bubbles | Not yet root-caused | Flow or Code | |
| 22 | Non-deterministic recommendations | No fixed sort/tie-break, LLM-driven selection with no temperature pinned | Flow | Add deterministic sort + consider temperature setting on the OpenRouter action |
| 23 | Mobile responsiveness unverified, fixed 400×662 panel | Not yet root-caused | Code (likely) | Needs a real-device check |
| 24 | Sympathy/Get Well still offers "Red and romantic"/"Tropical and lush" | Confirmed — `Design Preference Question` options are static regardless of occasion | Flow | Add a Condition branch to vary design options by occasion |
| 25 | Hebrew register mix; RU/UK "Flexible" wording | Translation wording only | Flow | RU/UK `budget_flexible` already mid-edit in `scratch_preset_translations.txt` — swap to QA's suggested phrasing |

---

## Confirmed working (no action needed)
Stock filtering, product link UTMs, full 5-language translation coverage, prompt-injection resistance, gibberish rejection, active-card alignment, session restore on reload, cart creation + checkout link.

## Incidental finding (not in QA report)
`Add to cart` group `pju52msg5m80h90ypb52xg8u` hardcodes a specific test product ("Lovely Face Collection") into `selected_product` — but it has **zero incoming edges**, so it's dead/orphaned, not reachable in the live flow (the real path is `pj64dqa1a8jykk0piamy7m61`). Safe to delete for hygiene; not urgent.

---

## Next steps
25 items is too much to spec and implement in one pass. Proposed batching, in priority order:

1. **Blockers, flow-only** (1, 2, 3, 5, 6) — no deploy needed, closes the items the client called out as launch-blocking fastest.
2. **High-priority, flow-only** (7, 8, 10, 12) — same, plus re-verify #11 once #9 ships.
3. **Code fix** (9) — `GuestBubble.tsx` line-clamp + button fix, since it's shared UI affecting every bot, not just this one.
4. **Medium, flow-only** (13, 14, 17 formatting, 18, 22, 24, 25).
5. **Needs more investigation before scoping** (4, 15, 16, 19, 20, 21, 23) — each needs a quick root-cause pass before it can get a fix estimate.
6. **Needs client input, not a bug fix** (17 area code confirmation, 23 real-device recording).

Each batch should get its own spec added under `## Active Specs` in `CLAUDE.md` before implementation starts, per the project's normal workflow.
