/* Brasa 0.4.0 · Chat Brasa: chat só dos usuários do Brasa, por canal (Supabase Realtime). Não é o chat da Kick. */
(()=>{'use strict';
const B=window.Brasa,sb=B&&B.sb;if(!B)return;const{esc,toast,act}=B,$=s=>document.querySelector(s);
const HEX=/^#[0-9a-f]{6}$/i,hx=v=>HEX.test(v||'')?v:'#f2e9dc';
const FONTS={padrao:'system-ui,sans-serif',serif:'Georgia,"Times New Roman",serif',mono:'ui-monospace,Menlo,Consolas,monospace',redonda:'ui-rounded,"Segoe UI",system-ui,sans-serif'};
const TONE={em:['#ff5b2e','#14110f'],ouro:['#e8a33d','#14110f'],musgo:['#2d4a3e','#f2e9dc'],tinta:['#f2e9dc','#14110f'],vinho:['#7a3b2a','#f2e9dc']};
let room='',ch=null,seen=new Set(),sentAt=0,user=null;
const tagH=(l,t)=>{if(!l)return'';const c=TONE[t]||TONE.em;return`<span class="tg" style="background:${c[0]};color:${c[1]}">${esc(String(l).slice(0,10))}</span>`};
const line=m=>`<div class="cm"><b style="color:${hx(m.color)};font-family:${FONTS[m.font]||FONTS.padrao}">${esc(m.name)}</b>${tagH(m.tag,m.tone)}<span>${esc(m.body)}</span></div>`;
function add(m){if(!m||!m.id||seen.has(m.id)||m.room!==room)return;seen.add(m.id);const box=$('#msgs');if(!box)return;const e=$('#cemp');if(e)e.remove();
const near=box.scrollHeight-box.scrollTop-box.clientHeight<90;box.insertAdjacentHTML('beforeend',line(m));while(box.children.length>120)box.firstChild.remove();if(near)box.scrollTop=box.scrollHeight}
function unmount(){if(ch&&sb){try{sb.removeChannel(ch)}catch(e){}}ch=null;room='';seen=new Set()}
function drawInput(){const c=$('#cin');if(!c)return;c.innerHTML=user?'<input id="cm" class="in" maxlength="300" placeholder="Enviar mensagem" autocomplete="off" enterkeyhint="send"><button class="btn" data-a="csend">Enviar</button>':'<a class="btn" href="#/perfil">Entrar para comentar</a>'}
async function mount(slug){unmount();room=slug;const c=$('#chat');if(!c)return;
if(!sb){c.innerHTML='<p class="mu sm">O chat do Brasa precisa das contas conectadas (Supabase). Veja o README.</p>';return}
c.innerHTML='<p class="mu sm cnote">Chat do Brasa: só quem usa o app vê estas mensagens. Não é o chat da Kick.</p><div class="msgs" id="msgs" aria-live="polite"></div><div class="cin" id="cin"></div>';
try{const r=await sb.auth.getSession();user=r.data.session&&r.data.session.user}catch(e){user=null}
if(room!==slug)return;drawInput();
ch=sb.channel('chat-'+slug).on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:'room=eq.'+slug},p=>add(p.new)).subscribe();
const r=await sb.from('chat_messages').select('*').eq('room',slug).order('id',{ascending:false}).limit(40);if(room!==slug)return;
const box=$('#msgs');if(!box)return;
if(r.error){box.innerHTML='<p class="mu sm">Não foi possível carregar o chat. Se você acabou de atualizar o app, rode o atualizacao-0.4.0.sql no Supabase.</p>';return}
(r.data||[]).reverse().forEach(add);if(!(r.data||[]).length)box.insertAdjacentHTML('afterbegin','<p class="mu sm" id="cemp">Seja o primeiro a comentar.</p>');box.scrollTop=box.scrollHeight}
async function send(){const i=$('#cm');if(!i||!sb)return;const body=i.value.replace(/[\u0000-\u001f\u007f]/g,'').trim();if(!body)return;
if(Date.now()-sentAt<2000)return toast('Devagar: espere 2 segundos');sentAt=Date.now();i.value='';
const r=await sb.from('chat_messages').insert({room,body}).select().single();
if(r.error){i.value=body;toast(/devagar|sem acesso/i.test(r.error.message)?r.error.message:'Não foi possível enviar');return}add(r.data)}
act.csend=send;
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&e.target.id==='cm'){e.preventDefault();send()}});
B.after=(n,id)=>{if(n==='watch'){if(room!==id)mount(id)}else if(room)unmount()};
B.chat={mount,unmount,add,line};
if(B.view().n==='watch')mount(B.view().id);
})();
