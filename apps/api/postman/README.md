# Postman — Wordlopol API

## Files

| File                                                  | Purpose                                           |
| ----------------------------------------------------- | ------------------------------------------------- |
| `Wordlopol-Local.postman_environment.json`            | Shared environment (only set `base_url` manually) |
| `Wordlopol-Auth.postman_collection.json`              | Auth happy-path flow (14 requests)                |
| `Wordlopol-Auth-Negative.postman_collection.json`     | Auth edge cases & error responses (9 folders)     |
| `Wordlopol-Daily.postman_collection.json`             | Daily challenge happy path (3 requests)           |
| `Wordlopol-Infinite.postman_collection.json`          | Infinite mode happy path (6 requests)             |
| `Wordlopol-Infinite-Negative.postman_collection.json` | Infinite edge cases (401, 403)                    |

## Import

1. Postman → **Import**
2. Select the files you need from this folder
3. **Important:** top-right dropdown → select **Wordlopol Local**

If the environment is not selected, only Health will pass — auth requests send empty `{{email}}` / `{{password}}`.

## Run auth happy path

1. `pnpm --filter @wordlopol/api dev` (must be `NODE_ENV=development`)
2. Open **Wordlopol Auth (automated)** → **Run**
3. Run all 14 requests **in order**, starting from **00 Health**

## Run daily challenge

1. Same environment (**Wordlopol Local**) and running API
2. Dictionary must be loaded: `pnpm db:import-words` (or health shows `wordCount > 0`)
3. Open **Wordlopol Daily (automated)** → **Run**
4. Run **00 Health** → **01 Daily Today** → **02 Daily Today again**

Empty-dictionary **503** is covered by Vitest, not the Postman happy path.

## Run infinite mode

1. Same environment (**Wordlopol Local**) and running API
2. Dictionary must be loaded: `pnpm db:import-words` (or health shows `wordCount > 0`)
3. Open **Wordlopol Infinite (automated)** → **Run**
4. Run **00 Health** through **05 Infinite Next again** in order

Requires `NODE_ENV=development` (devToken on register).

## Run infinite negative / edge cases

1. Same environment (**Wordlopol Local**) and running API
2. Open **Wordlopol Infinite (negative)** → **Run**
3. Run all folders — each scenario is self-contained

| Folder                       | Expect                                    |
| ---------------------------- | ----------------------------------------- |
| 01 No auth                   | 401                                       |
| 02 Unverified login          | 403                                       |
| 02 Unverified /infinite/next | 403 (uses `devAccessToken` from register) |

## Run auth negative / edge cases

1. Same environment (**Wordlopol Local**) and running API
2. Open **Wordlopol Auth (negative)** → **Run**
3. Run all folders — each scenario is self-contained (`[init]` requests create a fresh `neg-*@example.com` user)

Run this after auth changes or occasionally — not on every happy-path run. CI already covers these via Vitest.

| Folder                    | Expect |
| ------------------------- | ------ |
| 01 Login before verify    | 403    |
| 02 Duplicate register     | 409    |
| 03 Refresh after logout   | 401    |
| 04 Wrong change-password  | 401    |
| 05 Wrong delete password  | 401    |
| 06 Missing displayName    | 400    |
| 07 Blank displayName      | 400    |
| 08 Invalid verify token   | 400    |
| 09 Unchanged display name | 400    |

## Debug

Open **View → Show Postman Console**. After **00 Health** (auth collection) you should see:

```
[init] email = player-1780...@example.com
```

After **01 Register**:

```
[saved] verify_token
```

After **01 Daily Today**:

```
[saved] daily_date = 2026-06-06
```

After **04 Infinite Next**:

```
[saved] infinite_date = 2026-06-06
```

If **01 Register** fails, the console logs the request body and response.

## Common failures

| Symptom                  | Cause                       | Fix                                     |
| ------------------------ | --------------------------- | --------------------------------------- |
| Only Health passes       | Environment not selected    | Select **Wordlopol Local** top-right    |
| `devToken present` fails | API not in development mode | Restart `pnpm dev`                      |
| `email is empty` error   | Skipped **00 Health**       | Always run full collection from start   |
| 409 on Register          | Re-ran without Health init  | Run collection from **00 Health** again |
| Daily 503                | Empty dictionary            | Run `pnpm db:import-words`              |
