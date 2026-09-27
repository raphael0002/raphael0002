import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const START = "<!-- PROFILE:START -->";
const END = "<!-- PROFILE:END -->";

// Missing featured repositories are replaced by other public projects.
export const featuredOrder = [
  "Leaflet-Digital-Solution", "3D-Portfolio-threejs", "Meal-Map",
  "chatify", "StudentPortal", "Aeterna",
];

// Short descriptions carried over from the existing profile dashboard.
const projectDescriptions = {
  "Leaflet-Digital-Solution": "Company website and digital services platform.",
  "3D-Portfolio-threejs": "Interactive 3D portfolio built with React and Three.js.",
  "Meal-Map": "Recipe application built with the MERN stack.",
  "chatify": "Modern React-based web chat interface.",
  "StudentPortal": "Student management portal with create, view, update, and delete workflows.",
  "Aeterna": "Application project built with Dart.",
};

const technologies = [
  ["Frontend", [
    ["js", "JavaScript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"],
    ["ts", "TypeScript", "https://www.typescriptlang.org/"],
    ["react", "React", "https://react.dev/"],
    ["nextjs", "Next.js", "https://nextjs.org/"],
    ["tailwind", "Tailwind CSS", "https://tailwindcss.com/"],
    ["threejs", "Three.js", "https://threejs.org/"],
  ]],
  ["Backend & data", [
    ["nodejs", "Node.js", "https://nodejs.org/"],
    ["express", "Express", "https://expressjs.com/"],
    ["mongodb", "MongoDB", "https://www.mongodb.com/"],
    ["postgres", "PostgreSQL", "https://www.postgresql.org/"],
  ]],
  ["Tools", [
    ["git", "Git", "https://git-scm.com/"],
    ["github", "GitHub", "https://github.com/"],
    ["docker", "Docker", "https://www.docker.com/"],
    ["vite", "Vite", "https://vite.dev/"],
    ["vscode", "VS Code", "https://code.visualstudio.com/"],
  ]],
];

const escapeHtml = value => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;").replace(/[\r\n]+/g, " ");
const number = value => Number(value).toLocaleString("en-US");
const profileUrl = login => `https://github.com/${encodeURIComponent(login)}`;
const repoUrl = (login, name) => `${profileUrl(login)}/${encodeURIComponent(name)}`;

export function yearsActive(createdAt, now = new Date()) {
  const created = new Date(createdAt);
  let years = now.getUTCFullYear() - created.getUTCFullYear();
  const anniversary = new Date(created);
  anniversary.setUTCFullYear(now.getUTCFullYear());
  if (now < anniversary) years--;
  return Math.max(0, years);
}

export function selectProjects(repos, login) {
  const eligible = repos.filter(repo => !repo.fork && repo.name.toLowerCase() !== login.toLowerCase());
  const selected = featuredOrder.map(name => eligible.find(repo => repo.name === name)).filter(Boolean);
  const remaining = [...eligible].sort((a, b) =>
    b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at));
  for (const repo of remaining) {
    if (selected.length >= 6) break;
    if (!selected.includes(repo)) selected.push(repo);
  }
  return selected.slice(0, 6);
}

function projectCard(repo, login) {
  const url = repoUrl(login, repo.name);
  return `<td width="440" valign="top">
<p><strong><a href="${url}">${escapeHtml(repo.name)}</a></strong></p>
<p>${escapeHtml(projectDescriptions[repo.name] || repo.description || "Explore the source code and project details.")}</p>
<p>${repo.language ? `<code>${escapeHtml(repo.language)}</code> &nbsp; ` : ""}<a href="${url}/stargazers">${number(repo.stargazers_count)} ${repo.stargazers_count === 1 ? "star" : "stars"}</a> &nbsp; <a href="${url}/forks">${number(repo.forks_count)} ${repo.forks_count === 1 ? "fork" : "forks"}</a></p>
</td>`;
}

export function renderProfile(data, now = new Date()) {
  const { user, repos, languages, languageRepoCount, contributions } = data;
  const url = profileUrl(user.login);
  const ownRepos = repos.filter(repo => !repo.fork);
  const stats = [
    [number(user.public_repos), "Repositories", `${url}?tab=repositories`],
    [number(ownRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0)), "Stars earned", `${url}?tab=repositories`],
    [number(user.followers), "Followers", `${url}?tab=followers`],
    [number(yearsActive(user.created_at, now)), "Years active", url],
  ];
  const totalBytes = Object.values(languages).reduce((sum, size) => sum + size, 0);
  const ranked = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 5);
  const other = ranked.slice(5).reduce((sum, [, size]) => sum + size, 0);
  if (other) top.push(["Other", other]);
  const languageRows = totalBytes ? top.map(([name, size]) => {
    const percent = size / totalBytes * 100;
    return `<tr><td width="700">${escapeHtml(name)}</td><td width="180" align="right">${percent < 0.1 ? "&lt;0.1" : percent.toFixed(1)}%</td></tr>`;
  }).join("\n") : '<tr><td colspan="2">No language data yet.</td></tr>';

  const projects = selectProjects(repos, user.login);
  const rows = [];
  for (let i = 0; i < projects.length; i += 2) {
    rows.push(`<table>\n<tr>\n${projectCard(projects[i], user.login)}\n${projects[i + 1] ? projectCard(projects[i + 1], user.login) : '<td width="440"></td>'}\n</tr>\n</table>`);
  }

  return `<table>
<tr>
${stats.map(([value, label, href]) => `<td width="220" align="center" valign="middle"><h3>${value}</h3><p><sub><a href="${href}">${label}</a></sub></p></td>`).join("\n")}
</tr>
</table>

### Contributions

${contributions ? `<p><strong>${number(contributions.contributionCalendar.totalContributions)} contributions</strong> in the past year.</p>
<p>${number(contributions.totalCommitContributions)} commits &nbsp; · &nbsp; ${number(contributions.totalPullRequestContributions)} pull requests &nbsp; · &nbsp; ${number(contributions.totalIssueContributions)} issues &nbsp; · &nbsp; ${number(contributions.totalPullRequestReviewContributions)} reviews</p>\n\n` : ""}<p><a href="${url}?tab=overview">View contribution calendar</a></p>

### Core technologies

<table>
${technologies.map(([label, values]) => `<tr><td width="180" valign="middle"><strong>${escapeHtml(label)}</strong></td><td width="700"><p>${values.map(([id, name, href]) => `<a href="${href}"><img src="./assets/tech/${id}.svg" width="42" height="42" alt="${escapeHtml(name)}" title="${escapeHtml(name)}"></a>`).join(" &nbsp; ")}</p><sub>${values.map(([, name]) => escapeHtml(name)).join(" &nbsp; · &nbsp; ")}</sub></td></tr>`).join("\n")}
</table>

### Languages

<table>
<thead><tr><th align="left">Language</th><th align="right">Share</th></tr></thead>
<tbody>
${languageRows}
</tbody>
</table>
<p><sub>By code size across ${number(languageRepoCount)} recently updated public repositories, excluding forks. Percentages are rounded.</sub></p>

### Notable projects

${rows.length ? rows.join("\n\n") : "Public projects will appear here as they are published."}

<p><a href="${url}?tab=repositories">Browse all repositories</a></p>

<sub>Stats refreshed ${now.toISOString().slice(0, 10)} UTC · Stars count public repositories I own, excluding forks.</sub>`;
}

export function replaceProfile(readme, content) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start < 0 || end < start || readme.indexOf(START, start + START.length) >= 0 || readme.indexOf(END, end + END.length) >= 0) {
    throw new Error("README.md must contain exactly one ordered PROFILE:START / PROFILE:END pair.");
  }
  return `${readme.slice(0, start + START.length)}\n\n${content}\n\n${readme.slice(end)}`;
}

export async function fetchProfile(login, token) {
  const headers = { "User-Agent": "native-profile-readme", Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  async function request(endpoint, options = {}) {
    const response = await fetch(`https://api.github.com${endpoint}`, {
      ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`GitHub request failed (${response.status}) for ${endpoint}. README left unchanged.`);
    return response.json();
  }
  const user = await request(`/users/${encodeURIComponent(login)}`);
  const repos = [];
  for (let page = 1; ; page++) {
    const batch = await request(`/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`);
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  const sampledRepos = repos.filter(repo => !repo.fork).slice(0, 20);
  const languages = {};
  for (const repo of sampledRepos) {
    const sizes = await request(`/repos/${encodeURIComponent(login)}/${encodeURIComponent(repo.name)}/languages`);
    for (const [name, size] of Object.entries(sizes)) languages[name] = (languages[name] || 0) + size;
  }
  let contributions = null;
  if (token) {
    const payload = await request("/graphql", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query($login: String!) { user(login: $login) { contributionsCollection {
          totalCommitContributions totalPullRequestContributions totalIssueContributions
          totalPullRequestReviewContributions contributionCalendar { totalContributions }
        } } }`,
        variables: { login },
      }),
    });
    if (payload.errors?.length || !payload.data?.user) throw new Error("GitHub contribution query failed. README left unchanged.");
    contributions = payload.data.user.contributionsCollection;
  }
  return { user, repos, languages, languageRepoCount: sampledRepos.length, contributions };
}

async function main() {
  const readmePath = path.join(ROOT, "README.md");
  const readme = await fs.readFile(readmePath, "utf8");
  replaceProfile(readme, "");
  const data = await fetchProfile(process.env.GITHUB_USERNAME || "raphael0002", process.env.GITHUB_TOKEN);
  await fs.writeFile(readmePath, replaceProfile(readme, renderProfile(data)));
  console.log(`Native profile refreshed for ${data.user.login}: ${data.repos.length} public repositories.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
