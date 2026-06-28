const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');
let fixed = 0;

// STEP 1: Add Predictions tab button
const oldTabs = "    <button class=\"tab\" onclick=\"switchTab('chat',this)\">Chat</button>";
const newTabs = "    <button class=\"tab\" onclick=\"switchTab('chat',this)\">Chat</button>\n    <button class=\"tab\" onclick=\"switchTab('predictions',this)\">&#x1F3AF; Predict</button>";
if(html.includes(oldTabs)){html=html.replace(oldTabs,newTabs);console.log('STEP 1 OK');fixed++;}
else{console.log('STEP 1 FAILED');}

// STEP 2: Add Predictions section HTML
const oldMain = '  <!-- ANNOUNCEMENTS -->';
const newMain = '  <!-- PREDICTIONS -->\n  <div id="tab-predictions" class="section">\n    <div class="section-header"><div class="section-title">&#x1F3AF; Match <span>Predictions</span></div></div>\n    <div class="info-bar">Predict the exact score before each match. Exact score = 3pts &middot; Correct winner = 1pt &middot; Wrong = 0pts</div>\n    <div id="predictions-leaderboard" style="margin-bottom:24px;"></div>\n    <div id="predictions-fixtures"></div>\n  </div>\n\n  <!-- ANNOUNCEMENTS -->';
if(html.includes(oldMain)){html=html.replace(oldMain,newMain);console.log('STEP 2 OK');fixed++;}
else{console.log('STEP 2 FAILED');}

// STEP 3: Add predictions to switchTab renders
const oldRenders = "const renders={groups:renderGroups,bracket:renderBracket,champion:renderChampion,fixtures:renderFixturesAll,results:renderResults,table:renderTable,stats:renderStats,teams:renderTeams,announcements:renderAnnouncements,chat:renderChat,members:renderMembers,'golden-boot':renderGoldenBoot};";
const newRenders = "const renders={groups:renderGroups,bracket:renderBracket,champion:renderChampion,fixtures:renderFixturesAll,results:renderResults,table:renderTable,stats:renderStats,teams:renderTeams,announcements:renderAnnouncements,chat:renderChat,members:renderMembers,'golden-boot':renderGoldenBoot,predictions:renderPredictions};";
if(html.includes(oldRenders)){html=html.replace(oldRenders,newRenders);console.log('STEP 3 OK');fixed++;}
else{console.log('STEP 3 FAILED');}

// STEP 4: Add prediction functions
const marker = '// ── PUSH NOTIFICATIONS ──';
const predFunctions = `// ── PREDICTIONS ──
function renderPredictions(){
  const el=document.getElementById('predictions-fixtures');
  const lb=document.getElementById('predictions-leaderboard');
  if(!el)return;
  const allFx=[...S.fixtures,...(S.knockout.semis||[]),...(S.knockout.final?[S.knockout.final]:[])];
  const unplayed=allFx.filter(f=>f.home&&f.away&&!f.played);
  const played=allFx.filter(f=>f.home&&f.away&&f.played);
  const preds=S.predictions||{};

  // Build leaderboard
  const scores={};
  played.forEach(f=>{
    const fp=preds[f.id]||{};
    Object.keys(fp).forEach(name=>{
      const p=fp[name];if(!p)return;
      if(!scores[name])scores[name]={name,pts:0,exact:0,winner:0,total:0};
      scores[name].total++;
      const ph=parseInt(p.home),pa=parseInt(p.away);
      if(ph===f.homeGoals&&pa===f.awayGoals){scores[name].pts+=3;scores[name].exact++;}
      else{
        const pw=ph>pa?'h':ph<pa?'a':'d';
        const aw=f.homeGoals>f.awayGoals?'h':f.homeGoals<f.awayGoals?'a':'d';
        if(pw===aw){scores[name].pts+=1;scores[name].winner++;}
      }
    });
  });
  const lbArr=Object.values(scores).sort((a,b)=>b.pts-a.pts||b.exact-a.exact);

  // Render leaderboard
  if(lb){
    if(!lbArr.length){
      lb.innerHTML='<div style="color:var(--dim);font-size:13px;margin-bottom:8px;">No predictions scored yet.</div>';
    } else {
      const medals=['&#x1F947;','&#x1F948;','&#x1F949;'];
      let lbHtml='<div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:22px;letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">&#x1F3C6; Prediction Leaderboard</div>';
      lbHtml+='<div style="display:grid;gap:10px;">';
      lbArr.slice(0,10).forEach(function(p,i){
        const border=i===0?'#FFD700':i===1?'rgba(192,192,192,0.6)':'rgba(205,127,50,0.5)';
        const bl=i<3?'border-left:2px solid '+border+';':'';
        lbHtml+='<div style="background:var(--card);border:1px solid rgba(27,86,245,0.12);border-radius:10px;padding:14px 16px;display:flex;align-items:center;gap:12px;'+bl+'">';
        lbHtml+='<div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:22px;min-width:32px;text-align:center;">'+(i<3?medals[i]:i+1)+'</div>';
        lbHtml+='<div style="flex:1;"><div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:18px;text-transform:uppercase;">'+p.name+'</div>';
        lbHtml+='<div style="font-size:11px;color:var(--dim);margin-top:2px;">&#x1F3AF; '+p.exact+' exact &middot; &#x2705; '+p.winner+' winner</div></div>';
        lbHtml+='<div style="text-align:right;"><div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:28px;color:var(--gold);">'+p.pts+'</div>';
        lbHtml+='<div style="font-size:10px;color:var(--dim);letter-spacing:1px;">PTS</div></div></div>';
      });
      lbHtml+='</div>';
      lb.innerHTML=lbHtml;
    }
  }

  // Render fixtures
  if(!unplayed.length){
    el.innerHTML='<div class="empty-state"><div class="big">&#x1F3AF;</div><p>No upcoming matches to predict.</p></div>';
    return;
  }

  let html2='<div style="font-family:Barlow Condensed,sans-serif;font-weight:700;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--dim);margin-bottom:12px;">UPCOMING MATCHES</div>';
  unplayed.forEach(function(f){
    const fp=preds[f.id]||{};
    const count=Object.keys(fp).length;
    const tag=f.stage?(f.stage==='semi'?'Semi-Final':'Final'):'Group '+f.group;
    html2+='<div style="background:var(--card);border:1px solid rgba(27,86,245,0.12);border-radius:12px;margin-bottom:14px;overflow:hidden;">';
    html2+='<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:rgba(0,0,0,0.25);border-bottom:1px solid rgba(27,86,245,0.1);">';
    html2+='<span style="font-family:Barlow Condensed,sans-serif;font-weight:700;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--grey);">'+tag+'</span>';
    html2+='<span style="font-size:11px;color:var(--dim);">'+count+' prediction'+(count!==1?'s':'')+'</span></div>';
    html2+='<div style="display:flex;align-items:center;padding:16px;gap:12px;">';
    html2+='<div style="flex:1;display:flex;align-items:center;gap:10px;">'+fixBadge(f.home);
    html2+='<div><div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:16px;text-transform:uppercase;">'+f.home+'</div>';
    html2+='<div style="font-size:11px;color:var(--grey);">'+getPlayer(f.home)+'</div></div></div>';
    html2+='<div style="text-align:center;min-width:100px;">';
    html2+='<div style="font-size:12px;color:var(--dim);letter-spacing:1px;margin-bottom:8px;">PREDICT</div>';
    html2+='<div style="display:flex;gap:4px;align-items:center;justify-content:center;">';
    html2+='<input type="number" min="0" max="20" id="ph-'+f.id+'" placeholder="0" style="width:42px;background:var(--bg);border:2px solid rgba(27,86,245,0.25);border-radius:6px;padding:6px 4px;color:var(--white);font-size:18px;font-weight:900;text-align:center;outline:none;">';
    html2+='<span style="font-size:16px;color:var(--dim);">-</span>';
    html2+='<input type="number" min="0" max="20" id="pa-'+f.id+'" placeholder="0" style="width:42px;background:var(--bg);border:2px solid rgba(27,86,245,0.25);border-radius:6px;padding:6px 4px;color:var(--white);font-size:18px;font-weight:900;text-align:center;outline:none;">';
    html2+='</div></div>';
    html2+='<div style="flex:1;display:flex;align-items:center;gap:10px;justify-content:flex-end;">';
    html2+='<div style="text-align:right;"><div style="font-family:Barlow Condensed,sans-serif;font-weight:900;font-size:16px;text-transform:uppercase;">'+f.away+'</div>';
    html2+='<div style="font-size:11px;color:var(--grey);">'+getPlayer(f.away)+'</div></div>'+fixBadge(f.away)+'</div></div>';
    html2+='<div style="padding:0 16px 14px;display:flex;gap:8px;align-items:center;">';
    html2+='<input type="text" id="pn-'+f.id+'" placeholder="Your name..." maxlength="20" style="flex:1;background:var(--bg);border:1px solid rgba(27,86,245,0.2);border-radius:6px;padding:8px 12px;color:var(--white);font-size:13px;outline:none;">';
    html2+='<button class="btn btn-small" onclick="submitPrediction('+f.id+')">Predict</button></div>';
    if(count>0){
      html2+='<div style="padding:0 16px 12px;"><div style="font-size:10px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">PREDICTIONS SO FAR</div>';
      html2+='<div style="display:flex;flex-wrap:wrap;gap:6px;">';
      Object.keys(fp).forEach(function(name){
        html2+='<span style="background:rgba(27,86,245,0.08);border:1px solid rgba(27,86,245,0.2);border-radius:6px;padding:4px 10px;font-size:11px;color:var(--grey);">'+name+': '+fp[name].home+'-'+fp[name].away+'</span>';
      });
      html2+='</div></div>';
    }
    html2+='</div>';
  });
  el.innerHTML=html2;
}

function submitPrediction(fid){
  const name=document.getElementById('pn-'+fid)?.value.trim();
  const home=document.getElementById('ph-'+fid)?.value;
  const away=document.getElementById('pa-'+fid)?.value;
  if(!name){showToast('Enter your name.');return;}
  if(home===''||away===''){showToast('Enter your predicted score.');return;}
  if(!S.predictions)S.predictions={};
  if(!S.predictions[fid])S.predictions[fid]={};
  S.predictions[fid][name]={home:parseInt(home),away:parseInt(away),time:Date.now()};
  save();
  showToast(name+' prediction saved: '+home+'-'+away);
  renderPredictions();
}

// ── PUSH NOTIFICATIONS ──`;

if(html.includes(marker)){
  html=html.replace(marker, predFunctions);
  console.log('STEP 4 OK');fixed++;
} else {
  console.log('STEP 4 FAILED');
}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done. Fixed: '+fixed+'/4');