import fs from "node:fs";

const USERNAME = process.env.GITHUB_USERNAME || "raphael0002";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  throw new Error("GITHUB_TOKEN is required.");
}

const query = `
query($login: String!) {
  user(login: $login) {
    name
    login
    bio
    createdAt
    followers { totalCount }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      privacy: PUBLIC
      isFork: false
      orderBy: {field: UPDATED_AT, direction: DESC}
    ) {
      totalCount
      nodes {
        name
        description
        url
        homepageUrl
        stargazerCount
        forkCount
        pushedAt
        primaryLanguage { name color }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
`;

const response = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    "User-Agent": "github-profile-dashboard"
  },
  body: JSON.stringify({ query, variables: { login: USERNAME } })
});

if (!response.ok) throw new Error(`GitHub GraphQL failed: ${response.status}`);

const payload = await response.json();
if (payload.errors) throw new Error(JSON.stringify(payload.errors, null, 2));

const user = payload.data.user;
if (!user) throw new Error(`User ${USERNAME} not found.`);

const repos = user.repositories.nodes || [];
const totalStars = repos.reduce((n, r) => n + (r.stargazerCount || 0), 0);
const yearsActive = Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (365.25 * 86400000)));

const languageMap = new Map();
for (const repo of repos) {
  for (const edge of repo.languages?.edges || []) {
    const key = edge.node.name;
    const prev = languageMap.get(key) || { size: 0, color: edge.node.color || "#8b949e" };
    prev.size += edge.size || 0;
    if (edge.node.color) prev.color = edge.node.color;
    languageMap.set(key, prev);
  }
}
const languageTotal = [...languageMap.values()].reduce((n, x) => n + x.size, 0) || 1;
const languages = [...languageMap.entries()]
  .sort((a,b) => b[1].size - a[1].size)
  .slice(0,5)
  .map(([name, v]) => ({
    name,
    pct: Math.max(1, Math.round((v.size / languageTotal) * 100)),
    color: v.color || "#8b949e"
  }));

const featuredOrder = [
  "Leaflet-Digital-Solution",
  "3D-Portfolio-threejs",
  "Meal-Map",
  "chatify",
  "StudentPortal",
  "Aeterna"
];

const featured = featuredOrder
  .map(name => repos.find(r => r.name === name))
  .filter(Boolean);

for (const repo of [...repos].sort((a,b) => b.stargazerCount - a.stargazerCount || new Date(b.pushedAt) - new Date(a.pushedAt))) {
  if (featured.length >= 6) break;
  if (!featured.some(x => x.name === repo.name) && repo.name !== USERNAME) featured.push(repo);
}

const esc = s => String(s ?? "")
  .replaceAll("&","&amp;").replaceAll("<","&lt;")
  .replaceAll(">","&gt;").replaceAll('"',"&quot;");

const rect = (x,y,w,h,rx=8,fill="#080a09",stroke="#232825",sw=1) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

const text = (x,y,s,size=14,fill="#e6edf3",weight=400,anchor="start",opacity=1,spacing=0) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" letter-spacing="${spacing}">${esc(s)}</text>`;

const wrap = (value, limit=60) => {
  const words = String(value || "Project from my GitHub portfolio.").split(/\s+/);
  const lines=[]; let line="";
  for (const word of words) {
    if ((line + " " + word).trim().length > limit) {
      if (line) lines.push(line);
      line=word;
    } else line=(line+" "+word).trim();
  }
  if (line) lines.push(line);
  return lines;
};

const heatColor = count => {
  if (!count) return "#0b2013";
  if (count === 1) return "#0e4429";
  if (count <= 3) return "#006d32";
  if (count <= 6) return "#26a641";
  return "#39d353";
};

const techs = [
  ["JS","#f7df1e","#111111"],["TS","#3178c6","#ffffff"],["⚛","#20232a","#61dafb"],
  ["N","#111111","#ffffff"],["NODE","#173b24","#74b65a"],["EX","#181a1d","#ffffff"],
  ["MDB","#0b2e22","#47a248"],["PG","#1d3046","#6ea1cf"],["TW","#082630","#38bdf8"],
  ["3D","#141414","#ffffff"],["GIT","#361c18","#f05032"],["GH","#17191c","#ffffff"],
  ["DKR","#10243f","#2496ed"],["VITE","#231b3c","#a78bfa"],["VS","#10253d","#23a8f2"]
];

const techIcon = (x,y,label,bg,fg,w=50,h=50) => {
  const fs=label.length<=3?14:10;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="11" fill="${bg}" stroke="#29302b"/>`
    + text(x+w/2,y+h/2+5,label,fs,fg,800,"middle");
};

function desktop() {
  const W=1200,H=1365,m=18,cw=W-2*m;
  const p=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(user.name || user.login)} GitHub dashboard">
<style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif}</style>
<rect width="100%" height="100%" fill="#000000"/>`];

  p.push(rect(m,18,cw,100,9,"#080a09"));
  p.push(text(38,53,`Welcome to ${user.name || user.login}'s Hub`,20,"#f0f6fc",700));
  p.push(text(38,80,user.bio || "Full-stack developer building modern web experiences.",12,"#8b949e"));
  p.push(text(W-38,50,`PROFILE // ${user.login.toUpperCase()}`,10,"#656d76",700,"end",1,1.2));
  p.push(text(W-38,75,"Auto-refreshed by GitHub Actions",10,"#39d353",600,"end"));

  const stats=[["▱",user.repositories.totalCount,"TOTAL REPOS"],["☆",totalStars,"TOTAL STARS"],["♙",user.followers.totalCount,"FOLLOWERS"],["◷",yearsActive,"YEARS ACTIVE"]];
  const y=138,h=112,gap=14,cardw=(cw-3*gap)/4;
  stats.forEach(([ic,val,lab],i)=>{
    const x=m+i*(cardw+gap);
    p.push(rect(x,y,cardw,h,9));
    p.push(text(x+cardw/2,y+29,ic,16,"#727b75",400,"middle"));
    p.push(text(x+cardw/2,y+69,val,31,"#f0f6fc",750,"middle"));
    p.push(text(x+cardw/2,y+93,lab,10,"#7d8590",600,"middle",1,1.1));
  });

  const cy=270,ch=226;
  p.push(rect(m,cy,cw,ch,9));
  p.push(text(34,cy+31,"Contributions",14,"#e6edf3",650));
  p.push(text(W-34,cy+31,`Total Contributions: ${user.contributionsCollection.contributionCalendar.totalContributions}`,11,"#c9d1d9",500,"end"));

  const weeks=user.contributionsCollection.contributionCalendar.weeks.slice(-52);
  const gx=82,gy=340,sq=12,gg=3;
  let lastMonth=-1;
  weeks.forEach((week,c)=>{
    const first=week.contributionDays[0];
    if (first) {
      const d=new Date(first.date+"T00:00:00Z");
      const month=d.getUTCMonth();
      if (month!==lastMonth && c<49) {
        p.push(text(gx+c*(sq+gg),gy-18,d.toLocaleString("en-US",{month:"short",timeZone:"UTC"}),9,"#656d76"));
        lastMonth=month;
      }
    }
    week.contributionDays.forEach((day,r)=>{
      p.push(`<rect x="${gx+c*(sq+gg)}" y="${gy+r*(sq+gg)}" width="${sq}" height="${sq}" rx="2.5" fill="${heatColor(day.contributionCount)}"/>`);
    });
  });
  [[1,"Mon"],[3,"Wed"],[5,"Fri"]].forEach(([r,l])=>p.push(text(34,gy+r*(sq+gg)+10,l,9,"#656d76")));
  p.push(text(34,cy+ch-17,"Last 52 weeks of activity · refreshed automatically",10,"#5f675f"));

  const sy=516,sh=222,splitgap=14,half=(cw-splitgap)/2;
  p.push(rect(m,sy,half,sh,9)); p.push(rect(m+half+splitgap,sy,half,sh,9));
  p.push(text(34,sy+31,"CORE TECHNOLOGIES",10,"#69716c",700,"start",1,1.2));
  let x=34,yy=sy+61;
  const chips=[...languages.map(l=>[l.name,l.color]),["React","#61dafb"],["Next.js","#d7dce2"],["Node.js","#74b65a"],["Three.js","#a6a6a6"]];
  const seen=new Set();
  chips.filter(([name])=>!seen.has(name)&&seen.add(name)).slice(0,9).forEach(([name,col])=>{
    const w=25+name.length*7;
    if(x+w>m+half-20){x=34;yy+=34}
    p.push(`<rect x="${x}" y="${yy}" width="${w}" height="24" rx="12" fill="#101311" stroke="#252b27"/>`);
    p.push(`<circle cx="${x+12}" cy="${yy+12}" r="4" fill="${col || "#8b949e"}"/>`);
    p.push(text(x+23,yy+16,name,10,"#d0d7de",550)); x+=w+8;
  });

  const rx=m+half+splitgap,cx=rx+150,ccy=sy+122,r=52,circ=2*Math.PI*r;
  p.push(text(rx+22,sy+31,"LANGUAGES",10,"#69716c",700,"start",1,1.2));
  let off=0;
  languages.forEach(l=>{
    const dash=circ*l.pct/100;
    p.push(`<circle cx="${cx}" cy="${ccy}" r="${r}" fill="none" stroke="${l.color}" stroke-width="18" stroke-dasharray="${dash.toFixed(1)} ${(circ-dash).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${cx} ${ccy})"/>`);
    off+=dash;
  });
  p.push(`<circle cx="${cx}" cy="${ccy}" r="35" fill="#080a09"/>`);
  p.push(text(cx,ccy-2,`${languages.length} langs`,10,"#8b949e",600,"middle"));
  p.push(text(cx,ccy+15,"tracked",9,"#5f675f",400,"middle"));
  const lx=rx+270,ly=sy+70;
  languages.forEach((l,i)=>{
    const y=ly+i*27;
    p.push(`<circle cx="${lx}" cy="${y}" r="5" fill="${l.color}"/>`);
    p.push(text(lx+15,y+4,l.name,11,"#c9d1d9",500));
    p.push(text(rx+half-22,y+4,`${l.pct}%`,11,"#8b949e",500,"end"));
  });

  const ty=758,th=154;
  p.push(rect(m,ty,cw,th,9)); p.push(text(34,ty+31,"TECH STACK",10,"#69716c",700,"start",1,1.2));
  let ix=34,iy=ty+56;
  techs.forEach(([lab,bg,fg])=>{p.push(techIcon(ix,iy,lab,bg,fg));ix+=62});
  p.push(text(34,ty+130,"JavaScript · TypeScript · React · Next.js · Node.js · Express · MongoDB · PostgreSQL · Tailwind · Three.js · Git · GitHub · Docker",10,"#727b75"));

  const py=949;
  p.push(text(28,py,"▱",15,"#8b949e")); p.push(text(50,py,"Notable Projects",16,"#e6edf3",650));
  p.push(`<rect x="${W-134}" y="${py-24}" width="114" height="32" rx="7" fill="#080a09" stroke="#232825"/>`);
  p.push(text(W-77,py-3,"Featured Work",10,"#c9d1d9",550,"middle"));

  const cardgap=14,cardw=(cw-cardgap)/2,cardh=112;
  featured.slice(0,6).forEach((repo,idx)=>{
    const row=Math.floor(idx/2),col=idx%2,x=m+col*(cardw+cardgap),y=py+24+row*(cardh+13);
    p.push(rect(x,y,cardw,cardh,9)); p.push(text(x+16,y+28,"▱",12,"#656d76"));
    p.push(text(x+38,y+29,repo.name,13,"#39d353",650));
    const lang=repo.primaryLanguage?.name || "Repo",bw=Math.max(58,22+lang.length*6);
    p.push(`<rect x="${x+cardw-bw-14}" y="${y+14}" width="${bw}" height="22" rx="11" fill="#101311" stroke="#252b27"/>`);
    p.push(text(x+cardw-bw/2-14,y+29,lang,9,"#8b949e",550,"middle"));
    wrap(repo.description || "Project from my GitHub portfolio.",60).slice(0,2).forEach((line,li)=>p.push(text(x+16,y+57+li*15,line,10,"#8b949e")));
    p.push(text(x+16,y+96,`★ ${repo.stargazerCount}     ⑂ ${repo.forkCount}`,10,"#5f675f"));
  });

  p.push("</svg>");
  return p.join("\n");
}

function mobile() {
  const W=680,H=2180,m=16,cw=W-32,p=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(user.name || user.login)} GitHub dashboard mobile"><style>text{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Arial,sans-serif}</style><rect width="100%" height="100%" fill="#000000"/>`];
  p.push(rect(m,16,cw,118,9)); p.push(text(32,49,`Welcome to ${user.name || user.login}'s Hub`,19,"#f0f6fc",700)); p.push(text(32,76,user.bio || "Full-stack developer building modern web experiences.",11,"#8b949e")); p.push(text(32,105,`${user.login.toUpperCase()} · AUTO-REFRESHED`,9,"#39d353",650,"start",1,1));
  const stats=[["▱",user.repositories.totalCount,"TOTAL REPOS"],["☆",totalStars,"TOTAL STARS"],["♙",user.followers.totalCount,"FOLLOWERS"],["◷",yearsActive,"YEARS ACTIVE"]],y=152,gap=12,cardw=(cw-gap)/2,h=96;
  stats.forEach(([ic,val,lab],i)=>{const row=Math.floor(i/2),col=i%2,x=m+col*(cardw+gap),yy=y+row*(h+gap);p.push(rect(x,yy,cardw,h,9));p.push(text(x+cardw/2,yy+24,ic,13,"#727b75",400,"middle"));p.push(text(x+cardw/2,yy+56,val,27,"#f0f6fc",750,"middle"));p.push(text(x+cardw/2,yy+79,lab,9,"#7d8590",600,"middle",1,1));});
  const cy=y+2*(h+gap)+12,ch=270; p.push(rect(m,cy,cw,ch,9)); p.push(text(32,cy+31,"Contributions",14,"#e6edf3",650)); p.push(text(W-32,cy+31,`${user.contributionsCollection.contributionCalendar.totalContributions} total`,10,"#8b949e",550,"end"));
  const weeks=user.contributionsCollection.contributionCalendar.weeks.slice(-26),gx=48,gy=cy+73,sq=17,gg=4; weeks.forEach((week,c)=>week.contributionDays.forEach((day,r)=>p.push(`<rect x="${gx+c*(sq+gg)}" y="${gy+r*(sq+gg)}" width="${sq}" height="${sq}" rx="3" fill="${heatColor(day.contributionCount)}"/>`))); p.push(text(32,cy+ch-18,"Recent activity · automatically refreshed",10,"#5f675f"));
  const sy=cy+ch+14,sh=215;p.push(rect(m,sy,cw,sh,9));p.push(text(32,sy+31,"CORE TECHNOLOGIES",10,"#69716c",700,"start",1,1.2));let x=32,yy=sy+58;const chips=[...languages.map(l=>[l.name,l.color]),["React","#61dafb"],["Next.js","#d7dce2"],["Node.js","#74b65a"],["Three.js","#a6a6a6"]],seen=new Set();chips.filter(([n])=>!seen.has(n)&&seen.add(n)).slice(0,9).forEach(([name,col])=>{const w=25+name.length*7;if(x+w>W-32){x=32;yy+=34}p.push(`<rect x="${x}" y="${yy}" width="${w}" height="24" rx="12" fill="#101311" stroke="#252b27"/>`);p.push(`<circle cx="${x+12}" cy="${yy+12}" r="4" fill="${col || "#8b949e"}"/>`);p.push(text(x+23,yy+16,name,10,"#d0d7de",550));x+=w+8});
  const ly=sy+sh+14,lh=290;p.push(rect(m,ly,cw,lh,9));p.push(text(32,ly+31,"LANGUAGES",10,"#69716c",700,"start",1,1.2));const cx=188,ccy=ly+160,r=50,circ=2*Math.PI*r;let off=0;languages.forEach(l=>{const dash=circ*l.pct/100;p.push(`<circle cx="${cx}" cy="${ccy}" r="${r}" fill="none" stroke="${l.color}" stroke-width="17" stroke-dasharray="${dash.toFixed(1)} ${(circ-dash).toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${cx} ${ccy})"/>`);off+=dash});p.push(`<circle cx="${cx}" cy="${ccy}" r="34" fill="#080a09"/>`);p.push(text(cx,ccy+4,`${languages.length} langs`,10,"#8b949e",600,"middle"));const lx=350,lyy=ly+83;languages.forEach((l,i)=>{const y=lyy+i*32;p.push(`<circle cx="${lx}" cy="${y}" r="5" fill="${l.color}"/>`);p.push(text(lx+16,y+4,l.name,11,"#c9d1d9",500));p.push(text(W-40,y+4,`${l.pct}%`,11,"#8b949e",500,"end"))});
  const ty=ly+lh+14,th=248;p.push(rect(m,ty,cw,th,9));p.push(text(32,ty+31,"TECH STACK",10,"#69716c",700,"start",1,1.2));let ix=32,iy=ty+57;techs.forEach(([lab,bg,fg])=>{if(ix+50>W-32){ix=32;iy+=62}p.push(techIcon(ix,iy,lab,bg,fg));ix+=62});
  const py=ty+th+42;p.push(text(22,py,"▱",15,"#8b949e"));p.push(text(46,py,"Notable Projects",16,"#e6edf3",650));const cardh=112;featured.slice(0,6).forEach((repo,idx)=>{const x=m,y=py+24+idx*(cardh+12);p.push(rect(x,y,cw,cardh,9));p.push(text(x+16,y+28,"▱",12,"#656d76"));p.push(text(x+38,y+29,repo.name,13,"#39d353",650));const lang=repo.primaryLanguage?.name || "Repo",bw=Math.max(58,22+lang.length*6);p.push(`<rect x="${x+cw-bw-14}" y="${y+14}" width="${bw}" height="22" rx="11" fill="#101311" stroke="#252b27"/>`);p.push(text(x+cw-bw/2-14,y+29,lang,9,"#8b949e",550,"middle"));wrap(repo.description || "Project from my GitHub portfolio.",74).slice(0,2).forEach((line,li)=>p.push(text(x+16,y+57+li*15,line,10,"#8b949e")));p.push(text(x+16,y+96,`★ ${repo.stargazerCount}     ⑂ ${repo.forkCount}`,10,"#5f675f"))});
  p.push("</svg>");return p.join("\n");
}

fs.mkdirSync("assets", { recursive: true });
fs.writeFileSync("assets/dashboard.svg", desktop());
fs.writeFileSync("assets/dashboard-mobile.svg", mobile());
console.log("Dashboard refreshed.");
