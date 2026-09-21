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

-- 작품 대표 이미지용 공개 버킷입니다. 파일은 사용자 ID별 폴더에 저장합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-covers',
  'project-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project_covers_are_public" on storage.objects;
create policy "project_covers_are_public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'project-covers');

drop policy if exists "users_can_upload_own_project_covers" on storage.objects;
create policy "users_can_upload_own_project_covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "users_can_delete_own_project_covers" on storage.objects;
create policy "users_can_delete_own_project_covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-covers'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 공개 회원 프로필, 좋아요, 댓글, 팔로우
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name varchar(50) not null check (char_length(trim(display_name)) between 1 and 50),
  created_at timestamptz not null default now()
);

create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(nullif(split_part(new.email, '@', 1), ''), '회원'))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_profile_after_signup on auth.users;
create trigger create_profile_after_signup after insert on auth.users
for each row execute function public.create_profile_for_user();

insert into public.profiles (user_id, display_name)
select id, coalesce(nullif(split_part(email, '@', 1), ''), '회원') from auth.users
on conflict (user_id) do nothing;

create table if not exists public.item_likes (
  item_id uuid not null references public.items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

create table if not exists public.item_comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  author_id uuid not null references public.profiles (user_id) on delete cascade,
  body varchar(500) not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  following_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists item_comments_item_created_idx on public.item_comments (item_id, created_at);
create index if not exists follows_following_idx on public.follows (following_id);

alter table public.profiles enable row level security;
alter table public.item_likes enable row level security;
alter table public.item_comments enable row level security;
alter table public.follows enable row level security;

drop policy if exists "profiles_are_public" on public.profiles;
drop policy if exists "likes_are_public" on public.item_likes;
drop policy if exists "users_like_as_themselves" on public.item_likes;
drop policy if exists "users_remove_own_likes" on public.item_likes;
drop policy if exists "comments_are_public" on public.item_comments;
drop policy if exists "users_comment_as_themselves" on public.item_comments;
drop policy if exists "users_delete_own_comments" on public.item_comments;
drop policy if exists "follows_are_public" on public.follows;
drop policy if exists "users_follow_as_themselves" on public.follows;
drop policy if exists "users_remove_own_follows" on public.follows;
create policy "profiles_are_public" on public.profiles for select to anon, authenticated using (true);
create policy "likes_are_public" on public.item_likes for select to anon, authenticated using (true);
create policy "users_like_as_themselves" on public.item_likes for insert to authenticated with check (user_id = auth.uid());
create policy "users_remove_own_likes" on public.item_likes for delete to authenticated using (user_id = auth.uid());
create policy "comments_are_public" on public.item_comments for select to anon, authenticated using (true);
create policy "users_comment_as_themselves" on public.item_comments for insert to authenticated with check (author_id = auth.uid());
create policy "users_delete_own_comments" on public.item_comments for delete to authenticated using (author_id = auth.uid());
create policy "follows_are_public" on public.follows for select to anon, authenticated using (true);
create policy "users_follow_as_themselves" on public.follows for insert to authenticated with check (follower_id = auth.uid());
create policy "users_remove_own_follows" on public.follows for delete to authenticated using (follower_id = auth.uid());

grant select on public.profiles, public.item_likes, public.item_comments, public.follows to anon, authenticated;
grant insert, delete on public.item_likes, public.item_comments, public.follows to authenticated;
