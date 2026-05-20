-- Auto-create profile + free subscription on signup (Issue #15 / #12)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (
    new.id,
    split_part(coalesce(new.email, 'user'), '@', 1)
  )
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, status, plan, started_at, expires_at)
  values (new.id, 'active', 'free', now(), now() + interval '100 years');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Fallback: authenticated users can insert their own profile row
drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
  on public.profiles for insert to authenticated
  with check (id = auth.uid());
