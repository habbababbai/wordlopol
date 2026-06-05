# Postman — Wordlopol Auth

## Import

1. Postman → **Import**
2. Select both files in this folder
3. **Important:** top-right dropdown → select **Wordlopol Local**

If the environment is not selected, only Health will pass — all other requests send empty `{{email}}` / `{{password}}`.

## Run

1. `pnpm --filter @wordlopol/api dev` (must be `NODE_ENV=development`)
2. Open **Wordlopol Auth (automated)** → **Run**
3. Run all 14 requests **in order**, starting from **00 Health**

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
