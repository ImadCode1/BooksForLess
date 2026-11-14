# BooksForLess ISBN and demo flow

**Persistence update:** Book/ticket metadata now saves to a shared Supabase demo
table without auth; photos remain local. See [Supabase demo](supabase-demo.md)
for the current privacy model, setup, failure/retry behavior, and live tests.
The original in-memory-only notes below describe the earlier prototype.

## Run and test

Use Node 22.13+ (the SDK 58 minimum), then:

```sh
npm install
npx expo start --go
node --test tests/book-lookup.test.cjs
npx tsc --noEmit
npx expo lint
```

Typecheck passes. Project-wide lint still reports the pre-existing
`react-hooks/set-state-in-effect` error in `src/hooks/use-color-scheme.web.ts`.
That unrelated hook is unchanged.

On an iPhone, install Expo Go supporting SDK 58, connect to the same Wi-Fi as
the computer, and scan the terminal QR with the iPhone Camera app. Open the app
in Expo Go, select **Scan**, tap **Allow camera access**, and accept the prompt.
Point the camera at a physical textbook's EAN-13 barcode (the main barcode,
not the small supplemental price code). Camera scanning requires a real phone.
`expo-camera` is included in compatible Expo Go; custom native builds need
rebuilding after adding this dependency. If the App Store Expo Go no longer
supports SDK 58, use a compatible development build instead.

### Device acceptance checks (not automated)

- Hold one barcode in view: only one lookup/confirmation should appear.
- Tap **Scan another book**: scanning becomes available again.
- Deny camera permission: manual ISBN entry and the offline demo still work.
  If iOS blocks another prompt, **Open Settings** allows permission recovery.
- Enter `978-0-262-03384-8`: see Introduction to Algorithms.
- Enter `9780262033849`: checksum validation rejects it without a request.
- Tap **Try a demo book** with internet disabled (keep the Metro LAN connection):
  metadata appears immediately. Demo books have an intentional no-cover placeholder
  so even their confirmation does not need external image requests.
- Try `9780980200447` online: Open Library should return Slow reading and its
  cover when available. Covers are optional and failed images show a placeholder.
- Try a non-demo valid ISBN offline: within 8 seconds, enter a title manually,
  optionally enter authors, and tap **Review book**.
- Navigate away during lookup, then return: stale requests should not replace
  the current screen; the camera is unmounted while unfocused/backgrounded.
- Complete or skip the three-screen onboarding, restart, and verify it does not
  appear again. In development/Expo Go, use **My Books → Developer settings →
  Preview onboarding now** for immediate replay, or **Reset onboarding for next
  launch**, then reload the app. Reset only clears the onboarding flag; finishing
  a preview saves completion again. Developer controls are hidden in release builds.
- On an iPhone with a Dynamic Island, verify the onboarding brand/Skip button,
  Scan heading (including after scrolling back to the top), and My Books title
  stay below the status bar. The bottom actions should also clear the tab bar.
  Tab screens own their native safe-area insets; automatic scroll insets are
  disabled. Onboarding measures its own modal window's safe area.
- Home is intentionally blank. Scan is the center tab; My Books is on the right.
- Confirm a book, pick a condition, and enter an asking price in CAD.
  Blank/zero/negative prices or more than two decimal places should be rejected.
  These are explicitly marked testing controls pending planned AI evaluation;
  onboarding does not instruct students to set the price or condition.
- Take a photo on the physical phone, try **Retake photo**, and review the result.
  Denied permissions show Settings/recheck actions. Photos are not uploaded.
- Generate the ticket once and visit My Books: the photo, condition, CAD price,
  and ticket must agree. Navigate between tabs and verify it is retained.
- Scan the displayed QR with another phone/scanner capable of reading raw text.
  Expect `booksforless:ticket:BFL-…`, not a server URL.
- Restarting clears all tickets and photo references. Only onboarding completion
  is persisted. Captured photos live in the camera cache and are not saved to
  the photo library.

## Ownership / integration contract

### UI refinement checks

- Shared actions use a single React Native Pressable with full content width,
  wrapping labels, and at least 54pt targets. The onboarding header's Skip action
  explicitly opts into compact sizing. This avoids native Host/Button intrinsic
  sizing that produced narrow primary buttons on iPhone.
- Native surfaces/text use Expo Router semantic colors. Toggle light/dark mode
  on iOS and Android and verify the tabs, form, book preview, and ticket labels.
  The QR always remains black on white with a quiet zone.
- At 320pt width and the largest system text size, check that condition rows,
  onboarding controls, camera permission text, and ticket details wrap and scroll.
- Book artwork failures show an explicitly labeled book-jacket placeholder.
  Native button sizing, VoiceOver/TalkBack, keyboard interaction, and actual
  safe-area placement still require physical-device verification.

The scanner is `/scan` (`src/app/scan.tsx`). Both tab implementations now show
Home / Scan / My Books. The root layout supplies the in-memory TicketProvider
and the persisted onboarding gate. Home is deliberately blank.
No Catalog, Listing, or Selling teammate page was changed.

`BookMetadata` in `src/types/book-metadata.ts` contains:

```ts
type BookMetadata = {
  isbn: string;       // normalized, checksum-validated ISBN-13
  title: string;
  authors: string[];  // empty when unknown; manual input may contain multiple names
  coverUrl?: string;
  source: 'open-library' | 'demo' | 'manual';
};
```

**Confirm book & continue** saves metadata in `prepareSellingBook(book)` for
future teammate integration, then opens the local `BookPreparation` component.
This flow collects the student's chosen condition and asking price (not an
estimate), requires a camera photo, and generates a scannable local QR ticket.

Shared pieces are outside `src/app/` in `src/components/book-flow/`.
`LocalTicket` and `BookCondition` are in `src/types/local-ticket.ts`.
`parseCadPrice` validates cents without floating-point rounding and
`ticketQrValue` defines the stable payload. No AI, price research, backend,
checkout, or actual co-op integration is included.

The Selling teammate can reuse `BookPreparation`/`useTickets` or adapt their
own flow using `getPendingSellingBook()`. `SELLING_ROUTE` is currently unused:
setting it alone does not redirect this new local flow. Agree on the final
route/model before replacing the local demo. Tickets live in root state
across tab changes but are intentionally not persisted.

Reuse `DEMO_BOOKS` from `src/data/demo-books.ts` to keep demo metadata consistent.
Known demo ISBNs resolve locally first; other ISBNs use the Open Library Books
API (`jscmd=data`). Missing results, HTTP/JSON failures, and network timeouts
allow manual entry; cancellation does not produce a stale result.
