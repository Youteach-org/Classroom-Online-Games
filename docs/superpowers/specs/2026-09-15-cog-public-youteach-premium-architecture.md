# COG Public + YouTeach Premium Integration — Living Architecture Record

**Status:** Draft / canonical planning record  
**Repository:** `youteachtk/Classroom-Online-Games`  
**Last updated:** 2026-09-15  
**Purpose:** Preserve the product and architecture decisions for Classroom Online Games (COG) and its integration with YouTeach so the logic is not lost across chats, accounts, or implementation phases.

> This is a living decision record. Confirmed decisions belong in **Confirmed decisions**. Ideas not yet approved belong in **Open decisions / proposals**.

---

## 1. Product split

### Confirmed decisions

COG and YouTeach will become two distinct products that share game engines but do not share the same access model.

### YouTeach

YouTeach remains the private classroom platform.

- Students authenticate in YouTeach.
- A YouTeach student launches COG games from inside YouTeach.
- The student does **not** sign in again inside the game.
- The game receives a secure, short-lived YouTeach credential and recognizes the student automatically.
- The private YouTeach experience is **ad-free**.
- YouTeach students receive COG Premium learning features automatically.
- YouTeach-linked sessions may save performance, progress, reports, and teacher-facing data back to the student's YouTeach identity.
- A copied private game URL must not grant access without a valid YouTeach-authenticated launch.

### Public COG

COG becomes an independent, public, monetizable website.

- Public visitors can open COG directly without a YouTeach account.
- Public visitors can play free games without creating an account.
- COG has its own public identity, analytics, SEO, sharing, monetization, and account system.
- Public COG must have no direct path to private YouTeach student, group, attendance, classroom, or teacher-monitor data.
- Public COG and YouTeach may share the same game engine/source code, but run under different entitlement and data-access contexts.

---

## 2. Deployment model

### Confirmed decision: Option B

Use **two independent product deployments that share game code**, rather than creating a visible intermediary page or maintaining two unrelated copies of every game.

Expected user flows:

### YouTeach student

`YouTeach login -> choose/open COG game -> secure launch credential -> game in YouTeach/Premium mode`

There is no visible intermediary page.

### Public visitor

`Public COG website -> game catalog -> choose game -> game in public mode`

A public visitor may also open a **direct public game link** and enter immediately as a Guest, without creating an account.

Examples:

`classroomonlinegames.com/verb-runner`

`classroomonlinegames.com/games/verb-runner?challenge=...`

The same underlying game can expose different features according to the authenticated entitlement.

---

## 3. Access and entitlement model

### Confirmed access matrix

| User type | Ads | Performance report | Grammar explanations | Saved history / progress | Teacher features |
|---|---|---|---|---|---|
| Public guest | Yes, discreet | Basic | Brief / limited | No | No |
| COG Premium account | No | Full | Full | Yes | According to plan |
| YouTeach student | No | Full | Full | Yes, linked to YouTeach | No |
| YouTeach teacher | No | Full | Full | Yes | Proposed full teacher tools |

### Confirmed Premium sign-in baseline

Public COG Premium accounts will support at launch:

- **Google sign-in**
- **Microsoft sign-in**
- **Apple sign-in**
- **Email + password**

These methods resolve into a **single COG account/identity**. A user may link multiple sign-in methods (Google, Microsoft, Apple, and email/password) to the same account so Premium entitlement, billing state, history, reports, and preferences are not duplicated across providers.

### Confirmed entitlement rule

A student who arrives through a valid YouTeach-authenticated launch is treated as **Premium for learning features**, without buying a separate COG subscription and without creating a second account.

### Confirmed link-access rule

There are two different link classes:

- **Public COG links** may be opened by anyone who has the link. The visitor enters as a Guest unless they authenticate as Premium.
- **YouTeach private launch links** must not grant private/Premium access by URL possession alone. A copied or forwarded URL is not sufficient; the private mode requires a valid, short-lived, server-authorized YouTeach launch credential.
- If a YouTeach private credential is missing, expired, already used, or invalid, the request must not fall through into a private YouTeach session.
- Public direct links are intentionally shareable. Private YouTeach launch links are intentionally non-transferable.

---

## 4. Common learning layer for every COG game

### Confirmed decision

Do not build a separate report/explanation system inside each game.

Create a reusable COG learning layer:

`Game -> standardized Game Result -> Performance Report -> Explanation Library / Review Mistakes`

Every game produces a normalized result object. The presentation layer can then display reports consistently across Verb Runner, OSASCOMP, Support Meter, 100 Students Said, and future games.

### Standard report goals

A complete report should be able to show, where relevant:

- overall score / accuracy;
- correct answers and attempts;
- performance by skill or grammar concept;
- recurring error categories;
- strengths;
- concepts that need review;
- difficulty and relevant game settings;
- mistakes worth reviewing;
- links from each error to an explanation;
- suggested next practice;
- completion metadata needed for YouTeach history.

The exact schema is still to be specified.

---

## 5. Grammar explanations

### Confirmed decision

Games should explain not only which answer is correct, but **why**.

Example style:

> **Why?**  
> *Yesterday* places the action in a finished past time, so **went** is required rather than **go** or **gone**.

Explanations must be pedagogical, concise, and tied to the concept used in that item.

### During gameplay

- Do not reveal an answer before the learner commits to an answer.
- Explanations may become available after the learner answers.
- The end-of-game report collects the relevant explanations into a review flow.

### Public free access

- Public free users receive a useful **brief explanation**.
- Part of the extended explanation may be visible as a teaser.
- The remaining Premium explanation can be **visually blurred/locked**, similar to common freemium educational sites.
- The locked content must never be delivered in full to the browser and merely hidden with CSS. Premium-only content must be enforced by entitlement/backend logic so it cannot be revealed simply by removing a blur in DevTools.

### Premium / YouTeach

Premium users and authenticated YouTeach students receive:

- the full explanation;
- deeper concept notes;
- additional examples;
- review of mistakes;
- report-level concept analysis;
- future personalized practice built from recurring errors.

---

## 6. Monetization direction

### Confirmed direction

Public COG is intended to become monetizable. YouTeach student gameplay remains ad-free.

Potential revenue layers already accepted as direction:

1. Free public play to maximize access and sharing.
2. Discreet advertising on the public COG experience.
3. COG Premium accounts with an ad-free experience and full learning/report features.
4. Future teacher/school subscriptions or licenses.

### Advertising principles

- Ads belong to the public product, not the YouTeach student experience.
- Avoid ads that interrupt active gameplay.
- Prefer placements around catalog/menu/result surfaces.
- The system must be designed carefully for an educational audience that may include minors.

Pricing, ad provider, billing provider, and exact placements remain open decisions.

---

## 7. Analytics and growth

### Confirmed direction

Public COG should have analytics from launch so product decisions are based on real use.

Initial analytics should include:

- visits;
- approximate unique visitors;
- game page popularity;
- game starts;
- game completions;
- devices;
- countries/regions at aggregate level;
- acquisition/referrer source;
- share/conversion events where appropriate.

Cloudflare Web Analytics has been proposed as the initial privacy-oriented site analytics layer.

### Growth / virality proposals not yet finalized

Potential features to evaluate:

- SEO-indexable pages for each game;
- share buttons;
- “Challenge a friend” links;
- shareable results;
- weekly challenges;
- teacher-shareable direct game links.

These are proposals, not yet implementation commitments.

---

## 8. Public COG backend separation

### Confirmed decision

Public COG will use its **own backend/data project**, independent from YouTeach.

This separation applies to both public user types:

- **Guest users:** use only public COG services and temporary/anonymous session data needed to run games, analytics, and basic result display. Guests do not gain access to YouTeach data and do not receive a persistent COG learning history.
- **Premium users:** use the same public COG backend but with an authenticated COG account, Premium entitlement, billing state, persistent history, full reports, complete explanations, and preferences.

Public COG must not depend on direct client access to YouTeach's private student/classroom database.

The public COG backend technology is **not yet decided**. Firebase remains the current backend technology in existing COG/YouTeach code, while Cloudflare Pages is the current deployment/hosting platform. The confirmed requirement is backend/data isolation from YouTeach, regardless of the final backend provider.

## 8. Security boundary

### Confirmed security principle

Public COG and private YouTeach data must be separated so compromising or manipulating the public client does not grant access to YouTeach student/classroom data.

### Current-state risks discovered during planning

These are existing implementation details that must be migrated before the architecture can be considered secure:

1. YouTeach student identity is currently represented in part by `studentKey` / external ID stored in browser `localStorage`.
2. Current student login logic compares a supplied password against student data read from Firebase.
3. The current Verb Runner launch token is generated by the browser and written by the browser.
4. Current Realtime Database rules contain public `.read: true` and `.write: true` at the COG game roots.

These are prototype-era mechanisms and are **not** the target architecture.

### Target private launch

The target is:

`real YouTeach authentication -> server-authorized one-time launch -> COG private/Premium context`

Private launch tokens should be:

- created/authorized server-side;
- short-lived;
- one-time use;
- scoped to user + game + role/entitlements;
- invalid after expiration or use;
- impossible to obtain merely by editing browser storage.

### Public/private data separation

Public COG should use a separate data boundary. A separate Firebase project/backend for public COG is preferred over exposing YouTeach's private database to public game clients.

---

## 9. Shared-code principle

### Confirmed decision

Do **not** maintain two unrelated versions of each game.

Prefer one game engine with explicit runtime/build context, for example conceptually:

- `public-cog`
- `cog-premium`
- `youteach-student`
- `youteach-teacher`

The entitlement layer controls ads, explanations, report depth, persistence, teacher integrations, and public/private APIs.

---

## 10. Existing games in scope

The common architecture should eventually support at least:

- Verb Runner
- Support Meter
- OSASCOMP
- 100 Students Said
- future COG games

The architecture must not be designed only around Verb Runner.

---

## 11. Verb Runner decisions / pending implementation notes

These are product decisions already discussed during this planning period and should not be lost:

- COG logo should appear in gameplay and also in the Pause menu.
- Pause menu should also show the concept credit.
- Updated credit wording requested: **“Concept YouTeach by Armando Anota”**.
- Difficulty should set a meaningful default starting speed while Momentum can continue modifying speed during the run:
  - Easy: **70%** requested.
  - Medium: **50% of the base/current intended scale** requested; exact slider interpretation must be normalized because the current slider minimum is 60%.
  - Hard: **slightly below the maximum** requested; exact percentage still TBD.
- Manual speed adjustment can remain available unless later changed.

These are recorded but are separate from the COG/YouTeach architecture implementation.

---

## 12. Open decisions

The following still require explicit decisions before implementation planning is complete:

1. Exact public COG domain.
2. Public COG account authentication provider/method.
3. Premium pricing model: monthly, annual, educator plan, school plan, etc.
4. Payment provider.
5. Ad provider and exact placements.
6. Exact free-vs-Premium explanation cutoff.
7. Standardized `GameResult` schema.
8. Standardized explanation object/schema.
9. Public COG backend technology/provider (Firebase, Cloudflare-native stack, Supabase, or another option), while preserving complete data isolation from YouTeach.
10. YouTeach authentication migration path.
11. Entitlement token format and backend validation mechanism.
12. Teacher Premium feature set.
13. Data retention/privacy policy for public users and minors.
14. Hard difficulty default speed exact value.
15. Whether public Premium accounts can later link/import into a YouTeach identity.
16. Future optional sign-in methods (for example passkeys) beyond the confirmed launch set.

---

## 13. Decision log

### 2026-09-15

- Chose the two-product architecture: private YouTeach + independent public COG.
- Chose shared game engines instead of maintaining duplicate game code.
- Confirmed no visible intermediary page is required for YouTeach launches.
- Confirmed public users can play without creating an account.
- Confirmed COG is intended to be monetized.
- Confirmed YouTeach students automatically receive Premium learning functionality.
- Confirmed YouTeach gameplay is ad-free.
- Confirmed all COG games need end-of-game performance reporting.
- Confirmed all COG games need grammar/concept explanations where applicable.
- Confirmed free users receive brief explanations while Premium receives the complete explanation.
- Confirmed a blurred/locked Premium explanation teaser is acceptable.
- Confirmed Premium content must be technically access-controlled, not merely hidden with CSS.
- Confirmed this GitHub document is the canonical persistent planning record and must be updated as decisions are made.
- Confirmed public COG guests can access a game directly if they have its public link, without registering.
- Confirmed that possession of a YouTeach private game URL alone never grants YouTeach/Premium access; private access requires a valid authenticated launch credential.
- Confirmed the public account model is intentionally simple: **Guest** or **Premium** only. There is no separate free registered account tier.
- Confirmed the long-term Premium sign-in methods: **Google**, **Microsoft**, **Apple**, and **email + password**. For the initial zero-cost phase, Apple is deferred because it requires paid Apple Developer Program membership.
- Confirmed that multiple sign-in providers may be linked to the **same COG account** so subscription status, history, reports, and preferences remain unified.
- Confirmed that the initial architecture must have **USD 0 mandatory infrastructure cost** until real usage/monetization justifies upgrading.
- Confirmed that **all public COG traffic, Guest and Premium, uses a backend/data project independent from YouTeach**. Guests use temporary/anonymous public-session data; Premium users add authenticated persistent account data on that same public COG backend.
- Clarified that moving deployment/hosting to **Cloudflare Pages** did **not** constitute a decision to migrate the database/authentication backend away from Firebase. The backend provider for the new public COG remains an open architectural decision.

## Backend evaluation criteria and current cost/capacity comparison

### Confirmed decision criterion

The backend provider must be selected primarily by **quotas, capacity, total operating cost, security, and long-term maintainability** for COG. Availability of a ChatGPT connector/plugin is **not** a selection criterion.

### Current comparison — decision pending

The initial persistent database provider for the zero-cost public COG phase is now **Turso Free**. This selection applies to persistent COG account/report/history data. Cloudflare remains the hosting/edge/live-session layer, and authentication remains a separate concern.

Official pricing/limit points reviewed on 2026-09-16:

#### Supabase

- Pro starts at USD 25/month.
- Pro includes 100,000 MAU, 8 GB database disk, 250 GB uncached egress, 250 GB cached egress, 5 million Realtime messages, and 500 peak Realtime connections.
- Auth over 100,000 MAU: USD 0.00325 per additional MAU.
- Database disk over 8 GB: USD 0.125/GB-month.
- Uncached egress over 250 GB: USD 0.09/GB.
- Realtime over 5 million messages: USD 2.50 per additional million messages.
- Realtime peak connections over included quota: USD 10 per 1,000 peak connections.
- Higher Postgres compute tiers are available up to large dedicated configurations; cost increases with compute size.

Official references:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/realtime/pricing
- https://supabase.com/docs/guides/platform/compute-and-disk

#### Firebase / Google Cloud

- Base Firebase Authentication supports email/password and social/federated providers; Firebase Authentication with Identity Platform is an **optional** paid/enterprise-style upgrade with different MAU pricing.
- Identity Platform Tier 1 includes 50,000 MAU free, then tiered pricing beginning at USD 0.0055/MAU for 50K–100K.
- Realtime Database on Blaze supports 200,000 simultaneous connections per database.
- Realtime Database includes 1 GB stored and roughly 10 GB/month downloaded, then USD 5/GB-month stored and USD 1/GB downloaded.
- Firestore Standard includes 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day, 1 GiB storage and 10 GiB/month egress free; in us-central1, reads start around USD 0.03/100K and writes around USD 0.09/100K.
- Firebase can therefore use different products for different workloads: Authentication, Firestore for persistent reports/accounts, and RTDB where live synchronization is appropriate.

Official references:
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/auth/
- https://firebase.google.com/docs/database/usage/billing
- https://firebase.google.com/docs/firestore/pricing
- https://cloud.google.com/identity-platform/pricing

#### Cloudflare-native

- Workers Paid has a USD 5/month minimum.
- Workers Paid includes 10 million requests/month and 30 million CPU-ms/month; excess requests are USD 0.30/million and excess CPU is USD 0.02/million CPU-ms.
- D1 Paid includes 25 billion rows read/month, 50 million rows written/month, and 5 GB storage; overages are USD 0.001/million rows read, USD 1/million rows written, and USD 0.75/GB-month.
- D1 has no data-transfer/egress charge, but each individual database currently has a 10 GB maximum and is single-threaded; horizontal sharding is the intended scale-out model.
- Durable Objects are designed for stateful real-time workloads and WebSockets. On Paid, incoming WebSocket messages use a 20:1 billing ratio for request billing; outgoing WebSocket messages are not charged as requests. Hibernation can reduce duration charges while sockets remain connected.
- Cloudflare does **not** provide an equivalent turnkey consumer identity system covering Google + Microsoft + Apple + email/password in the same way Firebase Auth or Supabase Auth do; a Cloudflare-native design therefore needs an authentication layer to be built or integrated.

Official references:
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/

### Important architecture implication

A hybrid backend remains under consideration because COG has two very different workloads:

1. **High-frequency transient gameplay state** — favors Cloudflare Durable Objects/WebSockets on price and scale.
2. **Identity, subscription state, reports, history and explanations** — favors a managed identity + persistent database layer such as Firebase or Supabase.

No backend/provider decision is final until this comparison is approved.


## Persistence database cost spike: D1 vs Turso vs Firestore

**Status:** comparison recorded; no provider selected yet.  
**Reviewed:** 2026-09-16.

### Comparison workload

This spike compares only the **persistent learning/account database**. High-frequency gameplay/session synchronization is assumed to live outside this database (for example in Cloudflare Durable Objects).

Planning workload per monthly active player:

- 4 completed game sessions/month;
- about 200 persistent reads/month;
- about 50 persistent writes/month;
- about 40 KB of new persistent learning/history data/month.

This is a planning model, not measured production usage. It must later be replaced with real telemetry.

Under this model:

| MAU | Reads/month | Writes/month | New storage/month | Storage after 12 months if all remain active |
|---:|---:|---:|---:|---:|
| 10,000 | 2 million | 0.5 million | 0.4 GB | 4.8 GB |
| 100,000 | 20 million | 5 million | 4 GB | 48 GB |
| 1,000,000 | 200 million | 50 million | 40 GB | 480 GB |

### Cloudflare D1

Current official pricing/limits reviewed:

- Workers Free: 5M rows read/day, 100K rows written/day, 5 GB total storage.
- Free maximum database size: 500 MB; maximum 10 databases.
- Workers Paid: USD 5/month account minimum for Workers.
- D1 Paid includes 25B rows read/month, 50M rows written/month, 5 GB storage.
- Overages: USD 0.001/million rows read, USD 1/million rows written, USD 0.75/GB-month stored.
- Paid maximum database size: 10 GB; 1 TB total storage/account by default; up to 50,000 databases/account.
- No D1 data transfer/egress charge.
- D1 indexes can add billed row writes and storage, so schema/index design affects real cost.

Approximate 12-month-storage-stage cost under the planning model, before index/write amplification:

- 10K MAU: about USD 5/month on Workers Paid; Free could cover aggregate storage but the 500 MB/database free cap makes sharding necessary.
- 100K MAU: about USD 37.25/month (USD 5 base + ~43 GB storage over included 5 GB).
- 1M MAU: about USD 361.25/month (USD 5 base + ~475 GB storage over included 5 GB), before possible write/index overages.

Capacity consequence: 48 GB needs roughly 5 D1 databases at the 10 GB paid per-database cap; 480 GB needs roughly 48 databases. This is supported by account limits but introduces application-level sharding/partitioning complexity.

Official sources:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/

### Turso

Current official pricing reviewed:

Free:
- USD 0/month;
- 100 databases;
- 5 GB storage;
- 500M rows read/month;
- 10M rows written/month.

Developer:
- USD 4.99/month;
- unlimited databases;
- 9 GB storage + USD 0.75/GB;
- 2.5B rows read/month + USD 1/billion;
- 25M rows written/month + USD 1/million.

Scaler:
- USD 24.92/month;
- 24 GB storage + USD 0.50/GB;
- 100B rows read/month + USD 0.80/billion;
- 100M rows written/month + USD 0.80/million.

Approximate 12-month-storage-stage cost under the planning model:

- 10K MAU: USD 0/month fits Free (~4.8 GB, 2M reads, 0.5M writes).
- 100K MAU: ~USD 34.24/month on Developer (4.99 + ~39 GB storage over 9 GB × 0.75); reads/writes remain inside plan.
- 1M MAU: ~USD 252.92/month on Scaler (24.92 + ~456 GB storage over 24 GB × 0.50); reads/writes remain inside plan.

Official source:
- https://turso.tech/pricing

### Firestore Standard

Current official us-central1 pricing reviewed:

- Free quota: 50K document reads/day, 20K writes/day, 20K deletes/day, 1 GiB storage, 10 GiB outbound transfer/month.
- Reads beyond free quota: USD 0.30/million.
- Writes beyond free quota: USD 0.90/million.
- Deletes: USD 0.10/million.
- Stored data: approximately USD 0.15/GiB-month (USD 0.000205479/GiB-hour).
- Internet outbound after 10 GiB/month is generally USD 0.12/GiB for the first 1 TiB to worldwide destinations excluding higher-priced regions.
- Firestore Standard index updates are included in document-write operation pricing, but indexes consume storage.

Approximate 12-month-storage-stage operation + storage cost under the planning model, excluding network egress:

- 10K MAU: ~USD 0.72/month.
- 100K MAU: ~USD 16.56/month.
- 1M MAU: ~USD 175.86/month.

If an average billed document response is about 1 KB and every modeled read transfers that response to an external client/API, rough outbound transfer could add about:
- 10K MAU: USD 0 (below the 10 GiB free monthly allowance);
- 100K MAU: about USD 1;
- 1M MAU: about USD 21.

These network estimates are especially sensitive to document size, caching, API architecture, and destination.

Official sources:
- https://firebase.google.com/docs/firestore/quotas
- https://firebase.google.com/docs/firestore/standard-edition
- https://cloud.google.com/firestore/pricing

### What the spike shows

At this planning workload:

- **10K MAU:** all three are inexpensive; Turso can remain entirely free, Firestore is close to free, and D1 Paid is about the existing Workers minimum.
- **100K MAU:** Firestore is estimated cheapest for the persistent database in this model; Turso and D1 are close to each other but storage dominates their cost.
- **1M MAU:** Firestore remains cheaper in this model than Turso and D1 for long-lived history. Turso is second. D1 becomes expensive mainly because stored history costs USD 0.75/GB-month and each database is capped at 10 GB.
- **D1 remains attractive for transient/edge workloads**, but using it as the sole long-term historical store becomes less attractive as hundreds of GB accumulate.
- **Turso has the strongest no-cost starting allowance** of these three for a traditional SQL store.
- **Firestore has the strongest modeled economics for large persistent histories** under the assumed read/write pattern, although bandwidth and document/index design can change the result materially.

The backend decision remains open until the architecture section is approved.

## Zero-cost launch constraint

### Confirmed decision — 2026-09-16

The initial public COG architecture must operate with **USD 0 mandatory infrastructure cost** while the product is being built and validated.

This means:

- Prefer free tiers that do not require a paid subscription merely to start.
- Do not select a provider whose minimum paid plan is required for the initial architecture.
- Paid upgrades may be introduced only after real usage, monetization, or a confirmed need justifies them.
- The architecture should make free-tier limits measurable so COG can upgrade deliberately before hitting them.
- "Free now" does not mean choosing an unsafe or unknown hosting provider. Security and data isolation remain mandatory.

### Firestore clarification

Cloud Firestore Standard has a real no-cost quota:

- 1 GiB stored data;
- 50,000 document reads/day;
- 20,000 document writes/day;
- 20,000 document deletes/day;
- 10 GiB outbound transfer/month;
- exactly one free Firestore database per project.

Some Firestore features (for example PITR, managed backups/restore, TTL deletes, cloning) require billing and therefore are excluded from the initial zero-cost phase.

### Authentication launch adjustment

The long-term Premium sign-in design remains:

- Google
- Microsoft
- Apple
- email + password

However, **Apple sign-in is deferred from the zero-cost launch phase** because Sign in with Apple can only be configured by Apple Developer Program members and that membership costs USD 99/year.

Initial zero-cost Premium sign-in set:

- Google
- Microsoft
- email + password

Apple remains a planned provider to activate once COG begins paying for production/monetization infrastructure.

Official references reviewed:
- https://firebase.google.com/docs/firestore/quotas
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/auth/web/apple
- https://developer.apple.com/help/account/membership/program-enrollment


## Zero-cost capacity spike — D1 vs Turso vs Firestore

**Status:** comparison completed; provider still pending explicit approval.  
**Reviewed:** 2026-09-16.

### Planning model

For persistent Premium/account data only:

- 4 game completions/player/month;
- ~200 database rows/documents read per persistent player/month;
- ~50 rows/documents written per persistent player/month;
- ~40 KB new persistent history/player/month.

Guest live gameplay is not included here; it should use temporary/live infrastructure rather than long-term history storage.

### Free-tier headroom

#### Cloudflare D1 Free

Official free limits:

- 5,000,000 rows read/day;
- 100,000 rows written/day;
- 5 GB total D1 storage/account;
- maximum 500 MB per database on Free;
- maximum 10 databases on Free;
- no D1 egress charge.

Under the planning model, if usage is evenly distributed:

- read quota corresponds to roughly **750,000 persistent MAU**;
- write quota corresponds to roughly **60,000 persistent MAU** and becomes the operation bottleneck;
- 5 GB stores roughly **125,000 persistent user-months** at 40 KB/user/month;
- because each Free database is capped at 500 MB, storage above roughly 12,500 user-months in one database requires sharding across the available databases.

Important: D1 Free limits reset daily. A traffic spike can hit the daily write/read ceiling even if monthly averages look safe.

#### Turso Free

Official free limits:

- 100 databases;
- 5 GB storage;
- 500,000,000 rows read/month;
- 10,000,000 rows written/month;
- 3 GB monthly sync allowance;
- 1-day point-in-time restore.

Under the planning model:

- read quota corresponds to roughly **2.5 million persistent MAU**;
- write quota corresponds to roughly **200,000 persistent MAU**;
- 5 GB stores roughly **125,000 persistent user-months** at 40 KB/user/month.

For this workload, storage is likely to become the Free-tier constraint before read/write operations.

#### Firestore Free

Official free limits:

- 1 GiB stored data;
- 50,000 document reads/day;
- 20,000 document writes/day;
- 20,000 deletes/day;
- 10 GiB outbound/month;
- one free Firestore database/project.

Under the planning model, if usage is evenly distributed:

- read quota corresponds to roughly **7,500 persistent MAU**;
- write quota corresponds to roughly **12,000 persistent MAU**;
- 1 GiB stores roughly **26,000 persistent user-months** at 40 KB/user/month;
- reads become the operation bottleneck before writes.

Firestore free quotas reset daily, so spikes also matter.

### How long storage lasts at a steady Premium population

At 40 KB/player/month of new persistent history:

| Persistent Premium MAU | D1 Free 5 GB | Turso Free 5 GB | Firestore Free 1 GiB |
|---:|---:|---:|---:|
| 1,000 | ~125 months total-account capacity | ~125 months | ~26 months |
| 5,000 | ~25 months | ~25 months | ~5 months |
| 10,000 | ~12.5 months | ~12.5 months | ~2.6 months |

D1 additionally requires splitting data before a single Free database exceeds 500 MB.

### Free real-time infrastructure note

Cloudflare Durable Objects are available on Workers Free with SQLite-backed storage.

Current Free compute limits include:

- 100,000 Durable Object requests/day;
- 13,000 GB-s duration/day;
- WebSocket incoming messages use a 20:1 billing/request accounting ratio;
- outgoing WebSocket messages are not charged as requests;
- WebSocket Hibernation can avoid idle-duration usage.

Workers Free also has a 100,000 requests/day account-plan limit. Therefore the initial real-time design must batch/minimize server calls and use WebSocket hibernation.

### Zero-cost authentication note

Firebase's Spark plan is no-cost and lists non-phone Authentication services as available without requiring a payment method. For the initial phase COG can use Google, Microsoft, and email/password without enabling SMS/phone auth. Apple remains deferred because Apple Developer Program membership is paid.

### Spike conclusion

Under the strict **USD 0** launch constraint:

1. **Turso provides the largest free persistent-database operating headroom** of the three and avoids D1's 500 MB-per-database Free limit.
2. **D1 is attractive because it stays inside Cloudflare and has 5 GB free**, but its 100K writes/day and 500 MB/database limits introduce earlier operational/sharding concerns.
3. **Firestore is the simplest pairing with Firebase Authentication**, but its free persistent database quota is materially smaller: 1 GiB and 50K reads/day.

This conclusion concerns the initial no-cost phase only. It does not yet select the final provider.

Official references:
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://turso.tech/pricing
- https://firebase.google.com/docs/firestore/quotas
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/auth/web/microsoft-oauth


## Local-first persistence principle — confirmed 2026-09-16

COG must be designed **local-first**. High game frequency must not imply high permanent cloud storage.

Confirmed principles:

- Game execution, animation state, timers, choices, temporary attempts, momentum/speed, round state, and most per-play telemetry stay on the user's device or temporary live-session infrastructure.
- Guest users do not create permanent learning-history rows in Turso.
- Public Premium users use Turso only for data that genuinely benefits from persistence across devices, subscription entitlement, or longitudinal learning reports.
- YouTeach students do not put their private school identity/history into the public COG database; the shared game engine produces a standard result that can be persisted through YouTeach's private data path.
- The earlier planning assumption of **4 games/month** was only a provider-comparison normalization and is **not** a product assumption. COG should support tens or hundreds of plays per user per month without storing every gameplay event remotely.

### Initial persistent database selection

For the zero-cost launch phase, **Turso Free** is selected as the persistent database for public COG.

Reasons recorded during planning:

- zero mandatory monthly cost;
- 5 GB free storage;
- large free read/write allowances;
- SQL data model is suitable for accounts, reports, progress, entitlements, and longitudinal learning data;
- it avoids using Firestore's smaller free quota as the primary persistent history store;
- it avoids D1 Free's 500 MB-per-database partitioning constraint for the first phase.

This choice can be revisited when COG has measured production telemetry and revenue.


## Premium detailed-report retention — confirmed 2026-09-16

For **public COG Premium users only**:

- Turso stores a maximum of the **5 most recent detailed reports per game**.
- When a sixth detailed report is created for the same game, the oldest detailed report is no longer kept as a full per-session record.
- Older performance is compacted into lightweight historical summaries and concept-level aggregates.
- The local device may retain a larger detailed history in IndexedDB without consuming cloud database storage.
- Guest users store no permanent detailed reports in Turso.
- YouTeach student reports are governed by the private YouTeach data policy and are not subject to this public Premium retention limit.

This policy is intended to keep persistent cloud storage small even for high-frequency players.


## Diego project response convention — confirmed 2026-09-16

For this planning/project context, assistant responses should be **numbered** so decisions and references can be discussed unambiguously across turns.


## Simple game report model — confirmed 2026-09-16

COG end-of-game reports are **simple gameplay summaries**, not exam-style answer audits.

### What is not stored

The persistent report must **not** store:

- the exact question text for every item;
- every answer the player selected;
- the answer that "should have gone there";
- a replay of every mistake;
- personalized correction text per question;
- detailed click/movement/event logs.

COG is a game, not an examination system.

### Predefined error taxonomy

Games use small predefined error/concept codes instead of storing verbose mistake records.

Example generic categories may include codes such as:

- incorrect/missing target verb;
- spelling error;
- incorrect target phrase/expression.

Each game can define its own compact fixed code dictionary. The persistent report stores only counts/flags against those codes where needed.

### What a detailed report may store

A detailed Premium report should remain compact and may contain:

- game identifier and game version;
- date/time;
- difficulty/mode;
- duration;
- score or game performance metric;
- completed challenges/items;
- total successes/errors;
- accuracy or equivalent gameplay metric when meaningful;
- compact counts by predefined error/concept code;
- streak/level/round summary where relevant;
- other small game-specific aggregate metrics.

### Personalized improvement guidance

"Personalized report" does **not** mean permanently storing individualized answer-by-answer corrections.

If a user explicitly requests **what they can improve**, COG generates that guidance **on demand** from:

- the current/simple report aggregates;
- recent report summaries;
- predefined error/concept codes;
- the shared explanation/recommendation library.

The generated improvement guidance does not need to be stored as a permanent custom report unless a future requirement explicitly calls for it.

### Retention

For public COG Premium users, Turso stores at most the **5 most recent detailed reports per game**. Older data is represented only through compact historical aggregates/summaries.

Guest users keep gameplay history locally and do not create persistent Turso reports.

YouTeach student reporting remains on the private YouTeach data path and is not constrained by the public Premium retention rule.


## Downloadable improvement guidance — confirmed 2026-09-16

When a public COG Premium user requests **“What can I improve?”**, the generated improvement guidance must be **downloadable**.

Confirmed behavior:

- The guidance is generated on demand from the user's recent compact reports, predefined error/concept codes, and the shared recommendation/explanation library.
- The downloaded artifact is not treated as a permanently stored individualized report in Turso by default.
- The downloadable version should remain compact and readable.
- The default export format is still an open decision.


## Download format — confirmed 2026-09-16

The default downloadable format for the on-demand **“What can I improve?”** guidance is a **single-page PDF**.

Confirmed rules:

- The PDF is generated on demand.
- The PDF is intended to be compact, readable, printable, and easy to share.
- It is not permanently stored in Turso by default.
- It is derived from compact report aggregates, predefined error/concept codes, and the shared recommendation library.


## YouTeach verifiable activity receipts — requirement confirmed 2026-09-16

Some COG activities will be designated as **YouTeach-evaluable / verifiable activities**.

When such an activity is launched from a YouTeach Task, Project task, or other evaluable YouTeach assignment:

- YouTeach must be able to verify that the activity was completed through a valid YouTeach-linked session.
- The activity must produce a lightweight machine-readable result for YouTeach evaluation.
- The result must include enough server-trusted metadata to determine whether it was completed on time and under the assigned activity configuration.
- The result may contain aggregate successes/errors and predefined compact error/concept codes, but must not require storing every question or answer.
- A human-readable/downloadable report for that completion must include a **QR-based verification receipt**.
- The QR must not merely encode self-reported client data. It must resolve to or represent a server-verifiable receipt.
- The QR/receipt must be reusable across future COG activities that opt into the verifiable-activity contract.
- The same mechanism should support YouTeach's grading/evaluation subsystem so it can consume the verified result rather than manually re-entering it.

### Security boundary

A QR receipt can prove that YouTeach/COG recorded a valid linked activity session and its recorded result. By itself it does not prove physical identity, prevent all external assistance, or constitute remote proctoring.

### Architecture direction under review

Recommended model:

1. YouTeach launches the configured COG activity using a short-lived, server-authorized credential scoped to student, task, activity, mode/configuration, and entitlement.
2. COG completes the activity locally and produces a standardized compact `GameResult`.
3. A server endpoint validates the linked session and assigned configuration and creates an immutable/append-only completion receipt with server timestamps.
4. The private YouTeach task record receives the verified result automatically.
5. A downloadable report contains a QR with an opaque receipt identifier or verification URL; it does not expose private student data in the QR payload.
6. Scanning/opening the QR shows a read-only verification view appropriate to the viewer's permissions.

The student selects which completed attempt to submit. YouTeach then maps that submitted result to the points configured for the task. Automatic grading of every practice attempt is not part of the design.


## Student-selected YouTeach submission — confirmed 2026-09-16

For YouTeach-evaluable COG activities, gameplay is primarily **practice**.

Confirmed behavior:

- A student may repeat the assigned COG activity as many times as desired.
- Individual practice attempts do **not** automatically become the official YouTeach submission.
- Practice attempts may remain local/temporary according to the normal local-first game model.
- When the student is satisfied with a result, they explicitly choose **Submit to YouTeach**.
- Only that explicitly submitted attempt becomes the official verified evidence for the task.
- The submitted payload is still compact: activity identity/version/configuration, score/performance summary, successes/errors, predefined compact error/concept codes, duration, and server-verifiable timing/session metadata.
- YouTeach verifies the completion receipt and maps the submitted game result into the points configured for the task.
- The purpose is verification of completion plus the student's selected performance result; YouTeach should not continuously auto-grade every practice attempt.
- The QR receipt belongs to the explicitly submitted attempt, not to every practice run.

This preserves the educational intent: students can practice repeatedly, improve, and submit the result they choose as their task evidence.

The exact rule for whether a submitted result can later be replaced by a newer submission remains open.


## Premium billing cadence — confirmed 2026-09-16

Public COG Premium will use:

- **monthly subscription**;
- **annual subscription**.

A lifetime one-time purchase is not part of the current design.

YouTeach-linked students continue to receive the relevant Premium learning features through their YouTeach entitlement and do not need to purchase a separate public COG Premium subscription for assigned YouTeach activities.


## Teacher-directed submission and attempt count — confirmed 2026-09-16

For YouTeach-linked evaluable COG activities:

- The student-facing action is **“Send to teacher”**, not “Send to YouTeach.”
- YouTeach is the transport/record system; the visible recipient is the teacher.
- The official submitted receipt must include the **number of completed attempts** associated with that assigned activity before the chosen result is submitted.
- The student may practice multiple times and select the result they want to send to the teacher.
- The selected result becomes the current official submission for that assignment.
- YouTeach's existing **Undo Submission** behavior is reused: while the assignment remains open, the student can undo the official submission, return to practice, and later submit a replacement result.
- The QR verification receipt corresponds only to the currently submitted official result.
- Undoing the submission invalidates/removes that current official evidence from the assignment view; later replacement creates a new official receipt.
- Existing YouTeach behavior already disables Undo Submission when the assignment is closed, so replacement is available only while the assignment is still open unless a future teacher override is explicitly added.

### Open detail

The displayed attempt count is **cumulative across the entire assignment**, including attempts made before and after an Undo Submission. Undo removes the current official submission, but it does not reset the attempt counter.


## Cumulative attempt count — confirmed 2026-09-16

For YouTeach-linked evaluable COG activities:

- The attempt counter is **cumulative for the entire assignment**.
- Undo Submission removes the current official submitted result but does **not** reset the number of attempts.
- If a student completes 6 attempts, submits, undoes the submission, completes 3 more attempts, and submits again, the new verified receipt shows **9 attempts**.
- The counter represents completed practice attempts associated with that assigned activity and student.


## Proportional task-score mapping — confirmed 2026-09-16

For an explicitly submitted YouTeach-linked COG result:

- The student's chosen game result is expressed as a percentage/performance score from 0 to 100.
- YouTeach converts that percentage directly and proportionally into the point value configured for the assignment.
- Formula: **earned points = assignment points × submitted percentage / 100**.
- Example: assignment worth 15 points, submitted result 92% -> **13.8 / 15**.
- This mapping applies only to the attempt the student explicitly chooses to **Send to teacher**.
- Practice attempts are not graded or transferred into task points.
- Undo Submission removes the current official mapping; a later replacement submission creates a new mapping from the newly selected result.


## QR identity privacy — confirmed 2026-09-16

For YouTeach-linked evaluable COG activity receipts:

- The student's name must **not** be embedded in the QR payload.
- The student's name must **not** be exposed on a publicly viewable verification page.
- The downloadable/printable receipt should avoid exposing student identity to unauthenticated viewers.
- The QR contains only an opaque receipt identifier or verification URL.
- When the QR is opened, student identity is revealed only if the viewer is an **authenticated authorized teacher** for that assignment/student context.
- Unauthenticated verification may show only non-identifying receipt facts such as validity status, activity name, task code, submitted percentage, points earned, attempt count, completion/submission timestamp, and on-time/late status, subject to final privacy review.
- Authorization must be checked server-side; hiding identity only in the browser UI is insufficient.


## Public QR verification visibility — confirmed 2026-09-16

For YouTeach-linked evaluable COG activity receipts:

- If the QR is opened by an unauthenticated viewer, the verification page reveals **only the receipt validity state**.
- Allowed unauthenticated states are limited to messages such as:
  - **Valid receipt**
  - **Invalid / no longer valid receipt**
- No unauthenticated viewer may see:
  - student identity;
  - activity/game name;
  - Task Code;
  - percentage/score;
  - task points;
  - attempt count;
  - submission/completion dates or times;
  - error/concept data;
  - group/class information.
- Full receipt details are available only after server-side verification that the viewer is an authenticated, authorized teacher for the relevant assignment/student context.


## Superseded QR receipt behavior — confirmed 2026-09-16

For YouTeach-linked evaluable COG activity receipts:

- If the student uses **Undo Submission**, the QR/receipt for that official submission becomes **invalid for public verification immediately**.
- An unauthenticated viewer scanning an old QR sees only **Invalid / no longer valid receipt**.
- The old receipt is not erased from the teacher audit trail.
- An authenticated, authorized teacher may still inspect that receipt and see that it was:
  - previously valid;
  - later undone, superseded, or replaced;
  - associated with its original submission metadata.
- A later replacement submission generates a **new receipt and new QR**.
- Only the current official submission may have an active valid receipt for that assignment/student pair.


## Teacher-visible submission history — confirmed 2026-09-16

For YouTeach-linked evaluable COG activities:

- The teacher-facing assignment view shows **only the student's current/final official submitted result**.
- Previous official submissions that were undone or replaced are **not shown as a visible submission history** in the normal teacher workflow.
- Practice attempts are never shown individually to the teacher.
- The cumulative attempt count may still appear on the current final receipt/report.
- Superseded receipt records may remain only as minimal internal audit/security records needed to invalidate old QR receipts and preserve system integrity, but they are not exposed as normal teacher-facing history.
- The currently valid final submission is the only result used for the assignment's proportional point conversion.


## Creating YouTeach assignments from COG games — confirmed 2026-09-16

When a teacher creates a YouTeach assignment that uses a COG activity:

- The assignment creation flow includes an **Activity COG** option/type.
- The teacher selects the specific COG game to assign.
- The teacher configures the required game **mode/modality** and **difficulty** for that assignment.
- Those settings become part of the assignment configuration and are included in the secure YouTeach-to-COG launch context.
- A submitted result is considered valid for that assignment only if it comes from the assigned game under the required configuration.
- The student may practice repeatedly under that assigned configuration and later choose which result to **Send to teacher**.
- The final submitted result is converted proportionally into the task's configured point value.
- The verified receipt/QR corresponds to that final submitted result and assigned configuration.


## Minimum performance threshold for COG assignments — confirmed 2026-09-16

When a teacher creates a YouTeach assignment based on a COG activity:

- The teacher can configure a **minimum required performance percentage** for that assignment.
- The student may practice as many times as needed.
- A result below the configured minimum cannot be submitted as the official assignment result.
- The student can continue practicing until obtaining a result that meets or exceeds the minimum.
- Once the threshold is met, the student may choose **Send to teacher** for that attempt.
- The final submitted percentage is still converted proportionally into the points assigned to the task.
- The configured minimum belongs to the assignment, not globally to the game.


## Single overall minimum threshold — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- Each assignment may define **one overall minimum performance percentage** required before the student may use **Send to teacher**.
- There are **no per-concept or per-criterion minimum thresholds** inside the game submission gate.
- The game result only determines whether the overall minimum has been reached and supplies the student's submitted performance percentage.
- The existing YouTeach assignment criteria/rubric continue to determine how the assignment's available points are structured and allocated.
- The minimum-performance gate must not duplicate or replace the assignment rubric.


## Optional minimum performance threshold — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- The overall minimum performance threshold is **optional**.
- If the teacher leaves the minimum field empty, the student may use **Send to teacher** with any completed result.
- If the teacher enters a minimum percentage, only results that meet or exceed that percentage may be submitted.
- The absence of a minimum does not change the assignment rubric or proportional point conversion.


## Practice after assignment deadline — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- After the assignment due date/time has passed, the student may still open the assigned COG game and continue practicing.
- Once the assignment is closed/expired, **Send to teacher** is disabled.
- Practice attempts completed after the deadline do not become official submissions while the task remains closed.
- The teacher may restore submission ability by reopening the assignment or extending its due date.
- The existing assignment open/closed state remains the authority for whether a result may be submitted.
- This preserves COG's learning/practice function even after the graded submission window closes.


## Reopened assignment may accept prior practice result — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- A student may continue practicing while the assignment is closed.
- If the teacher later reopens the assignment or extends its due date, the student may **Send to teacher** a valid completed result that was obtained while the assignment was closed.
- The student is **not required to complete a new attempt after reopening** solely because the submission window changed.
- The submitted result must still satisfy the assignment's configured game, mode/difficulty, optional minimum threshold, and other validity requirements.
- The official submission timestamp is the time the student sends the result to the teacher after reopening; the gameplay completion timestamp remains the original completion time.


## Reopen submission timing decision — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- If a teacher reopens a previously closed/expired assignment, the system must **not automatically decide** whether a later submission is treated as on-time or late.
- At the moment the teacher reopens the assignment, the teacher chooses how reopened submissions should be classified for that reopening.
- The reopening control should offer a clear timing treatment such as:
  - **Accept as on-time for this reopened window**
  - **Accept but mark as late**
- The selected treatment applies to submissions made under that reopened window.
- If the teacher instead changes/extends the due date, the normal due-date logic may determine whether a later submission is on time under the new deadline.


## Reopened assignment minimum retention — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- Reopening a closed/expired assignment preserves the assignment's existing overall minimum performance threshold.
- The minimum does not reset or disappear merely because the assignment is reopened.
- The teacher may manually change or remove the minimum at the moment of reopening if desired.
- If the teacher makes no change, the original minimum continues to govern whether **Send to teacher** is enabled.


## Teacher final-submission view — confirmed 2026-09-16

For the current/final official COG submission in YouTeach, an authenticated authorized teacher sees:

- submitted result percentage;
- proportional points earned for the assignment;
- cumulative attempt count for that assignment;
- date/time when the selected gameplay result was completed;
- date/time when the student used **Send to teacher**;
- on-time or late status under the assignment/reopen rules;
- assigned/used game mode or modality;
- assigned/used difficulty;
- access to the verifiable receipt / QR.

Student identity is shown only to an authenticated authorized teacher, consistent with the QR privacy rules.

The normal teacher-facing workflow shows only the current/final official submission, not prior replaced submissions or individual practice attempts.


## COG assignment compatibility certification — confirmed 2026-09-16

For the YouTeach **Activity COG** assignment type:

- The game selector shows only COG games that are explicitly marked as **compatible with YouTeach evaluable assignments**.
- A compatible game must implement the standardized assignment contract required for:
  - secure YouTeach-linked launch context;
  - assigned mode/modality and difficulty;
  - cumulative attempt counting;
  - optional overall minimum-performance gate;
  - explicit **Send to teacher** submission;
  - standardized compact result payload;
  - proportional score mapping;
  - verifiable receipt/QR generation;
  - assignment open/closed and reopening behavior.
- Games that do not yet implement this contract remain playable in COG but do not appear as assignable YouTeach activities.
- Compatibility is an explicit capability flag/certification, not inferred merely because the game exists in the COG catalog.


## Game updates for existing assignments — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- An assignment is **not pinned to a frozen game version**.
- Existing assignments use the current compatible version of the assigned COG game when the student opens it.
- The assignment continues to preserve its own configured requirements, such as game identity, mode/modality, difficulty, optional minimum threshold, due/reopen rules, and point value.
- Updating a COG game should therefore improve/fix the experience for already-created assignments instead of leaving those assignments on old copies.
- The standardized YouTeach assignment contract must remain compatible across game updates so that existing assignments continue to launch, count attempts, submit results, and generate valid receipts.


## Backward-compatible assignment configuration — confirmed 2026-09-16

For YouTeach assignments based on COG activities:

- Game updates must preserve compatibility with configuration values already used by existing assignments.
- If an assignment references a previously valid mode, modality, difficulty, or other assignment-level option, the updated game must continue to understand and honor that configuration.
- Renaming or reorganizing options in the current UI must not silently invalidate existing assignments.
- Internal stable identifiers should be used for assignable configuration values so display labels may evolve without breaking stored assignments.
- If an option is retired for new assignments, existing assignments that already use it must remain functional until those assignments are no longer active/relevant.
- Updates must not silently substitute a materially different configuration for an existing assignment.


## Standardized 0–100 game result — confirmed 2026-09-16

For every COG game certified as compatible with YouTeach evaluable assignments:

- The game must return a standardized official performance result on a **0–100 scale**.
- Each game may calculate that percentage differently according to its own mechanics, objectives, scoring model, accuracy, speed, completion, or other game-specific rules.
- The game-specific calculation remains internal to that game's result adapter/logic, but the value exposed to YouTeach is always normalized to 0–100.
- YouTeach uses that standardized percentage for:
  - the optional overall minimum-performance gate;
  - proportional conversion into assignment points;
  - the teacher's final-submission view;
  - the verified receipt.
- Certification for YouTeach assignment use requires that the game's 0–100 calculation be deterministic, documented, and compatible with the shared standardized result contract.


## Server-validated official COG results — confirmed 2026-09-16

For YouTeach evaluable COG activities:

- YouTeach must **never trust a 0–100 result supplied only by the student's browser** as an official grade.
- A browser/client may calculate and display provisional gameplay state locally, but the result used for an official submission must be validated through the authorized server-side session/result path.
- The server-side validation must verify at minimum that the result belongs to:
  - the authenticated student;
  - the intended YouTeach assignment;
  - the assigned COG game;
  - the required mode/modality and difficulty;
  - a valid authorized launch/session;
  - a completed attempt;
  - the applicable assignment state and minimum-performance rules.
- Only a server-validated result becomes eligible for **Send to teacher**, proportional point conversion, teacher-facing display, and verifiable receipt/QR generation.
- Client-side manipulation of JavaScript, local storage, network payloads, visible score text, or browser developer tools must not be sufficient to create or alter an official result.
- This requirement applies to the standardized result contract for every game certified as compatible with YouTeach assignments.
