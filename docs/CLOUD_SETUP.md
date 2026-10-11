# Cloud environment handoff

The prepared instance has Node 24, dependencies, a migrated/seeded SQLite database, original assets and the tested app. `install_script` and `start_skill` were successfully saved to the cloud environment configuration draft.

The install script runs from `/workspace/Rips`, verifies the supported Node version, then executes `npm ci`, `npm run setup` and `npm run typecheck`. Startup instructions use the existing checkout, preserve existing data/configuration, start `npm run dev`, inspect logs, and verify `/api/catalog`, `/api/player`, `/play` and `/admin`. They explicitly avoid creating extra worktrees and disabling artifact/TLS verification. Live processes must be restarted after snapshot restoration.

The app is running on port 3000 in the current instance. The HTTP functional checks and browser tests have completed. No credentials, secret values or external services were requested.

Saving a draft does not publish a snapshot. Review and save the configuration in environment settings, then publish the environment. Publication and restoration in a new task have not been performed or independently verified here.
