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
