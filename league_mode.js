const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');

const old = "function renderTable(){\n  const el=document.getElementById('table-container');if(!el)return;\n  const gs=getGroupStats();\n  const hasTeams=GN.some(g=>(S.groups[g]||[]).length>0);\n  if(!hasTeams){el.innerHTML=`<div class=\"empty-state\"><div class=\"big\">&#x1F4CA;</div><p>Generate groups first.</p></div>`;return;}";

const newCode = "function renderTable(){\n  const el=document.getElementById('table-container');if(!el)return;\n  if(S.tournamentFormat==='league'){renderLeagueTable();return;}\n  const gs=getGroupStats();\n  const hasTeams=GN.some(g=>(S.groups[g]||[]).length>0);\n  if(!hasTeams){el.innerHTML=`<div class=\"empty-state\"><div class=\"big\">&#x1F4CA;</div><p>Generate groups first.</p></div>`;return;}";

if(html.includes(old)){
  html = html.replace(old, newCode);
  fs.writeFileSync('app.html', html, 'utf8');
  console.log('SUCCESS - renderTable fixed');
} else {
  console.log('FAILED - text not found');
}