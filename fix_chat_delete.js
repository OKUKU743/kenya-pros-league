const fs = require('fs');
let html = fs.readFileSync('app.html', 'utf8');
html = html.replace(/\r\n/g, '\n');
let fixed = 0;

// FIX 1: Update renderChat to show delete button for admin
const oldRender = `  const myName = _chatName;
  el.innerHTML = msgs.map(m=>{
    const isMe = m.name === myName;
    const color = nameColors[m.name]||'#7C9EFF';
    return \`<div style="display:flex;flex-direction:column;align-items:\${isMe?'flex-end':'flex-start'};">
      <div style="max-width:75%;\${isMe?'':''}">
        \${!isMe?\`<div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:\${color};margin-bottom:3px;">\${m.name}</div>\`:''}
        <div style="background:\${isMe?'#1B56F5':'#111840'};border-radius:\${isMe?'12px 12px 3px 12px':'12px 12px 12px 3px'};padding:9px 14px;font-size:13px;color:#E8F0FF;line-height:1.4;word-break:break-word;">
          \${m.message}
        </div>
        <div style="font-size:10px;color:#4A5A9A;margin-top:3px;">\${formatChatTime(m.time)}</div>
      </div>
    </div>\`;
  }).join('');`;

const newRender = `  const myName = _chatName;
  el.innerHTML = msgs.map(m=>{
    const isMe = m.name === myName;
    const color = nameColors[m.name]||'#7C9EFF';
    const canDelete = PIN.unlocked;
    return \`<div style="display:flex;flex-direction:column;align-items:\${isMe?'flex-end':'flex-start'};">
      <div style="max-width:75%;position:relative;">
        \${!isMe?\`<div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:\${color};margin-bottom:3px;">\${m.name}</div>\`:''}
        <div style="display:flex;align-items:flex-start;gap:6px;\${isMe?'flex-direction:row-reverse':''}">
          <div style="background:\${isMe?'#1B56F5':'#111840'};border-radius:\${isMe?'12px 12px 3px 12px':'12px 12px 12px 3px'};padding:9px 14px;font-size:13px;color:#E8F0FF;line-height:1.4;word-break:break-word;">
            \${m.message}
          </div>
          \${canDelete?\`<button onclick="deleteChatMessage('\${m.id}')" style="background:rgba(229,62,109,0.1);border:1px solid rgba(229,62,109,0.2);border-radius:6px;padding:4px 7px;color:#E53E6D;cursor:pointer;font-size:11px;flex-shrink:0;align-self:center;">&#x1F5D1;</button>\`:''}
        </div>
        <div style="font-size:10px;color:#4A5A9A;margin-top:3px;">\${formatChatTime(m.time)}</div>
      </div>
    </div>\`;
  }).join('');`;

if(html.includes(oldRender)){
  html = html.replace(oldRender, newRender);
  console.log('FIX 1 OK - delete button added to chat');
  fixed++;
} else {
  console.log('FIX 1 FAILED');
}

// FIX 2: Add deleteChatMessage function after sendChatMessage
const oldSend = `function sendChatMessage(){
  const nameEl = document.getElementById('chat-name-input');
  const msgEl = document.getElementById('chat-msg-input');
  if(!nameEl||!msgEl) return;
  const name = nameEl.value.trim() || _chatName;
  const message = msgEl.value.trim();
  if(!name){ alert('Enter your name first.'); nameEl.focus(); return; }
  if(!message) return;
  // Save name locally
  _chatName = name;
  localStorage.setItem('kpl_chat_name', name);
  nameEl.value = name;
  msgEl.value = '';
  if(window._fbSendChat) window._fbSendChat(name, message);
  else console.warn('Chat not ready');
}`;

const newSend = `function sendChatMessage(){
  const nameEl = document.getElementById('chat-name-input');
  const msgEl = document.getElementById('chat-msg-input');
  if(!nameEl||!msgEl) return;
  const name = nameEl.value.trim() || _chatName;
  const message = msgEl.value.trim();
  if(!name){ alert('Enter your name first.'); nameEl.focus(); return; }
  if(!message) return;
  // Save name locally
  _chatName = name;
  localStorage.setItem('kpl_chat_name', name);
  nameEl.value = name;
  msgEl.value = '';
  if(window._fbSendChat) window._fbSendChat(name, message);
  else console.warn('Chat not ready');
}

function deleteChatMessage(id){
  if(!PIN.unlocked){showToast('Admin access required.');return;}
  if(!confirm('Delete this message?')) return;
  if(window._fbDeleteChat) window._fbDeleteChat(id);
  else showToast('Chat not ready.');
}`;

if(html.includes(oldSend)){
  html = html.replace(oldSend, newSend);
  console.log('FIX 2 OK - deleteChatMessage function added');
  fixed++;
} else {
  console.log('FIX 2 FAILED');
}

// FIX 3: Add _fbDeleteChat to Firebase module
const oldFbChat = `window._fbSendChat = async function(name, message){
  try {
    await addDoc(CHAT_REF, {
      name,
      message,
      time: Date.now()
    });
  } catch(e){ console.error('Chat send failed:', e); }
};`;

const newFbChat = `window._fbSendChat = async function(name, message){
  try {
    await addDoc(CHAT_REF, {
      name,
      message,
      time: Date.now()
    });
  } catch(e){ console.error('Chat send failed:', e); }
};

window._fbDeleteChat = async function(id){
  try {
    const {deleteDoc, doc: _doc2} = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
    await deleteDoc(_doc2(db, 'chat', id));
  } catch(e){ console.error('Chat delete failed:', e); }
};`;

if(html.includes(oldFbChat)){
  html = html.replace(oldFbChat, newFbChat);
  console.log('FIX 3 OK - Firebase delete function added');
  fixed++;
} else {
  console.log('FIX 3 FAILED');
}

fs.writeFileSync('app.html', html, 'utf8');
console.log('Done. Fixed: '+fixed+'/3');