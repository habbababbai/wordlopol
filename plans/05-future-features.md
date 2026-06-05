# Phase 4+ — Future Features

Deferred scope. Documented for planning only.

## Timed mode

**Goal**: 5 minutes to guess as many words as possible.

### Backend

- New `GameMode`: `TIMED`
- `POST /timed/start` — begin session, return first word
- `POST /timed/guess` — validate; on win, return next word immediately
- `POST /timed/end` — finalize when timer expires
- Update `UserStats`: `bestTimedWords`, `bestTimedMs`, `bestTimedWord`

### Frontend

- Countdown timer (5:00)
- Rapid word transitions on correct guess
- End screen: words guessed, time used
- Profile shows personal best only (no leaderboard)

## Multiplayer lobbies (up to 4 players)

**Goal**: Synchronous rounds where all players must submit a guess before the round resolves.

### Backend

- WebSocket server (e.g. `ws` or Socket.io on same Express app)
- `Lobby` model: id, host, players (max 4), status
- Round flow:
  1. Host creates lobby, others join
  2. Server picks word for round
  3. All players submit guess (hidden until all ready)
  4. Reveal results simultaneously
  5. Next round or end game

### Frontend

- Lobby create/join UI
- Waiting state: "2/4 players submitted"
- Side-by-side or tabbed result grids

### Considerations

- Reconnection handling
- Idle timeout
- No global leaderboard — optional per-lobby scores only

## React Native + Expo (`apps/mobile`)

### Setup

```bash
# Future scaffold
apps/mobile/   # Expo SDK 52+
```

### Shared code

- Import `@wordlopol/shared` for guess logic and types
- Same REST API as web
- Secure token storage: `expo-secure-store`

### Platform differences

- Native Polish keyboard vs custom on-screen keyboard
- Deep links for email verification / password reset
- Push notifications (optional, later)

## Not planned for v1

- OAuth / social login
- Public leaderboards
- Public user profiles
- Paid tiers / ads
