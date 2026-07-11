const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');
let fixed = 0;

// FIX 1: Fix corrupted emoji in setSyncStatus
const old1 = `function setSyncStatus(status){
  const el = document.getElementById('sync-status');
  if(!el) return;
  const map = {
    live:    {text:'ðŸŸ¢ Live', color:'#22C55E'},
    saving:  {text:'â³ Saving...', color:'#F0B429'},
    offline: {text:'ðŸ"´ Offline', color:'#E53E6D'},
    loading: {text:'â³ Loading...', color:'#7C9EFF'},
  };
  const cfg = map[status] || map.offline;
  el.textContent = cfg.text;
  el.style.color = cfg.color;
}`;

const new1 = `function setSyncStatus(status){
  const el = document.getElementById('sync-status');
  if(!el) return;
  const map = {
    live:    {text:'&#x1F7E2; Live', color:'#22C55E'},
    saving:  {text:'&#x23F3; Saving...', color:'#F0B429'},
    offline: {text:'&#x1F534; Offline', color:'#E53E6D'},
    loading: {text:'&#x23F3; Loading...', color:'#7C9EFF'},
  };
  const cfg = map[status] || map.offline;
  el.innerHTML = cfg.text;
  el.style.color = cfg.color;
}`;

if(html.includes(old1)){
  html = html.replace(old1, new1);
  console.log('FIX 1 OK - sync status emoji fixed');
  fixed++;
} else {
  console.log('FIX 1 FAILED');
}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done. Fixed: '+fixed+'/1');