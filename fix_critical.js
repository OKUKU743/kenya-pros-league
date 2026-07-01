const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');
let fixed = 0;

// FIX 4: Auto-nullify unplayed matches at deadline in renderLeagueTable
const old4 = "  var allPlayed=S.fixtures.filter(function(f){return f.group==='L';}).every(function(f){return f.played;});\n  var deadlinePassed=S.leagueDeadline&&Date.now()>S.leagueDeadline;\n  var winner=(allPlayed||deadlinePassed)&&table.length?table[0]:null;";
const new4 = "  var deadlinePassed=S.leagueDeadline&&Date.now()>S.leagueDeadline;\n  if(deadlinePassed){\n    S.fixtures.filter(function(f){return f.group==='L'&&!f.played;}).forEach(function(f){f.played=true;f.homeGoals=null;f.awayGoals=null;f.nullified=true;});\n  }\n  var allPlayed=S.fixtures.filter(function(f){return f.group==='L';}).every(function(f){return f.played||f.nullified;});\n  var winner=(allPlayed||deadlinePassed)&&table.length?table[0]:null;";
if(html.includes(old4)){html=html.replace(old4,new4);console.log('FIX 4 OK - deadline nullify added');fixed++;}
else{console.log('FIX 4 FAILED');}

// FIX 6: Error boundary — add return after parse error
const old6 = "  } catch(e){ console.error('Parse error:', e); }\n  _firstLoad = false;\n  renderActiveTab();";
const new6 = "  } catch(e){ console.error('Parse error:', e); setSyncStatus('offline'); return; }\n  _firstLoad = false;\n  renderActiveTab();";
if(html.includes(old6)){html=html.replace(old6,new6);console.log('FIX 6 OK - error boundary added');fixed++;}
else{console.log('FIX 6 FAILED');}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done. Fixed: '+fixed+'/2');