# LIORIN staged lesson learning

This is a separate integration branch. Do not merge or promote it automatically.
The default build hides the experiment; preview builds opt in with
`VITE_ADAPTIVE_LEARNING=true`. Each visitor then explicitly enables learning.

## Action and reward

The action suggests an existing lesson and opens its existing teaching board.
After trying it, the user returns to Learn and gives helpful (+1) or not helpful
(-1) feedback. This is a usefulness preference, not measured chess mastery.
The engine, legal moves, tutor and fair-play charter are unchanged.

The bounded bandit explores untried lessons first, then uses 10% random exploration
and an exponential score update: `q = q + 0.2 * (reward - q)`.
Suggestions alone, clicks, elapsed time and skips earn no reward.
An in-memory receipt permits at most one update per opened suggestion.
Reload discards pending receipts; it does not manufacture feedback.

## Privacy and limits

Only consent and aggregate lesson scores are stored under
`liorin:lesson-learning:v1` on the current browser. There are no network calls,
student identifiers, board states, keys, database changes, or cross-app sharing.
Disable invalidates pending feedback; forget deletes this namespace.
Storage failures fall back to volatile memory and are shown in the UI.
This pilot is single-browser/single-tab; concurrent tabs can overwrite aggregates.
Browser storage is neither signed nor an audit log. This is not the Python
vector optimizer, general intelligence, online engine training, or a credential store.

## Local verification

Use Node 24 to match the current Vercel project runtime.

```sh
npm ci --ignore-scripts
node --test scripts/learning-policy.test.mjs
npm run typecheck
VITE_ADAPTIVE_LEARNING=true npm run dev
```

Use no production DATABASE_URL for local work. The repository's existing
`npm run build` runs database migrations after compilation; do not run that
against production merely to test this experiment.
Compile without migration with `VITE_ADAPTIVE_LEARNING=true npx vite build`.

## Rollback

Leave master/production untouched. Close the staged PR to discard the experiment.
If later merged, unset the preview feature flag to hide it, or revert this commit.
No backend data migration or shared learner rollback is needed.

The staged branch disables its own automatic Vercel Git deployment in
`vercel.json`. Other branches retain their previous behavior. Deploy this preview
manually from the migration-free prebuilt output, with an empty `DATABASE_URL`
runtime override, so no production database is connected.

## Validation in this sandbox

- Six new policy tests pass; TypeScript and the targeted ESLint checks pass.
- Vite compilation succeeds without running the migration script.
- Auth invariant check passes with local sign-in disabled.
- Full Node script suite: 187 pass, 14 fail, versus 181 pass and the same
  14 failures before this change. The baseline failures concern missing legacy
  .grok fixtures/platform assets and an auth-schema fixture, not this adapter.
- Browser: opt-in, suggestion navigation, explicit reward, reload persistence,
  disable, forget, all primary navigation pages, lesson move and board reset.
- Desktop 1280px and mobile 375px inspected; no horizontal overflow or page errors
  observed in these flows.
- Installation reports 21 dependency vulnerabilities. No dependency upgrades
  or broad legacy repairs are included in this focused experiment.
- Production databases, real sign-in and remote live service writes were not tested.
