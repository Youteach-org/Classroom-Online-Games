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

A separate Firebase project/backend for public COG is the preferred target architecture.

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
9. Public COG backend choice and whether it gets its own Firebase project.
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
- Confirmed the Premium launch sign-in methods: **Google**, **Microsoft**, **Apple**, and **email + password**.
- Confirmed that multiple sign-in providers may be linked to the **same COG account** so subscription status, history, reports, and preferences remain unified.
- Confirmed that **all public COG traffic, Guest and Premium, uses a backend/data project independent from YouTeach**. Guests use temporary/anonymous public-session data; Premium users add authenticated persistent account data on that same public COG backend.
