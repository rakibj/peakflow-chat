# Maison la Fleur v23 — QA Review & Fix Plan

**Status:** Implemented (v24 batch), awaiting user testing. See [CLAUDE.md](./CLAUDE.md#active-specs) Active Specs for the implementation summary and file references. Per-item status notes added inline below.
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
**Status:** ✅ Fixed (in client's v24 export, prior to this session) — brackets updated, hard filter + ascending sort added in `Preprocess Data`.

### 2. "Invalid message. Please, try again." not localized
Bot `settings.general` has no `systemMessages` block, so it falls through to the hardcoded English default in `packages/settings/src/constants.ts:33`. The engine already interpolates variables here (`packages/bot-engine/src/continueBotFlow.ts:792-797`).
**Fix type:** Flow.
**Recommended fix:** Add a `localized_invalid_message` computed variable (same pattern as every other `localized_*` var) and set `settings.general.systemMessages.invalidMessage` to `{{localized_invalid_message}}`.
**Status:** ✅ Fixed (in client's v24 export, prior to this session).

### 3. Dead end at the handoff step
`Contact Options` (`g_mlf_contact_cards`) has a "Skip"/"Continue conversation" button wired to a `Return` block, but `freeTextInput` is not enabled on that cards block (unlike earlier steps). A customer who types instead of clicking gets stuck in the generic invalid-input retry loop with no way out.
**Fix type:** Flow.
**Recommended fix:** Enable `freeTextInput` on all contact-options cards groups (`g_mlf_contact_cards`, `_aventura`, `_miami`, `_boca`) and route it the same way as Skip, for consistency with every other step in the flow.
**Status:** ✅ Fixed (in client's v24 export, prior to this session).

### 4. Cold start ~40 seconds, no loading indicator
Not a flow issue — runtime/container behavior (cold container start and/or missing loading state in the embed).
**Fix type:** Needs investigation (infra/runtime, separate from this doc's scope). Reproduce with cold container timing and check embed's initial-load state.
**Status:** ⬜ Unresolved — explicitly left untouched (out of scope for the v24 batch).

### 5. Occasion → "Other" opens a blank text field
`Design Preference → Other` (`eyn666u42kfonyoq5z0mxe4u`) correctly re-shows a localized text bubble before its input. `Occasion → Other` (`mln35owz6ct9nkrkqiiqm25s`) is just a bare `text input` block with nothing before it.
**Fix type:** Flow.
**Recommended fix:** Add the same localize-Code + text-bubble pattern to `Occasion → Other`, reusing `localized_occasion_question` (already computed upstream in `Occasion Question`).
**Status:** ✅ Fixed (in client's v24 export, prior to this session).

### 6. Price formatting `$205.0` / `$305.0`, and $0 items shown
`Fetch Products` (`cmc1gr0001fetch`) writes Shopify's raw `price.amount` string (e.g. `"205.0"`) straight into `product_catalog`, unformatted. The AI Selection prompt is told not to modify catalog fields, so the raw value passes through untouched to both the card's price line (`descriptionKey: "price"` in `packages/bot-engine/src/blocks/cards/injectVariableValuesInCardsBlock.ts`, no formatting logic there) and the model's own prose.
**Fix type:** Flow (single point of fix).
**Recommended fix:** In the `Fetch Shopify Products` code block, format price as `'$' + Number(amount).toFixed(2)` and exclude `amount === 0` (excludes the "$0.00 Complimentary Voucher" item) at the source — fixes card display and AI text together.
**Status:** ✅ Fixed (in client's v24 export, prior to this session).

---

## High priority

### 7. Agent invents operational facts (delivery, hours, etc.)
`AI Selection`'s system prompt has no guardrail language for delivery, cut-off times, hours, payment, or refunds — it answers conversationally on any topic.
**Fix type:** Flow.
**Recommended fix:** Add an explicit instruction: these topics must defer to human handoff, never be answered from the model or catalogue data.
**Status:** ✅ Fixed (this session) — guardrail paragraph added to both AI Selection system prompts; `ev_mlf_interruption` trigger list updated to hand off on direct delivery-cutoff/hours/payment/refund questions instead of excluding them.

### 8. Valid free-text answers rejected; silent escalation
`Validate custom occasion` (`g_mlf_validate_occasion`) is not AI-based — it's a hardcoded per-language keyword whitelist (English list has `birthday, anniversary, wedding, ...` but no `gift`), so "a small inexpensive gift under $100" fails outright. After 2 failures it `Jump`s straight to handoff (`g_mlf_proactive_handoff_jump_occasion`) with no acknowledgement of what happened. Notably `g_mlf_catalog_guard` (off-topic filter elsewhere in the same flow) does use an AI classifier — this validator is inconsistent with that pattern.
**Fix type:** Flow.
**Recommended fix:** Either broaden the term lists substantially or switch this validator to the same AI-classification approach as `g_mlf_catalog_guard`; have the pre-handoff message acknowledge the difficulty instead of abruptly pivoting topic. Same applies to `g_mlf_validate_design`.
**Status:** ✅ Fixed (this session) — added "gift"/"present" (+ translated equivalents) to the occasion term whitelist (confirmed the QA repro case "a small inexpensive gift under $100" now validates); added an acknowledgement bubble before both proactive-handoff jumps instead of a silent pivot.

### 9. Answered cards lose buttons and line-clamp
Confirmed component bug, not a flow issue. In `packages/embeds/js/src/components/bubbles/GuestBubble.tsx`, `CardSnapshotsRow` (the row of other cards echoed back after answering) renders title/description with no path buttons at all and no `line-clamp` classes — those only exist on the live `CardsCaroussel.tsx`. `CardSnapshotGuestBubble` (the selected-card echo) keeps other paths but renders link-type ones as disabled-looking `<div>`s, also with no line-clamp.
**Fix type:** Code — `packages/embeds/js/src/components/bubbles/GuestBubble.tsx`.
**Recommended fix:** Port `line-clamp-2`/`line-clamp-3` classes into both snapshot renderers, and keep link-type paths as working `<a>` links (matching `CardsCaroussel.tsx`) instead of disabled `<div>`s.
**Status:** ✅ Fixed (this session) — `line-clamp-2`/`line-clamp-3` added to both renderers in `GuestBubble.tsx`. Link-path rendering was already correct on inspection (contrary to this note) — no change needed there.

### 10. Flow ends dead after the checkout link
`Checkout Card` group ends on a thank-you text bubble with no outgoing content — no "anything else?", no restart, composer disappears.
**Fix type:** Flow.
**Recommended fix:** Add a follow-up prompt with a restart/continue-shopping path after `localized_checkout_thanks`.
**Status:** ✅ Fixed (this session) — added a "Would you like anything else?" choice input after the thanks message; "Shop for more" jumps back to Occasion Question, "No thanks" falls through to a closing message.

### 11. No "No thanks" option at the upsell step — needs re-verification
The flow config actually already has a `skipButton` with label "No thanks" on `Show Card Options Addon` (`e3qcuqdqch2ywooq9plzjxhw`). This looks like the same rendering issue as #9 rather than a missing flow option.
**Fix type:** Re-test after #9 is fixed; not a separate flow change unless re-testing shows otherwise.
**Status:** ⬜ Needs re-test now that #9 is fixed — not independently verified this session.

### 12. No Yes/No buttons for "want to see cheaper options?"
That's prose generated by the AI Selection structured-output reply, never a real button block.
**Fix type:** Flow.
**Recommended fix:** Largely resolved by #1 (hard budget filtering makes this a rare edge case). If kept, needs a real conditional `choice input` (Yes/No) after the AI flags a budget overage, driven by a structured `exceeds_budget` boolean from the model.
**Status:** ✅ Closed, no change — #1's hard budget filtering (already shipped) makes this a rare edge case; existing prose disclosure is sufficient.

---

## Medium

| # | Finding | Root cause | Fix type | Notes | Status |
|---|---|---|---|---|---|
| 13 | Cards not sorted by price | Cards render in whatever order the LLM returns them | Flow | Add explicit sort before the cards step | ✅ Fixed (client's v24 export) |
| 14 | Placeholder "I'd like to see...." is English, has 4 dots | Confirmed hardcoded in `Show Card Options` (`lh2mtajvv13drs0y3676ka8m`), not localized | Flow | Localize via `preset_translations`, fix to 3 dots | ✅ Fixed (this session) |
| 15 | Header line truncated, no tooltip | Not yet root-caused | Code (likely) | Needs a look at `ChatHeader` styling | ✅ Fixed (this session) — `title` tooltips added to truncating spans |
| 16 | VIEW FULL not centered (text-align: start) | `CardsCaroussel.tsx`'s link-type paths already have `flex items-center justify-center` in `sharedClass` — needs live/visual re-check, may be a CSS specificity issue with the raw `<a>` tag | Code (likely) | Needs browser verification | ✅ Fixed (this session) — added explicit `text-center`; still worth a visual re-check |
| 17 | Phone numbers unformatted; confirm Aventura area code | Confirmed raw `tel:+19548748383` etc. in `Contact Options` | Flow (formatting) + business input (area code) | 954 is Broward, not Miami-Dade — confirm with client | ✅ Fixed (this session) — display formatting added in `ChatHeader.tsx`; area code confirmed correct by client, no change |
| 18 | WhatsApp link has no pre-filled message / UTM | Confirmed, static `https://wa.me/...` link with no query params | Flow | Add `?text=` and UTM params | ✅ Fixed (this session) — `utm_source=chatagent` + prefilled text |
| 19 | Call-us dropdown doesn't close on Escape | Not yet root-caused | Code | | ✅ Fixed (this session) — Escape keydown listener added |
| 20 | Duplicate `startChat` POST per page load | Not yet root-caused | Code | `packages/embeds/js/src/queries/startChatQuery.ts`, `Bot.tsx` | ⚠️ Guard added (this session) as defense-in-depth; root cause not conclusively pinned down — needs network-tab verification |
| 21 | Some answers arrive as two bubbles | Not yet root-caused | Flow or Code | | ⬜ Unresolved — explicitly left untouched |
| 22 | Non-deterministic recommendations | No fixed sort/tie-break, LLM-driven selection with no temperature pinned | Flow | Add deterministic sort + consider temperature setting on the OpenRouter action | ✅ Fixed (this session) — `temperature: 0.2` on both AI Selection blocks |
| 23 | Mobile responsiveness unverified, fixed 400×662 panel | Not yet root-caused | Code (likely) | Needs a real-device check | ⬜ Unresolved — explicitly left untouched |
| 24 | Sympathy/Get Well still offers "Red and romantic"/"Tropical and lush" | Confirmed — `Design Preference Question` options are static regardless of occasion | Flow | Add a Condition branch to vary design options by occasion | ✅ Fixed (this session) — new Condition branch + sympathy-specific design group |
| 25 | Hebrew register mix; RU/UK "Flexible" wording | Translation wording only | Flow | RU/UK `budget_flexible` already mid-edit in `scratch_preset_translations.txt` — swap to QA's suggested phrasing | ⚠️ RU/UK fixed (this session); Hebrew register mix not independently re-verified |

---

## Confirmed working (no action needed)
Stock filtering, product link UTMs, full 5-language translation coverage, prompt-injection resistance, gibberish rejection, active-card alignment, session restore on reload, cart creation + checkout link.

## Incidental finding (not in QA report)
`Add to cart` group `pju52msg5m80h90ypb52xg8u` hardcodes a specific test product ("Lovely Face Collection") into `selected_product` — but it has **zero incoming edges**, so it's dead/orphaned, not reachable in the live flow (the real path is `pj64dqa1a8jykk0piamy7m61`). Safe to delete for hygiene; not urgent.

---

## Next steps

All batches implemented except where noted. Remaining work:

1. **Re-import and test** `builds/maison-lefleur-agent-v24-fixed.json` in the builder, then re-publish and run through the original 5-language × 8-occasion × 7-design × 4-budget QA matrix (or a representative subset) to confirm the fixes hold up live.
2. **Re-verify #11** (upsell "No thanks" button) now that #9's line-clamp fix has shipped — the QA doc suspected #11 was never a real bug, just #9's rendering issue.
3. **Verify #20** (duplicate startChat POST) in the browser network tab — the guard added this session is defense-in-depth, not a confirmed root-cause fix.
4. **#4, #21, #23 remain unresolved** — cold start/loading indicator, double-bubble answers, and mobile responsiveness were explicitly left out of this batch and still need a root-cause pass.
5. Once live-tested and approved, condense this doc's findings into a one-liner under `## Shipped Features` in `CLAUDE.md`, per the project's normal workflow.
