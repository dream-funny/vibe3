-- 바이브코딩 완성 작품 데이터
-- Supabase SQL Editor 또는 마이그레이션에서 실행합니다.

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  author_id uuid null references auth.users (id) on delete set null,
  title varchar(100) not null check (char_length(title) between 1 and 100),
  region varchar(50) null check (region is null or char_length(trim(region)) between 1 and 50),
  cover_image_url text not null check (char_length(trim(cover_image_url)) > 0),
  summary varchar(200) not null check (char_length(summary) between 1 and 200),
  description text not null check (char_length(trim(description)) > 0),
  tools text[] not null default '{}'::text[] check (cardinality(tools) between 1 and 10),
  tags text[] not null default '{}'::text[] check (cardinality(tags) <= 5),
  project_url text not null check (char_length(trim(project_url)) > 0),
  repository_url text null,
  status text not null default 'published' check (status = 'published'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.items
  add column if not exists region varchar(50) null;

comment on table public.items is '바이브코딩으로 만든 완성 작품';
comment on column public.items.author_id is '작성자. 입력 시 비워두면 현재 로그인 사용자로 자동 지정';
comment on column public.items.description is '마크다운 형식의 작품 설명';

create index if not exists items_created_at_idx
  on public.items (created_at desc);

create index if not exists items_author_id_idx
  on public.items (author_id);

-- author_id가 비어 있으면 로그인한 사용자의 ID를 자동으로 채웁니다.
create or replace function public.set_items_author_id()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.author_id is null then
    new.author_id := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists set_items_author_id_before_insert on public.items;
create trigger set_items_author_id_before_insert
before insert on public.items
for each row
execute function public.set_items_author_id();

-- 수정 시각을 자동으로 갱신합니다.
create or replace function public.set_items_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  new.updated_at := now();

  return new;
end;
$$;

drop trigger if exists set_items_updated_at_before_update on public.items;
create trigger set_items_updated_at_before_update
before update on public.items
for each row
execute function public.set_items_updated_at();

alter table public.items enable row level security;

-- 누구나 공개 작품을 읽을 수 있습니다.
drop policy if exists "items_are_readable_by_everyone" on public.items;
create policy "items_are_readable_by_everyone"
on public.items
for select
to anon, authenticated
using (true);

-- 로그인 사용자는 본인 소유의 작품만 등록할 수 있습니다.
-- author_id를 생략하면 위 트리거가 auth.uid()로 자동 지정합니다.
drop policy if exists "users_can_insert_own_items" on public.items;
create policy "users_can_insert_own_items"
on public.items
for insert
to authenticated
with check (author_id = auth.uid());

-- 로그인 사용자는 본인 작품만 수정할 수 있고 소유자를 바꿀 수 없습니다.
drop policy if exists "users_can_update_own_items" on public.items;
create policy "users_can_update_own_items"
on public.items
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

-- 로그인 사용자는 본인 작품만 삭제할 수 있습니다.
drop policy if exists "users_can_delete_own_items" on public.items;
create policy "users_can_delete_own_items"
on public.items
for delete
to authenticated
using (author_id = auth.uid());

grant select on table public.items to anon, authenticated;
grant insert, update, delete on table public.items to authenticated;
revoke insert, update, delete on table public.items from anon;
