-- Security-linter hardening.
-- Pin a stable search_path so the trigger function can't be hijacked.
alter function public.set_updated_at() set search_path = '';

-- handle_new_user is only meant to run from the auth.users trigger, never via RPC.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
