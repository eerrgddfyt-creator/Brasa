/* Brasa API · Cloudflare Worker. Ponte entre o app e a API oficial da Kick (api.kick.com/public/v1).
   Segredos (Settings > Variables and Secrets): KICK_CLIENT_ID, KICK_CLIENT_SECRET
   Opcionais: ALLOW_ORIGIN (ex.: https://seusite.pages.dev), DEFAULT_LANG (padrão "pt")
   Rotas: GET /health · GET /top?limit=24 · GET /lives?slugs=canal1,canal2 */
const SLUG=/^[a-z0-9_-]{2,25}$/i,ids=new Map();let tok={v:'',exp:0};
const cors=env=>({'access-control-allow-origin':env.ALLOW_ORIGIN||'*','access-control-allow-methods':'GET,OPTIONS',vary:'origin'});
const json=(o,env,s=200,x={})=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json',...cors(env),...x}});
async function token(env){if(tok.v&&Date.now()<tok.exp)return tok.v;
const r=await fetch('https://id.kick.com/oauth/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'client_credentials',client_id:env.KICK_CLIENT_ID,client_secret:env.KICK_CLIENT_SECRET})});
if(!r.ok)throw new Error('token '+r.status);const j=await r.json();tok={v:j.access_token,exp:Date.now()+Math.max(60,(j.expires_in||3600)-300)*1e3};return tok.v}
async function kick(env,path){const r=await fetch('https://api.kick.com/public/v1'+path,{headers:{authorization:'Bearer '+await token(env)}});if(!r.ok)throw new Error('kick '+r.status);return(await r.json()).data||[]}
const norm=s=>({slug:s.slug,title:s.stream_title,category:s.category&&s.category.name||'',viewers:s.viewer_count|0,startedAt:s.started_at,thumbnail:s.thumbnail||'',avatar:s.profile_picture||''});
/* slug -> id do streamer (a Kick recusa o pedido inteiro se um nome não existir, então há plano B canal a canal) */
async function resolve(env,slugs){const miss=slugs.filter(s=>!ids.has(s));
if(miss.length){try{(await kick(env,'/channels?'+miss.map(s=>'slug='+s).join('&'))).forEach(c=>ids.set(String(c.slug).toLowerCase(),c.broadcaster_user_id))}
catch(e){for(const s of miss){try{const c=(await kick(env,'/channels?slug='+s))[0];if(c)ids.set(s,c.broadcaster_user_id)}catch(_){}}}}
return slugs.map(s=>ids.get(s)).filter(Boolean)}
export default{async fetch(req,env,ctx){const u=new URL(req.url);
if(req.method==='OPTIONS')return new Response(null,{headers:cors(env)});if(req.method!=='GET')return json({error:'método não permitido'},env,405);
if(u.pathname==='/health')return json({ok:!!(env.KICK_CLIENT_ID&&env.KICK_CLIENT_SECRET)},env);
const cache=typeof caches!=='undefined'?caches.default:null,key=new Request(u.toString()),hit=cache&&await cache.match(key);
if(hit)return new Response(hit.body,{headers:{...Object.fromEntries(hit.headers),...cors(env)}});
try{let lives;
if(u.pathname==='/top'){const n=Math.min(Math.max(+u.searchParams.get('limit')||24,1),48);lives=await kick(env,'/livestreams?limit='+n+'&sort=viewer_count&language='+encodeURIComponent(env.DEFAULT_LANG||'pt'))}
else if(u.pathname==='/lives'){const slugs=[...new Set((u.searchParams.get('slugs')||'').toLowerCase().split(',').filter(s=>SLUG.test(s)))].slice(0,30),b=await resolve(env,slugs);lives=b.length?await kick(env,'/livestreams?'+b.map(i=>'broadcaster_user_id='+i).join('&')):[]}
else return json({error:'rota não encontrada'},env,404);
const res=json({lives:lives.map(norm),at:Date.now()},env,200,{'cache-control':'public, max-age=45'});if(cache)ctx.waitUntil(cache.put(key,res.clone()));return res}
catch(e){return json({error:String(e.message||e)},env,502)}}};
