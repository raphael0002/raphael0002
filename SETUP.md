# Setup

1. Copy every file in this package into the root of `raphael0002/raphael0002`.
2. Commit and push.
3. Open the repository's **Actions** tab.
4. Run **Refresh Profile Dashboard** once.
5. Run **Generate Contribution Snake** once.
6. GitHub will then refresh the dashboard daily and regenerate the snake daily.

No personal access token is required. Both workflows use the repository-provided `GITHUB_TOKEN`.

## Files

- `README.md` — the visible GitHub profile.
- `assets/dashboard.svg` — desktop dashboard.
- `assets/dashboard-mobile.svg` — responsive mobile dashboard.
- `scripts/generate-dashboard.mjs` — fetches live GitHub data and regenerates the dashboard.
- `.github/workflows/dashboard.yml` — daily dashboard refresh.
- `.github/workflows/snake.yml` — contribution snake generator.

## Customize

Edit the `featuredOrder` array in `scripts/generate-dashboard.mjs` to choose which repositories appear as featured projects.
