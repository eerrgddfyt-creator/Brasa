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
