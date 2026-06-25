const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
// Normalize line endings
html = html.replace(/\r\n/g, '\n');
let fixed = 0;

// STEP 2 - Fix generateGroups
const s2old = "function generateGroups(){\n  if(S.teams.length<8){alert('Add at least 8 teams.');return;}\n  if(S.fixtures.length>0&&!confirm('Replace all groups, fixtures and results?')) return;\n  const clubs=shuffle(S.teams.map(t=>t.club));";
const s2new = "function generateGroups(){\n  if(S.teams.length<8){alert('Add at least 8 teams.');return;}\n  if(S.fixtures.length>0&&!confirm('Replace all groups, fixtures and results?')) return;\n  var fm=document.getElementById('fmt-modal');fm.style.opacity='1';fm.style.visibility='visible';\n}\nfunction closeFmt(){var m=document.getElementById('fmt-modal');m.style.opacity='0';m.style.visibility='hidden';}\nfunction selectFormat(fmt){closeFmt();S.tournamentFormat=fmt;if(fmt==='league'){generateLeague();}else{generateChampionship();}}\nfunction generateLeague(){var clubs=S.teams.map(function(t){return t.club;});S.groups={};S.ties={};S.knockout={semis:[],final:null};var fixtures=[];var id=0;for(var i=0;i<clubs.length;i++){for(var j=i+1;j<clubs.length;j++){fixtures.push({id:id++,group:'L',home:clubs[i],away:clubs[j],homeGoals:null,awayGoals:null,played:false,round:1,leg:1});fixtures.push({id:id++,group:'L',home:clubs[j],away:clubs[i],homeGoals:null,awayGoals:null,played:false,round:2,leg:2});}}S.fixtures=fixtures;S.round=1;S.leagueStartTime=Date.now();S.leagueDeadline=Date.now()+(48*60*60*1000);save();renderAll();showToast('League generated - 48hr countdown started!');switchTab('fixtures',document.querySelectorAll('.tab')[2]);}\nfunction generateChampionship(){\n  if(S.teams.length<8){alert('Add at least 8 teams.');return;}\n  const clubs=shuffle(S.teams.map(t=>t.club));";
if(html.includes(s2old)){html=html.replace(s2old,s2new);console.log('STEP 2 OK');fixed++;}else{console.log('STEP 2 FAILED');}

// STEP 4 - Fix renderGroups body
const s4old = "  const el=document.getElementById('groups-container');if(!el)return;\n  const gs=getGroupStats();";
const s4new = "  if(S.tournamentFormat==='league'){renderLeagueTable();return;}\n  const el=document.getElementById('groups-container');if(!el)return;\n  const gs=getGroupStats();";
if(html.includes(s4old)){html=html.replace(s4old,s4new);console.log('STEP 4 OK');fixed++;}else{console.log('STEP 4 FAILED');}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done. Fixed: '+fixed+'/2');