# GovDoc — Production Deploy Runbook

Phase 1 deploy is **manual** by design (see Phase 1 design doc §4.8). Cloud Run service `govdoc` in project `genai-poc-424806`, region `us-central1`. Coexists with the legacy `caltrans-app` Streamlit service — do not touch that one.

## One-time setup (per project)

You only need to run this once per Google Cloud project. Skip if `govdoc-runtime` already exists.

```bash
gcloud iam service-accounts create govdoc-runtime --project=genai-poc-424806

for s in openai anthropic groq dev-user dev-pass session-secret; do
  echo -n "<value-for-$s>" | gcloud secrets create govdoc-$s --data-file=- --project=genai-poc-424806
  gcloud secrets add-iam-policy-binding govdoc-$s \
    --member=serviceAccount:govdoc-runtime@genai-poc-424806.iam.gserviceaccount.com \
    --role=roles/secretmanager.secretAccessor \
    --project=genai-poc-424806
done
```

Generate `GOVDOC_SESSION_SECRET` with `openssl rand -hex 32`. The secret loaded by `instrumentation.ts` must be ≥ 32 bytes or the container exits at boot.

## Pre-deploy checklist

```bash
# 1. Tests green
npm test

# 2. Lint clean
npm run lint

# 3. Production build succeeds
npm run build

# 4. Confirm you're on the branch you want to ship
git status
git log -1 --oneline
```

## Deploy

```bash
# Dry-run first to see the exact command
scripts/deploy-cloud-run.sh --dry-run

# Then ship it
scripts/deploy-cloud-run.sh
```

The script prints the deployed revision name and service URL on success. Cloud Run's first deploy of `govdoc` takes ~5-8 minutes (image build + provisioning); subsequent deploys are ~3 minutes.

## Post-deploy verification

### 1. Health check

```bash
curl https://<service-url>/api/health
# Expected: {"ok":true,"service":"govdoc","uptimeSec":N,"commit":"abc1234"}
```

### 2. Login flow (manual)

Open `https://<service-url>/login` in a browser. Sign in with `GOVDOC_DEV_USER` / `GOVDOC_DEV_PASS`. Verify redirect to `/landing`. Confirm the Review tile is live and the other three tiles say "Coming soon".

### 3. Run the @e2e suite against the deployed URL

The three Playwright `@e2e` specs (CMGC, CUCP, ROW) hit the real OpenAI API and exercise the full pipelines.

```bash
export BASE_URL=https://<service-url>
export GOVDOC_DEV_USER=<from secret>
export GOVDOC_DEV_PASS=<from secret>
export OPENAI_API_KEY=<from secret>

# CMGC happy path (uses tests/fixtures/cmgc/synthetic-narrative.docx)
npx playwright test --project=deployed tests/e2e/cmgc.spec.ts

# CUCP — requires a real narrative PDF
export CUCP_E2E_NARRATIVE_PDF=/path/to/narrative.pdf
npx playwright test --project=deployed tests/e2e/cucp.spec.ts

# ROW — requires a real appraisal PDF
export ROW_E2E_PDF=/path/to/appraisal.pdf
npx playwright test --project=deployed tests/e2e/row.spec.ts
```

Each spec is gated with `test.skip(!process.env.OPENAI_API_KEY, ...)` so missing creds simply skip rather than fail.

## Rollback

```bash
# List revisions
gcloud run revisions list --service=govdoc --region=us-central1 --project=genai-poc-424806

# Route 100% traffic back to the previous revision
gcloud run services update-traffic govdoc \
  --to-revisions=<previous-revision-name>=100 \
  --region=us-central1 --project=genai-poc-424806
```

## Logs

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="govdoc"' \
  --project=genai-poc-424806 --limit=50 --format=json
```

Each request log line is JSON with at least `service`, `level`, `time`, and (where applicable) `runId`, `stage`, `userId`. The boot env-validation failure (if any) writes to stderr with prefix `[govdoc] env validation failed:`.

## What can go wrong

| Symptom | Likely cause | Fix |
|---|---|---|
| Container exits immediately, log says `[govdoc] env validation failed` | Missing or short secret | Re-check Secret Manager values; rotate if needed |
| SSE stream hangs at first stage | `--no-cpu-throttling` not set | Re-deploy via `scripts/deploy-cloud-run.sh` (the script always sets it) |
| `502` on long pipelines | Pipeline ran past `--timeout=900s` | Investigate the slow stage; raise timeout only if justified |
| Login returns 401 with correct creds | `GOVDOC_DEV_USER`/`PASS` mismatch | Re-check Secret Manager values |
| `/api/health` returns 401 | `/api/health` not in middleware PUBLIC list | Re-check `middleware.ts` |
