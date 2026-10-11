# Browser-only demo deployment

The included `render.yaml` prepares a single free Render Node web service.
No terminal or payment integrations are needed. Hosting still requires a Render
account and permission for Render to read this GitHub repository.

1. Sign in to Render with GitHub.
2. Choose **New → Blueprint** and connect the Rips repository.
3. Select the branch containing `render.yaml`, review the free service, and deploy.
4. Wait for the service to become live, then open its assigned HTTPS URL.
5. Use `/play` for the player and `/admin` for the demo administration screens.

The URL is assigned by Render after deployment; no hosted demo URL exists until
that succeeds. Free service availability and sleep behavior are controlled by
Render. There is no persistent disk in this configuration: demo wallet, inventory,
and opening changes can reset when the service restarts or is redeployed. The
startup command creates and seeds a fresh database automatically when needed.

This is a shared, public demo with simulated money, demo users, and accessible
administration screens. Anyone with its URL can change its demo data. Do not use
real payments, passwords, personal information, or physical fulfillment here.
See `PRODUCTION_GAPS.md` before converting it to a production application.

The build and startup commands can be checked locally, but successful local
validation does not establish that a Render deployment has run or become live.
