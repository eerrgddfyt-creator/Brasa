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
const mark=z=>`<svg width="${z}" height="${z}" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="var(--em)"/><path d="M32 11c1 9 13 15 13 28a13 13 0 0 1-26 0c0-7 4-10 6-15 2 3 3 5 5 6 2-6 1-12 2-19z" fill="var(--ink)"/><path d="M32 33c0 5 6 7 6 12a6 6 0 0 1-12 0c0-3 3-5 4-8z" fill="var(--em)"/></svg>`;
function art(s){let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;const P=[['#ff5b2e','#f2e9dc','#3a2a22'],['#e8a33d','#2b2420','#f2e9dc'],['#7a3b2a','#f2c7a0','#14110f'],['#2d4a3e','#f2e9dc','#ff5b2e']][h%4],v=(h>>2)%3,o=h%23;
const g=v==0?`<circle cx="${50+o}" cy="45" r="30" fill="${P[1]}"/><circle cx="${50+o}" cy="45" r="14" fill="${P[2]}"/>`:v==1?`<rect x="${20+o}" width="34" height="90" fill="${P[1]}"/><rect x="${70+o}" y="30" width="22" height="60" fill="${P[2]}"/>`:`<path d="M0 90L${60+o} 0H${100+o}L${40+o} 90z" fill="${P[1]}"/><circle cx="130" cy="25" r="12" fill="${P[2]}"/>`;
return`<svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="160" height="90" fill="${P[0]}"/>${g}</svg>`}
/* Dados vindos da API (tudo validado antes de usar) */
const clean=a=>(Array.isArray(a)?a:[]).filter(x=>x&&SLUG.test(x.slug||'')).slice(0,60).map(x=>({slug:x.slug.toLowerCase(),title:String(x.title||'').slice(0,120),category:String(x.category||'').slice(0,60),viewers:Math.max(0,+x.viewers||0),thumb:https(x.thumbnail),avatar:https(x.avatar)}));
async function jget(p){const c=new AbortController(),t=setTimeout(()=>c.abort(),9000);try{const r=await fetch(API+p,{signal:c.signal});if(!r.ok)throw Error('resposta '+r.status);return await r.json()}finally{clearTimeout(t)}}
async function load(force){if(!API||L.busy||(!force&&Date.now()-L.at<45e3))return;L.busy=true;L.err='';if(!L.top.length)render(true);
try{const[t,m]=await Promise.all([jget('/top?limit=24'),FOL.length?jget('/lives?slugs='+FOL.join(',')):{lives:[]}]);L.top=clean(t.lives);L.mine=clean(m.lives);L.at=Date.now()}
catch(e){L.err='Não foi possível falar com a API ('+(e.name==='AbortError'?'tempo esgotado':e.message)+').'}L.busy=false;render(true)}
const live=s=>L.mine.find(x=>x.slug===s)||L.top.find(x=>x.slug===s);
/* Componentes */
const av=l=>`<span class="av">${l.avatar?`<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(l.avatar)}">`:art(l.slug)}</span>`;
const card=l=>`<a class="cd" href="#/assistir/${l.slug}"><div class="th">${art(l.slug)}${l.thumb?`<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(l.thumb)}">`:''}<span class="live">AO VIVO</span><span class="vw">${num(l.viewers)}</span></div><div class="mt">${av(l)}<div><b>${esc(l.title||l.slug)}</b><span>${esc(l.slug)}${l.category?' · '+esc(l.category):''}</span></div></div></a>`;
const sec=(t,b)=>`<h2>${t}</h2>${b}`,skel='<div class="grid">'+'<div class="sk"></div>'.repeat(4)+'</div>';
const setup=()=>`<div class="box"><div class="bm">${mark(48)}</div><h2 style="margin-top:0">Falta conectar a API da Kick</h2><p>Para saber quem está ao vivo, o Brasa usa a API oficial da Kick por meio de um pequeno servidor seu, assim a chave secreta nunca fica no app. O passo a passo está no README.</p><button class="btn" data-a="cfg">Conectar agora</button><p class="mu sm">Enquanto isso dá para assistir qualquer canal: em Explorar, digite o nome dele.</p></div>`;
const VW={
home(){let h='<h1>Ao vivo agora</h1>';if(!API)return h+setup();
if(L.err)h+=`<div class="box err"><p>${esc(L.err)}</p><button class="btn" data-a="re">Tentar de novo</button></div>`;
if(L.mine.length)h+=sec('Quem você segue está ao vivo',`<div class="rail">${L.mine.map(card).join('')}</div>`);
const cats=[...L.top.reduce((m,l)=>l.category?m.set(l.category,(m.get(l.category)||0)+1):m,new Map())].sort((a,b)=>b[1]-a[1]).slice(0,8);
if(cats.length)h+=sec('Categorias em alta',cats.map(([c,n])=>`<button class="chip" data-a="cat" data-c="${esc(c)}">${esc(c)} <small>${n}</small></button>`).join(''));
return h+sec('Mais assistidas',L.top.length?`<div class="grid">${L.top.map(card).join('')}</div>`:L.busy?skel:L.err?'':'<div class="box"><p>Nenhuma live encontrada agora.</p></div>')},
explore(){return`<h1>Explorar</h1><input id="q" class="in" type="search" placeholder="Nome do canal, título ou categoria" autocomplete="off" value="${esc(Q)}"><div id="res"></div>`},
seg(){let h='<h1>Seguindo</h1>';if(!FOL.length)return h+'<div class="box"><p>Você ainda não segue ninguém. Abra um canal e toque em Seguir.</p><a class="btn" href="#/explorar">Buscar um canal</a></div>';
const row=s=>{const l=live(s);return`<div class="row"><a class="rl" href="#/assistir/${s}"><span class="av">${l&&l.avatar?`<img loading="lazy" referrerpolicy="no-referrer" alt="" src="${esc(l.avatar)}">`:art(s)}</span><span class="tx"><b>${esc(s)}</b><small>${l?`<i class="dot"></i>AO VIVO${l.category?' · '+esc(l.category):''} · ${num(l.viewers)}`:API?'Offline':'Status indisponível sem a API'}</small></span></a><button class="ib" data-a="fol" data-s="${s}" aria-label="Deixar de seguir ${esc(s)}">${I('heartf')}</button></div>`};
const on=FOL.filter(live),off=FOL.filter(s=>!live(s));return h+(on.length?sec('Ao vivo',on.map(row).join('')):'')+(off.length?sec(on.length?'Offline':'Canais',off.map(row).join('')):'')},
watch(){const s=V.id,l=live(s),f=FOL.includes(s),sug=L.top.filter(x=>x.slug!==s).slice(0,8);
return`<div class="hd"><a class="ib" href="#/" data-a="back" aria-label="Voltar">${I('left')}</a><h1>${esc(s)}</h1></div><div class="pl" id="pl"><iframe src="https://player.kick.com/${encodeURIComponent(s)}?autoplay=true" allow="autoplay; fullscreen" allowfullscreen title="Live de ${esc(s)}"></iframe></div><div class="info">${l?`<span class="tagl">AO VIVO</span> <small class="mu">${num(l.viewers)} assistindo</small>`:`<small class="mu">${API?'Sem live no ar agora, ou o status ainda não carregou.':'Status ao vivo indisponível sem a API.'}</small>`}<b class="tt">${esc(l?l.title:s)}</b>${l&&l.category?`<small class="mu">${esc(l.category)}</small>`:''}</div><div class="btns"><button class="btn${f?' s':''}" data-a="fol" data-s="${s}">${I(f?'heartf':'heart')}${f?'Seguindo':'Seguir'}</button><button class="btn s" data-a="fs">${I('expand')}Tela cheia</button><a class="btn s" href="https://kick.com/${encodeURIComponent(s)}" target="_blank" rel="noopener noreferrer">${I('ext')}Abrir na Kick</a></div>${sug.length?sec('Outras lives',`<div class="rail">${sug.map(card).join('')}</div>`):''}<p class="mu sm">Se o vídeo não carregar, a Kick pode ter bloqueado o player incorporado neste site. Use Abrir na Kick.</p>`}};
function res(){const q=Q.trim().toLowerCase(),all=[...new Map([...L.mine,...L.top].map(l=>[l.slug,l])).values()],cats=[...new Set(all.map(l=>l.category).filter(Boolean))].slice(0,10);let h='';
if(cats.length)h+=`<div class="chips">${cats.map(c=>`<button class="chip${CAT===c?' on':''}" data-a="cat2" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
if(SLUG.test(q)&&!all.some(l=>l.slug===q))h+=`<a class="row" href="#/assistir/${q}">${I('play')}<span>Abrir o canal <b>${esc(q)}</b></span></a>`;
const r=all.filter(l=>(!CAT||l.category===CAT)&&(!q||[l.slug,l.title,l.category].some(s=>s.toLowerCase().includes(q))));
h+=r.length?`<div class="grid">${r.map(card).join('')}</div>`:`<div class="box"><p>${API?'Nenhuma live no ar com esse filtro agora.':'Conecte a API para listar as lives. Você ainda pode abrir um canal digitando o nome acima.'}</p></div>`;$('#res').innerHTML=h}
function render(keep){const m=$('#m'),n=V.n;if(n==='explore'&&document.activeElement===$('#q')){res();return}
m.innerHTML=(VW[n]||VW.home)();if(n==='explore')res();if(!keep)m.scrollTop=0;$$('nav a').forEach(a=>a.classList.toggle('on',a.dataset.k===(n==='watch'?'home':n)))}
function route(){const h=location.hash.replace(/^#\/?/,'').split('/'),w=h[0]==='assistir'&&SLUG.test(h[1]||'');V={n:w?'watch':h[0]==='explorar'?'explore':h[0]==='seguindo'?'seg':h[0]==='perfil'?'perfil':'home',id:w?h[1].toLowerCase():''};render();if(V.n!=='watch')load()}
$('#hd').innerHTML=`${mark(32)}<b>Brasa</b>${CFGAPI?'':`<button class="ib" data-a="cfg" aria-label="Conectar a API da Kick">${I('gear')}</button>`}`;
/* Folha de configuração da API */
const sh=h=>{$('#sh').innerHTML=`<div class="bk" data-a="x"></div><div class="pn" role="dialog">${h}</div>`;$('#sh').hidden=false};
function cfg(){sh(`<h2>Conectar a API da Kick</h2><p class="mu">Cole o endereço do seu servidor (o Worker do arquivo brasa-worker.js).</p><input id="ap" class="in" inputmode="url" placeholder="https://brasa-api.seunome.workers.dev" value="${esc(API)}"><button class="btn" data-a="apsave">Salvar e testar</button>${API?'<button class="btn s" data-a="apclr">Desconectar</button>':''}<p class="mu sm" id="aps"></p>`)}
const act={cfg,x:()=>{$('#sh').hidden=true},re:()=>load(true),
cat(b){CAT=b.dataset.c;location.hash='#/explorar'},cat2(b){CAT=CAT===b.dataset.c?'':b.dataset.c;res()},
fol(b){const s=b.dataset.s;FOL=FOL.includes(s)?FOL.filter(x=>x!==s):[...FOL,s];KV.set('seg',FOL);toast(FOL.includes(s)?'Você segue '+s:'Deixou de seguir '+s);L.at=0;render(true);load(true)},
back(b,e){if(history.length>1){e.preventDefault();history.back()}},
fs(){const p=$('#pl');(p.requestFullscreen||p.webkitRequestFullscreen||(()=>Promise.reject())).call(p).catch(()=>toast('Seu navegador não permitiu tela cheia aqui'))},
apclr(){API='';KV.set('api','');L={top:[],mine:[],err:'',busy:false,at:0};act.x();render(true)},
async apsave(){const s=$('#aps'),u=$('#ap').value.trim().replace(/\/+$/,'');if(!/^(https:\/\/[^\s"'<>]+|http:\/\/localhost(:\d+)?)$/i.test(u)){s.textContent='Endereço inválido. Use um link que comece com https://';return}
s.textContent='Testando…';try{const r=await fetch(u+'/health'),j=await r.json();if(!r.ok||!j.ok)throw Error(j.ok===false?'o servidor não tem as chaves da Kick configuradas':'resposta '+r.status);API=u;KV.set('api',u);L.at=0;act.x();toast('API conectada');render(true);load(true)}catch(e){s.textContent='Não deu certo: '+e.message}}};
window.Brasa={VW,act,esc,I,toast,sh,art,mark,route,render:()=>render(true),view:()=>V};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&act[b.dataset.a])act[b.dataset.a](b,e)});
document.addEventListener('input',e=>{if(e.target.id==='q'){Q=e.target.value;res()}});
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.remove()},true);
addEventListener('hashchange',route);
/* Atualização: no máximo 1 vez por minuto, só com a aba visível e fora do player */
setInterval(()=>{if(document.visibilityState==='visible'&&V.n!=='watch')load()},6e4);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&V.n!=='watch')load()});
route();
})();
