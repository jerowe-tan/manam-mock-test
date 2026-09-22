# Manam: Through the Table

Independent, yellow-led 3D restaurant concept. Three procedural dishes, a keyboard-accessible 2D experience, and a server-calculated tasting estimate. No checkout or real orders.

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

- `app/experience/page.tsx`: server catalog read and initial render.
- `app/api/estimate/route.ts`: JSON parsing, development fixtures, authoritative estimate.
- `components/Experience.tsx`: selection, navigation, form, accessibility, lazy scene boundary.
- `components/FoodScene.tsx`: camera movement, WebGL lifecycle, visibility and resize observers.
- `components/food-models.ts`: deterministic procedural food geometry.
- `lib/catalog.ts`: server-consumed catalog and pricing validation; never imported by client code.
- `lib/types.ts`: shared types, formatting, selection reconciliation.
- `tests/estimate.test.ts`: pricing, invalid inputs, filtering and HTTP behavior.

## Design

Reference: https://manam.momentfood.com/, inspected September 22, 2026. Current order page uses teal, photography, and a thin Manam wordmark. User requested yellow; `#f5cf56` is our warm marigold interpretation, not a verified official brand token. Typography uses local Arial and Georgia: an understated wordmark against generous editorial serif headings. No remote font requests.

ENERGY 3 / RHYTHM 3 / MOTION 2. Food is focal point; large yellow opening contrasts with quieter cream tasting area. Shadows ground vessels on table. Camera moves only in response to selection, then stops. Circular view controls communicate mutually exclusive modes. Arrows indicate navigation, external destinations and section movement. Plus sign adds a dish. Food models intentionally stylized, not photorealistic.

Sisig and watermelon sinigang are inspired by restaurant dishes; copy and all prices are demo content. Ube dessert is an imagined concept, unavailable in demo. No claim of official affiliation. Default portion prices are fixtures, not copied live prices.

## Architecture

Server page supplies serializable catalog data and pre-renders useful HTML. Client experience owns interactive state. Browser-only Three.js module loads after hydration. Plain Three.js avoids another reconciler dependency. Renderer pauses when settled, offscreen, or document hidden; resolution is capped; GPU resources and observers are disposed on unmount. Reduced motion defaults to 2D and removes travel when 3D is explicitly chosen.

Server owns prices and validates every item. Extra fields are ignored and cannot affect totals. Money uses integer centavos. API returns 400 for malformed JSON, 422 for invalid selections, 503 for development failure fixture, and 200 with normalized items and total. Response errors have `{ "error": { "message": "..." } }` shape. No persistence.

Estimate input changes abort pending requests, advance a version counter, clear stale totals, and preserve form inputs. A version check also prevents late responses from committing after abort. Filters never remove tasting selections.

## Manual fixtures and checks

Copy `.env.example` to `.env.local`. Enable `DEMO_EMPTY`, `DEMO_DELAY`, or `DEMO_ERROR` with `1`, then restart development server. Production ignores all three.

- Empty: page remains navigable, renders no invalid scene, displays table empty state.
- Delay: submit a selected dish, change portion before response; old total must not appear. Submit again for new total.
- Error: submit, verify inline error and retained inputs. Disable fixture and retry.
- Keyboard: Tab through filters, dish navigation, mode buttons, add, portion, quantity, remove and calculate. Visible focus throughout.
- Reduced motion: enable OS preference before loading; 2D starts selected. Explicit 3D changes dish without flight.
- WebGL disabled/context lost: scene switches to 2D; form remains usable.
- Inspect 360px, tablet and desktop widths, plus 200% zoom. No horizontal overflow.

## Limitations

No saved cart, stock system, tax, delivery charges or ordering. Estimate is per selected portion quantity. Food assets are stylized geometry; some overlaps model chopped ingredients. No automatic animation, drag camera, or scroll interception. Server prices are shipped to clients for display, but calculations use server catalog only.
