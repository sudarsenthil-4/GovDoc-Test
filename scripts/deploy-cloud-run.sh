#!/usr/bin/env bash
# Deploy GovDoc to Cloud Run.
# Usage: scripts/deploy-cloud-run.sh [--dry-run] [--help]
set -euo pipefail

PROJECT="genai-poc-424806"
REGION="us-central1"
SERVICE="govdoc"
SA="govdoc-runtime@${PROJECT}.iam.gserviceaccount.com"

DRY_RUN=0
ALLOW_DIRTY=0
LEGACY_ENV_VARS=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --allow-dirty) ALLOW_DIRTY=1 ;;
    --legacy-env-vars) LEGACY_ENV_VARS=1 ;;
    --help|-h)
      cat <<EOF
Usage: scripts/deploy-cloud-run.sh [--dry-run] [--allow-dirty] [--legacy-env-vars] [--help]

Deploys the govdoc Next.js service to Cloud Run.

Flags:
  --dry-run           Print the gcloud command without executing it.
  --allow-dirty       Deploy even when the working tree has uncommitted changes.
                      The deploy will be tagged GIT_COMMIT=<sha>-dirty and is
                      not reproducible from git. Use only for short-lived
                      throw-away builds.
  --legacy-env-vars   Skip the dedicated runtime service account and read the
                      6 required secrets from .env.local, passing them inline
                      as --set-env-vars. This is the fallback for projects
                      where the one-time Secret Manager + service-account
                      setup in docs/DEPLOY.md has not been run. Keys end up
                      in revision metadata as plaintext — accepted trade-off
                      until the one-time setup happens.
  --help              Show this message.

Required env vars:
  OPENAI_API_KEY ANTHROPIC_API_KEY GROQ_API_KEY
  GOVDOC_DEV_USER GOVDOC_DEV_PASS GOVDOC_SESSION_SECRET

Default mode reads them from Secret Manager. --legacy-env-vars reads them
from .env.local at the repo root. See docs/DEPLOY.md for first-time setup.
EOF
      exit 0
      ;;
    *) echo "Unknown arg: $arg (try --help)" >&2; exit 2 ;;
  esac
done

# Refuse to deploy a dirty working tree by default.
# `gcloud run deploy --source .` bakes the entire working directory into the
# image, INCLUDING uncommitted edits and untracked files, producing a build
# that lives nowhere in git. The May 2026 "stash-only design" incident is the
# precedent. Override with --allow-dirty if you really need it.
IS_DIRTY=0
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  IS_DIRTY=1
fi

if [[ "$IS_DIRTY" -eq 1 && "$ALLOW_DIRTY" -eq 0 ]]; then
  cat >&2 <<EOF
ERROR: working tree is dirty. Refusing to deploy.

Uncommitted changes would be baked into the Cloud Run image but live nowhere
in git, making the deploy un-reproducible.

Resolve one of:
  1. Commit (or stash with intent to revisit) and re-run.
  2. If you truly know what you are doing, re-run with --allow-dirty.

Current changes:
$(git status --short | head -20)
EOF
  exit 3
fi

GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
if [[ "$IS_DIRTY" -eq 1 ]]; then
  GIT_COMMIT="${GIT_COMMIT}-dirty"
  echo "WARNING: --allow-dirty set; deploying with uncommitted changes." >&2
  echo "         GIT_COMMIT will be tagged '${GIT_COMMIT}'." >&2
  echo "         /api/health will report dirty=true on this revision." >&2
fi

CMD=(
  gcloud run deploy "$SERVICE"
  --source .
  --region="$REGION"
  --project="$PROJECT"
  --no-cpu-throttling
  --cpu-boost
  --memory=2Gi
  --timeout=900s
  --concurrency=10
  --max-instances=5
)

if [[ "$LEGACY_ENV_VARS" -eq 1 ]]; then
  ENV_FILE="$(git rev-parse --show-toplevel)/.env.local"
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "ERROR: --legacy-env-vars requires $ENV_FILE, which does not exist." >&2
    exit 4
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  MISSING=()
  for var in OPENAI_API_KEY ANTHROPIC_API_KEY GROQ_API_KEY GOVDOC_DEV_USER GOVDOC_DEV_PASS GOVDOC_SESSION_SECRET; do
    if [[ -z "${!var:-}" ]]; then MISSING+=("$var"); fi
  done
  if [[ "${#MISSING[@]}" -gt 0 ]]; then
    echo "ERROR: --legacy-env-vars requires these env vars in .env.local: ${MISSING[*]}" >&2
    exit 5
  fi
  echo "WARNING: --legacy-env-vars set; deploying with plaintext keys in revision metadata." >&2
  echo "         Default Compute SA will be used (no $SA)." >&2
  CMD+=(
    --clear-secrets
    "--set-env-vars=^@^OPENAI_API_KEY=${OPENAI_API_KEY}@ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}@GROQ_API_KEY=${GROQ_API_KEY}@GOVDOC_DEV_USER=${GOVDOC_DEV_USER}@GOVDOC_DEV_PASS=${GOVDOC_DEV_PASS}@GOVDOC_SESSION_SECRET=${GOVDOC_SESSION_SECRET}@NODE_ENV=production@NEXT_TELEMETRY_DISABLED=1@LOG_LEVEL=info@GIT_COMMIT=${GIT_COMMIT}"
  )
else
  CMD+=(
    --service-account="$SA"
    --update-secrets=OPENAI_API_KEY=govdoc-openai:latest,ANTHROPIC_API_KEY=govdoc-anthropic:latest,GROQ_API_KEY=govdoc-groq:latest,GOVDOC_DEV_USER=govdoc-dev-user:latest,GOVDOC_DEV_PASS=govdoc-dev-pass:latest,GOVDOC_SESSION_SECRET=govdoc-session-secret:latest
    --set-env-vars=NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,LOG_LEVEL=info,GIT_COMMIT="$GIT_COMMIT"
  )
fi

if [[ "$DRY_RUN" -eq 1 ]]; then
  if [[ "$LEGACY_ENV_VARS" -eq 1 ]]; then
    # Redact secret values in dry-run output so the printed command is shareable.
    printf '%s\n' "${CMD[@]}" | sed -E 's/(OPENAI_API_KEY|ANTHROPIC_API_KEY|GROQ_API_KEY|GOVDOC_DEV_USER|GOVDOC_DEV_PASS|GOVDOC_SESSION_SECRET)=[^@]*/\1=<redacted>/g'
  else
    printf '%s\n' "${CMD[*]}"
  fi
  exit 0
fi

"${CMD[@]}"
