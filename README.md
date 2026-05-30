# GovDoc

State of California document intelligence platform — Next.js under a unified GovDoc shell.

## Status

**Phase 1 — design complete, implementation pending.**

Phase 1 design: [`docs/superpowers/specs/2026-05-05-govdoc-phase-1-design.md`](docs/superpowers/specs/2026-05-05-govdoc-phase-1-design.md)

## Phase 1 scope

GovDoc shell (Login mock, Landing with 4 tiles, Review tile live with three use cases) + three evaluator pipelines:

- **CMGC / Project Delivery Evaluator V2** — multi-stage wizard, 32-category rubric, 3-LLM ensemble, override+undo
- **CUCP Re-Evaluations** — 7 mandatory criteria under 49 CFR §26.67, Pass/Fail
- **ROW Appraisal Evaluator** — chunked GPT-4.1 + GPT-4o vision fallback over bundled Landing AI markdowns

The other three Landing tiles (Search & Ask, Draft a Document, My Inbox) ship as "Coming soon" stubs.

## Stack

Next.js 16 App Router · TypeScript strict · shadcn/ui + Tailwind + Tremor · Zustand · TanStack Query · Vitest · `exceljs` / `docx` / `pdf-parse` · Cloud Run.

LLM providers: OpenAI, Anthropic, Groq. (Databricks dropped from the legacy stack.)

## Source apps being ported

Streamlit originals at `~/Downloads/caltrans/src/{project_delivery_evaluator,cucp_reevals,landing_ai_row_eval_chunked}.py`.

## Roadmap (high level)

| # | Phase | Scope |
|---|---|---|
| **1** | **GovDoc shell + Review tile** | what this repo currently targets |
| 2 | Real auth & RBAC | State SSO + MFA + roles + audit log foundation |
| 3 | Document corpus & ingestion | connectors, OCR, classification, vector store *(gating phase)* |
| 4 | Search & Ask tile | semantic search + grounded Q&A + citations |
| 5 | Draft a Document tile | drafting, form-filling, redlining, translation |
| 6 | My Inbox tile | routing, approvals, notifications |
| 7 | Compliance & risk | compliance checks, redaction, CPRA, FedRAMP alignment |
| 8 | Additional use cases | CMGC procurement variants, agency expansion |
| 9 | Analytical / lower-priority | sentiment, trend, forecasting, decision support |
