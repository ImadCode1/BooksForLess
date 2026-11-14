# Shared Supabase demo (no auth)

This is an explicit expansion beyond the original local-only hackathon scope.
No login, guest account, or ownership claims are implemented.

- `public.demo_books` contains shared book metadata, test condition, CAD price
  in cents, stable ticket ID, and server creation date.
- Anyone with the public app can read and submit demo books.
- Anonymous clients cannot update/delete records or choose a status/date.
- Photos, local file paths, and personal details are not uploaded.
- **No rate limiting or private ownership:** do not use this public append-only
  setup for production or store sensitive information. Authentication, per-user
  RLS, abuse prevention, and private photo storage are future work.
- My Books currently displays the latest 100 shared submissions (not personal
  records). Pull to refresh. Locally captured photos last only for this session.

## Setup

The migration in `supabase/migrations/202611140001_shared_demo_books.sql` has
been applied to the connected project. `.env.local` holds only its public URL
and publishable key and is already ignored by Git. Other teammates can copy
`.env.example` to `.env.local` and use the project's **publishable** key.
Never put a secret/service-role key in an `EXPO_PUBLIC_` variable.

Restart `npx expo start --go` after environment changes.

Unit checks: `node --test tests/*.test.cjs`

Live API check (creates/retains one known demo book, then verifies insert retries
and rejected PATCH/DELETE):
`BFL_LIVE_TEST=1 node --env-file=.env.local --test tests/ticket-database.test.cjs`

The test-created default book was removed after verification at the user's
request. Normal app startup and unit tests do not seed the database. Running
the opt-in live test above will explicitly recreate that one demo record.

Developer onboarding tools are in the **••• menu beside My Books**, not in a
footer. They remain development-only.

## Test

1. Use a demo ISBN, choose the manual test values, take a photo, and review.
2. Read the shared-data notice and tap **Save book & generate QR**.
3. Check `demo_books` in Supabase and reload the app. The book/ticket should
   return; the photo should not (it was never uploaded).
4. Disable internet before saving. The draft should stay open with a retry
   message, not display a successful ticket. Reconnect and retry.
5. If a response is lost after the insert commits, retrying the same unchanged
   draft uses the same ticket ID and verifies the existing row.
6. Public reads/inserts are intentional for this demo. Check that PATCH and
   DELETE fail; anon has no UPDATE or DELETE privileges.

The REST client has a 10-second timeout. There is no offline upload queue.
ISBN lookup retains its offline demo fallback, but saving requires internet.

## iPhone scroll edges

Scroll content now extends behind the system areas with automatic iOS content
insets. Only Android applies a separate top safe area; native tabs provide its
bottom inset. This removes the fixed safe-area viewport that sharply clipped
cards at the status bar and above the tab bar. Check on the actual iPhone:
at rest, headings/actions must remain safe; while scrolling, content should
continue beneath the native system chrome instead of stopping at a hard edge.
