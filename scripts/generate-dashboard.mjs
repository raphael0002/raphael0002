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

const projectTitles = {
  "Leaflet-Digital-Solution": "Leaflet Digital Solution",
  "3D-Portfolio-threejs": "3D Portfolio",
  "Meal-Map": "Meal Map",
  "chatify": "Chatify",
  "StudentPortal": "Student Portal",
  "Aeterna": "Aeterna",
};

const languageColors = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Dart: "#00b4ab",
  CSS: "#a78bfa", "C++": "#f34b7d", "C#": "#178600", HTML: "#e34c26",
  Python: "#3572a5", Other: "#8b949e",
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
  const title = projectTitles[repo.name] || repo.name;
  return `<td width="440" valign="top">
<h4><a href="${url}">${escapeHtml(title)}</a></h4>
<p>${escapeHtml(projectDescriptions[repo.name] || repo.description || "Explore the source code and project details.")}</p>
<p>${repo.language ? `<code>${escapeHtml(repo.language)}</code> &nbsp; ` : ""}<a href="${url}/stargazers">${number(repo.stargazers_count)} ${repo.stargazers_count === 1 ? "star" : "stars"}</a> &nbsp; <a href="${url}/forks">${number(repo.forks_count)} ${repo.forks_count === 1 ? "fork" : "forks"}</a></p>
</td>`;
}

export function languageShares(data) {
  if (data.languageShares) return data.languageShares;
  const total = Object.values(data.languages).reduce((sum, size) => sum + size, 0);
  if (!total) return [];
  const ranked = Object.entries(data.languages).sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 5);
  const other = ranked.slice(5).reduce((sum, [, size]) => sum + size, 0);
  if (other) top.push(["Other", other]);
  return top.map(([name, size]) => ({ name, pct: size / total * 100 }));
}

export function renderLanguageBar(data) {
  const shares = languageShares(data);
  const total = shares.reduce((sum, item) => sum + item.pct, 0) || 1;
  let x = 0;
  const segments = shares.map(item => {
    const width = item.pct / total * 880;
    const segment = `<rect x="${x.toFixed(2)}" y="0" width="${width.toFixed(2)}" height="10" fill="${languageColors[item.name] || "#8b949e"}"><title>${escapeHtml(item.name)}: ${item.pct.toFixed(1)}%</title></rect>`;
    x += width;
    return segment;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 10" width="880" height="10" role="img" aria-labelledby="title"><title id="title">Language distribution by code size</title><defs><clipPath id="round"><rect width="880" height="10" rx="5"/></clipPath></defs><g clip-path="url(#round)">${segments.join("")}</g></svg>`;
}

export function renderProfile(data, now = new Date()) {
  const { user, repos, languageRepoCount, contributions } = data;
  const url = profileUrl(user.login);
  const ownRepos = repos.filter(repo => !repo.fork);
  const stats = [
    [number(user.public_repos), "Repositories", `${url}?tab=repositories`],
    [number(data.totalStars ?? ownRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0)), "Stars earned", `${url}?tab=repositories`],
    [number(user.followers), "Followers", `${url}?tab=followers`],
    [number(yearsActive(user.created_at, now)), "Years active", url],
  ];
  const shares = languageShares(data);
  const iconRows = values => values.map(([id, name, href], index) =>
    `${index === 3 ? "<br><br>" : index ? " &nbsp; " : ""}<a href="${href}"><img src="./assets/tech/${id}.svg" width="42" height="42" alt="${escapeHtml(name)}" title="${escapeHtml(name)}"></a>`).join("");

  const projects = selectProjects(repos, user.login);
  const rows = [];
  for (let i = 0; i < projects.length; i += 2) {
    rows.push(`<table>\n<tr>\n${projectCard(projects[i], user.login)}\n${projects[i + 1] ? projectCard(projects[i + 1], user.login) : '<td width="440"></td>'}\n</tr>\n</table>`);
  }

  return `<h3 align="center">A snapshot of my GitHub</h3>

<table>
<tr>
${stats.map(([value, label, href]) => `<td width="220" align="center" valign="middle"><h3>${value}</h3><p><sub><a href="${href}">${label}</a></sub></p></td>`).join("\n")}
</tr>
</table>

<br>

<h3 align="center">My development toolkit</h3>
<p align="center">The tools behind my web applications and interactive experiences.</p>

<table>
<tr>
${technologies.map(([label, values]) => `<td width="293" align="center" valign="top"><h4>${escapeHtml(label)}</h4><p>${iconRows(values)}</p><p><sub>${values.map(([, name]) => escapeHtml(name)).join(" &middot; ")}</sub></p></td>`).join("\n")}
</tr>
</table>

<br>

<h3 align="center">Selected work</h3>
<p align="center">From business websites to real-time interfaces and immersive 3D.</p>

${rows.length ? rows.join("\n\n") : "Public projects will appear here as they are published."}

<p align="center"><a href="${url}?tab=repositories">Browse all repositories</a></p>

<br>

<h3 align="center">Code &amp; consistency</h3>

${contributions ? `<p align="center"><strong>${number(contributions.contributionCalendar.totalContributions)} contributions</strong> over the past year</p>
<p align="center"><sub>${number(contributions.totalCommitContributions)} commits &nbsp; &middot; &nbsp; ${number(contributions.totalPullRequestContributions)} pull requests &nbsp; &middot; &nbsp; ${number(contributions.totalIssueContributions)} issues &nbsp; &middot; &nbsp; ${number(contributions.totalPullRequestReviewContributions)} reviews</sub></p>\n\n` : ""}<p align="center">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="./assets/profile/contributions-dark.svg">
<img src="./assets/profile/contributions.svg" width="100%" alt="An animated snake traveling across my actual GitHub contribution calendar">
</picture>
</p>
<p align="center"><a href="${url}?tab=overview">Explore contribution history</a></p>

<br>

<h3 align="center">Languages in my repositories</h3>
${shares.length ? `<p><img src="./assets/profile/languages.svg" width="100%" height="10" alt="${escapeHtml(shares.map(item => `${item.name} ${item.pct.toFixed(1)}%`).join(", "))}"></p>
<p align="center"><sub>${shares.map(item => `<strong>${escapeHtml(item.name)}</strong> ${item.pct < 0.1 ? "&lt;0.1" : item.pct.toFixed(1)}%`).join(" &nbsp; &middot; &nbsp; ")}</sub></p>` : "<p align=\"center\">No language data yet.</p>"}
<p align="center"><sub>Code size across ${number(languageRepoCount)} recently updated public repositories, excluding forks.</sub></p>

<hr>
<p align="center"><sub>Profile data refreshed ${escapeHtml(data.refreshedDate || now.toISOString().slice(0, 10))} UTC &middot; Stars exclude forks.</sub></p>`;
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
  return { user, repos, languages, languageRepoCount: sampledRepos.length, contributions, refreshedDate: new Date().toISOString().slice(0, 10) };
}

async function main() {
  const readmePath = path.join(ROOT, "README.md");
  const readme = await fs.readFile(readmePath, "utf8");
  replaceProfile(readme, "");
  const cachePath = path.join(ROOT, "assets/profile/data.json");
  const data = process.argv.includes("--cached")
    ? JSON.parse(await fs.readFile(cachePath, "utf8"))
    : await fetchProfile(process.env.GITHUB_USERNAME || "raphael0002", process.env.GITHUB_TOKEN);
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(path.join(ROOT, "assets/profile/languages.svg"), renderLanguageBar(data));
  if (!process.argv.includes("--cached")) await fs.writeFile(cachePath, JSON.stringify(data, null, 2) + "\n");
  await fs.writeFile(readmePath, replaceProfile(readme, renderProfile(data)));
  console.log(`Native profile refreshed for ${data.user.login}: ${data.user.public_repos} public repositories${process.argv.includes("--cached") ? " (saved data)" : ""}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
