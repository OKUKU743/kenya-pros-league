const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');
let fixed = 0;

// FIX 1: Cookie banner privacy policy link
const old1 = 'href="/privacy.html"';
const new1 = 'href="/kenya-pros-league/privacy.html"';
if(html.includes(old1)){
  html = html.replace(old1, new1);
  console.log('FIX 1 OK - privacy link fixed');
  fixed++;
} else {
  console.log('FIX 1 FAILED');
}

// FIX 2: Remove splash.png reference - replace with CSS gradient
const old2 = '<img src="splash.png" alt="KPL" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center top;opacity:0.35;">';
const new2 = '<div style="position:absolute;inset:0;background:linear-gradient(135deg,rgba(27,86,245,0.3) 0%,rgba(123,47,247,0.2) 50%,rgba(6,9,28,0.9) 100%);"></div>';
if(html.includes(old2)){
  html = html.replace(old2, new2);
  console.log('FIX 2 OK - splash.png replaced with gradient');
  fixed++;
} else {
  console.log('FIX 2 FAILED');
}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done. Fixed: '+fixed+'/2');