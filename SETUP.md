# GitHub profile setup

This profile is inspired by the animated, icon-based, and minimal layouts collected in [Awesome GitHub Profile README](https://github.com/abhisheknaiidu/awesome-github-profile-readme), including DenverCoder1's animated introduction and codeSTACKr's grouped technology logos.

The name, introduction, statistics, toolkit labels, project descriptions, and links are native GitHub HTML and Markdown. Local SVGs provide the typing animation, navigation buttons, logos, contribution animation, and language color bar. The design uses cyan and violet accents, a centered introduction, three toolkit panels, and three pairs of project cards.

GitHub controls the surrounding fonts, table borders, and page theme. SVG assets can define their own appearance and animation. The introduction and the initial contribution artwork respect reduced-motion preferences. The initial contribution artwork also has separate light and dark palettes.

## Publish

1. Commit and push these changes to the default branch of `raphael0002/raphael0002`.
2. Check **Actions → Refresh Native Profile**. A push changing the README or generator triggers a refresh.
3. The same workflow runs daily at 00:17 UTC and can be started manually.

The daily workflow fetches current public statistics, updates the README and saved data, regenerates the language bar, and generates the contribution snake with [Platane/snk](https://github.com/Platane/snk). All these files are committed together to the default branch, avoiding separate branches for animation assets. **Refresh Contribution Animation** delegates to the same workflow.

No personal token is required. The workflow uses the repository's `GITHUB_TOKEN`. GitHub Actions must be enabled and allowed to write repository contents; branch protection may prevent the automated commit.

## Edit the profile

- Update the introduction above `<!-- PROFILE:START -->` directly in `README.md`.
- Update `featuredOrder`, `projectTitles`, and `projectDescriptions` in `scripts/generate-dashboard.mjs` to choose and describe up to six projects.
- Each entry in `technologies` contains an icon ID, accessible name, and official website URL. Add the corresponding SVG to `assets/tech` for a new icon.
- Update the generated layout in `renderProfile`. Content outside the generation markers is preserved.
- Update the animated phrases and navigation assets in `scripts/generate-profile-art.mjs`, then run that script. It uses the public GitHub contribution calendar to create initial animation assets. The daily workflow subsequently replaces the contribution artwork with the snk animation.

Technology icons come from [Skill Icons](https://github.com/tandpfun/skill-icons), distributed under the MIT license in `assets/tech/LICENSE`. Introduction, navigation, initial contribution artwork, and language bar are original SVG assets.

## Local commands

Node.js 24 or later is sufficient; no dependencies need to be installed.

Refresh from GitHub:

```powershell
node scripts/generate-dashboard.mjs
```

Apply layout changes using the last saved statistics, without API requests:

```powershell
node scripts/generate-dashboard.mjs --cached
```

Rebuild the introduction, buttons, and initial contribution artwork:

```powershell
node scripts/generate-profile-art.mjs
```

Without `GITHUB_TOKEN`, a live local refresh uses the public REST API and omits the authenticated annual activity summary. API errors preserve the README. The committed `assets/profile/data.json` is a public data snapshot used for layout work; its initial version preserves the statistics, language shares, and six featured projects from the last README. The next live refresh replaces it with a complete public repository snapshot.

## Statistics

Repository count includes owned public repositories. Stars exclude forks. Account age is measured in completed calendar years. Language shares use code size across up to 20 recently updated public repositories, excluding forks. Contribution summary counts come from GitHub GraphQL; commits, pull requests, issues, and reviews do not necessarily cover every contribution type.

The old `assets/dashboard.svg` and `assets/dashboard-mobile.svg` files are no longer displayed or regenerated.
