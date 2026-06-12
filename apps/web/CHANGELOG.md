# Changelog

## [1.0.0] — 2026-06-12

First playable web app for Wordlopol.

### Features

- **Home** — hero, feature cards, how-to-play; auth-aware CTAs
- **Daily** — full game UI; guest and registered play
- **Infinite** — sequential words for verified users
- **Auth** — login, register, verify email, forgot/reset password; silent session refresh
- **Account** — profile with stats; settings (display name, password/email, logout-all, delete account)
- **Game UX** — result modal on finish; optional typing/reveal sounds; page headers and status bar
- **Polish UI** — `pl.json`; light/dark theme
- **A11y** — responsive board, focus states, skip link, `prefers-reduced-motion`
- **Stack** — React 19, Vite, Tailwind 4, TanStack Query, Zustand; Vitest + Testing Library

## [0.6.0](https://github.com/habbababbai/wordlopol/compare/web-v0.5.0...web-v0.6.0) (2026-06-07)

### Features

- **web:** add static home page layout ([#38](https://github.com/habbababbai/wordlopol/issues/38)) ([5ca65de](https://github.com/habbababbai/wordlopol/commit/5ca65de21f24e70b1e91164746964976127eda1c))

## [0.5.0](https://github.com/habbababbai/wordlopol/compare/web-v0.4.0...web-v0.5.0) (2026-06-07)

### Features

- **web:** add i18n with polish and english locales ([#36](https://github.com/habbababbai/wordlopol/issues/36)) ([7ad7327](https://github.com/habbababbai/wordlopol/commit/7ad7327ee61c862879da32701b2875f83cbce766))

## [0.4.0](https://github.com/habbababbai/wordlopol/compare/web-v0.3.0...web-v0.4.0) (2026-06-07)

### Features

- **web:** add vitest and testing library setup ([#34](https://github.com/habbababbai/wordlopol/issues/34)) ([3651101](https://github.com/habbababbai/wordlopol/commit/36511016c617397c63c3c711a98eb9f60719b5e7))

## [0.3.0](https://github.com/habbababbai/wordlopol/compare/web-v0.2.0...web-v0.3.0) (2026-06-07)

### Features

- **web:** add app layout and route stubs ([#32](https://github.com/habbababbai/wordlopol/issues/32)) ([0cff505](https://github.com/habbababbai/wordlopol/commit/0cff505d1f7b4ee3f22acab1dbc95d6ff5b0b6ac))

## [0.2.0](https://github.com/habbababbai/wordlopol/compare/web-v0.1.0...web-v0.2.0) (2026-06-07)

### Features

- **web:** add design system and ui primitives ([#27](https://github.com/habbababbai/wordlopol/issues/27)) ([73d92bb](https://github.com/habbababbai/wordlopol/commit/73d92bb5743ab38f8d567fc522a81f225ce58ad9))

## [0.1.0](https://github.com/habbababbai/wordlopol/releases/tag/web-v0.1.0) (2026-06-05)

### Miscellaneous

- Initial web app scaffold (React 19 + Vite)
