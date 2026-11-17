-- Explicitly shared demo data, with no accounts or ownership.
-- Permit only single-ID cancellation; retain the ban on direct table DELETE/UPDATE.
create function public.cancel_demo_book(ticket_id text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if ticket_id is null or ticket_id !~ '^BFL-[A-Z0-9-]{3,70}$' then
    raise exception 'A valid ticket ID is required.' using errcode = '22023';
  end if;

  delete from public.demo_books where id = ticket_id;
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cancel_demo_book(text) from public;
grant execute on function public.cancel_demo_book(text) to anon, authenticated;

comment on function public.cancel_demo_book(text) is
  'Permanently cancels one public demo listing by ID. No ownership checks: demo use only.';
comment on table public.demo_books is
  'Public hackathon collection. Single-ID cancellation is public; no private ownership, photos or personal data.';
