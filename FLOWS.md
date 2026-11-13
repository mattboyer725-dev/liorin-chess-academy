# Staged learning QA

## Existing flows
- Learning hub: six lesson cards; open a lesson on the teaching board.
- Teaching board: select a legal move, see the tutor response, reset the board.
- Main navigation: command, play, learn, 2700, hunt, agents, recaps, studio and charter load.
- No production database or real sign-in is used in local testing.

## Requested change
- Experimental learning is hidden unless VITE_ADAPTIVE_LEARNING=true.
- Enable local lesson suggestions; open the recommended lesson; return and rate it.
- Explicit helpful/not-helpful feedback changes scores exactly once per suggestion.
- Reload retains aggregate preferences when browser storage is available.
- Disable restores non-learning behavior. Forget removes only this app's preferences.
- Corrupt or unavailable storage fails safely; no student identifiers or game moves are stored.
- Check desktop and 375px mobile, keyboard controls, and browser errors.

## Baseline limitations
- npm test fails before edits on missing .grok skill reference fixtures.
- External provider authentication and production database writes are excluded.
