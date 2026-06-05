# Postman — Wordlopol Auth

## Files

| File                                              | Purpose                                           |
| ------------------------------------------------- | ------------------------------------------------- |
| `Wordlopol-Local.postman_environment.json`        | Shared environment (only set `base_url` manually) |
| `Wordlopol-Auth.postman_collection.json`          | Happy-path flow (14 requests)                     |
| `Wordlopol-Auth-Negative.postman_collection.json` | Edge cases & error responses (9 folders)          |

## Import

1. Postman → **Import**
2. Select all three files in this folder
3. **Important:** top-right dropdown → select **Wordlopol Local**

If the environment is not selected, only Health will pass — all other requests send empty `{{email}}` / `{{password}}`.

## Run happy path

1. `pnpm --filter @wordlopol/api dev` (must be `NODE_ENV=development`)
2. Open **Wordlopol Auth (automated)** → **Run**
3. Run all 14 requests **in order**, starting from **00 Health**

## Run negative / edge cases

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

Open **View → Show Postman Console**. After **00 Health** you should see:

```
[init] email = player-1780...@example.com
```

After **01 Register**:

```
[saved] verify_token
```

If **01 Register** fails, the console logs the request body and response.

## Common failures

| Symptom                  | Cause                       | Fix                                     |
| ------------------------ | --------------------------- | --------------------------------------- |
| Only Health passes       | Environment not selected    | Select **Wordlopol Local** top-right    |
| `devToken present` fails | API not in development mode | Restart `pnpm dev`                      |
| `email is empty` error   | Skipped **00 Health**       | Always run full collection from start   |
| 409 on Register          | Re-ran without Health init  | Run collection from **00 Health** again |
