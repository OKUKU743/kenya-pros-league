const fs = require('fs');
let content = fs.readFileSync('app.html', 'utf8');

// 1. Add tournament format modal HTML after the PIN modal closing div
const pinModalEnd = '<!-- HEADER -->';
const formatModal = `<!-- FORMAT SELECTION MODAL -->
<div id="format-modal" style="position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(4,6,42,0.92);backdrop-filter:blur(8px);opacity:0;visibility:hidden;transition:opacity 0.25s,visibility 0.25s;">
  <div style="background:#0A0E28;border:1px solid rgba(27,86,245,0.2);border-top:2px solid #F0B429;border-radius:16px;padding:32px 28px;width:min(420px,90vw);text-align:center;box-shadow:0 24px 80px rgba(0,0,0,0.8);">
    <div style="font-size:36px;margin-bottom:12px;">⚙️</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:24px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Select <span style="color:#F0B429;">Format</span></div>
    <div style="font-size:12px;color:#4A5A9A;margin-bottom:28px;letter-spacing:0.5px;">Choose how this tournament will be played</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px;">
      <button onclick="selectFormat('championship')" style="background:rgba(27,86,245,0.08);border:2px solid rgba(27,86,245,0.3);border-radius:12px;padding:20px 14px;cursor:pointer;transition:all 0.2s;text-align:center;" onmouseover="this.style.borderColor='#1B56F5';this.style.background='rgba(27,86,245,0.15)'" onmouseout="this.style.borderColor='rgba(27,86,245,0.3)';this.style.background='rgba(27,86,245,0.08)'">
        <div style="font-size:32px;margin-bottom:8px;">🏆</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#E8F0FF;margin-bottom:4px;">Championship</div>
        <div style="font-size:11px;color:#4A5A9A;line-height:1.4;">Groups + Knockout<br>Semi-finals & Final</div>
      </button>
      <button onclick="selectFormat('league')" style="background:rgba(240,180,41,0.06);border:2px solid rgba(240,180,41,0.25);border-radius:12px;padding:20px 14px;cursor:pointer;transition:all 0.2s;text-align:center;" onmouseover="this.style.borderColor='#F0B429';this.style.background='rgba(240,180,41,0.12)'" onmouseout="this.style.borderColor='rgba(240,180,41,0.25)';this.style.background='rgba(240,180,41,0.06)'">
        <div style="font-size:32px;margin-bottom:8px;">📋</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:900;font-size:16px;letter-spacing:1px;text-transform:uppercase;color:#E8F0FF;margin-bottom:4px;">League</div>
        <div style="font-size:11px;color:#4A5A9A;line-height:1.4;">Full home & away<br>Top team wins in 48hrs</div>
      </button>
    </div>
    <button onclick="closeFormatModal()" style="background:none;border:none;color:#4A5A9A;font-size:12px;cursor:pointer;padding:6px 14px;font-family:'Inter',sans-serif;">Cancel</button>
  </div>
</div>

`;

if(content.includes(pinModalEnd)){
  content = content.replace(pinModalEnd, formatModal + pinModalEnd);
  console.log('FORMAT MODAL - added');
} else {
  console.log('FORMAT MODAL - NOT FOUND');
}

// 2. Replace generateGroups function
const oldFn = `function generateGroups(){
  if(S.teams.length<8){alert('Add at least 8 teams.');return;}
  if(S.fixtures.length>0&&!confirm('Replace all groups, fixtures and results?')) return;`;

const newFn = `function generateGroups(){
  if(S.teams.length<8){alert('Add at least 8 teams.');return;}
  if(S.fixtures.length>0&&!confirm('Replace all groups, fixtures and results?')) return;
  // Show format selection modal
  document.getElementById('format-modal').style.opacity='1';
  document.getElementById('format-modal').style.visibility='visible';
}

function closeFormatModal(){
  const m=document.getElementById('format-modal');
  m.style.opacity='0';m.style.visibility='hidden';
}

function selectFormat(format){
  closeFormatModal();
  S.tournamentFormat = format;
  if(format==='league') generateLeague();
  else generateChampionship();
}

function generateLeague(){
  const clubs=S.teams.map(t=>t.club);
  S.groups={};S.ties={};S.knockout={semis:[],final:null};
  const fixtures=[];let id=0;
  for(let i=0;i<clubs.length;i++){
    for(let j=i+1;j<clubs.length;j++){
      fixtures.push({id:id++,group:'L',home:clubs[i],away:clubs[j],homeGoals:null,awayGoals:null,played:false,round:1,leg:1});
      fixtures.push({id:id++,group:'L',home:clubs[j],away:clubs[i],homeGoals:null,awayGoals:null,played:false,round:2,leg:2});
    }
  }
  S.fixtures=fixtures;S.round=1;
  S.leagueStartTime=Date.now();
  S.leagueDeadline=Date.now()+(48*60*60*1000);
  save();renderAll();
  showToast('League generated — 48hr countdown started!');
  switchTab('fixtures',document.querySelectorAll('.tab')[2]);
}

function generateChampionship(){
  if(S.teams.length<8){alert('Add at least 8 teams.');return;}`;

if(content.includes(oldFn)){
  content = content.replace(oldFn, newFn);
  console.log('GENERATE FUNCTION - updated');
} else {
  console.log('GENERATE FUNCTION - NOT FOUND');
}

// 3. Add league table render and winner logic
const oldLeagueTable = `function renderGroups(){`;
const newLeagueTable = `function getLeagueStats(S){
  const clubs=S.teams.map(t=>t.club);
  const stats={};
  clubs.forEach(c=>{stats[c]={p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0,cs:0,form:[],player:(S.teams.find(t=>t.club===c)||{}).player||''};});
  (S.fixtures||[]).filter(f=>f.group==='L'&&f.played).sort((a,b)=>a.round-b.round).forEach(f=>{
    const h=stats[f.home],a=stats[f.away];if(!h||!a)return;
    h.p++;a.p++;h.gf+=f.homeGoals;h.ga+=f.awayGoals;a.gf+=f.awayGoals;a.ga+=f.homeGoals;
    if(f.awayGoals===0)h.cs++;if(f.homeGoals===0)a.cs++;
    if(f.homeGoals>f.awayGoals){h.w++;h.pts+=3;h.form.push('W');a.l++;a.form.push('L');}
    else if(f.homeGoals<f.awayGoals){a.w++;a.pts+=3;a.form.push('W');h.l++;h.form.push('L');}
    else{h.d++;h.pts++;h.form.push('D');a.d++;a.pts++;a.form.push('D');}
  });
  return Object.entries(stats).map(([club,s])=>({club,...s,gd:s.gf-s.ga})).sort((a,b)=>b.pts-a.pts||b.gd-a.gd||b.gf-a.gf);
}

function getLeagueWinner(){
  if(S.tournamentFormat!=='league') return null;
  const allPlayed=S.fixtures.filter(f=>f.group==='L').every(f=>f.played);
  const deadlinePassed=S.leagueDeadline&&Date.now()>S.leagueDeadline;
  if(!allPlayed&&!deadlinePassed) return null;
  const table=getLeagueStats(S);
  return table[0]||null;
}

function renderLeagueCountdown(){
  const el=document.getElementById('league-countdown');if(!el)return;
  if(S.tournamentFormat!=='league'||!S.leagueDeadline){el.style.display='none';return;}
  el.style.display='block';
  const ms=S.leagueDeadline-Date.now();
  if(ms<=0){el.innerHTML='<div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:12px 16px;font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:14px;letter-spacing:1px;color:#22C55E;">⏱ SEASON COMPLETE — Results finalised</div>';return;}
  const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000);
  el.innerHTML='<div style="background:rgba(240,180,41,0.08);border:1px solid rgba(240,180,41,0.25);border-radius:8px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;"><span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#F0B429;">⏰ Season Deadline</span><span style="font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:22px;color:#E8F0FF;letter-spacing:2px;">'+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'</span></div>';
}

function renderGroups(){`;

if(content.includes(oldLeagueTable)){
  content = content.replace(oldLeagueTable, newLeagueTable);
  console.log('LEAGUE STATS - added');
} else {
  console.log('LEAGUE STATS - NOT FOUND');
}

// 4. Update renderGroups to handle league mode
const oldGroupsBody = `  const el=document.getElementById('groups-container');if(!el)return;
  const gs=getGroupStats();
  const hasTeams=GN.some(g=>(S.groups[g]||[]).length>0);
  if(!hasTeams){el.innerHTML=\`<div class="empty-state"><div class="big">&#x1F4CA;</div><p>Generate groups from the Teams tab.</p></div>\`;return;}`;

const newGroupsBody = `  const el=document.getElementById('groups-container');if(!el)return;

  // League mode
  if(S.tournamentFormat==='league'){
    const table=getLeagueStats(S);
    const winner=getLeagueWinner();
    const medals=['🥇','🥈','🥉'];
    if(!table.length){el.innerHTML='<div class="empty-state"><div class="big">📋</div><p>League fixtures generated. Enter results in the Results tab.</p></div>';return;}
    el.innerHTML='<div id="league-countdown" style="margin-bottom:18px;"></div>'+
    (winner?'<div style="background:linear-gradient(135deg,rgba(240,180,41,0.1),rgba(27,86,245,0.05));border:1px solid rgba(240,180,41,0.3);border-radius:14px;padding:20px;text-align:center;margin-bottom:20px;"><div style="font-size:32px;margin-bottom:6px;">🏆</div><div style="font-family:\'Barlow Condensed\',sans-serif;font-weight:900;font-size:28px;letter-spacing:1px;text-transform:uppercase;color:#F0B429;">'+winner.club+'</div><div style="font-size:13px;color:#7C9EFF;margin-top:4px;">👤 '+winner.player+' — League Champion</div></div>':'')+
    '<div class="full-table-wrap"><div class="full-table-header" style="color:#7C9EFF;">📋 League Table</div><table class="full-pl-table"><thead><tr><th>#</th><th>Club</th><th>Player</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Form</th><th>PTS</th></tr></thead><tbody>'+
    table.map((t,i)=>{
      const rc=i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':'rank-other';
      return '<tr><td><span class="rank-badge '+rc+'">'+(i<3?medals[i]:i+1)+'</span></td><td><div class="team-cell-sm">'+miniBadge(t.club)+'<div class="cell-club">'+t.club+'</div></div></td><td><div style="font-size:12px;color:#7C9EFF">👤 '+t.player+'</div></td><td>'+t.p+'</td><td>'+t.w+'</td><td>'+t.d+'</td><td>'+t.l+'</td><td>'+t.gf+'</td><td>'+t.ga+'</td><td style="color:'+(t.gd>0?'#22C55E':t.gd<0?'#E53E6D':'inherit')+'">'+( t.gd>0?'+':'')+t.gd+'</td><td><div style="display:flex;gap:2px">'+t.form.slice(-5).map(r=>'<span class="form-pill form-'+r+'">'+r+'</span>').join('')+'</div></td><td class="pts">'+t.pts+'</td></tr>';
    }).join('')+
    '</tbody></table></div>';
    renderLeagueCountdown();
    setInterval(renderLeagueCountdown,1000);
    return;
  }

  const gs=getGroupStats();
  const hasTeams=GN.some(g=>(S.groups[g]||[]).length>0);
  if(!hasTeams){el.innerHTML=\`<div class="empty-state"><div class="big">&#x1F4CA;</div><p>Generate groups from the Teams tab.</p></div>\`;return;}`;

if(content.includes(oldGroupsBody)){
  content = content.replace(oldGroupsBody, newGroupsBody);
  console.log('RENDER GROUPS - updated');
} else {
  console.log('RENDER GROUPS - NOT FOUND');
}

// 5. Update renderChampion to handle league mode
const oldChampion = `function renderChampion(){
  const el=document.getElementById('champion-display');if(!el)return;
  ensureFinal();const fin=S.knockout.final;const champ=fin?koWinner(fin):null;`;

const newChampion = `function renderChampion(){
  const el=document.getElementById('champion-display');if(!el)return;
  // League mode winner
  if(S.tournamentFormat==='league'){
    const winner=getLeagueWinner();
    if(!winner){el.innerHTML='<div class="champ-no-winner">Complete all league matches or wait for the 48hr deadline.</div>';return;}
    const url=CRESTS[winner.club];const ini2=winner.club.split(/\\s+/).slice(0,2).map(w=>w[0].toUpperCase()).join('');
    el.innerHTML='<div class="champ-label">Kenya Pro\'s League Champion</div><div class="champ-trophy-wrap">'+trophySVG()+'</div><div class="champ-badge-wrap">'+(url?'<img src="'+url+'" class="champ-badge" alt="'+winner.club+'"><div class="champ-badge-fb" style="display:none">'+ini2+'</div>':'<div class="champ-badge-fb">'+ini2+'</div>')+'</div><div class="champ-club">'+winner.club+'</div><div class="champ-player">👤 '+winner.player+'</div><div class="champ-stats-row"><div class="champ-stat-item"><div class="champ-stat-val">'+winner.pts+'</div><div class="champ-stat-lbl">Points</div></div><div class="champ-stat-item"><div class="champ-stat-val">'+winner.w+'</div><div class="champ-stat-lbl">Wins</div></div><div class="champ-stat-item"><div class="champ-stat-val">'+winner.gf+'</div><div class="champ-stat-lbl">Goals</div></div></div><div class="champ-divider"></div><div class="champ-ribbon"><span class="champ-ribbon-text">🏆 League Champion — Season 1 🏆</span></div><div class="stars">★ ★ ★</div>';
    return;
  }
  ensureFinal();const fin=S.knockout.final;const champ=fin?koWinner(fin):null;`;

if(content.includes(oldChampion)){
  content = content.replace(oldChampion, newChampion);
  console.log('RENDER CHAMPION - updated');
} else {
  console.log('RENDER CHAMPION - NOT FOUND');
}

fs.writeFileSync('app.html', content, 'utf8');
console.log('DONE - all changes written');