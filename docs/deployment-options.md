# Deployment Cost Comparison

This document summarizes low-cost hosting options for the classroom management stack (FastAPI backend, React frontend, PostgreSQL, object storage, and SMTP) and recommends the cheapest viable setup.

## Baseline resource needs
- Single container capable of running the FastAPI API and serving the built React bundle (512 MB RAM, shared CPU is sufficient for <200 concurrent users).
- Managed PostgreSQL database with automated backups (~5 GB storage budget for MVP).
- Object storage for user-uploaded avatars/documents (≤10 GB in early usage).
- Outbound email provider for birthday automation (≤500 emails/month).

## Providers evaluated
| Provider | Compute | Postgres | Object Storage | Email | Est. Monthly Cost |
| --- | --- | --- | --- | --- | --- |
| **Fly.io** | `shared-cpu-1x` 256 MB VM fits inside free allowance | Fly Postgres Lite (3 GB storage) free | Cloudflare R2 free tier (10 GB) | Resend free tier (100 emails) or Mailjet free (200 emails/day) | **$0** within free limits |
| Render | Starter instance ($7/mo) | Starter PostgreSQL ($7/mo) | S3-compatible add-on via Backblaze B2 ($0.005/GB) | Mailjet free tier | ≈ $14+ storage |
| DigitalOcean | Basic Droplet ($4/mo) | Managed PostgreSQL ($15/mo) | Spaces ($5/mo) | Mailjet free tier | ≈ $24+ |
| Railway | Starter (free $5 credit) covers shared compute | Hobby Postgres uses same credit | Requires external storage | External email | ≈ $0 while credit lasts, then ≥$12 |

## Recommendation: Fly.io free tier
Fly.io is the lowest-cost option because both compute and the starter PostgreSQL tier run free of charge while usage remains small. Deploy the backend and compiled frontend inside a single Fly machine, connect to the free Postgres cluster, and integrate Cloudflare R2 for uploads alongside a free transactional email provider. This combination satisfies the product requirements without recurring costs until workloads exceed the free quotas.

## When to upgrade
- If average RAM usage exceeds 256 MB or CPU needs grow, move to a `shared-cpu-1x` 512 MB VM (~$5/mo).
- If Postgres storage approaches 3 GB, upgrade to Fly’s paid tier (~$1.5/GB per month beyond the free allocation).
- Heavy email volume (>100 monthly messages) requires upgrading the email provider to a paid plan (~$15/mo for 15k emails with Resend or Mailjet’s Essential plan).

Monitor actual usage and budget transitions gradually as adoption increases.
