# SonGuess Codebase Audit & Fixes Specification

**Date:** 2026-11-01  
**Project:** SonGuess (Real-time Multiplayer Music Trivia Battle)  
**Status:** All Audit Issues Resolved & Verified  
**Stack:** NestJS, TypeScript, Socket.IO, PostgreSQL (Prisma), Redis, React 19, Redux Toolkit, Vite

---

## Executive Summary
A comprehensive audit of both backend and frontend systems was executed, covering security vulnerabilities, network protocols, game state synchronization, edge-case arithmetic, localization, and UI/UX behaviors. All discovered defects have been resolved, and both the backend (`npm run build`) and frontend (`vite build` + `tsc --noEmit`) compile cleanly with zero errors.

---

## 1. Group A: Critical Gameplay & Game Logic Fixes

### 1.1 WebSocket Room State Leak (Cheating Vulnerability)
- **Problem:** When clients connected or requested the room state (`getCurrentRoom`, `joinRoom`, `playerDisconnected`), the raw `room` object was transmitted over WebSockets. Because `room.gameProgress.rounds` contained all 10 rounds' track answers, any client inspecting the Network/WS tab could read all upcoming correct song titles.
- **Root Cause:**
  - `backend/src/game/gateways/room/room-control.gateway.ts`: `handleGetCurrentRoom` emitted raw `room`.
  - `backend/src/game/gateways/room/room-lobby.gateway.ts`: `handleJoinRoom` and `handleAutoJoin` emitted raw `room`.
  - `backend/src/game/services/room/room-helper.service.ts`: `scheduleLeaderReassignment` emitted raw `room` on `playerDisconnected`.
- **Fix:** Integrated `sanitizeRoom(room)` across all room emission endpoints. `sanitizeRoom` completely strips `gameData` and round answers, keeping only `totalScores` and `currentRound`.
- **Files Modified:**
  - `backend/src/game/gateways/room/room-control.gateway.ts`
  - `backend/src/game/gateways/room/room-lobby.gateway.ts`
  - `backend/src/game/services/room/room-helper.service.ts`

---

### 1.2 3-Track Game Crash (`pickRandomWrongOptions` Underflow)
- **Problem:** Starting a room game with 3 tracks caused the backend server to crash with `TypeError: Cannot read properties of undefined (reading 'title')`.
- **Root Cause:** In `backend/src/utils/array.ts`, `pickRandomWrongOptions(tracks, correctId, count = 3)` filtered out the correct track into `available` (length = 2). The loop counter decremented into negative index (`-1`), swapping `available[-1]` with `available[0]`. Slicing `-3` produced an array containing `undefined`, causing `.map((t) => t.title)` to throw an unhandled exception.
- **Fix:**
  - Rewrote `pickRandomWrongOptions` using `shuffleArray(available)` and clamping slice count to `Math.min(count, available.length)`. It now gracefully handles any track pool size without index underflow or mutations.
  - In `backend/src/game/services/gameplay/gameplay.service.ts`, ensured `playableTracks.length >= 4` is required for a 4-choice quiz game.
- **Files Modified:**
  - `backend/src/utils/array.ts`
  - `backend/src/game/services/gameplay/gameplay.service.ts`

---

### 1.3 Daily Challenge Flaws: Regex Truncation & Unpersisted Attempts
- **Problems:**
  1. Players could solve the daily challenge by entering only the artist's name or any other track by that artist.
  2. Refreshing (F5) during attempts 1–5 wiped all progress and reset the player to attempt 1.
- **Root Causes:**
  - In `backend/src/utils/gameplay/fuzzy-match.util.ts`, `normalizeText` executed `.replace(/-(?:\s*.*)/g, '')`, which stripped everything after the first hyphen. `fullExpected` ("Queen - Bohemian Rhapsody") collapsed into "queen".
  - In `isFuzzyMatch`, `if (normTitle.includes(normUser))` had no length ratio check, allowing 5-letter inputs to match 30-letter titles.
  - In `backend/src/daily/daily.service.ts`, non-terminal attempts (attempts 1–5) were never saved in Redis, only terminal attempts (success or attempt 6) were saved in PostgreSQL.
- **Fix:**
  - Removed `-(?:\s*.*)` from `normalizeText`. Metadata inside `()` and `[]` continues to be stripped cleanly, while hyphens are normalized to spaces.
  - Added a length ratio threshold (`ratio >= 0.7`) to substring matching in `isFuzzyMatch`.
  - Added Redis session persistence for ongoing daily challenges under `songuess:daily_attempts:${userId}:${dateStr}`.
  - Exposed `attemptsHistory` in `getDailyStatus` so refreshing restores all previous guesses.
- **Files Modified:**
  - `backend/src/utils/gameplay/fuzzy-match.util.ts`
  - `backend/src/daily/daily.service.ts`
  - `frontend/src/store/api/dailyApi.ts`
  - `frontend/src/pages/Game/DailyChallenge/DailyChallengePage.tsx`

---

### 1.4 TYPE_IN Mode: Fuzzy Score Mismatch & Hidden Answer
- **Problem:** In `TYPE_IN` mode, if a user made a minor typo or used different casing, the backend awarded points via fuzzy matching (`score > 0`), but the frontend compared strings with strict equality (`r.answer === correctAnswer`) and displayed a red "Incorrect" cross. In addition, when the round ended, the correct song title was never shown.
- **Root Cause:**
  - `frontend/src/hooks/Gameplay/useGameplayListeners.ts`: `isCorrect: r.answer === correctAnswer`.
  - `frontend/src/components/Game/Play/PlayingGame/RoundResult.tsx`: Only displayed status icons without the track name.
- **Fix:**
  - In `useGameplayListeners.ts`, updated `isCorrect` check to: `Boolean(r.isCorrect ?? (r.score > 0 || (r.answer && r.answer === correctAnswer)))`.
  - In `RoundResult.tsx`, added a neon-bordered revealed-answer banner displaying the correct track title at the end of each round.
- **Files Modified:**
  - `frontend/src/hooks/Gameplay/useGameplayListeners.ts`
  - `frontend/src/components/Game/Play/PlayingGame/RoundResult.tsx`
  - `frontend/src/components/Game/Play/PlayingGame.module.css`

---

### 1.5 Audio Synchronization & Distinct Mode Architecture (Classic vs. Heardle)
- **Problem & Root Cause Analysis:**
  - **The Collision:** Previously, `useAudioPlayer` relied solely on `Boolean(maxPlayDuration)` to decide audio behavior. However, in `PlayingGame.tsx`, `effectiveMaxDuration` was passed as `roundDurationSec` (e.g. 25 seconds) even in `CLASSIC` and `DUEL` modes. Consequently, any generic attempt to treat `maxPlayDuration` as a snippet mode erroneously overrode standard real-time games, causing audio on F5 reload to restart at 0 seconds instead of the synchronized elapsed round time.
  - **Heardle Mode Requirements:** In `HEARDLE` mode, audio playback is progressive and intro-focused (1s -> 2s -> 5s -> 10s -> 20s). The player must hear the song from the opening note (`0s`) up to the unlocked snippet threshold, rather than jumping to elapsed wall-clock seconds. When expanding to the next tier or replaying, playback must rewind to `0s` and play the full unlocked snippet before auto-pausing.
- **Architectural Solution:**
  1. **Explicit Mode Separation (`isHeardle`):**
     - `PlayingGame.tsx` computes `const isHeardle = gameMode === 'HEARDLE';` and explicitly forwards `isHeardle` through `AudioPlayer.tsx` down to `useAudioPlayer.ts`.
  2. **CLASSIC and DUEL Modes (`isHeardle === false`):**
     - Full synchronization with the room's round clock is strictly preserved:
       ```ts
       const playbackStartTime = calculateStartTime(startedAt);
       ```
     - On page reload (F5) or autoplay gesture resume, the player seeks to the exact elapsed second minus network latency compensation (`calculateStartTime`), accompanied by post-start micro-correction. Audio continues playing in lockstep across all multiplayer clients without restarting.
  3. **HEARDLE Mode (`isHeardle === true`):**
     - Starts playback at second `0` up to `unlockedSeconds`.
     - When `audio.currentTime >= maxPlayDuration`, the audio pauses and rewinds `audio.currentTime = 0`.
     - When the player unlocks a higher tier (e.g., 1s -> 2s), `useAudioPlayer` resets `currentTime = 0` and auto-plays the full expanded snippet from the beginning.
     - Added a `replayTrigger` pipeline and an interactive "↺ Слухати уривок" button in `HeardleControls.tsx` allowing players to re-listen to the unlocked snippet anytime before submitting an answer.
- **Files Modified:**
  - `frontend/src/hooks/useAudioPlayer.ts`
  - `frontend/src/components/Game/Play/PlayingGame/AudioPlayer.tsx`
  - `frontend/src/components/Game/Play/PlayingGame.tsx`
  - `frontend/src/components/Game/Play/PlayingGame/HeardleControls.tsx`

---

### 1.6 Frontend Reconnect / F5 Room Bounce & Single-Listener Socket Overwrite
- **Problem:** Pressing F5 during an active game ejected the user back to the `/game` lobby page. Furthermore, different components listening to the same WebSocket events (e.g. `duelMatchFound`) would overwrite each other's listeners.
- **Root Cause:**
  - In `frontend/src/services/socket/socketHandlers.ts`, `SocketHandlers` stored callbacks in a single `Map<string, Callback>`. Adding a second listener for any event disconnected and replaced the first one.
  - In `frontend/src/hooks/GameRoom/useGameRoomListeners.ts`, `handleJoinedRoom` navigated to `/game/${data.id}` without dispatching `setCurrentRoom(...)` when `data.state !== RoomState.ADDING`.
  - In `frontend/src/pages/Game/Gameplay.tsx`, `if (!currentRoom)` immediately triggered `<Navigate to="/game" replace />` on the first millisecond before the socket could re-identify the room.
- **Fix:**
  - Refactored `SocketHandlers` to use a `Map<string, Set<Callback>>` pattern, supporting multiple concurrent listeners across independent hooks and components.
  - In `useGameRoomListeners.ts`, ensured `setCurrentRoom(mapBackendRoomToFrontend(data))` is always dispatched before navigation.
  - In `Gameplay.tsx`, added a 3-second grace period with a full-screen Cyberpunk loader while reconnecting to the room via `joinRoom` / `getCurrentRoom`.
- **Files Modified:**
  - `frontend/src/services/socket/socketHandlers.ts`
  - `frontend/src/hooks/GameRoom/useGameRoomListeners.ts`
  - `frontend/src/pages/Game/Gameplay.tsx`

---

### 1.7 Spotify Playlist Import Integration
- **Problem:** Pasting a Spotify playlist URL resulted in Deezer searching for a hardcoded `'top hits playlist'` and serving unrelated pop tracks.
- **Fix:** Added Spotify oEmbed metadata resolution (`https://open.spotify.com/oembed?url=...`). The backend retrieves the exact title of the Spotify playlist (e.g., "Top 50 Ukrainian", "Classic Rock 80s") and searches Deezer for that title to retrieve the matching tracks.
- **Files Modified:**
  - `backend/src/deezer/deezer.service.ts`

---

## 2. Group B: Security & Backend Optimizations

### 2.1 CORS Bypass Fix
- **Problem:** In `backend/src/main.ts`, the CORS callback returned `callback(null, true)` regardless of whether `isAllowed` was true or false. Combined with `credentials: true`, this allowed any malicious third-party site to make authenticated requests with cookies.
- **Fix:** When `!isAllowed`, reject request with `callback(new Error(`Origin ${origin} not allowed by CORS`))`.
- **File Modified:** `backend/src/main.ts`

---

### 2.2 Public LiqPay Test Donation Exploitation
- **Problem:** `POST /api/liqpay/simulate-test` was annotated with `@Public()`, accepting any user ID without authentication and assigning VIP status and donor badges for free.
- **Fix:** Removed `@Public()`, enforced authentication, and added an explicit `process.env.NODE_ENV === 'production'` guard that throws `ForbiddenException`.
- **File Modified:** `backend/src/liqpay/liqpay.controller.ts`

---

### 2.3 Reusable Password Reset & Email Verification Tokens
- **Problem:** Password reset and email verification methods only checked JWT signature validity. Because tokens were not verified against the `prisma.token` database table, any generated token could be replayed repeatedly within its expiration window.
- **Fix:** Enforced a database lookup in `prisma.token` ensuring the token exists, belongs to the user, matches the type, and has not expired. The token is immediately deleted after single-use.
- **File Modified:** `backend/src/auth/auth.service.ts`

---

### 2.4 Abandoned Game Room Memory Leaks
- **Problem:** Rooms in `CREATING` or `STARTED` states with 0 online players were excluded from cleanup in `cleanUpRoomById` and remained in server memory indefinitely.
- **Fix:** Enabled cleanup for empty or all-offline rooms regardless of state, providing a 15-second grace period for in-game reconnects before disposing of room resources and clearing active timers.
- **File Modified:** `backend/src/game/services/room/room-helper.service.ts`

---

### 2.5 `CENTURION_100` Achievement Calculation
- **Problem:** Checked whether single-game score exceeded 5,000 points (`totalScore >= 5000`), which was impossible in standard 10-round games (max ~1,000 points).
- **Fix:** Aggregated cumulative player score and total games played from `prisma.gameScore`. Unlocks when total score exceeds 5,000 or games played exceeds 10 (100 rounds).
- **File Modified:** `backend/src/game/services/gameplay/game-result.service.ts`

---

### 2.6 Database Index Optimizations
- **Problem:** Frequent queries on `Token`, `User`, `DailyResult`, and `GameScore` lacked targeted database indexes.
- **Fix:** Added Prisma indexes:
  - `Token`: `@@index([userId, type])`, `@@index([expiresAt])`
  - `User`: `@@index([record])`
  - `DailyResult`: `@@index([date])`
  - `GameScore`: `@@index([gameMode])`
- **File Modified:** `backend/prisma/schema.prisma` (synced via `prisma db push`)

---

## 3. Group C: Frontend UI/UX & TypeScript Corrections

### 3.1 Missing `footer` in `TranslationDictionary`
- **Problem:** `frontend/src/i18n/types.ts` lacked the `footer` definition, causing TypeScript compilation warnings against `uk.ts` and `en.ts`.
- **Fix:** Added comprehensive `footer` interface to `TranslationDictionary`.
- **File Modified:** `frontend/src/i18n/types.ts`

---

### 3.2 "ВИ ВИ" / "YOU YOU" Redundant Label in Final Scores
- **Problem:** In `PlayerCard.tsx`, both the player's name and the badge displayed "ВИ" / "YOU", rendering "ВИ ВИ".
- **Fix:** Preserved `player.login` for the player name and kept `miniYouBadge` for the "(ВИ)" indicator.
- **File Modified:** `frontend/src/components/Game/GameFinished/components/FinalScores/PlayerCard.tsx`

---

### 3.3 "Спробаs" Ukrainian Localization Grammar Bug
- **Problem:** Line 434 of `DailyChallengePage.tsx` concatenated `'s'` directly onto the localized string: `{t('daily.attempt')}s` -> `"Спробаs"`.
- **Fix:** Added `attemptsTitle` key to i18n ("Спроби" in Ukrainian, "Attempts" in English).
- **Files Modified:**
  - `frontend/src/i18n/types.ts`
  - `frontend/src/i18n/locales/uk.ts`
  - `frontend/src/i18n/locales/en.ts`
  - `frontend/src/pages/Game/DailyChallenge/DailyChallengePage.tsx`

---

### 3.4 Missing Other Users Profile Page (`/user/:id`)
- **Problem:** Navigating to another user's profile (`/user/:id`) rendered a blank stub `<div>OtherUsersPage</div>`.
- **Fix:** Built a complete profile page utilizing `useGetUserByIdQuery` and `useGetUserAchievementsQuery`, displaying avatar, stats, VIP status, cosmetics, achievements showcase, and a navigation back button.
- **Files Modified:**
  - `frontend/src/pages/Users/OtherUsersPage.tsx`
  - `frontend/src/components/user/UserInfoSection.tsx`
  - `frontend/src/components/user/AchievementsShowcase.tsx`

---

### 3.5 Type Consistency for `Player.nameColor`
- **Problem:** `PodiumCard.tsx`, `PlayerCard.tsx`, and `FinalScores.tsx` redefined `interface Player` with `nameColor?: string`, conflicting with `roomTypes.ts` (`nameColor?: string | null`).
- **Fix:** Standardized components to import `Player` directly from `types/roomTypes.ts`.
- **Files Modified:**
  - `frontend/src/components/Game/GameFinished/components/FinalScores.tsx`
  - `frontend/src/components/Game/GameFinished/components/FinalScores/PodiumCard.tsx`
  - `frontend/src/components/Game/GameFinished/components/FinalScores/PlayerCard.tsx`

---

### 3.6 Heardle Mode: Snippet Tier Round Persistence & F5 Anti-Cheat Verification
- **Problem:**
  1. In Heardle mode, `unlockedSeconds` was held solely in component local state (`useState(1)` in `PlayingGame.tsx`).
  2. Clicking extra snippet tiers (1s -> 2s -> 5s -> 10s -> 20s) and refreshing the page (F5) reset the client's unlocked tier back to 1.
  3. This was both a confusing UX regression and a severe cheating vulnerability: a player could unlock 20s, identify the track, reload with F5, and submit under tier 1 to receive 500 maximum points instead of 100.
- **Fix:**
  1. **Frontend Persistence (`sessionStorage` + Redux):**
     - Initialized `unlockedSeconds` synchronously from `sessionStorage` (`songuess_heardle_${currentRoom.id}_${trackInfo.roundNumber}`) with fallback to Redux `heardleUnlockedTier`.
     - Preserved `hasAnswered` status across reloads (`songuess_answered_${currentRoom.id}_${trackInfo.roundNumber}`).
     - Cleaned up previous round keys on round transition.
     - Emitted `unlockHeardleSnippet` WebSocket event when unlocking higher tiers.
  2. **Backend Server-Side Tracking & Anti-Cheat Validation:**
     - Added `heardleUnlockedTiers: Record<number, Record<number, number>>` to `GameProgress` in `game-progress.interface.ts`.
     - Added `unlockHeardleSnippet` gateway subscriber in `gameplay.gateway.ts` and handler in `gameplay.service.ts`.
     - In `handleAnswer` in `gameplay.service.ts`, enforced `effectiveSnippetDuration = Math.max(recordedSnippet, snippetDurationUsed || 1)`. Cheating points via F5 downgrade is completely prevented.
     - In `round-sync.service.ts`, included `heardleUnlockedTier` in `reconnectToRound` event payload.
- **Files Modified:**
  - `backend/src/game/interfaces/game-progress.interface.ts`
  - `backend/src/game/gateways/gameplay.gateway.ts`
  - `backend/src/game/services/gameplay/gameplay.service.ts`
  - `backend/src/game/services/game/round-sync.service.ts`
  - `backend/src/utils/gameplay/fuzzy-match.spec.ts`
  - `frontend/src/types/socketEvents.ts`
  - `frontend/src/store/gameplay/types.ts`
  - `frontend/src/store/gameplay/gameplaySlice.ts`
  - `frontend/src/store/gameplay/gameplaySelectors.ts`
  - `frontend/src/hooks/Gameplay/useGameplayListeners.ts`
  - `frontend/src/components/Game/Play/PlayingGame.tsx`

---

### 3.7 Ukrainian Localization & Compact Gameplay Viewport Layout
- **Problem:**
  1. In the left column (`TotalScore.tsx`), `"🏆 Загальний рахунок"` wrapped into two lines due to `font-size: 24px` within a 310px column, awkwardly breaking the header and misaligning the badge.
  2. In `AnswerOptions.tsx`, an unstyled `<h1>` with browser-default 42px margins blew up vertical spacing.
  3. Combined with excessive container padding and margins (`28px` card padding, `32px` section bottom margin, `24px` audio control top margin, `40px` finish button top margin), the audio control pill was sliced in half at the bottom of the viewport on 1080p displays, pushing the "Покинути гру" button off-screen.
  4. In `PlayerRoundResults.tsx`, the Ukrainian string `"Запізнився з відповіддю"` (23 characters) overflowed the 220px player card's time badge.
- **Fix:**
  1. Updated `TotalScore.module.css` to `font-size: 18px` with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis;` so `"🏆 Загальний рахунок"` renders on a single balanced line.
  2. Replaced unstyled `<h1>` with `<h2 className={styles.gameTitle}>` in `AnswerOptions.tsx`, eliminating browser-default margins.
  3. Balanced vertical padding and margins in `PlayingGame.module.css` and `Gameplay.module.css` (`padding: 20px 22px; margin-bottom: 14px; margin-top: 14px; margin-top: 20px;`), ensuring the entire game board, audio player, and leave buttons fit within standard viewport bounds.
  4. Shortened `lateWithAnswer` in `uk.ts` to `"Час вичерпано"` and added `white-space: nowrap; max-width: 100%` to `.timeBadgeLate`.
  5. Added `flex-wrap: wrap; gap: 8px;` to `.heardleHeader` in `HeardleControls.module.css`.
- **Files Modified:**
  - `frontend/src/components/Game/Play/PlayingGame/TotalScore.module.css`
  - `frontend/src/components/Game/Play/PlayingGame/AnswerOptions.tsx`
  - `frontend/src/components/Game/Play/PlayingGame.module.css`
  - `frontend/src/pages/Game/Gameplay.module.css`
  - `frontend/src/components/Game/Play/PlayingGame/RoundTimer.module.css`
  - `frontend/src/components/Game/Play/PlayingGame/PlayerRoundResults.module.css`
  - `frontend/src/components/Game/Play/PlayingGame/HeardleControls.module.css`
  - `frontend/src/i18n/locales/uk.ts`

---

## 4. Verification & Build Status

| Component | Check | Result |
|---|---|---|
| Backend Prisma | `npx prisma db push` | Synced database schema & indexes |
| Backend NestJS | `npm run build` | Built with exit code 0 |
| Frontend Vite | `npm run build` | Built client bundles successfully in 1.09s |
| Frontend TypeScript | `npx tsc --noEmit` | 0 errors |


---

## 5. Audit Part 1 Completion & Part 2 Feature Rollout (2026-11-17)

### 5.1 Prisma Migration History Sync
- **Problem:** Only an outdated 2025 migration (`20250226121828_`) existed in `backend/prisma/migrations/`, while `DailyResult`, `GameScore`, `Achievement`, `UserAchievement`, `Donation`, and new `User` columns/indexes were only pushed via `prisma db push`.
- **Fix:** Generated incremental SQL migration `backend/prisma/migrations/20261117000000_sync_audit_schema/migration.sql` via `prisma migrate diff` and marked it applied with `prisma migrate resolve --applied` (`prisma migrate status` reports 2 migrations, schema up to date).

### 5.2 Real Spotify Playlist Import (Spotify → Deezer Bridge)
- **Fix:** Exported `SpotifyService` from `SpotifyModule`, imported `SpotifyModule` into `DeezerModule`, added `SpotifyService.getPlaylistById(playlistId)` fetching up to 50 tracks (title, artist, ISRC). In `DeezerService.parsePlaylistUrl`, Spotify playlists are matched track-by-track in Deezer (ISRC lookup first, then `artist:"..." track:"..."` search throttled with `pLimit(5)`), with automatic fallback to `oEmbed` title search if Spotify returns 404 (e.g. restricted editorial playlists) or < 4 playable tracks.
- **Files Modified:** `backend/src/spotify/spotify.module.ts`, `backend/src/spotify/spotify.service.ts`, `backend/src/deezer/deezer.module.ts`, `backend/src/deezer/deezer.service.ts`.

### 5.3 Clickable Public Profiles (`/user/:id`)
- **Fix:** Wired navigation from player names/avatars in Leaderboard (`LeaderboardPage.tsx`), Joined Lobby (`RoomPlayerList.tsx`), and Final Scores (`PodiumCard.tsx`, `PlayerCard.tsx`) to `/user/${id}` (or `/user/me` for the signed-in user).

### 5.4 `TYPE_IN` Mode Artist Match Hint
- **Fix:** In `GameplayService.handleAnswer`, if `answerMode === 'TYPE_IN'` and `isFuzzyMatch` returns `!isMatch && isArtistMatch`, the round submission is NOT locked out; instead `client.emit('artistMatchHint', { roundNumber, artistName })` is sent. On the frontend (`PlayingGame.tsx` + `TypeInAnswer.tsx`), the input unlocks immediately and shows a glowing amber banner prompting the player to enter the song title.

### 5.5 Daily Challenge Live Deezer Charts
- **Fix:** Added `DeezerService.getChartTracks(50)` and `DailyService.resolveTodayChallengePool(dayNumber, dateStr)` backed by Redis (`daily:challenge_pool:${dateStr}`, 24h TTL) to deterministically select daily tracks and options from live Deezer top charts, keeping `DAILY_TRACKS_BANK` as an offline fallback. Also fixed `submitGuess` existing-result streak in `generateShareText`.

### 5.6 Custom Round Count (`5 / 10 / 15 / 20`) & Mix Packs (Multi-Select)
- **Fix:** Added round count selector (`[5, 10, 15, 20]`) in `LobbyControls.tsx` and display in `CurrentRoom.tsx`, plus fixed `socketHandlers.off` callback references in `LobbyControls.tsx`. Added Mix Pack Basket mode in `CreatingGame.tsx` so room leaders can combine deduplicated playable tracks from multiple artists, playlists, albums, themes, or imported URLs into a single custom game pool.

### 5.7 Real-Time Emoji Reactions
- **Fix:** Added `sendReaction` WebSocket handler in `GameplayGateway` and `GameplayService.handleReaction` (whitelist `['🔥', '💀', '😭', '🎉', '🤔', '👏']`, 400ms cooldown) broadcasting `playerReaction`. Frontend renders a neon reaction bar in `PlayingGame.tsx` and floating animated emoji badges over player avatars in `TotalScore.tsx`.


---

## 6. Deep Security Audit Fixes — Critical Batch (Items 1–8)

1. **Public Profile Email PII Leak (`GET /api/user/:id`):** Removed `email` from `UserService.getUserById` API payload (keeping an internal `isGuest` boolean for `RoomManagerService`) and hid the email row in `UserInfoSection.tsx` when `isReadOnly === true`.
2. **Stored SVG/XSS via Preset Avatars (`UserService.setPresetAvatar`):** Enforced strict allowlist lookup against `PRESET_AVATARS`; raw `data:image/svg+xml` payloads are now rejected with `BadRequestException`.
3. **Catalog Access Control (`SongsController`):** Added `AdminGuard` (`backend/src/common/guards/admin.guard.ts`) on `POST`, `PATCH`, and `DELETE /api/songs`, blocking guests and non-admin accounts.
4. **Avatar Upload Hardening (`UserController.updateAvatar` & `ImageService.uploadImage`):** Enforced 2 MB file size limit, MIME allowlist (`jpeg`, `png`, `webp`, `gif`), and binary magic-byte verification.
5. **LiqPay Callback Validation & IDOR (`LiqPayService` & `LiqPayController`):** Added idempotency guard (`donation.status === 'success'`), amount/currency/action verification in `processCallback`, minimum/maximum checkout validation, and removed `(dto as any).userId` fallback in `simulateTest`.
6. **WebSockets & CORS & Swagger Hardening:** Created shared `backend/src/common/config/cors.config.ts` applied to HTTP CORS and all 4 WebSocket gateways (`GameGateway`, `GameplayGateway`, `RoomControlGateway`, `RoomLobbyGateway`). Added `ValidationPipe` + `class-validator` rules on `GameplayGateway` (`SubmitAnswerDto`, `LaunchGameDto`) and disabled Swagger `/api/docs` in `production`.
7. **Auth Token & Enumeration Hardening (`AuthService`):** `refreshTokens` now verifies the user still exists in PostgreSQL; `sendTokenEmail` returns a generic success message for `PASSWORD_RESET` when the email does not exist.
8. **Daily Challenge Server-Side Attempt Tracking (`DailyService.submitGuess`):** Attempt count and score are now calculated server-side from Redis (`attemptsHistory.length + 1`) rather than trusting client-supplied `attempt`, and missing/deleted users return `UnauthorizedException`.


---

## 7. Deep Security Audit Fixes — Stability, Anti-Farm & Party Mode (Items 9–16)

9. **Solo & Guest Leaderboard Farming Prevention (`GameResultService.finishGame`):** `GameScore`, personal `record`, and achievements (`CENTURION_100`, `FIRST_WIN`, `DUEL_GLADIATOR`) are now recorded only for registered (non-guest) players in multiplayer rooms (`room.players.length >= 2`).
10. **Multi-Tab Socket Disconnect Protection (`ClientsRegistry` & `ConnectionService`):** `handleDisconnect` removes the closing socket first and checks `this.clients.getClientId(user.id)` — if another browser tab for that `userId` is still connected, the player stays online without triggering room cleanup or leader reassignment. `getClientId` returns the newest connected socket.
11. **Strict Cosmetics Validation (`UpdateCosmeticsDto`):** Enforced 6-digit HEX format `/^(#[0-9a-fA-F]{6})?$/` on `nameColor` and `@MaxLength(32)` on `customTitle`.
12. **Deleted-User Daily Guess Guard:** Handled via `UnauthorizedException` in `DailyService.submitGuess` (covered in Section 6.8).
13. **Party Mode TV Dynamic Round Timer (`PartyHostPage.tsx`):** Replaced hardcoded `25`s duration with `roundDurationRef` calculated from `payload.endsAt - startedAt` (or `room.lobbyOptions.roundDuration`), and omitted invalid `snippetDurationUsed: 0` in `PartyHostPage.tsx` and `PartyControllerPage.tsx`.
14. **Scoped Socket Listener Cleanup (`PartyHostPage.tsx` & `PartyControllerPage.tsx`):** Passed exact callback references to `socketHandlers.off(event, handler)` instead of wiping all shared listeners.
15. **Token Refresh Mutex (`customBaseQuery.ts`):** Added a shared `refreshPromise` lock so concurrent `401` responses trigger only one `/auth/refresh` call.
16. **Session Storage Cleanup (`clearRoomSessionStorage.ts`):** Cleared `songuess_heardle_${roomId}_*` and `songuess_answered_${roomId}_*` keys on `leaveRoom`, `deleteRoom`, kick, `gameEnded`, and `gameRestarted`.
