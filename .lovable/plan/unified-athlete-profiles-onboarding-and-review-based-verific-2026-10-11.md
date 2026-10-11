# Unified athlete profiles, onboarding and review-based verification

## 1. One shared profile header (example and real members)
- New shared profile header used by both the example profile page and the real member page — same layout, same dark card.
- Cover area: fixed aspect ratio, image cropped to fit, rounded top; when there is no cover, a dark branded gradient (never a grey block).
- Round photo overlapping the cover; initials in a balanced circle when there's no photo. Remove the stray "+" icon.
- Same compact outlined Follow button everywhere; on your own profile it becomes "Edit profile".
- Placeholders when details are missing:
  - Name: "Complete your profile"
  - Sport/position: "Add your sport and position"
  - Bio: "Tell scouts about your playing background, strengths, and goals."
  - Location: "Abu Dhabi, UAE"
  - Followers: 0
- Spacing, dividers and card height stay the same whether the profile is full or empty.

## 2. "Complete Your Athlete Profile" steps after sign-up
- New athletes go straight into a multi-step flow: photo → name, date of birth → city/emirate → sport, position/event → school/academy → short bio.
- Progress bar, "Save and continue later" on every step (saves what's filled in).
- Subtle "Profile incomplete" banner on the feed until all required fields are filled, linking back to the flow.

## 3. Review-based verification for athletes
- "Get Verified" section on the feed and the edit-profile page, linking to a 3-step flow:
  1. Type: School, Academy/Club, or Coach verification
  2. Details: organisation name, emirate, student/athlete ID (optional), sport, team/grade
  3. Proof: up to 2 files (JPG, PNG, HEIC, PDF, max 10 MB each); "Scan School ID" camera button on phones, normal upload on desktop; consent checkbox; guardian-consent checkbox for under-18s
- Statuses: Not verified, Submitted, Under review, More information required, Rejected, Verified by School / Academy / Club / Coach.
- Withdraw request while pending (deletes the uploaded files too).
- Admin review queue: athlete, organisation details, proof (private short-lived links), submitted date; Approve / Reject / Request more info with a note. Athlete is notified.
- Only approved requests show the green shield pill, e.g. "Verified by Abu Dhabi Indian School", with a details popover showing type and date. Documents, IDs and date of birth are never shown publicly.

## 4. Checks
- Profile, onboarding, verification and admin queue tested on phone, tablet, desktop and at 125% zoom, both themes. Tests for: badge only after approval, file type/size/count limits, placeholder text.

## Technical details
- New `athlete_verifications` table: user_id, kind (school/academy/coach), org_name, emirate, athlete_ref, sport, team_grade, document_paths text[] (max 2), guardian_consent, status, review_note, reviewed_by/at. RLS: owner insert/select, owner delete only while pending, admin select/update via `has_role`. Owner cannot set status (column grants + trigger forcing `submitted`).
- Public security-definer function `athlete_verified_badges()` returns only user_id, kind, org_name, reviewed_at for approved rows — badges read only this.
- Documents in the private `media` bucket under `<userId>/verification/<uuid>.<ext>`; upload through a server function that checks size, count and file signature (magic bytes) server-side and generates the name. Real antivirus scanning isn't available on the free stack — the signature check rejects disguised files; noted to the user.
- Admin queue route under `_authenticated/admin/verifications`, guarded by `has_role(..., 'admin')`; signed URLs created server-side after the admin check.
- Onboarding gating: athletes with missing required profile fields are redirected from the feed to `/onboarding`; existing onboarding route reworked into steps.
- Shared component `ProfileHeader` in `src/components/app/`, used by `u.$id.tsx` and `people.$id.tsx`; record in AGENTS.md.
