const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');

const old = 'window._fbDeleteChat = async function(id){';

const newCode = `// ── SEASONS FIRESTORE ──
const SEASONS_REF = collection(db, 'seasons');

window._fbSaveSeason = async function(seasonNum, data){
  try{
    await setDoc(doc(db,'seasons','season_'+seasonNum), data);
  }catch(e){console.error('Season save failed:',e);throw e;}
};

window._fbGetSeasons = function(callback){
  getDocs(SEASONS_REF).then(function(snap){
    var seasons=[];
    snap.forEach(function(d){seasons.push(d.data());});
    callback(seasons);
  }).catch(function(e){
    console.error('Seasons load failed:',e);
    callback([]);
  });
};

window._fbDeleteChat = async function(id){`;

if(html.includes(old)){
  html = html.replace(old, newCode);
  fs.writeFileSync('app.html', html, 'utf8');
  console.log('FIXED - seasons Firebase functions added');
} else {
  console.log('NOT FOUND');
}
