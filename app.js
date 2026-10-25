(function(){"use strict";
const R=window.RELICS||[];const $=id=>document.getElementById(id);
const fold=s=>(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const esc=s=>(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
R.forEach((r,i)=>{r.i=i;r.hay=fold([r.title,r.saints.join(' '),r.original,r.english,r.note,r.file].join(' '))});
const saints=[...new Set(R.flatMap(r=>r.saints))].sort((a,b)=>fold(a).localeCompare(fold(b)));
const first=s=>fold(s)[0].toUpperCase();
const P=new URLSearchParams(location.search);
const S={q:P.get('q')||'',saint:P.get('saint')||'',letter:P.get('letter')||'',kind:P.get('kind')||'all',page:Math.max(1,+P.get('page')||1),size:+P.get('size')===24?24:12};
// deep-link fallback: index.html#img-0557 -> relic page
if(/^#img-\d+$/.test(location.hash)){location.replace('relic/'+location.hash.slice(1)+'.html');return}
const mk=(t,fn,dis,cls)=>{const b=document.createElement('button');b.type='button';b.className='btn'+(cls?' '+cls:'');b.textContent=t;if(dis)b.disabled=true;b.onclick=fn;return b};
saints.forEach(s=>{const o=document.createElement('option');o.value=s;o.textContent=s;$('saint').appendChild(o)});
const has=new Set(saints.map(first));
$('az').appendChild(mk('All',()=>{S.letter='';S.saint='';S.q='';$('q').value='';S.page=1;render()}));
'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(L=>$('az').appendChild(mk(L,()=>{S.letter=S.letter===L?'':L;S.saint='';S.page=1;render()},!has.has(L))));
const KINDS=[['all','All labels'],['latin','Latin or Greek'],['english','Already in English']];
KINDS.forEach(([k,t])=>{const b=mk(t,()=>{S.kind=k;S.page=1;render()});b.dataset.kind=k;$('pills').appendChild(b)});
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>{S.size=+b.dataset.size;S.page=1;render()});
const isLatin=r=>/Latin|Greek|Mixed/.test(r.language)&&r.original;
const isEng=r=>r.language==='English'&&r.original;
function list(){const ws=fold(S.q).split(/\s+/).filter(Boolean);
  let l=R.filter(r=>ws.every(w=>r.hay.includes(w))&&(S.kind==='all'||(S.kind==='latin'?isLatin(r):isEng(r))));
  if(S.saint)l=l.filter(r=>r.saints.includes(S.saint));
  else if(S.letter){l=l.filter(r=>r.saints.some(s=>first(s)===S.letter));const key=r=>fold(r.saints.find(s=>first(s)===S.letter));l.sort((a,b)=>key(a).localeCompare(key(b))||a.i-b.i)}
  return l}
function sync(){const p=new URLSearchParams();if(S.q)p.set('q',S.q);if(S.saint)p.set('saint',S.saint);if(S.letter)p.set('letter',S.letter);if(S.kind!=='all')p.set('kind',S.kind);p.set('page',S.page);p.set('size',S.size);history.replaceState(null,'','?'+p.toString())}
function render(){
  $('q').value=S.q;$('saint').value=S.saint;
  [...$('az').children].forEach(b=>b.classList.toggle('on',b.textContent==='All'?(!S.letter&&!S.saint):b.textContent===S.letter));
  document.querySelectorAll('[data-kind]').forEach(b=>b.classList.toggle('on',b.dataset.kind===S.kind));
  document.querySelectorAll('[data-size]').forEach(b=>b.classList.toggle('on',+b.dataset.size===S.size));
  const n=$('names');if(S.letter){n.innerHTML='';saints.filter(s=>first(s)===S.letter).forEach(s=>n.appendChild(mk(s,()=>{S.saint=S.saint===s?'':s;S.page=1;render()},false,S.saint===s?'on':'')));n.hidden=false}else n.hidden=true;
  const l=list(),pages=Math.max(1,Math.ceil(l.length/S.size));if(S.page>pages)S.page=pages;
  const st=(S.page-1)*S.size,sl=l.slice(st,st+S.size);
  $('grid').innerHTML=sl.length?sl.map(r=>`<a class="card" href="relic/${r.id}.html"><div class="ph">${r.hasImg?`<img loading="lazy" src="${r.thumb}" alt="${esc(r.title)}">`:'<span>Photograph pending</span>'}</div><div class="tx"><span class="tag">${esc(r.tag)}</span><h3>${esc(r.title)}</h3><p>${esc(/^\(Already/.test(r.english||'')?r.original.replace(/ \| /g,' · '):(r.english||r.note))}</p></div></a>`).join(''):'<p class="empty">No relics match.</p>';
  $('showing').textContent=l.length?`Showing ${st+1}–${st+sl.length} of ${l.length}`:'';
  const p=$('pager');p.innerHTML='';
  if(pages>1){p.appendChild(mk('Previous',()=>go(S.page-1),S.page===1));
    const ns=[...new Set([1,pages,S.page-2,S.page-1,S.page,S.page+1,S.page+2])].filter(x=>x>=1&&x<=pages).sort((a,b)=>a-b);let last=0;
    ns.forEach(x=>{if(x-last>1){const g=document.createElement('span');g.className='gap';g.textContent='…';p.appendChild(g)}const b=mk(String(x),()=>go(x),false,x===S.page?'on':'');if(x===S.page)b.setAttribute('aria-current','page');p.appendChild(b);last=x});
    p.appendChild(mk('Next',()=>go(S.page+1),S.page===pages))}
  sync()}
function go(x){S.page=x;render();window.scrollTo({top:$('q').getBoundingClientRect().top+scrollY-20,behavior:'smooth'})}
let t;$('q').addEventListener('input',e=>{clearTimeout(t);t=setTimeout(()=>{S.q=e.target.value.trim();S.page=1;render()},150)});
$('saint').onchange=e=>{S.saint=e.target.value;S.letter=S.saint?first(S.saint):'';S.page=1;render()};
if(S.saint&&!S.letter)S.letter=first(S.saint);
render()})();
