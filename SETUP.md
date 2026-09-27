# Native GitHub profile

The profile uses Markdown and GitHub-supported HTML: selectable text, equal-width statistics, technology logos, a visible language table, and three pairs of linked project cards. Technology logos are stored locally in `assets/tech`; the rest of the layout is native text and tables.

GitHub controls the fonts, colors, borders, spacing, and mobile table scrolling. The profile follows each visitor's GitHub theme. The interactive contribution calendar remains in GitHub's own profile section below the README.

## Publish and refresh

1. Commit and push these changes to the default branch of `raphael0002/raphael0002`.
2. Open **Actions → Refresh Native Profile** and check the run triggered by the push, or choose **Run workflow**.
3. The workflow updates the README daily at 00:17 UTC. It commits only when content changes.

The workflow uses the repository-provided `GITHUB_TOKEN`; no personal token is needed. GitHub Actions must be enabled and the repository must allow workflows to write repository contents. Branch protection may prevent the automated commit.

## Customize

- Edit the introduction above `<!-- PROFILE:START -->` in `README.md`. Content outside the generated markers is preserved.
- Edit `featuredOrder` in `scripts/generate-dashboard.mjs` to choose and order up to six projects. Missing repositories are replaced with other public projects, sorted by stars and then recent activity.
- Edit `technologies` in the same script to change the technology labels.
- Each technology entry contains an icon ID, accessible name, and official website URL. Add the corresponding SVG to `assets/tech` when introducing an icon. The existing icons come from [Skill Icons](https://github.com/tandpfun/skill-icons), distributed under the MIT license; see `assets/tech/LICENSE`.
- Edit `projectDescriptions` to update the short project summaries preserved from the previous profile. Other projects use their GitHub repository descriptions.
- The block between `PROFILE:START` and `PROFILE:END` is generated. Make lasting layout edits in `renderProfile` instead.

## Data

- Repository count includes all owned public repositories; stars exclude forks.
- Account age uses completed calendar years since the GitHub account was created.
- Languages are aggregated by code size across up to 20 recently updated public repositories, excluding forks. The top five languages and an Other row cover the full sample.
- Annual contribution totals come from GitHub GraphQL. Commit, pull request, issue, and review counts are a breakdown, not necessarily all contribution types.
- If a required API request fails, the existing README is preserved.

## Local refresh

Node.js 24 or later is sufficient; no dependencies need to be installed.

```powershell
node scripts/generate-dashboard.mjs
```

Without `GITHUB_TOKEN`, the script reads public statistics through the REST API and provides a link to the contribution calendar. In Actions, the supplied token also enables the annual activity summary. Unauthenticated local refreshes are subject to GitHub's lower API rate limit.

The previous SVG assets are no longer displayed or refreshed. The old snake workflow is available only for manual runs.
