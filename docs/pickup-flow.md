# Pickup and completion demo

- Selling QR tickets no longer show the “Awaiting drop-off” badge. Captured photos
  appear in the selling flow, but are hidden in My Books.
- Buyer checkout goes directly from a valid payment method to a pickup QR.
  There is no delivery-address step or address section in Profile.
- Payments, inventory changes, and buyer orders are simulated locally. Pickup
  is a proposed co-op workflow, not an actual reservation or integrated service.
- The QR contains `booksforless:pickup:order_…`, a stable local order identity.
  It contains no card details and is not a server URL.
- Reopen the same QR from Profile → My orders or My Books → Purchases.
- My Books has horizontal Purchases/Selling/History tabs, each with its own list and empty
  state. Selling and checkout links open the matching tab. There are no extra
  “Selling books”/“Purchases” headings between mixed lists.
- Pickup uses one prominent My Books action and a quiet orders link. In Profile,
  tap an order row to view its QR; Add/Cancel payment method actions stay in the
  section header instead of adding more full-width buttons.
- My Books places “I've sold this book” inside selling cards, above the QR,
  and “I've received this book” inside purchase cards. Confirmation opens a
  separate optional 1–5-star review screen. Save, skip, or cancel edits without
  changing the previous rating. My Books keeps a compact Sold/Received row,
  an Undo action, and a Leave/Edit review button. These changes are local;
  shared Supabase records are untouched.
- Saving a review opens History and moves that book out of Purchases/Selling. Skipping
  or cancelling a review leaves it in its current list. History retains QR tickets
  and Edit review/Undo controls; undoing completion restores the book to its active list.
- Orders, confirmations, ratings, and photos survive navigation, but not an app
  restart. Opening an expired/missing pickup ticket offers a route back to browsing.

## Checks

Run `node --test tests/*.test.cjs`, `npx tsc --noEmit`, and `npx expo lint`.
The opt-in live database test is not required and must not be run casually:
it recreates a demo record.

On a phone, verify selling photo capture and the combined photo/ticket card,
scannability of both QR formats, payment validation, repeat-tap protection,
ticket reopening, sold/received confirmation, rating, undo, and safe areas.
