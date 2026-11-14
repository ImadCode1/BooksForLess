# ISBN scanner and Selling handoff

## Run and test

Use Node 22.13+ (the SDK 58 minimum), then:

```sh
npm install
npx expo start --go
node --test tests/book-lookup.test.cjs
npx tsc --noEmit
npx expo lint
```

Current starter-code blockers: project-wide typecheck reports a ref type mismatch
in `src/components/app-tabs.web.tsx`'s existing `TabButton`; project-wide lint
reports `react-hooks/set-state-in-effect` in `src/hooks/use-color-scheme.web.ts`.
These unrelated implementations were left unchanged. Expo lint bootstrapped the
missing ESLint config and development dependencies.

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
- Tap **Use offline demo** with internet disabled (keep the Metro LAN connection):
  metadata appears immediately. Demo books have an intentional no-cover placeholder
  so even their confirmation does not need external image requests.
- Try `9780980200447` online: Open Library should return Slow reading and its
  cover when available. Covers are optional and failed images show a placeholder.
- Try a non-demo valid ISBN offline: within 8 seconds, enter a title manually,
  optionally enter authors, and tap **Review book**.
- Navigate away during lookup, then return: stale requests should not replace
  the current screen; the camera is unmounted while unfocused/backgrounded.

## Ownership / integration contract

The scanner is `/scan` (`src/app/scan.tsx`). The starter root uses explicitly
registered tabs, so a Scan trigger was added to each platform's tab component.
No Catalog, Listing, Selling, or root layout screen was changed.

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

Selling does not exist in this checkout. **Continue to Selling** confirms and
copies the metadata into `prepareSellingBook(book)`, then explains that the
Selling integration is pending instead of navigating to a nonexistent screen.

When the Selling teammate's route is ready:

1. Set `SELLING_ROUTE` in `src/services/selling-handoff.ts` from `null` to the
   agreed route, such as `/selling`. Ensure the route is registered with the
   current navigator (or placed inside the team's selling stack).
2. In that screen, read `getPendingSellingBook()` to initialize the flow.
   Handle `null` for direct entry/reloads by offering navigation to `/scan`.
3. Adapt this metadata to the teammate's Book model if needed. No reference
   price, condition, estimate, listing, or QR ticket is created by the scanner.
4. This handoff is in-memory only and is not consumed on read; restarting the
   app clears it. Persist listings separately if desired.

Reuse `DEMO_BOOKS` from `src/data/demo-books.ts` to keep demo metadata consistent.
Known demo ISBNs resolve locally first; other ISBNs use the Open Library Books
API (`jscmd=data`). Missing results, HTTP/JSON failures, and network timeouts
allow manual entry; cancellation does not produce a stale result.
