(function(){
'use strict';
const $=id=>document.getElementById(id);
const {chapters,totalVerses}=window.DURGA_BOOK;
const titles=['Madhu and Kaiṭabha','Mahiṣāsura’s armies','The slaying of Mahiṣāsura','The gods praise the Devī','The messenger of Śumbha','The slaying of Dhūmralocana','The slaying of Caṇḍa and Muṇḍa','The slaying of Raktabīja','The slaying of Niśumbha','The slaying of Śumbha','Nārāyaṇī Stuti','The promise of protection','The granting of boons'];
const verses=chapters.flatMap(c=>c.verses.map(v=>({...v,chapter:c.id,chapterTitle:c.subtitle||c.title})));
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let index=-1,size=100,turning=false,target=null,pending=null,mobileRight=false,turnID=0,activeAnimation=null;
const native=window.webkit?.messageHandlers?.pageTurn;
const bookmarkIcon='<svg class="bookmark-icon" viewBox="0 0 20 26" aria-hidden="true"><path d="M3 2h14v22l-7-5-7 5z"/></svg>';
function remember(){try{localStorage.setItem('durga-flipbook-position',JSON.stringify({index,mobileRight,size}))}catch{}}
function commitTarget(){if(!target)return;index=target.i;mobileRight=target.side;setPages(index);update();remember()}
function finishTurn(){turning=false;target=null;activeAnimation=null;$('book').removeAttribute('aria-busy');if(pending){const p=pending;pending=null;go(p.i,p.side)}}
window.durgaNativeCommit=commitTarget;
window.durgaNativeFinish=finishTurn;
const mobile=()=>matchMedia('(max-width:700px)').matches;
const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
let saved=[];try{saved=JSON.parse(localStorage.getItem('durga-flipbook-bookmarks')||'[]')}catch{}
function verseKey(v){return `${v.chapter}:${v.id}`}
function page(content,side,classes=''){return `<div class="page ${side}-page ${classes}">${content}</div>`}
function running(left,right){return `<div class="page-running"><span>${left}</span><span>${right}</span></div>`}
function spread(i){
 if(i<0)return [page(`<div class="blank-cover"><div class="om" lang="sa">ॐ</div><p>THE GLORY OF THE DIVINE MOTHER<br>Mārkaṇḍeya Purāṇa</p><div class="ornament">✧</div><p>13 chapters · ${totalVerses} verses<br>Sanskrit · Translation · Word meanings</p></div>`,'left'),page(`<div class="cover-border"><div class="cover-kicker">DEVĪ MĀHĀTMYAM</div><img class="cover-art" src="cover.jpg" alt="Durga seated with her lion"><h1 class="cover-title" lang="sa">श्रीदुर्गासप्तशती</h1><p class="cover-english">Śrī Durgā Saptaśatī</p><p class="cover-sub">The glory of the Divine Mother</p></div>`,'right','cover-page')];
 const v=verses[i];
 return [page(`${running('DEVĪ MĀHĀTMYAM',`CHAPTER ${v.chapter}`)}<div class="page-body"><p class="section-kicker">Chapter ${v.chapter} · Verse ${v.id}</p><h2 class="chapter-title">${titles[v.chapter-1]}</h2><div class="sanskrit" lang="sa">${esc(v.devanagari)}</div><div class="ornament">✧</div><p class="section-kicker">Translation</p><p class="meaning">${esc(v.translation)}</p></div><div class="page-number">${i*2+1}</div>`,'left'),page(`${running('DURGĀ SAPTAŚATĪ',`${v.chapter} · ${v.id}`)}<div class="page-body"><p class="section-kicker">Verse ${v.id}</p><h2 class="chapter-title">Word-by-word meaning</h2><div class="word-list">${v.words.map(w=>`<div class="word-row"><span class="word" lang="sa">${esc(w.word)}</span><span>${esc(w.meaning)}</span>${w.details?.length?`<div class="details">${w.details.map(esc).join('<br>')}</div>`:''}</div>`).join('')}</div></div><div class="page-number">${i*2+2}</div>`,'right')];
}
function setPages(i){const s=spread(i);$('left').outerHTML=s[0].replace('class="page ','id="left" class="page ');$('right').outerHTML=s[1].replace('class="page ','id="right" class="page ');$('book').classList.toggle('on-cover',i<0);$('book').classList.toggle('mobile-right',mobileRight);}
function update(){
 const v=verses[index];$('chapter-label').textContent=v?`CHAPTER ${v.chapter} · ${titles[v.chapter-1].toUpperCase()}`:'THE GLORY OF THE DIVINE MOTHER';
 $('verse-label').textContent=v?`VERSE ${v.id} OF ${chapters[v.chapter-1].verses.length}`:'13 CHAPTERS · 700 VERSES';
 $('position').textContent=v?`${v.chapter}.${v.id} · ${mobile()?(mobileRight?'Word meanings':'Shlokam'):`${index+1} / ${totalVerses}`}`:'Cover';
 $('prev').disabled=$('prev-side').disabled=index<0;
 $('next').disabled=$('next-side').disabled=index===verses.length-1&&(!mobile()||mobileRight);
 $('next').innerHTML=index<0?'<span>Open book</span> →':'<span>Next</span> →';
 $('bookmark').disabled=!v;$('bookmark').innerHTML=bookmarkIcon;$('bookmark').setAttribute('aria-pressed',String(Boolean(v&&saved.includes(verseKey(v)))));
 if(v){$('chapter').value=v.chapter;$('verse').value=v.id;$('verse').max=chapters[v.chapter-1].verses.length;}
 document.querySelectorAll('#chapter-list button').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.chapter)===v?.chapter)));
}
async function go(i,side=false){
 i=Math.max(-1,Math.min(verses.length-1,i));
 if(turning){pending={i,side};return}
 if(i===index&&side===mobileRight)return;
 const forward=i>index||(i===index&&side),old=index,newPages=spread(i);target={i,side};
 if(reduced()){commitTarget();target=null;return}
 turning=true;const thisTurn=++turnID;$('book').setAttribute('aria-busy','true');
 if(native){const r=$('book').getBoundingClientRect();native.postMessage({x:r.x,y:r.y,w:r.width,h:r.height,forward,single:mobile()});return} 
 const layer=document.createElement('div');layer.className='turn-layer';layer.setAttribute('aria-hidden','true');
 const under=document.createElement('div');under.className='turn-under';
 const leaf=document.createElement('div');leaf.className='turn-leaf';
 const front=document.createElement('div');front.className='turn-face';
 const back=document.createElement('div');back.className='turn-face turn-back';
 const mobileMode=mobile();
 if(mobileMode){
  under.style.left='0';leaf.style.left='0';leaf.style.transformOrigin=forward?'left center':'right center';
  const visible=old<0?$('right'):mobileRight?$('right'):$('left');front.appendChild(visible.cloneNode(true));
  under.innerHTML=newPages[i<0?1:side?1:0];back.innerHTML=newPages[i<0?1:side?1:0];
 }else{
  under.style.left=leaf.style.left=forward?'50%':'0';leaf.style.transformOrigin=forward?'left center':'right center';
  front.appendChild((forward?$('right'):$('left')).cloneNode(true));back.innerHTML=newPages[forward?0:1];under.innerHTML=newPages[forward?1:0];
 }
 layer.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
 leaf.append(front,back);layer.append(under,leaf);$('book').append(layer);
 layer.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
 // Give the two small, isolated pages a paint before compositor-only rotation.
 await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 if(thisTurn!==turnID){layer.remove();return}
 const animation=activeAnimation=leaf.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${forward?-180:180}deg)`}],{duration:720,easing:'cubic-bezier(.32,0,.2,1)',fill:'forwards'});
 try{await animation.finished}catch{}
 if(thisTurn!==turnID){layer.remove();return}
 commitTarget();layer.remove();animation.cancel();finishTurn();
}
function navigate(forward){
 let base=pending||target||{i:index,side:mobileRight};
 if(!mobile()){go(base.i+(forward?1:-1));return}
 if(forward){if(base.i<0)go(0,false);else if(!base.side)go(base.i,true);else go(base.i+1,false)}
 else{if(base.side)go(base.i,false);else go(base.i-1,base.i>0)}
}
function renderBookmarks(){
 $('saved-links').innerHTML=saved.length?'<h3>BOOKMARKS</h3>'+saved.map(key=>{const [c,v]=key.split(':');return `<button data-bookmark="${esc(key)}">Chapter ${c} · Verse ${v}</button>`}).join(''):'';
}
$('saved-links').onclick=e=>{const key=e.target.closest('button')?.dataset.bookmark;if(key){drawer(false);go(verses.findIndex(v=>verseKey(v)===key),false)}};
function drawer(open){$('drawer').hidden=$('scrim').hidden=!open;$('contents').setAttribute('aria-expanded',String(open));if(open){renderBookmarks();$('close').focus()}else $('contents').focus()}
$('chapter-list').innerHTML=chapters.map(c=>`<button data-chapter="${c.id}"><span>${String(c.id).padStart(2,'0')}</span>${titles[c.id-1]}</button>`).join('');
$('chapter').innerHTML=chapters.map(c=>`<option value="${c.id}">${c.id}</option>`).join('');
$('chapter-list').onclick=e=>{const b=e.target.closest('button');if(b){drawer(false);go(verses.findIndex(v=>v.chapter===+b.dataset.chapter),false)}};
$('contents').onclick=()=>drawer($('drawer').hidden);$('close').onclick=$('scrim').onclick=()=>drawer(false);
$('cover-link').onclick=()=>{drawer(false);go(-1)};$('home').onclick=()=>go(-1);
$('next').onclick=$('next-side').onclick=()=>navigate(true);$('prev').onclick=$('prev-side').onclick=()=>navigate(false);
$('chapter').onchange=()=>{$('verse').max=chapters[+$('chapter').value-1].verses.length;$('verse').value=1};
$('go').onclick=()=>{const c=+$('chapter').value,max=chapters[c-1].verses.length,v=Math.max(1,Math.min(max,+$('verse').value||1));go(verses.findIndex(x=>x.chapter===c&&x.id===v),false)};
$('verse').onkeydown=e=>{if(e.key==='Enter')$('go').click()};
function zoom(n){size=Math.min(140,Math.max(80,size+n));document.documentElement.style.setProperty('--reader-size',size/100);$('size').textContent=size+'%';remember()}
$('smaller').onclick=()=>zoom(-10);$('larger').onclick=()=>zoom(10);
$('bookmark').onclick=()=>{if(index<0)return;const key=verseKey(verses[index]),exists=saved.includes(key);saved=exists?saved.filter(k=>k!==key):[...saved,key];try{localStorage.setItem('durga-flipbook-bookmarks',JSON.stringify(saved))}catch{}update();$('toast').textContent=exists?'Bookmark removed':`Bookmarked chapter ${verses[index].chapter}, verse ${verses[index].id}`;$('toast').classList.add('visible');setTimeout(()=>$('toast').classList.remove('visible'),2000)};
$('fullscreen').onclick=()=>{if(native){native.postMessage({fullscreen:true});return}const task=document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();task?.catch(()=>{})};
document.addEventListener('keydown',e=>{if(e.key==='Escape'){drawer(false);return}if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||!$('drawer').hidden)return;if(e.key==='ArrowRight'){e.preventDefault();navigate(true)}if(e.key==='ArrowLeft'){e.preventDefault();navigate(false)}});
try{const last=JSON.parse(localStorage.getItem('durga-flipbook-position')||'null');if(last&&Number.isInteger(last.index)&&last.index>=-1&&last.index<verses.length){index=last.index;mobileRight=Boolean(last.mobileRight);size=Math.max(80,Math.min(140,Number(last.size)||100))}}catch{}
document.documentElement.style.setProperty('--reader-size',size/100);$('size').textContent=size+'%';
window.addEventListener('resize',()=>{if(turning){turnID++;pending=null;commitTarget();if(native)native.postMessage({cancel:true});activeAnimation?.cancel();document.querySelectorAll('.turn-layer').forEach(n=>n.remove());finishTurn()}update()});
setPages(index);update();
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){navigator.serviceWorker.register('service-worker.js',{scope:'./'}).catch(()=>{})}

})();
