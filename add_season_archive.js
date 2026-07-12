const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');
let fixed = 0;

// STEP 1: Add History tab button after Predictions tab
const old1 = "    <button class=\"tab\" onclick=\"switchTab('predictions',this)\">&#x1F3AF; Predict</button>";
const new1 = "    <button class=\"tab\" onclick=\"switchTab('predictions',this)\">&#x1F3AF; Predict</button>\n    <button class=\"tab\" onclick=\"switchTab('history',this)\">&#x1F4DC; History</button>";
if(html.includes(old1)){html=html.replace(old1,new1);console.log('STEP 1 OK - History tab added');fixed++;}
else{console.log('STEP 1 FAILED');}

// STEP 2: Add History section HTML before closing main div
const old2 = '  <!-- ANNOUNCEMENTS -->';
const new2 = `  <!-- HISTORY -->
  <div id="tab-history" class="section">
    <div class="section-header"><div class="section-title">&#x1F4DC; Season <span>History</span></div></div>
    <div class="info-bar">Every completed season — archived forever. The legacy of Kenya Pro's League.</div>
    <div id="history-container"></div>
  </div>

  <!-- ANNOUNCEMENTS -->`;
if(html.includes(old2)){html=html.replace(old2,new2);console.log('STEP 2 OK - History section added');fixed++;}
else{console.log('STEP 2 FAILED');}

// STEP 3: Add History to renders map
const old3 = "predictions:renderPredictions};";
const new3 = "predictions:renderPredictions,history:renderHistory};";
if(html.includes(old3)){html=html.replace(old3,new3);console.log('STEP 3 OK - History render added');fixed++;}
else{console.log('STEP 3 FAILED');}

// STEP 4: Add End Season button to Teams tab header
const old4 = "      <div style=\"display:flex;gap:10px;flex-wrap:wrap;\">\n        <button class=\"btn btn-secondary\" onclick=\"requireAdmin(generateGroups)\">Generate Groups &amp; Fixtures</button>\n        <button class=\"btn btn-danger\" onclick=\"requireAdmin(clearAll)\">Reset All</button>\n      </div>";
const new4 = "      <div style=\"display:flex;gap:10px;flex-wrap:wrap;\">\n        <button class=\"btn btn-secondary\" onclick=\"requireAdmin(generateGroups)\">Generate Groups &amp; Fixtures</button>\n        <button class=\"btn btn-gold\" onclick=\"requireAdmin(endSeason)\">&#x1F3C6; End Season</button>\n        <button class=\"btn btn-danger\" onclick=\"requireAdmin(clearAll)\">Reset All</button>\n      </div>";
if(html.includes(old4)){html=html.replace(old4,new4);console.log('STEP 4 OK - End Season button added');fixed++;}
else{console.log('STEP 4 FAILED');}

// STEP 5: Add season archive functions before PUSH NOTIFICATIONS
const marker = '// ── PUSH NOTIFICATIONS ──';
const archiveFunctions = `// ── SEASON ARCHIVE ──
async function endSeason(){
  if(!confirm('End Season '+( (S.seasonNumber||1))+' and archive all data? This cannot be undone.')) return;
  if(!confirm('Are you sure? Members will be reset and a new season will begin.')) return;

  // Get champion
  var champion = null;
  var championPlayer = null;
  if(S.tournamentFormat==='league'){
    var lt=getLeagueTable();
    if(lt.length){champion=lt[0].club;championPlayer=lt[0].player;}
  } else {
    var fin=S.knockout&&S.knockout.final;
    if(fin&&fin.played){
      champion=fin.homeGoals>fin.awayGoals?fin.home:fin.awayGoals>fin.homeGoals?fin.away:(fin.penaltyWinner||null);
      if(champion) championPlayer=getPlayer(champion);
    }
  }

  // Get top scorer
  var topScorer=null;
  if(S.goalscorers){
    var tally={};
    S.fixtures.filter(function(f){return f.played&&!f.nullified;}).forEach(function(f){
      var logs=S.goalscorers[f.id];if(!logs)return;
      var all=[].concat((logs.home||[]).map(function(n){return{name:n,club:f.home};}),(logs.away||[]).map(function(n){return{name:n,club:f.away};}));
      all.forEach(function(g){
        if(!g.name||g.name==='Unknown')return;
        var k=g.name.toLowerCase();
        if(!tally[k])tally[k]={name:g.name,club:g.club,goals:0};
        tally[k].goals++;
      });
    });
    var arr=Object.values(tally).sort(function(a,b){return b.goals-a.goals;});
    if(arr.length)topScorer=arr[0];
  }

  // Build archive record
  var seasonNum = S.seasonNumber||1;
  var archiveData = {
    seasonNumber: seasonNum,
    format: S.tournamentFormat||'championship',
    champion: champion,
    championPlayer: championPlayer,
    topScorer: topScorer?topScorer.name:null,
    topScorerClub: topScorer?topScorer.club:null,
    topScorerGoals: topScorer?topScorer.goals:0,
    teams: S.teams||[],
    endedAt: new Date().toISOString(),
    totalMatches: (S.fixtures||[]).filter(function(f){return f.played&&!f.nullified;}).length,
    totalGoals: (S.fixtures||[]).filter(function(f){return f.played&&!f.nullified;}).reduce(function(a,f){return a+(f.homeGoals||0)+(f.awayGoals||0);},0),
  };

  // Save to Firestore seasons collection
  try {
    if(window._fbSaveSeason) await window._fbSaveSeason(seasonNum, archiveData);
    showToast('Season '+seasonNum+' archived successfully!');
  } catch(e){
    console.error('Archive failed:',e);
    showToast('Archive failed - check console.');
    return;
  }

  // Reset tournament state for new season
  S = {
    teams: [],
    groups: {},
    fixtures: [],
    knockout: {semis:[], final:null},
    round: 1,
    ties: {},
    announcements: [],
    goalscorers: {},
    predictions: {},
    seasonNumber: seasonNum + 1,
    tournamentFormat: null,
  };
  save();
  renderAll();
  showToast('Season '+(seasonNum+1)+' started! Add teams to begin.');
  switchTab('teams', document.querySelectorAll('.tab')[0]);
}

function renderHistory(){
  const el = document.getElementById('history-container');
  if(!el) return;
  el.innerHTML = '<div style="color:var(--dim);font-size:13px;padding:20px 0;">Loading history...</div>';
  if(window._fbGetSeasons) window._fbGetSeasons(function(seasons){
    if(!seasons||!seasons.length){
      el.innerHTML = '<div class="empty-state"><div class="big">&#x1F4DC;</div><p>No completed seasons yet.</p><p>Complete a season and click <strong>End Season</strong> to archive it here.</p></div>';
      return;
    }
    seasons.sort(function(a,b){return b.seasonNumber-a.seasonNumber;});
    var medals=['&#x1F947;','&#x1F948;','&#x1F949;'];
    var html2 = '<div style="display:grid;gap:20px;">';
    seasons.forEach(function(s){
      var url = s.champion?CRESTS[s.champion]:null;
      var ini = s.champion?s.champion.split(/\\s+/).slice(0,2).map(function(w){return w[0].toUpperCase();}).join(''):'?';
      html2 += '<div style="background:var(--card);border:1px solid rgba(27,86,245,0.15);border-radius:16px;overflow:hidden;">';
      html2 += '<div style="background:linear-gradient(135deg,rgba(240,180,41,0.1),rgba(27,86,245,0.05));border-bottom:1px solid rgba(240,180,41,0.2);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">';
      html2 += '<div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:22px;letter-spacing:1px;text-transform:uppercase;color:#F0B429;">&#x1F3C6; Season '+s.seasonNumber+'</div>';
      html2 += '<div style="font-size:11px;color:var(--dim);letter-spacing:1px;">'+new Date(s.endedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+'</div>';
      html2 += '</div>';
      html2 += '<div style="padding:20px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;">';
      if(s.champion){
        html2 += '<div style="flex-shrink:0;">'+(url?'<img src="'+url+'" style="width:64px;height:64px;object-fit:contain;border-radius:10px;">':'<div style="width:64px;height:64px;border-radius:50%;background:#111840;display:flex;align-items:center;justify-content:center;font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:24px;color:#7C9EFF;">'+ini+'</div>')+'</div>';
        html2 += '<div style="flex:1;"><div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:28px;letter-spacing:1px;text-transform:uppercase;color:#F0B429;">'+s.champion+'</div>';
        html2 += '<div style="font-size:13px;color:#7C9EFF;margin-top:2px;">&#x1F464; '+s.championPlayer+' &mdash; Champion</div></div>';
      } else {
        html2 += '<div style="color:var(--dim);font-size:14px;">No champion recorded</div>';
      }
      html2 += '</div>';
      html2 += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;background:rgba(27,86,245,0.1);border-top:1px solid rgba(27,86,245,0.1);">';
      var stats2=[
        {icon:'&#x26BD;',label:'Matches',val:s.totalMatches||0},
        {icon:'&#x1F525;',label:'Goals',val:s.totalGoals||0},
        {icon:'&#x1F465;',label:'Teams',val:(s.teams||[]).length},
        {icon:'&#x1F45F;',label:'Top Scorer',val:s.topScorer||(s.topScorerGoals?s.topScorerGoals+' goals':'—')},
      ];
      stats2.forEach(function(st){
        html2 += '<div style="background:var(--card);padding:14px;text-align:center;"><div style="font-size:20px;margin-bottom:4px;">'+st.icon+'</div><div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:18px;color:#E8F0FF;">'+st.val+'</div><div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;">'+st.label+'</div></div>';
      });
      html2 += '</div></div>';
    });
    html2 += '</div>';
    el.innerHTML = html2;
  });
}

// ── PUSH NOTIFICATIONS ──`;

if(html.includes(marker)){
  html=html.replace(marker, archiveFunctions);
  console.log('STEP 5 OK - archive functions added');fixed++;
} else {
  console.log('STEP 5 FAILED');
}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done. Fixed: '+fixed+'/5');