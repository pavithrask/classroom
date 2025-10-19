# Fly.io Deployment Guide

This guide walks through provisioning the infrastructure and wiring the CI/CD workflow that ships the full-stack application to Fly.io.

## 1. Prerequisites
- A Fly.io account with the [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed locally.
- A GitHub repository connected to this project.
- Billing enabled on Fly.io if you intend to scale beyond the free tier.

## 2. Create the Fly app and Postgres database
```bash
fly auth login
fly launch --no-deploy --copy-config --name primary-classes-manager
fly postgres create --name primary-classes-manager-db --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1
fly postgres attach --postgres-app primary-classes-manager-db primary-classes-manager
```
The attach command creates the `DATABASE_URL` secret on the application so the API connects to the managed Postgres cluster.

## 3. Configure runtime secrets
Set the JWT signing secret and SMTP credentials that power the birthday automation emails:
```bash
fly secrets set SECRET_KEY="replace-with-a-long-random-value" \
  SMTP_HOST="smtp.example.com" \
  SMTP_PORT="587" \
  SMTP_USERNAME="apikey" \
  SMTP_PASSWORD="secret" \
  SMTP_FROM="teacher@example.com"
```
Include any additional configuration keys defined in `app/config.py` as needed. Secrets may be updated at any time with the same command.

## 4. Decide on the front-end API base URL
The Vite build injects the API URL at compile time. For Fly.io you will typically use:
```
https://<your-app-name>.fly.dev/api/v1
```
Store this value in the `VITE_API_BASE_URL` GitHub secret (see step 6) so the deployment pipeline builds the React assets against the live API domain.

## 5. First-time manual deployment (optional)
Before enabling CI/CD you can test a deployment locally:
```bash
fly deploy --remote-only --build-arg VITE_API_BASE_URL=https://primary-classes-manager.fly.dev/api/v1
```
This uses the provided `fly.toml` and Dockerfile to create a full-stack image that serves both the API and bundled React assets from a single Fly machine.

## 6. Configure GitHub Action secrets
Add the following secrets in your repository settings so the workflow defined in `.github/workflows/deploy.yml` can deploy automatically:
- `FLY_API_TOKEN`: a Fly.io access token created with `fly auth token`.
- `FLY_APP_NAME`: usually `primary-classes-manager` unless you renamed the app in step 2.
- `VITE_API_BASE_URL`: the API URL discussed in step 4.

The workflow will fail fast if the required secrets are missing. Optional secrets (like SMTP configuration) stay in Fly and do not need to be present in GitHub.

## 7. Deployment pipeline behaviour
- Trigger: pushes to `main` or manual `workflow_dispatch` runs.
- Steps: compile Python sources for a sanity check, build the Docker image on Fly’s remote builder, then roll out the release using `flyctl deploy`.
- Rollback: `fly releases` shows previous deployments; use `fly deploy --image <image_ref>` to revert.

With the secrets in place every commit to `main` publishes a new version to Fly.io automatically.
