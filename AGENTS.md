
This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

---

# BooksForLess — Hackathon-specific instructions

These instructions **add to** the Expo guidance above. Keep the existing Expo rules intact.

## Product concept

BooksForLess helps college/cégep students give textbooks a second life. Many students buy books for one term and barely use them again. The app demonstrates a faster way to resell those books at accessible prices, with a proposed campus co-op handling physical drop-off instead of students coordinating meetups with strangers.

The presentation focuses on **the student's experience**. The co-op partnership, handling fees, physical intake, resale logistics, and donation of unfit books are proposed concepts, **not integrated services**.

## Prototype scope and non-goals

- Build a **functional prototype** with **React Native, Expo, TypeScript, and Expo Router**.
- **No backend**: no database server, authentication, account creation, cloud functions, payment gateway, or real co-op integration.
- Store sample books, marketplace inventory, and user-created listings locally (in app state; optional local device persistence if easy).
- The application UI and demo content must be in **English**. Show example prices in **CAD**.
- **No fixed visual style yet.** Do not assume a color palette, design system, or specific marketplace inspiration. Choose straightforward, readable mobile UI that supports the working flow; do not spend time on unnecessary polish.
- Do not introduce features, dependencies, or architecture unrelated to the demonstration.

## Primary student selling flow

1. **Home/dashboard:** Obvious entry point to sell a book; links to Browse Books and My Books.
2. **Scan ISBN:** Use the **phone camera to scan a real barcode** (typically EAN-13 for ISBN-13). Provide **manual ISBN entry** as a reliable alternative.
3. **Book details:** Look up the title, author, and cover via a public book metadata API when available. If the lookup fails, use seeded demo book data or allow manual title entry. Never strand the user.
4. **Condition:** Ask the student to select the book's condition (e.g., Like New, Good, Fair, Poor). Keep this short and understandable.
5. **Price estimate:** Calculate and display a suggested resale price based on the selected condition and an available reference price. Make clear when the reference price is simulated.
6. **QR ticket:** Generate a QR code tied to a local listing/ticket ID. Show a confirmation that explains the **proposed** co-op drop-off process, not a confirmed drop-off.
7. **My Books:** Show the newly created listing and a simulated status such as “Awaiting drop-off”.
8. **Browse Books:** Show seeded secondhand book listings for buyers to discover; **no checkout or real payments**.

**Demo-critical path:** Scan/enter ISBN → identify book → choose condition → estimate price → generate QR → see listing in My Books.

## APIs, estimation, and simulated features

- Use a public API such as **Open Library** or **Google Books** for *book metadata*, if practical and reliable. External requests must have loading, failure, and no-result handling.
- **Book metadata is not the same as live secondhand pricing.** These APIs do not guarantee a trustworthy market-average used-book price. If no legitimate price-comparison source is available, use clearly marked local reference prices and deterministic condition-based multipliers. Do not invent sourced market prices or falsely describe a mock price as live research.
- The pitch mentions AI quality evaluation. **Do not claim AI inspected the physical book** if the prototype only asks the student to choose a condition. A basic pricing rule is acceptable for the demo; real image-based AI evaluation is not a prerequisite.
- All seeded books, listings, conditions, and prices should be internally consistent across screens. Include a **known demo ISBN** so the presentation can succeed without external APIs.
- QR generation may be real and scannable while the receiving/co-op process is entirely simulated. Encode a stable local ticket ID, not a fake server URL.
- Treat the co-op commission and donation flow as **future possibilities**, not working app features unless requested.

## Implementation guidelines

- Keep Expo Router screens in `src/app/`; shared components, types, seeded data, utilities, and API lookup functions should live outside that directory.
- Favor simple TypeScript types for `Book`, `BookCondition`, `PriceEstimate`, and `Listing`. Avoid large abstractions and new global state frameworks.
- Use the Expo-compatible camera/barcode scanning API supported by the installed SDK. Prevent duplicate scans from triggering repeated navigation. Handle camera permission denial and invalid ISBNs.
- Keep one simple pricing function, shared across relevant screens. All estimates should use CAD and an explicit condition mapping.
- Preserve created listings during normal navigation. Device persistence is optional; working in-memory state is sufficient for the hackathon if it is reliable.
- Prefer minimal changes to existing working code. Avoid unrelated refactors, elaborate styling systems, animations, or premature production hardening.
- **Do not add a backend** to solve a problem that can be demonstrated with local data.

## Priorities with limited hackathon time

The team had roughly **5–6 hours remaining** when defining this scope. Optimize for a reliable live demonstration, not production quality.

1. Make the full flow work with a **seeded book / manual ISBN fallback**.
2. Add **real camera scanning** and route scanned ISBNs into that same flow.
3. Add optional **public book metadata lookup**, without making the demo network-dependent.
4. Confirm **QR ticket**, **My Books**, and **Browse Books** display coherent data.
5. Test on a **physical phone**; fix broken navigation, permissions, errors, and repeat scans.
6. Improve appearance only once the demo is stable.

AI coding agents should implement clear requests directly with small, testable changes. Follow the Expo lint/typecheck instructions above; report blockers or untested device behavior instead of claiming features work without verification.

## Demo definition of done

- [ ] App starts and can be demonstrated on a physical phone.
- [ ] Real ISBN barcode scanning works, with manual entry available.
- [ ] The user can see book metadata or reliable fallback data.
- [ ] The user selects condition and receives a visibly labeled suggested price.
- [ ] The user generates a QR ticket and sees a confirmation.
- [ ] The newly created listing appears in My Books.
- [ ] Browse Books shows representative used-book listings.
- [ ] Failed API requests, denied camera permissions, and repeated scans do not break the demo.
- [ ] Simulated pricing, AI, and co-op functionality are **not portrayed as verified real integrations**.
