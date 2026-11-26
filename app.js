/* Brasa · Fase 1: descoberta de lives da Kick e player oficial incorporado. Sem contas, sem dinheiro. */
(()=>{'use strict';
const $=(s,e=document)=>e.querySelector(s),$$=(s,e=document)=>[...e.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SLUG=/^[a-z0-9_-]{2,25}$/i,https=u=>/^https:\/\/[^\s"'<>]+$/i.test(u||'')?u:'';
const num=n=>n>=1e4?Math.round(n/1e3)+' mil':n>=1e3?(n/1e3).toFixed(1).replace('.',',')+' mil':String(n|0);
const I=n=>`<svg class="i" aria-hidden="true"><use href="#i-${n}"/></svg>`;
let tt;const toast=m=>{const e=$('#ts');e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2400)};
const KV={get(k,d){try{const v=localStorage.getItem('brasa:'+k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('brasa:'+k,JSON.stringify(v))}catch(e){toast('Não foi possível salvar neste navegador')}}};
const CFGAPI=(window.BRASA_CONFIG&&/^https:\/\/[^\s"'<>]+$/i.test(window.BRASA_CONFIG.API_URL||''))?window.BRASA_CONFIG.API_URL.replace(/\/+$/,''):'';
let API=CFGAPI||KV.get('api','')||'',FOL=(KV.get('seg',[])||[]).filter(s=>SLUG.test(s)),V={n:'home',id:''},Q='',CAT='',L={top:[],mine:[],err:'',busy:false,at:0};
/* Marca: tile de brasa com chama; capas: composições planas geradas pelo nome do canal */
const mark=z=>`<svg width="${z}" height="${z}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#ff5b2e"/><path d="M32 11c1 9 13 15 13 28a13 13 0 0 1-26 0c0-7 4-10 6-15 2 3 3 5 5 6 2-6 1-12 2-19z" fill="#f2e9dc"/><path d="M32 33c0 5 6 7 6 12a6 6 0 0 1-12 0c0-3 3-5 4-8z" fill="#ff5b2e"/></svg>`;
function art(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;const P=[['#ff5b2e','#f2e9dc','#3a2a22'],['#e8a33d','#2b2420','#f2e9dc'],['#7a3b2a','#f2c7a0','#14110f'],['#2d4a3e','#f2e9dc','#ff5b2e']][h%4],v=(h>>2)%3,o=h%23;
const g=v==0?`<circle cx="${50+o}" cy="45" r="30" fill="${P[1]}"/><circle cx="${50+o}" cy="45" r="14" fill="${P[2]}"/>`:v==1?`<rect x="${20+o}" width="34" height="90" fill="${P[1]}"/><rect x="${70+o}" y="30" width="22" height="60" fill="${P[2]}"/>`:`<path d="M0 90L${60+o} 0H${100+o}L${40+o} 90z" fill="${P[1]}"/><circle cx="130" cy="25" r="12" fill="${P[2]}"/>`;
return`<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="${P[0]}"/>${g}</svg>`}
/* Dados vindos da API (tudo validado antes de usar) */
const clean=a=>(Array.isArray(a)?a:[]).filter(x=>x&&SLUG.test(x.slug||'')).slice(0,60).map(x=>({slug:x.slug.toLowerCase(),title:String(x.title||'').slice(0,120),category:String(x.category||'').slice(0,60),viewers:Math.max(0,+x.viewers||0),at:Date.parse(x.startedAt)||0,thumb:https(x.thumbnail),avatar:https(x.avatar)}));
async function jget(p){const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);try{const r=await fetch(API+p,{signal:c.signal});if(!r.ok)throw Error('resposta '+r.status);return await r.json()}finally{clearTimeout(t)}}
async function load(force){if(!API||L.busy||(!force&&Date.now()-L.at<45e3))return;L.busy=true;L.err='';if(!L.top.length)render(true);
try{const[t,m]=await Promise.all([jget('/top?limit=48'),FOL.length?jget('/lives?slugs='+FOL.join(',')):{lives:[]}]);L.top=clean(t.lives);L.mine=clean(m.lives);L.at=Date.now()}
catch(e){L.err='Não foi possível falar com a API ('+(e.name==='AbortError'?'tempo esgotado':e.message)+').'}L.busy=false;render(true)}
const live=s=>L.mine.find(x=>x.slug===s)||L.top.find(x=>x.slug===s);
/* Componentes */
const av=l=>`<span class="av">${l.avatar?`<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(l.avatar)}">`:art(l.slug)}</span>`;
const card=l=>`<a class="cd" href="#/assistir/${l.slug}"><div class="th">${art(l.slug)}${l.thumb?`<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(l.thumb)}">`:''}<span class="live">AO VIVO</span><span class="vw"><i class="dot"></i>${num(l.viewers)}</span></div><div class="mt">${av(l)}<div><b>${esc(l.title||l.slug)}</b><span>${esc(l.slug)}${l.category?' · '+esc(l.category):''}</span></div></div></a>`;
const since=t=>{if(!t)return'';const m=Math.max(0,Math.round((Date.now()-t)/6e4));return m>=60?Math.floor(m/60)+' h '+(m%60)+' min':m+' min'};
const catList=()=>[...L.top.reduce((m,l)=>{if(l.category){const c=m.get(l.category)||{n:l.category,v:0,k:0};c.v+=l.viewers;c.k++;m.set(l.category,c)}return m},new Map()).values()].sort((a,b)=>b.v-a.v).slice(0,12);
/* Arte própria das categorias: composição plana por palavra-chave (nada de capas de terceiros) */
function catArt(n){let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))>>>0;const[a,b,c,d]=[['#ff5b2e','#f2e9dc','#3a2a22','#e8a33d'],['#2d4a3e','#f2e9dc','#ff5b2e','#e8a33d'],['#7a3b2a','#f2c7a0','#14110f','#ff5b2e'],['#27384f','#f2e9dc','#e8a33d','#ff5b2e']][h%4],k=n.toLowerCase();let g;
if(/chat|conversa|talk/.test(k))g=`<rect x="12" y="34" width="68" height="42" rx="12" fill="${b}"/><path d="M30 76l-6 18 24-18z" fill="${b}"/><rect x="40" y="62" width="68" height="40" rx="12" fill="${d}"/><path d="M88 102l8 16-24-16z" fill="${d}"/><circle cx="60" cy="82" r="4.5" fill="${c}"/><circle cx="75" cy="82" r="4.5" fill="${c}"/><circle cx="90" cy="82" r="4.5" fill="${c}"/>`;
else if(/irl|vlog|travel|viagem/.test(k))g=`<ellipse cx="60" cy="124" rx="32" ry="7" fill="${d}"/><path d="M34 76L60 120L86 76z" fill="${b}"/><circle cx="60" cy="64" r="30" fill="${b}"/><circle cx="60" cy="64" r="12" fill="${c}"/>`;
else if(/grand theft|gta|vice city|rp|roleplay/.test(k))g=`<circle cx="86" cy="46" r="17" fill="${d}"/><rect x="8" y="76" width="24" height="52" fill="${b}"/><rect x="36" y="44" width="28" height="84" fill="${d}"/><rect x="68" y="66" width="22" height="62" fill="${c}"/><rect x="94" y="88" width="20" height="40" fill="${b}"/>`;
else if(/valorant|counter|call of duty|warzone|free fire|fps|shooter|apex|pubg|fortnite|cs2|rainbow/.test(k))g=`<circle cx="60" cy="72" r="34" fill="none" stroke="${b}" stroke-width="7"/><circle cx="60" cy="72" r="7" fill="${d}"/><rect x="57" y="26" width="6" height="22" fill="${b}"/><rect x="57" y="96" width="6" height="22" fill="${b}"/><rect x="14" y="69" width="22" height="6" fill="${b}"/><rect x="84" y="69" width="22" height="6" fill="${b}"/>`;
else if(/minecraft|roblox|lego|block/.test(k))g=[0,1,2].map(i=>[0,1,2].map(j=>`<rect x="${14+j*32}" y="${30+i*32}" width="28" height="28" rx="3" fill="${[b,d,c][(i*3+j+(h>>3))%3]}"/>`).join('')).join('');
else if(/fifa|futebol|football|soccer|ea sports|fc 2|esporte/.test(k))g=`<circle cx="60" cy="72" r="38" fill="${b}"/><polygon points="60,56 74,66 69,83 51,83 46,66" fill="${c}"/><path d="M60 56V36M74 66l18-6M69 83l12 14M51 83L39 97M46 66L28 60" stroke="${c}" stroke-width="4" fill="none"/>`;
else if(/music|música|musica|dj|show/.test(k))g=[0,1,2,3,4,5,6].map(i=>{const t=26+((h>>i)%5)*13;return`<rect x="${12+i*15}" y="${128-t}" width="10" height="${t}" rx="3" fill="${i%2?d:b}"/>`}).join('');
else g=`<circle cx="60" cy="74" r="40" fill="${b}"/><circle cx="60" cy="74" r="26" fill="${c}"/><path d="M60 74L100 74A40 40 0 0 0 60 34z" fill="${d}"/><circle cx="60" cy="74" r="8" fill="${a}"/>`;
return`<svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="120" height="160" fill="${a}"/>${g}</svg>`}
const pc=(c,a,on)=>`<button class="pc${on?' on':''}" data-a="${a}" data-c="${esc(c.n)}"><div class="po">${catArt(c.n)}<span class="vb"><i class="dot"></i>${num(c.v)}</span></div><b>${esc(c.n)}</b><span>${c.k} ${c.k>1?'lives':'live'}</span></button>`;
const feat=l=>`<a class="ft" href="#/assistir/${l.slug}"><div class="th">${art(l.slug)}${l.thumb?`<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(l.thumb)}">`:''}<span class="vw"><i class="dot"></i>${num(l.viewers)}</span><div class="fb">${av(l)}<div><b>${esc(l.slug)}</b><span>${esc(l.title||'')}</span></div></div></div></a>`;
const sec=(t,b)=>`<h2>${t}</h2>${b}`,skel='<div class="grid">'+'<div class="sk"></div>'.repeat(4)+'</div>';
const setup=()=>`<div class="box"><div class="bm">${mark(48)}</div><h2 style="margin-top:0">Falta conectar a API da Kick</h2><p>Para saber quem está ao vivo, o Brasa usa a API oficial da Kick por meio de um pequeno servidor seu, assim a chave secreta nunca fica no app. O passo a passo está no README.</p><button class="btn" data-a="cfg">Conectar agora</button><p class="mu sm">Enquanto isso dá para assistir qualquer canal: em Explorar, digite o nome dele.</p></div>`;
const watchHead=()=>{const s=V.id,l=live(s),f=FOL.includes(s);return`<div class="who2"><span class="av big">${l&&l.avatar?`<img referrerpolicy="no-referrer" alt="" src="${esc(l.avatar)}">`:art(s)}</span><div class="tx"><b>${esc(s)}${l?' <span class="tagl">AO VIVO</span>':''}</b><small>${l?`<span class="vm"><i class="dot"></i>${num(l.viewers)} assistindo</span>${l.at?' · há '+since(l.at):''}`:API?'Sem live no ar agora':'Status ao vivo indisponível'}</small></div><button class="btn${f?' s':''}" data-a="fol" data-s="${s}">${I(f?'heartf':'heart')}${f?'Seguindo':'Seguir'}</button></div>`};
const watchAbout=()=>{const s=V.id,l=live(s),sug=L.top.filter(x=>x.slug!==s).slice(0,10);return`${l?`<p class="tt">${esc(l.title)}</p>${l.category?`<button class="chip" data-a="cat" data-c="${esc(l.category)}">${esc(l.category)}</button>`:''}`:''}<div class="btns"><a class="btn s" href="https://kick.com/${encodeURIComponent(s)}" target="_blank" rel="noopener noreferrer">${I('ext')}Abrir na Kick</a></div>${sug.length?sec('Mais lives',`<div class="rail">${sug.map(card).join('')}</div>`):''}<p class="mu sm">O vídeo e os avisos dentro do player são da Kick e não podem ser alterados pelo Brasa. A contagem de espectadores vem da API da Kick e atualiza a cada minuto.</p>`};
const VW={
home(){let h='<h1>Ao vivo agora</h1>';if(!API)return h+setup();
if(L.err)h+=`<div class="box err"><p>${esc(L.err)}</p><button class="btn" data-a="re">Tentar de novo</button></div>`;
if(L.mine.length)h+=sec('Quem você segue está ao vivo',`<div class="rail">${L.mine.map(card).join('')}</div>`);
if(L.top.length>2)h+=sec('Em destaque',`<div class="rail">${L.top.slice(0,5).map(feat).join('')}</div>`);
const cats=catList();if(cats.length)h+=sec('Principais categorias ao vivo',`<div class="rail">${cats.map(c=>pc(c,'cat')).join('')}</div>`);
return h+sec('Mais assistidas',L.top.length?`<div class="grid">${L.top.slice(L.top.length>8?5:0,29).map(card).join('')}</div>`:L.busy?skel:L.err?'':'<div class="box"><p>Nenhuma live encontrada agora.</p></div>')},
explore(){return`<h1>Explorar</h1><input id="q" class="in" type="search" placeholder="Nome do canal, título ou categoria" autocomplete="off" value="${esc(Q)}"><div id="res"></div>`},
seg(){let h='<h1>Seguindo</h1>';if(!FOL.length)return h+'<div class="box"><p>Você ainda não segue ninguém. Abra um canal e toque em Seguir.</p><a class="btn" href="#/explorar">Buscar um canal</a></div>';
const row=s=>{const l=live(s);return`<div class="row"><a class="rl" href="#/assistir/${s}"><span class="av">${l&&l.avatar?`<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(l.avatar)}">`:art(s)}</span><span class="tx"><b>${esc(s)}</b><small>${l?`<i class="dot"></i>AO VIVO${l.category?' · '+esc(l.category):''} · ${num(l.viewers)}`:API?'Offline':'Status indisponível sem a API'}</small></span></a><button class="ib" data-a="fol" data-s="${s}" aria-label="Deixar de seguir ${esc(s)}">${I('heartf')}</button></div>`};
const on=FOL.filter(live),off=FOL.filter(s=>!live(s));return h+(on.length?sec('Ao vivo',on.map(row).join('')):'')+(off.length?sec(on.length?'Offline':'Canais',off.map(row).join('')):'')},
watch(){const s=V.id;return`<div class="wbar"><a class="ib" href="#/" data-a="back" aria-label="Voltar">${I('left')}</a><b>${esc(s)}</b><span class="sp"></span><button class="ib" data-a="fs" aria-label="Tela cheia">${I('expand')}</button></div><div class="pl" id="pl" data-s="${s}"><iframe src="https://player.kick.com/${encodeURIComponent(s)}?autoplay=true" allow="autoplay; fullscreen" allowfullscreen title="Live de ${esc(s)}"></iframe></div><div id="wh">${watchHead()}</div><div class="wtabs"><button class="wt on" data-a="wt" data-k="chat">Chat</button><button class="wt" data-a="wt" data-k="sobre">Sobre</button></div><div class="wbody"><div id="pchat"><div id="chat" class="chat"><p class="mu sm">O chat do Brasa precisa das contas conectadas. Veja o README.</p></div></div><div id="psobre" hidden>${watchAbout()}</div></div>`}};
function res(){const q=Q.trim().toLowerCase(),all=[...new Map([...L.mine,...L.top].map(l=>[l.slug,l])).values()],cats=[...new Set(all.map(l=>l.category).filter(Boolean))].slice(0,10);let h='';
const cl=catList();if(cl.length)h+=`<div class="rail" style="margin-bottom:14px">${cl.map(c=>pc(c,'cat2',CAT===c.n)).join('')}</div>`;
if(SLUG.test(q)&&!all.some(l=>l.slug===q))h+=`<a class="row" href="#/assistir/${q}">${I('play')}<span>Abrir o canal <b>${esc(q)}</b></span></a>`;
const r=all.filter(l=>(!CAT||l.category===CAT)&&(!q||[l.slug,l.title,l.category].some(s=>s.toLowerCase().includes(q))));
h+=r.length?`<div class="grid">${r.map(card).join('')}</div>`:`<div class="box"><p>${API?'Nenhuma live no ar com esse filtro agora.':'Conecte a API para listar as lives. Você ainda pode abrir um canal digitando o nome acima.'}</p></div>`;$('#res').innerHTML=h}
function render(keep){const m=$('#m'),n=V.n,pl=$('#pl');if(keep&&n==='watch'&&pl&&pl.dataset&&pl.dataset.s===V.id){$('#wh').innerHTML=watchHead();$('#psobre').innerHTML=watchAbout();return}if(n==='explore'&&document.activeElement===$('#q')){res();return}
m.innerHTML=(VW[n]||VW.home)()+(n==='watch'?'':'<p class="mu sm vf">Brasa v'+(typeof BRASA_V==='undefined'?'?':BRASA_V)+'</p>');$('#app').classList.toggle('w',n==='watch');if(n==='explore')res();if(!keep)m.scrollTop=0;$$('nav a').forEach(a=>a.classList.toggle('on',a.dataset.k===(n==='watch'?'home':n)));if(!keep&&window.Brasa&&window.Brasa.after)window.Brasa.after(n,V.id)}
function route(){const h=location.hash.replace(/^#\/?/,'').split('/'),w=h[0]==='assistir'&&SLUG.test(h[1]||'');V={n:w?'watch':h[0]==='explorar'?'explore':h[0]==='seguindo'?'seg':h[0]==='perfil'?'perfil':'home',id:w?h[1].toLowerCase():''};render();if(V.n!=='watch')load()}
$('#hd').innerHTML=`${mark(32)}<b>Brasa</b>${CFGAPI?'':`<button class="ib" data-a="cfg" aria-label="Conectar a API da Kick">${I('gear')}</button>`}`;
/* Folha de configuração da API */
const sh=h=>{$('#sh').innerHTML=`<div class="bk" data-a="x"></div><div class="pn" role="dialog">${h}</div>`;$('#sh').hidden=false};
function cfg(){sh(`<h2>Conectar a API da Kick</h2><p class="mu">Cole o endereço do seu servidor (o Worker do arquivo brasa-worker.js).</p><input id="ap" class="in" inputmode="url" placeholder="https://brasa-api.seunome.workers.dev" value="${esc(API)}"><button class="btn" data-a="apsave">Salvar e testar</button>${API?'<button class="btn s" data-a="apclr">Desconectar</button>':''}<p class="mu sm" id="aps"></p>`)}
const act={wt(b){const k=b.dataset.k;$('#pchat').hidden=k!=='chat';$('#psobre').hidden=k!=='sobre';$$('.wt').forEach(x=>x.classList.toggle('on',x===b))},cfg,x:()=>{$('#sh').hidden=true},re:()=>load(true),
cat(b){CAT=b.dataset.c;location.hash='#/explorar'},cat2(b){CAT=CAT===b.dataset.c?'':b.dataset.c;res()},
fol(b){const s=b.dataset.s;FOL=FOL.includes(s)?FOL.filter(x=>x!==s):[...FOL,s];KV.set('seg',FOL);toast(FOL.includes(s)?'Você segue '+s:'Deixou de seguir '+s);L.at=0;render(true);load(true)},
back(b,e){if(history.length>1){e.preventDefault();history.back()}},
fs(){const p=$('#pl');(p.requestFullscreen||p.webkitRequestFullscreen||(()=>Promise.reject())).call(p).catch(()=>toast('Seu navegador não permitiu tela cheia aqui'))},
apclr(){API='';KV.set('api','');L={top:[],mine:[],err:'',busy:false,at:0};act.x();render(true)},
async apsave(){const s=$('#aps'),u=$('#ap').value.trim().replace(/\/+$/,'');if(!/^(https:\/\/[^\s"'<>]+|http:\/\/localhost(:\d+)?)$/i.test(u)){s.textContent='Endereço inválido. Use um link que comece com https://';return}
s.textContent='Testando…';try{const r=await fetch(u+'/health'),j=await r.json();if(!r.ok||!j.ok)throw Error(j.ok===false?'o servidor não tem as chaves da Kick configuradas':'resposta '+r.status);API=u;KV.set('api',u);L.at=0;act.x();toast('API conectada');render(true);load(true)}catch(e){s.textContent='Não deu certo: '+e.message}}};
window.Brasa={VW,act,esc,I,toast,sh,art,mark,catArt,route,render:()=>render(true),view:()=>V};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&act[b.dataset.a])act[b.dataset.a](b,e)});
document.addEventListener('input',e=>{if(e.target.id==='q'){Q=e.target.value;res()}});
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.remove()},true);
addEventListener('hashchange',route);
/* Atualização: no máximo 1 vez por minuto, só com a aba visível e fora do player */
setInterval(()=>{if(document.visibilityState==='visible'&&V.n!=='watch')load()},6e4);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&V.n!=='watch')load()});
route();
})();
