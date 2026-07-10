const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');

// Fix: Replace dynamic import with proper deleteDoc using already imported functions
const old1 = `window._fbDeleteChat = async function(id){
  try {
    const {deleteDoc, doc: _doc2} = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    await deleteDoc(_doc2(db, 'chat', id));
  } catch(e){ console.error('Chat delete failed:', e); }
};`;

const new1 = `window._fbDeleteChat = async function(id){
  try {
    await deleteDoc(doc(db, 'chat', id));
  } catch(e){ console.error('Chat delete failed:', e); }
};`;

if(html.includes(old1)){
  html = html.replace(old1, new1);
  console.log('FIX 1 OK - delete function fixed');
} else {
  console.log('FIX 1 FAILED');
}

// Fix: Add deleteDoc to the Firebase imports
const old2 = `import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";`;
const new2 = `import { getFirestore, doc, setDoc, onSnapshot, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";`;

if(html.includes(old2)){
  html = html.replace(old2, new2);
  console.log('FIX 2 OK - deleteDoc imported');
} else {
  console.log('FIX 2 FAILED');
}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done');