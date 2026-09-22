# Manam: Through the Table

Independent, yellow-led 3D restaurant concept. Ten dishes with photography sourced from Manam’s reference menu, an automatic camera tour, keyboard-accessible 2D view, and a server-calculated tasting estimate. No checkout or real orders.

## Run

Node 22.9+ required (tested on Node 24).

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm start
```

Open http://localhost:3000/experience. Root redirects there.

## Structure

- `app/experience/page.tsx`: server catalog read, static header/footer, full ingredient descriptions, and server-rendered content slots.
- `app/api/estimate/route.ts`: JSON parsing, development fixtures, authoritative estimate.
- `components/Experience.tsx`: selection, navigation, form, accessibility, lazy scene boundary.
- `components/FoodScene.tsx`: camera movement, WebGL lifecycle, visibility and resize observers.
- `public/food/`: ten locally stored reference photos; original sources recorded in `public/food/SOURCES.md`.
- `lib/catalog.ts`: server-consumed catalog and pricing validation; never imported by client code.
- `lib/types.ts`: shared types, formatting, selection reconciliation.
- `tests/estimate.test.ts`: pricing, invalid inputs, filtering and HTTP behavior.

## Design

Reference: https://manam.momentfood.com/, inspected September 22, 2026. Current order page uses teal, photography, and a thin Manam wordmark. User requested yellow; `#f5cf56` is our warm marigold interpretation, not a verified official brand token. Typography uses local Arial and Georgia: an understated wordmark against generous editorial serif headings. No remote font requests.

ENERGY 3 / RHYTHM 3 / MOTION 2. Real food photography is focal point; large yellow opening contrasts with quieter cream tasting area. Photos sit in a Three.js gallery with spatial camera transitions. Tour advances every seven seconds, wraps at the end, and pauses offscreen, on hidden tabs, and while hovering over photography. Keyboard focus/manual navigation stops the tour until Play is pressed. Reduced motion disables autoplay. Thumbnails support direct selection; all ten dishes also appear below with descriptions.

Photos and dish identities come from the restaurant’s supplied reference. Descriptions are original summaries; portion prices and availability remain demo fixtures. Bibingkang Ube remains unavailable in demo to exercise that state. No claim of official affiliation or current price/stock synchronization.

## Architecture

Server page supplies serializable catalog data and pre-renders useful HTML. Client experience owns interactive state. Browser-only Three.js module loads after hydration. Plain Three.js avoids another reconciler dependency. Renderer pauses when settled, offscreen, or document hidden; resolution is capped; GPU resources and observers are disposed on unmount. Reduced motion defaults to 2D and removes travel when 3D is explicitly chosen.

Server owns prices and validates every item. Extra fields are ignored and cannot affect totals. Money uses integer centavos. API returns 400 for malformed JSON, 422 for invalid selections, 503 for development failure fixture, and 200 with normalized items and total. Response errors have `{ "error": { "message": "..." } }` shape. No persistence.

Estimate input changes abort pending requests, advance a version counter, clear stale totals, and preserve form inputs. A version check also prevents late responses from committing after abort. Filters never remove tasting selections.

## Manual fixtures and checks

Copy `.env.example` to `.env.local`. Enable `DEMO_EMPTY`, `DEMO_DELAY`, `DEMO_ERROR`, or `DEMO_WEBGL_FAILURE` with `1`, then restart development server. Production ignores all fixtures.

- Empty: page remains navigable, renders no invalid scene, displays table empty state.
- Delay: submit a selected dish, change portion before response; old total must not appear. Submit again for new total.
- Error: submit, verify inline error and retained inputs. Disable fixture and retry.
- Keyboard: Tab through filters, dish navigation, mode buttons, add, portion, quantity, remove and calculate. Visible focus throughout.
- Reduced motion: enable OS preference before loading; 2D starts selected. Explicit 3D changes dish without flight.
- WebGL disabled/context lost: scene switches to 2D; form remains usable.
- Inspect 360px, tablet and desktop widths, plus 200% zoom. No horizontal overflow.

Saved browser regressions live in `tests/browser-flow.mjs`. They use the Codex browser-use Tab interface (no extra browser dependency). In a browser session with a local `tab` handle, import the module by absolute file URL, then run `await checks.checkBrowserFlow(tab)`. Run `checkDelayedResponse(tab)` with `DEMO_DELAY=1`, and `checkFailureFallback(tab)` with `DEMO_WEBGL_FAILURE=1` and `DEMO_ERROR=1`. Functions throw on assertion failure and return a PASS summary. `npm test` runs independent server/selection tests; these browser checks require the running app and browser session.

## Limitations

No saved cart, stock system, tax, delivery charges or ordering. Estimate is limited to three selected dishes. Photographs are flat images displayed in a real 3D gallery, not reconstructed volumetric food models. Reference images are 400px source assets; enlarging cannot add detail. Source photography remains Manam/The Moment Group’s content. Server prices are shipped to clients for display, but calculations use server catalog only.
