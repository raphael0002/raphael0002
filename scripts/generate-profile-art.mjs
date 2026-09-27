import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../assets/profile/", import.meta.url));
const esc = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

function intro() {
  const phrases = [
    "Full-stack developer. Thoughtful interfaces.",
    "React & Next.js. Node.js & databases.",
    "Turning ideas into interactive experiences.",
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="56" viewBox="0 0 760 56" role="img" aria-labelledby="title desc">
<title id="title">Full-stack developer</title>
<desc id="desc">An animated introduction: ${esc(phrases.join(" "))}</desc>
<style>
text{font-family:Consolas,"Courier New",monospace;font-size:19px;fill:#67e8f9}
.line{opacity:0;animation:typing 15s linear infinite;clip-path:inset(0 100% 0 0)}
.first{opacity:1}.second{animation-delay:5s}.third{animation-delay:10s}
@keyframes typing{0%{opacity:1;clip-path:inset(0 100% 0 0)}15%,27%{opacity:1;clip-path:inset(0 0 0 0)}33%{opacity:1;clip-path:inset(0 100% 0 0)}34%,100%{opacity:0;clip-path:inset(0 100% 0 0)}}
@media(prefers-color-scheme:light){text{fill:#0e7490}}
@media(prefers-reduced-motion:reduce){.line{animation:none;clip-path:none;opacity:0}.first{opacity:1}}
</style>
${phrases.map((phrase, index) => `<g class="line ${["first", "second", "third"][index]}"><text x="380" y="30" text-anchor="middle">${esc(phrase)}</text></g>`).join("\n")}
</svg>`;
}

const symbols = {
  repositories: '<path d="M3 7h7l2 3h9v10H3z"/><path d="M3 7V4h7l2 3"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  follow: '<circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M19 8v8M15 12h8"/>',
};

function button(label, symbol, width) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 36" width="${width}" height="36" role="img" aria-label="${esc(label)}"><rect x=".5" y=".5" width="${width - 1}" height="35" rx="8" fill="#0d1117" stroke="#30363d"/><g transform="translate(12 8) scale(.8)" stroke="#67e8f9" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round">${symbols[symbol]}</g><text x="40" y="23" font-family="Segoe UI,Arial,sans-serif" font-size="13" font-weight="600" fill="#e6edf3">${esc(label)}</text></svg>`;
}

async function calendar() {
  const response = await fetch("https://github.com/users/raphael0002/contributions", { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`Public contribution calendar: HTTP ${response.status}`);
  const html = await response.text();
  const tooltips = new Map([...html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/g)].map(([, attributes, text]) =>
    [attributes.match(/\bfor="([^"]+)"/)?.[1], Number(text.match(/([\d,]+) contributions? on/)?.[1]?.replaceAll(",", "") || 0)]));
  const days = [...html.matchAll(/<td\b([^>]*\bdata-date="[^"]+"[^>]*)>/g)].map(([, attributes]) => ({
    date: attributes.match(/\bdata-date="([^"]+)"/)[1],
    level: Number(attributes.match(/\bdata-level="(\d)"/)?.[1] || 0),
    count: tooltips.get(attributes.match(/\bid="([^"]+)"/)?.[1]) || 0,
  })).sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 350 || days.length > 371) throw new Error("Public calendar format changed. Existing artwork preserved.");
  return days;
}

function activity(days, dark) {
  const palette = dark ? ["#161b22", "#164e63", "#0e7490", "#06b6d4", "#67e8f9"] : ["#ebedf0", "#cffafe", "#67e8f9", "#22d3ee", "#0891b2"];
  const textColor = dark ? "#8b949e" : "#57606a";
  const start = new Date(`${days[0].date}T00:00:00Z`);
  const weeks = Math.floor((new Date(`${days.at(-1).date}T00:00:00Z`) - start) / 604800000) + 1;
  const step = Math.min(16, 840 / weeks);
  const x0 = 34, y0 = 30, size = step - 4;
  let month = -1;
  const grid = days.map(day => {
    const date = new Date(`${day.date}T00:00:00Z`);
    const col = Math.floor((date - start) / 604800000), row = date.getUTCDay();
    let label = "";
    if (row === 0 && date.getUTCMonth() !== month && col < weeks - 2 && col > 1) {
      month = date.getUTCMonth();
      label = `<text x="${x0 + col * step}" y="16">${date.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`;
    }
    return `${label}<rect x="${x0 + col * step}" y="${y0 + row * step}" width="${size}" height="${size}" rx="2" fill="${palette[day.level]}"><title>${day.date}: ${day.count} contributions</title></rect>`;
  }).join("");
  let motionPath = `M ${x0 + size / 2} ${y0 + size / 2}`;
  for (let row = 0; row < 7; row++) {
    const x = x0 + (row % 2 ? 0 : weeks - 1) * step + size / 2;
    motionPath += ` L ${x} ${y0 + row * step + size / 2}`;
    if (row < 6) motionPath += ` L ${x} ${y0 + (row + 1) * step + size / 2}`;
  }
  const snake = Array.from({ length: 8 }, (_, index) => `<rect x="-4" y="-4" width="8" height="8" rx="3" fill="${index === 7 ? "#67e8f9" : "#a78bfa"}" opacity="${0.35 + index * 0.09}"><animateMotion dur="48s" begin="-${index * 0.11}s" repeatCount="indefinite" path="${motionPath}"/></rect>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="154" viewBox="0 0 880 154" role="img" aria-labelledby="title desc"><title id="title">Rohan Shrestha's GitHub contribution calendar</title><desc id="desc">${days.reduce((sum, day) => sum + day.count, 0)} public contributions from ${days[0].date} to ${days.at(-1).date}. A cyan and violet snake travels across the calendar.</desc><style>text{font-family:Segoe UI,Arial,sans-serif;font-size:10px;fill:${textColor}}@media(prefers-reduced-motion:reduce){.snake{display:none}}</style>${grid}<g class="snake">${snake}</g><text x="34" y="147">Less</text>${palette.map((color, index) => `<rect x="${64 + index * 14}" y="138" width="10" height="10" rx="2" fill="${color}"/>`).join("")}<text x="139" y="147">More</text></svg>`;
}

await fs.mkdir(output, { recursive: true });
await fs.writeFile(`${output}intro.svg`, intro());
for (const [label, symbol, width] of [["Repositories", "repositories", 140], ["Activity", "activity", 112], ["Follow on GitHub", "follow", 163]]) {
  await fs.writeFile(`${output}${symbol}.svg`, button(label, symbol, width));
}
const days = await calendar();
await fs.writeFile(`${output}contributions.svg`, activity(days, false));
await fs.writeFile(`${output}contributions-dark.svg`, activity(days, true));
console.log(`Generated animated introduction, navigation buttons, and contribution artwork from ${days.length} actual calendar days.`);
