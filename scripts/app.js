(function (T) {
  'use strict';
  const $ = s => document.querySelector(s), main = $('#main'), dialog = $('#dialog'), store = T.createStore();
  const escape = x => String(x).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let view = 'draw', session = null, spreadId = 'situation-obstacle-advice', question = '', noteTimer, pendingNote = null, toastTimer, allTimer;
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => store.data.settings.reduceMotion || motionQuery.matches;
  const card = id => T.cards.find(c => c.id === id);
  const moment = date => new Date(date).toLocaleString('zh-CN',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  function announce(text) { $('#announcement').textContent = text; }
  function toast(text) { const el=$('#toast'); el.textContent=text; el.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.hidden=true,4500); }
  function download(object, name, raw = false) {
    flushNote();
    const blob = new Blob([raw ? object : JSON.stringify(object,null,2)],{type:'application/json;charset=utf-8'}), url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function exportRecords() { flushNote(); download(store.export(),`tika-tarot-backup-${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}.json`); toast('备份已交给浏览器保存'); }
  function storageUI() {
    const banner=$('#storage-banner');
    banner.hidden=!store.error;
    banner.replaceChildren();
    if(store.error) {
      const label=document.createElement('span'); label.textContent=store.error; banner.append(label);
      const btn=document.createElement('button'); btn.className='text-button'; btn.textContent='导出记录'; btn.onclick=exportRecords; banner.append(btn);
      if(store.raw!==null) { const raw=document.createElement('button'); raw.className='text-button'; raw.textContent='下载原始数据'; raw.onclick=()=>download(store.raw,'tika-tarot-recovery.json',true); banner.append(raw); }
      else if(store.mode==='persistent') { const retry=document.createElement('button'); retry.className='text-button'; retry.textContent='重试保存'; retry.onclick=()=>{store.retry();storageUI();};banner.append(retry); }
    }
    document.querySelectorAll('[data-save-status]').forEach(el=>{el.textContent=pendingNote?'笔记未保存':store.mode==='memory'?'仅本次会话 · 请导出备份':store.dirty?'保存失败 · 请导出备份':'已保存在此浏览器';el.classList.toggle('unsaved',!!pendingNote||store.dirty);});
  }
  function flushNote() {
    clearTimeout(noteTimer);
    if(pendingNote) { const {id,value}=pendingNote; pendingNote=null; const r=store.data.readings.find(r=>r.id===id); if(r)store.save({...r,note:value,updatedAt:new Date().toISOString()}); }
    storageUI();
  }
  function bindNotes(root=document) {
    root.querySelectorAll('[data-note]').forEach(el=>{
      el.addEventListener('input',()=>{ if(pendingNote && pendingNote.id!==el.dataset.note) flushNote();pendingNote={id:el.dataset.note,value:el.value};storageUI();clearTimeout(noteTimer);noteTimer=setTimeout(flushNote,500); });
      el.addEventListener('blur',flushNote);
    });
  }
  function noteHTML(r) { return `<div class="note-area"><label class="field-title" for="note-${escape(r.id)}">写下此刻的想法<span class="optional">可选</span></label><textarea id="note-${escape(r.id)}" data-note="${escape(r.id)}" maxlength="2000" placeholder="哪些牌面让你有了新的联想？">${escape(r.note)}</textarea><p class="save-status" data-save-status></p></div>`; }
  function openDialog(html) { flushNote(); if(dialog.open)dialog.close(); $('#dialog-content').innerHTML=html; dialog.showModal(); bindNotes(dialog); storageUI(); }
  function confirmAction(title,message,action,label='确认') {
    openDialog(`<h2 id="dialog-title">${escape(title)}</h2><p class="dialog-text">${escape(message)}</p><div class="dialog-actions"><button class="secondary" id="cancel-action">取消</button><button class="primary" id="confirm-action">${escape(label)}</button></div>`);
    $('#cancel-action').onclick=()=>dialog.close(); $('#confirm-action').onclick=()=>{dialog.close();action();};
  }
  function intro(title,kicker,extra='') { return `<div class="intro"><div><p class="eyebrow">${kicker}</p><h1>${title}</h1></div>${extra}</div>`; }
  function render() {
    document.body.classList.toggle('reduce-motion',reduced());
    document.querySelectorAll('[data-view]').forEach(el=>{if(el.dataset.view===view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    if(view==='draw') draw(); else if(view==='library') library(); else history();
    storageUI();
  }
  function draw(effect = {}) {
    const s=session, spread=T.spreads[s?s.spreadId:spreadId], selected=s?s.selected.length:0, complete=s&&s.phase==='complete';
    const title=!s?'从一个问题开始':s.phase==='shuffling'?'让思绪慢慢沉静':s.phase==='selecting'?'选择与你相遇的牌':complete?'听见牌面的回声':'让答案慢慢展开';
    let slots='';
    spread.positions.forEach((pos,i)=>{
      const has=s&&s.selected[i]!==undefined, revealed=s&&s.revealed.includes(i), d=has?s.deck[s.selected[i]]:null;
      const label=revealed?`${pos.label}：${card(d.cardId).nameZh}，${d.reversed?'逆位':'正位'}，查看释义`:`${pos.label}，${has?'点击翻牌':'等待选牌'}`;
      slots+=`<div class="slot ${!has?'empty':''}"><button class="card-button ${revealed&&s.active===i?'is-active':''} ${effect.revealed===i?'reveal-now':''} ${effect.selected===i?'arrive':''}" data-slot="${i}" aria-label="${label}" ${!s||s.phase==='selecting'||s.phase==='shuffling'?'disabled':''}>${T.cardSVG(revealed?card(d.cardId):null,revealed&&d.reversed)}</button><p class="slot-label"><small>0${i+1}</small>${pos.label}</p><span class="orientation ${revealed&&d.reversed?'inverse':''}">${revealed?(d.reversed?'逆位':'正位'):has?'待翻开':'◇'}</span></div>`;
    });
    let caption=!s?'把注意力留给当下，答案不必急于出现。':s.phase==='shuffling'?'正在洗牌…':s.phase==='selecting'?`从下方选择 ${spread.positions.length} 张牌，完成翻牌后保存。`:complete?'点击牌面，阅读它在这个位置的提示。':'点击任意一张牌，或一次翻开全部。';
    let deck='';
    if(s&&s.phase==='selecting') deck=`<section class="deck-section" aria-label="待选牌池"><div class="deck-heading"><span>凭直觉选择</span><strong>已选 ${selected} / ${spread.positions.length}</strong></div><div class="deck-grid">${s.deck.map((_,i)=>`<button class="card-button ${s.selected.includes(i)?'taken':''}" data-pick="${i}" aria-label="第 ${i+1} 张待选牌" ${s.selected.includes(i)?'disabled':''}>${T.cardSVG()}</button>`).join('')}</div></section>`;
    const controls=s?`<div class="actions">${s.phase==='revealing'?'<button class="primary" id="reveal-all">全部翻开</button>':''}${s.phase!=='shuffling'?`<button class="${complete?'primary gold':'text-button'}" id="restart">${complete?'再抽一次':'重新开始'}</button>`:''}${complete?'<button class="secondary" id="export-current">导出备份</button>':''}</div>`:'';
    main.innerHTML=intro(title,'YOUR MOMENT, YOUR CARDS',`<span class="spread-badge">${spread.name}</span>`)+`<div class="workspace"><section class="table-space" aria-label="抽牌桌面"><div class="stage ${s&&s.phase==='shuffling'?'shuffling':''}"><div class="spread-row">${slots}</div><p class="stage-caption">${caption}</p></div>${deck}${controls}</section><aside class="side-panel" aria-label="${!s?'抽牌设置':'牌面解读'}">${!s?setupHTML():readingHTML(s)}</aside></div>`;
    if(!s) {
      $('#question').value=question;
      $('#question').oninput=e=>question=e.target.value;
      document.querySelectorAll('[data-spread]').forEach(el=>el.onclick=()=>{spreadId=el.dataset.spread;draw();document.querySelector(`[data-spread="${spreadId}"]`).focus();});
      $('#inverse').onchange=e=>{store.settings({reversalEnabled:e.target.checked});storageUI();};
      $('#start').onclick=start;
    } else {
      document.querySelectorAll('[data-pick]').forEach(el=>el.onclick=()=>{
        if(T.select(s,Number(el.dataset.pick))) { draw({selected:s.selected.length-1});announce(`已选 ${s.selected.length} 张${s.phase==='revealing'?'，可以开始翻牌':''}`);const next=s.phase==='revealing'?$('[data-slot="0"]'):$('[data-pick]:not(:disabled)');next?.focus({preventScroll:true}); }
      });
      document.querySelectorAll('[data-slot]').forEach(el=>el.onclick=()=>reveal(Number(el.dataset.slot)));
      if($('#reveal-all'))$('#reveal-all').onclick=()=>{
        const target=s;
        const step=()=>{if(session!==target)return;const i=target.selected.findIndex((_,j)=>!target.revealed.includes(j));if(i<0)return;reveal(i,false);if(target.phase!=='complete')allTimer=setTimeout(step,reduced()?0:120);};
        clearTimeout(allTimer);step();
      };
      if($('#restart'))$('#restart').onclick=()=>restart();
      if($('#export-current'))$('#export-current').onclick=exportRecords;
    }
    bindNotes(main);storageUI();
  }
  function setupHTML() { return `<p class="panel-number">01 / SET YOUR INTENTION</p><h2>此刻，你在想什么？</h2><label class="form-field"><span class="field-title">你的问题<span class="optional">可选 · 200 字内</span></span><textarea id="question" maxlength="200" placeholder="关于一个选择、一段关系，或只是今天的自己…"></textarea></label><div class="form-field"><span class="field-title">选择牌阵</span><div class="choices">${Object.entries(T.spreads).map(([id,s])=>`<button class="choice ${spreadId===id?'selected':''}" data-spread="${id}" aria-pressed="${spreadId===id}"><span>${s.name}</span><span class="choice-symbol" aria-hidden="true">${id==='single'?'◇':'◇ ◇ ◇'}</span></button>`).join('')}</div></div><label class="toggle" for="inverse"><span>纳入逆位</span><input type="checkbox" id="inverse" ${store.data.settings.reversalEnabled?'checked':''}></label><button class="primary gold full" id="start">洗牌并开始</button><p class="panel-note">不必追求一个标准答案<br>留意与你产生共鸣的线索</p>`; }
  function readingHTML(s) {
    const i=s.active, d=s.selected[i]!==undefined?s.deck[s.selected[i]]:null, revealed=s.revealed.includes(i), pos=T.spreads[s.spreadId].positions[i];
    const completed=store.data.readings.find(r=>r.id===s.id);
    let content=`<p class="panel-number">${s.phase==='selecting'?'02 / FOLLOW YOUR INTUITION':'03 / READ & REFLECT'}</p><p class="reading-question">${escape(s.question)}</p>`;
    if(revealed){const c=card(d.cardId),a=c[d.reversed?'reversed':'upright']; content+=`<div style="margin-top:22px"><p class="position-hint">${pos.label} · ${d.reversed?'逆位':'正位'}</p><h2 style="margin-top:8px">${c.nameZh}</h2><p class="position-hint">${pos.prompt}</p><div class="keywords">${a.keywords.map(k=>`<span class="keyword">${k}</span>`).join('')}</div><p class="reading-body">${a.meaning}</p><div class="reflection"><small>ASK YOURSELF</small>${a.reflection}</div></div>`;}
    else content+=`<div class="reading-body"><h3 style="margin-bottom:18px">${s.phase==='selecting'?'让直觉替你选择':'给自己一点时间'}</h3>${T.spreads[s.spreadId].positions.map((p,i)=>`<p class="position-hint" style="margin:17px 0"><span style="color:var(--light-gold)">0${i+1} · ${p.label}</span><br>${p.prompt}</p>`).join('')}</div>`;
    if(completed)content+=noteHTML(completed);
    return content;
  }
  function start() {
    if(session)return;
    try { session=T.createSession(question,spreadId,store.data.settings.reversalEnabled);draw(); const current=session;setTimeout(()=>{if(session!==current)return;session.phase='selecting';if(view==='draw'){draw();$('[data-pick]')?.focus({preventScroll:true});}announce('洗牌完成，请选择卡牌');},reduced()?0:700); }
    catch(e){session=null;toast('无法获取随机源，请使用支持安全随机数的浏览器。');}
  }
  function reveal(i,focus=true) {
    if(!session)return;
    const changed=T.reveal(session,i);
    if(changed&&session.phase==='complete'&&!store.data.readings.some(r=>r.id===session.id))store.save(T.toReading(session));
    if(view==='draw') {draw(changed?{revealed:i}:{});if(focus)$(`[data-slot="${i}"]`)?.focus({preventScroll:true});}
    if(changed){const d=session.deck[session.selected[i]];announce(`${card(d.cardId).nameZh}，${d.reversed?'逆位':'正位'}${session.phase==='complete'?'，本次翻牌完成':''}`);}
  }
  function restart() {
    const action=()=>{flushNote();clearTimeout(allTimer);session=null;draw();$('#question')?.focus({preventScroll:true});};
    if(session&&session.phase!=='complete'&&session.selected.length)confirmAction('重新开始？','本次尚未完成，重新开始会放弃已选牌。',action,'重新开始');else action();
  }
  function library() {
    main.innerHTML=intro('二十二种相遇','THE MAJOR ARCANA','<p>每一张牌，都是一个观察自己的角度。</p>')+`<div class="library-grid">${T.cards.map(c=>`<div><button class="card-button" data-card="${c.id}" aria-label="查看${c.nameZh}">${T.cardSVG(c)}</button></div>`).join('')}</div>`;
    document.querySelectorAll('[data-card]').forEach(el=>el.onclick=()=>cardDialog(el.dataset.card));
  }
  function cardDialog(id,inverse=false,replace=false) {
    const c=card(id),a=c[inverse?'reversed':'upright'];
    const html=`<div class="dialog-grid"><div class="card-preview">${T.cardSVG(c,inverse)}</div><div class="dialog-copy"><p class="eyebrow">${c.numeral} / ${c.nameEn.toUpperCase()}</p><h2 id="dialog-title">${c.nameZh}</h2><div class="dialog-toggle"><button class="secondary" data-orientation="false" aria-pressed="${!inverse}">正位</button><button class="secondary" data-orientation="true" aria-pressed="${inverse}">逆位</button></div><div class="keywords">${a.keywords.map(k=>`<span class="keyword">${k}</span>`).join('')}</div><p class="reading-body">${a.meaning}</p><div class="reflection"><small>ASK YOURSELF</small>${a.reflection}</div></div></div>`;
    if(replace)$('#dialog-content').innerHTML=html;else openDialog(html);
    document.querySelectorAll('[data-orientation]').forEach(el=>el.onclick=()=>{cardDialog(id,el.dataset.orientation==='true',true);$(`[data-orientation="${el.dataset.orientation}"]`).focus();});
  }
  function history() {
    const readings=store.data.readings.slice().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    main.innerHTML=intro('留给以后的自己','YOUR TAROT JOURNAL',`<div class="toolbar"><button class="secondary" id="import">导入备份</button><button class="primary" id="export">导出备份</button></div>`)+
      (readings.length?`<div class="history-list">${readings.map(r=>`<article class="history-row"><button class="history-open" data-reading="${escape(r.id)}"><p class="history-meta">${moment(r.createdAt)} · ${escape(r.spreadName)}</p><h2>${escape(r.question)}</h2><p class="history-cards">${r.cards.map(c=>`${escape(c.nameZh)}${c.reversed?'（逆位）':''}`).join(' · ')}</p></button><div class="mini-cards" aria-hidden="true">${r.cards.map(c=>`<div class="mini-card">${T.cardSVG(card(c.cardId),c.reversed)}</div>`).join('')}</div></article>`).join('')}</div>`:`<div class="empty-state"><div class="empty-symbol" aria-hidden="true">✧</div><h2>故事还没有写下</h2><p>完成一次抽牌后，记录会出现在这里。</p><button class="secondary" id="empty-draw" style="margin-top:25px">去抽一张牌</button></div>`);
    $('#export').onclick=exportRecords;$('#import').onclick=importFile;
    if($('#empty-draw'))$('#empty-draw').onclick=()=>navigate('draw');
    document.querySelectorAll('[data-reading]').forEach(el=>el.onclick=()=>recordDialog(el.dataset.reading));
  }
  function recordDialog(id) {
    const r=store.data.readings.find(r=>r.id===id);if(!r)return;
    openDialog(`<p class="eyebrow">${moment(r.createdAt)}</p><h2 id="dialog-title" style="padding-right:20px;overflow-wrap:anywhere">${escape(r.question)}</h2><p class="history-meta">${escape(r.spreadName)}</p><div class="record-spread">${r.cards.map(c=>`<div class="card-preview">${T.cardSVG(card(c.cardId),c.reversed)}<span class="orientation" style="text-align:center">${escape(c.positionLabel)} · ${c.reversed?'逆位':'正位'}</span></div>`).join('')}</div>${r.cards.map(c=>`<section class="record-meaning"><h3>${escape(c.positionLabel)} · ${escape(c.nameZh)}${c.reversed?'（逆位）':''}</h3><p>${escape(c.interpretation.meaning)}</p><p style="color:var(--light-gold)">${escape(c.interpretation.reflection)}</p></section>`).join('')}${noteHTML(r)}<div class="dialog-actions"><button class="danger" id="delete-record">删除这条记录</button></div>`);
    $('#delete-record').onclick=()=>confirmAction('删除这条记录？',`${moment(r.createdAt)} · ${r.question}。删除后无法在应用内撤销。`,()=>{store.remove(id);storageUI();if(view==='history')history();else if(view==='draw')draw();toast('记录已移除');},'删除记录');
  }
  function importFile() {
    flushNote();const input=document.createElement('input');input.type='file';input.accept='.json,application/json';
    input.onchange=async()=>{
      const file=input.files[0];if(!file)return;
      try {
        if(file.size>5*1024*1024)throw new Error('文件超过 5MB，无法导入');
        const data=JSON.parse(await file.text()),plan=store.plan(data);
        confirmAction('导入备份',`读取到 ${plan.clean.readings.length} 条记录：新增 ${plan.added} 条，跳过 ${plan.skipped} 条相同记录，其中 ${plan.conflicts} 条 ID 冲突会另存。备份中的基础设置也将恢复。`,()=>{
          try{const result=store.merge(data);render();toast(`已导入 ${result.added} 条，跳过 ${result.skipped} 条${store.dirty?'；请导出以保留本次数据':''}`);}catch(e){toast(`导入失败：${e.message}`);}
        },'导入');
      }catch(e){toast(`无法导入：${e instanceof SyntaxError?'JSON 格式无效':e.message}`);}
    };input.click();
  }
  function settings() {
    openDialog(`<p class="eyebrow">MAKE ROOM FOR YOURSELF</p><h2 id="dialog-title">抽牌设置</h2><label class="toggle" style="margin-top:24px"><span>纳入逆位${session?'（下次抽牌生效）':''}</span><input id="settings-inverse" type="checkbox" ${store.data.settings.reversalEnabled?'checked':''}></label><label class="toggle"><span>减少动态效果</span><input id="settings-motion" type="checkbox" ${store.data.settings.reduceMotion?'checked':''}></label><p class="dialog-text position-hint">记录保存在此浏览器。移动文件位置、清理浏览数据或更换浏览器前，请先导出备份。</p><button class="secondary" id="settings-export">导出备份</button>`);
    $('#settings-inverse').onchange=e=>{store.settings({reversalEnabled:e.target.checked});storageUI();if(view==='draw'&&!session)draw();};
    $('#settings-motion').onchange=e=>{store.settings({reduceMotion:e.target.checked});document.body.classList.toggle('reduce-motion',reduced());storageUI();};
    $('#settings-export').onclick=exportRecords;
  }
  function navigate(next) {flushNote();view=next;render();}
  document.querySelectorAll('[data-view]').forEach(el=>el.onclick=()=>navigate(el.dataset.view));
  $('.brand').onclick=e=>{e.preventDefault();navigate('draw');};
  $('#settings').onclick=settings;
  $('.dialog-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',flushNote);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  motionQuery.addEventListener('change',()=>document.body.classList.toggle('reduce-motion',reduced()));
  window.addEventListener('beforeunload',e=>{flushNote();if(store.dirty||(session&&session.phase!=='complete'&&session.selected.length)){e.preventDefault();e.returnValue='';}});
  window.addEventListener('storage',e=>{if(e.key==='tika-tarot:v1'){toast('其他窗口已更新记录；请先导出本次数据，再重新打开页面。');}});
  render();
})(window.TikaTarot);
