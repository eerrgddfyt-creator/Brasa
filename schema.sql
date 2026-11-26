-- Brasa · Fase 2 · contas, perfil, inventário e personalização.
-- Rode tudo no SQL Editor do Supabase. Nenhum dinheiro nesta fase.
create table public.items(
  id text primary key,
  kind text not null check (kind in ('color','font','tag','frame','sticker')),
  name text not null,
  descr text not null default '',
  rarity text not null default 'comum' check (rarity in ('comum','raro','epico','lendario')),
  data jsonb not null default '{}',
  starter boolean not null default false,
  active boolean not null default true
);
create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(display_name) between 2 and 24),
  eq_color text references public.items(id), eq_font text references public.items(id),
  eq_tag text references public.items(id), eq_frame text references public.items(id),
  created_at timestamptz not null default now()
);
create table public.inventory(
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id text not null references public.items(id),
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);
alter table public.items enable row level security;
alter table public.profiles enable row level security;
alter table public.inventory enable row level security;
create policy items_read on public.items for select using (true);
create policy profiles_read on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy inventory_read_own on public.inventory for select using (auth.uid() = user_id);
-- O navegador só pode: ler o catálogo, ler perfis, ler o próprio inventário e mudar o próprio nome de exibição.
revoke insert, update, delete on public.items, public.inventory from anon, authenticated;
revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- Equipar: valida no servidor que o item existe, está ativo, é do tipo certo e pertence ao usuário.
create or replace function public.equip(p_kind text, p_item text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  if p_kind not in ('color','font','tag','frame') then raise exception 'tipo inválido'; end if;
  if p_item is not null then
    if not exists (select 1 from items where id = p_item and kind = p_kind and active) then raise exception 'item inválido'; end if;
    if not exists (select 1 from inventory where user_id = auth.uid() and item_id = p_item) then raise exception 'você não possui este item'; end if;
  end if;
  execute format('update profiles set eq_%s = $1 where id = $2', p_kind) using p_item, auth.uid();
end $$;
revoke all on function public.equip(text, text) from public, anon;
grant execute on function public.equip(text, text) to authenticated;

-- Novo usuário: cria perfil, entrega os itens iniciais e já equipa o visual básico.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare u text := lower(coalesce(new.raw_user_meta_data->>'username',''));
begin
  if u !~ '^[a-z0-9_]{3,20}$' or u in ('admin','brasa','kick','staff','suporte') or exists (select 1 from profiles where username = u) then
    u := 'user_' || substr(replace(new.id::text,'-',''),1,10);
  end if;
  insert into profiles(id, username, display_name, eq_color, eq_font, eq_tag, eq_frame)
  values (new.id, u, u, 'c_branco', 'f_padrao', 't_novato', 'fr_liso');
  insert into inventory(user_id, item_id) select new.id, id from items where starter and active;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Catálogo inicial. Só os itens com starter = true são entregues agora; os demais aparecem como indisponíveis até a Fase 3.
insert into public.items(id,kind,name,descr,rarity,data,starter) values
('c_branco','color','Branco osso','Cor padrão do nome.','comum','{"hex":"#f2e9dc"}',true),
('c_vermelho','color','Vermelho brasa','Um vermelho quente.','comum','{"hex":"#e0523a"}',true),
('c_azul','color','Azul maré','Um azul calmo.','comum','{"hex":"#5b9bd5"}',true),
('c_verde','color','Verde musgo','Um verde discreto.','comum','{"hex":"#7fb069"}',false),
('c_roxo','color','Roxo ametista','Cor de quem coleciona.','raro','{"hex":"#9b72cf"}',false),
('c_dourado','color','Dourado','A cor mais rara dos nomes.','lendario','{"hex":"#e8a33d"}',false),
('f_padrao','font','Padrão','Fonte limpa do sistema.','comum','{"key":"padrao"}',true),
('f_serif','font','Clássica','Com serifa, estilo editorial.','comum','{"key":"serif"}',true),
('f_mono','font','Máquina','Estilo código.','raro','{"key":"mono"}',false),
('f_redonda','font','Redonda','Cantos suaves.','comum','{"key":"redonda"}',false),
('t_novato','tag','NOVATO','Todo mundo começa aqui.','comum','{"label":"NOVATO","tone":"tinta"}',true),
('t_vip','tag','VIP','Para quem fica.','raro','{"label":"VIP","tone":"musgo"}',false),
('t_og','tag','OG','Chegou antes.','epico','{"label":"OG","tone":"vinho"}',false),
('t_elite','tag','ELITE','Reservada a poucos.','epico','{"label":"ELITE","tone":"ouro"}',false),
('t_lendario','tag','LENDÁRIO','A tag mais rara.','lendario','{"label":"LENDÁRIO","tone":"em"}',false),
('fr_liso','frame','Anel simples','Moldura padrão.','comum','{"kind":"solid","ring":"#ff5b2e"}',true),
('fr_tracejado','frame','Tracejado','Linha em traços.','comum','{"kind":"dashed","ring":"#e8a33d"}',false),
('fr_duplo','frame','Anel duplo','Duas linhas.','raro','{"kind":"double","ring":"#f2e9dc"}',false),
('s_chama','sticker','Chama','A brasa da casa.','comum','{"shape":"chama","c1":"#ff5b2e","c2":"#f2e9dc"}',true),
('s_raio','sticker','Raio','Rápido e direto.','raro','{"shape":"raio","c1":"#27221e","c2":"#e8a33d"}',false),
('s_diamante','sticker','Diamante','Brilho sem glow.','epico','{"shape":"diamante","c1":"#2d4a3e","c2":"#f2e9dc"}',false);


-- ===== Versão 0.4.0: Chat Brasa (mesmo conteúdo de atualizacao-0.4.0.sql) =====
-- Brasa 0.4.0 · Chat Brasa. Rode UMA vez no SQL Editor do Supabase (depois do schema.sql da versão 0.2.0).
create table if not exists public.chat_messages(
  id bigint generated always as identity primary key,
  room text not null check (room ~ '^[a-z0-9_-]{2,25}$'),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  name text not null default '',
  color text not null default '#f2e9dc',
  font text not null default 'padrao',
  tag text,
  tone text,
  created_at timestamptz not null default now()
);
create index if not exists chat_room_id on public.chat_messages(room, id desc);
create table if not exists public.chat_bans(
  user_id uuid primary key references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
alter table public.chat_bans enable row level security;
drop policy if exists chat_read on public.chat_messages;
create policy chat_read on public.chat_messages for select using (true);
drop policy if exists chat_insert on public.chat_messages;
create policy chat_insert on public.chat_messages for insert to authenticated with check (user_id = auth.uid());
revoke insert, update, delete on public.chat_messages from anon;
revoke update, delete on public.chat_messages from authenticated;
revoke all on public.chat_bans from anon, authenticated;

-- O servidor decide quem escreveu e como o nome aparece: o navegador não consegue falsificar nome, cor, fonte nem tag.
create or replace function public.chat_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.profiles; c public.items; f public.items; t public.items; prev_at timestamptz;
begin
  new.user_id := auth.uid();
  if new.user_id is null then raise exception 'não autenticado'; end if;
  if exists (select 1 from public.chat_bans where user_id = new.user_id) then raise exception 'você está sem acesso ao chat'; end if;
  new.body := btrim(regexp_replace(new.body, E'[\\x01-\\x1f\\x7f]', '', 'g'));
  if char_length(new.body) < 1 then raise exception 'mensagem vazia'; end if;
  select max(created_at) into prev_at from public.chat_messages where user_id = new.user_id;
  if prev_at is not null and now() - prev_at < interval '2 seconds' then raise exception 'devagar: espere 2 segundos'; end if;
  select * into p from public.profiles where id = new.user_id;
  if not found then raise exception 'perfil não encontrado'; end if;
  select * into c from public.items where id = p.eq_color;
  select * into f from public.items where id = p.eq_font;
  select * into t from public.items where id = p.eq_tag;
  new.name := p.display_name;
  new.color := coalesce(c.data->>'hex', '#f2e9dc');
  new.font := coalesce(f.data->>'key', 'padrao');
  new.tag := t.data->>'label';
  new.tone := t.data->>'tone';
  return new;
end $$;
drop trigger if exists chat_before_insert on public.chat_messages;
create trigger chat_before_insert before insert on public.chat_messages for each row execute function public.chat_before_insert();

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- Moderação pelo painel do Supabase (SQL Editor):
--   banir:   insert into public.chat_bans(user_id, reason) select id, 'motivo' from public.profiles where username = 'fulano';
--   apagar:  delete from public.chat_messages where id = 123;
--   limpar mensagens com mais de 3 dias: delete from public.chat_messages where created_at < now() - interval '3 days';
