# Backblaze B2 CORS for direct browser uploads

This procedure configures the private `dockerize-sakhaa-forge-quarantine` bucket for browser uploads through S3-compatible presigned `PUT` URLs.

Run these commands on the developer PC. They are not application commands and are not entered in the Backblaze website.

## Prerequisites

- Windows PowerShell 5.1 or PowerShell 7+
- Python and `pip` available on `PATH`
- A Backblaze application key with the `writeBuckets` capability
- The real Vercel frontend URL

Create or retrieve the key ID and application key from:

`Backblaze Console → B2 Cloud Storage → Application Keys`

Do not commit, paste into source files, or share the application key.

## 1. Install and authorize the B2 CLI

```powershell
pip install --upgrade b2
b2 --help
b2 account authorize
```

Enter the key ID and application key when prompted.

## 2. Set the production origin

The production origin configured in `b2-cors-rules.json` is:

```text
https://sakhaa-signal.vercel.app
```

Origins must not include a path or trailing slash.

Validate the JSON before changing the bucket:

```powershell
Get-Content ".\b2-cors-rules.json" -Raw | ConvertFrom-Json | Out-Null
```

## 3. Review the existing bucket configuration

Updating CORS replaces the bucket's complete CORS rule set. Record the current configuration before applying the new rule:

```powershell
b2 bucket get dockerize-sakhaa-forge-quarantine
```

## 4. Apply with PowerShell 7 or PowerShell 6

```powershell
$corsRules = Get-Content ".\b2-cors-rules.json" -Raw

b2 bucket update --cors-rules $corsRules dockerize-sakhaa-forge-quarantine allPrivate
```

The final `allPrivate` argument keeps the bucket private.

## 5. PowerShell 5.x fallback

PowerShell 5 may strip JSON quotes when invoking native executables. Compress the JSON and escape its quotes:

```powershell
$corsRules = Get-Content ".\b2-cors-rules.json" -Raw |
  ConvertFrom-Json |
  ConvertTo-Json -Compress

$escapedCorsRules = $corsRules -replace '"', '\"'

b2 bucket update --cors-rules $escapedCorsRules dockerize-sakhaa-forge-quarantine allPrivate
```

The quote replacement must change `"` to `\"`. Replacing a quote with itself is a no-op and does not address PowerShell 5 argument parsing.

## 6. Verify the stored rule

```powershell
b2 bucket get dockerize-sakhaa-forge-quarantine
```

Confirm that the returned CORS rules contain:

- `http://localhost:3000`
- the exact Vercel origin
- `s3_put`, `s3_get`, and `s3_head`
- `allowedHeaders` containing `*`

## 7. Test a browser upload

Restarting Next.js is not required. Open the dashboard and submit a static image analysis again. A cached failed preflight can be avoided by opening a new browser tab or clearing site data.

To test a current presigned URL manually:

```powershell
curl.exe -i -X OPTIONS "<YOUR_PRESIGNED_UPLOAD_URL>" `
  -H "Origin: http://localhost:3000" `
  -H "Access-Control-Request-Method: PUT" `
  -H "Access-Control-Request-Headers: content-type"
```

The response should be successful and include `Access-Control-Allow-Origin` for `http://localhost:3000`, `PUT` in the allowed methods, and `content-type` in the allowed headers.

## Troubleshooting

- `unauthorized` or `not_capable`: authorize with a key that includes `writeBuckets`.
- `403 not entitled` after a successful preflight: inspect the application key's file-name prefix. This app uploads under `workspaces/`, so a key restricted to another prefix cannot upload even when CORS is correct.
- `bad_request`: validate the JSON and confirm the PowerShell 5 quote escaping.
- Preflight still returns `403`: confirm the rule was applied to `dockerize-sakhaa-forge-quarantine`, not the private-artifacts bucket.
- Do not use the Backblaze “share with all HTTPS origins” preset. It creates a download-oriented rule and does not match localhost HTTP uploads.
