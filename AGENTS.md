<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Account roles live in `public.user_roles` (one self-picked non-admin role per user, enforced by RLS); never store roles on `profiles` — prevents privilege escalation.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate); public pages stay top-level so they remain shareable.
- `src/components/SiteHeader.tsx` is the shared nav for every page — keeps navigation consistent.
- Signed-in pages render inside `src/components/app/AppShell.tsx` via the `_authenticated` layout: mobile bottom navigation plus a full destination menu, tablet rail with each destination's name under its icon, desktop labeled sidebar, and always-visible ScoutAI access — every device keeps the same destinations without squeezing the page.
- User media lives in the private `media` bucket under `<userId>/…`; store the path and display through `useMediaUrl` (signed links) — public buckets are blocked for this workspace.
- Demo/sample content lives only in `src/data/demo.ts` and renders through `src/components/app/Demo.tsx`; the sample marker is screen-reader-only by user request, real-brand club showcases still disclaim affiliation, seeded demo chats (DEMO_CHATS) render without disclaimers by user request — never inserted as real members.
- Real tournaments use the existing opportunities table and owner RLS, with optional HTTPS registration URLs — keeps event management and applications in one secured model.
- Demo social interactions and conversations stay local to their labeled demo views; generated editorial media is separate from private member uploads — avoids impersonating real accounts or messages.
- The shared app shell exposes appearance switching and a desktop messages bar, while the inbox owns chat and follower/following views — keeps social navigation consistent.
- ScoutAI streams from the `/api/scoutai` server route (verifies the bearer token itself) and stores one conversation per user in `scoutai_messages`.
- Coach verification status lives in `coach_verifications`; badges read only `verified_coach_ids()` so licence details stay private to the coach and admins.
- Tournament enrolments and club trial requests for showcase items live in `event_enrollments` (owner-only RLS) via `EnrollButton`; real opportunities keep using `applications`.
- Vertical reels live at `/_authenticated/reels` (snap-scroll, autoplay when in view) — the feed Reels tab stays a grid preview.

- Post comments live in `post_comments` (signed-in read, owner insert/delete); showcase posts use local seeded comments via `components/app/Social.tsx` — keeps sample content out of real tables.
- Organisers move applicants through `applications.status` (submitted/shortlisted/accepted/declined) via an owner-only column grant + trigger that notifies the athlete — status updates stay server-enforced.
- Showcase profiles and clubs have their own pages (`/people/$id`, `/club/$id`); public pages wrap in `PageFrame` so members keep the app sidebar.

- Discovery quick filters use shared pure age/verification predicates; real verification reads approved coach IDs only, while school verification is isolated to fictional showcases — prevents school text from granting badges.
- VerificationPill is presentation-only with themed tokens; callers determine verified status — keeps consistent visual badges separate from permissions.
- Showcase portraits use explicit per-role assignments and profile biographies derive from that person’s sport, position and location; never infer club membership from shared sport — avoids contradictory profile information.
- All profile pages (real members and showcases) render through `src/components/app/ProfileHeader.tsx` with shared placeholders from `src/lib/verification-rules.ts` — one design, no per-source layouts.
- Athlete verification lives in `athlete_verifications` (owner submit/withdraw-pending, admin review via `has_role`); proof goes to the private `verification-docs` bucket only through the `uploadVerificationDoc` server fn (content-sniffed type, size cap); public badges read only `athlete_verified_badges()` — documents and IDs never leave owner/admin.
