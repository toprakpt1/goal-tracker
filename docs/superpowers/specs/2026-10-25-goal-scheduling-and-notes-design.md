# Goal scheduling and notes

## Context

Goals currently apply to every occurrence of their period: a weekly goal is
active in every week. Users want to schedule a goal for one specific period
("the first week of November", "5 November", "2027") and to attach a free-text
note to a goal.

A goal with no schedule keeps today's behaviour. The feature is additive: no
existing goal changes meaning after the migration.

## Data model

Schema version 4 adds three nullable columns to `goals`:

| Column        | Type    | Meaning                                              |
| ------------- | ------- | ---------------------------------------------------- |
| `scope_start` | INTEGER | Inclusive start of the active window, epoch ms       |
| `scope_end`   | INTEGER | Exclusive end of the active window, epoch ms         |
| `note`        | TEXT    | Optional free-text note, trimmed, max 200 characters |

Rules:

- `scope_start IS NULL AND scope_end IS NULL` means recurring (every period).
- Both scope columns are set together; a half-open window is invalid.
- Existing goals migrate with all three columns `NULL` and keep working.
- The scope is stored as timestamps, not a formatted key, so changing the
  week-start setting later cannot silently move an existing goal.

`Goal` gains `scopeStart: number | null`, `scopeEnd: number | null`, and
`note: string | null`.

## Domain helpers

New module `src/domain/scope.ts`:

- `getGoalPeriodRange(goal, date, weekStartsOn)` – the period range containing
  `date` for the goal's period.
- `isGoalActive(goal, range)` – true when the goal is recurring or its scope
  overlaps `range`.
- `getGoalActiveRange(goal, date, weekStartsOn)` – intersection of the period
  range and the scope; `null` when the goal is not active for that date.
- `getGoalScopeLabel(goal, weekStartsOn)` – human label for the scope
  (`5 Nov 2026`, `2–8 Nov 2026`, `November 2026`, `2026`).

`getGoalProgress` accepts optional `scopeStart`/`scopeEnd` and sums logs inside
the effective range, so existing call sites and tests keep working.

## Behaviour

### Today

- `loadDashboard` filters goals to those active in the current period.
- Progress uses the effective range (period ∩ scope).
- Completion detection only considers goals active at the moment of logging.
- Quick add and check toggles are unchanged for active goals.

### Goals tab

- Shows active and upcoming goals (`scope_end IS NULL OR scope_end > now`).
- A scoped goal row shows its scope label; an upcoming goal shows the start
  date so it is clear why it is not on Today.
- Expired scoped goals disappear from this tab.

### Stats

- Shows recurring goals and scoped goals that have already started.
- Streaks are computed from logs inside the goal's scope only.
- An expired scoped goal keeps `best`/`total` history but reports `current = 0`,
  so it does not inflate the "active streaks" counter.
- Scoped rows show the scope label.

### Goal detail

- Recurring goals keep showing the current period.
- Scoped goals always show their own scope window.
- When the scope is not the current period, the log / check action is hidden and
  the scope label is shown instead.
- The note is shown in its own card below the summary when present.

### Reminders

- A scoped goal schedules its daily reminder only while the scope is active.
- The existing foreground reconciliation removes the reminder after the scope
  ends. Until the app is opened again a stray reminder is possible; this matches
  the current resync model and is accepted for now.

## UI

### New goal form

- New "Schedule" section with a segmented control:
  `Every period` (default) / `Specific period`.
- `Specific period` reveals a date button that opens the native date picker
  (`@react-native-community/datetimepicker`, available in Expo Go).
- Target rows show the computed scope for the chosen date, for example
  `Weekly · 2–8 Nov 2026`.
- Saving creates each selected period goal with that period's range as scope.
- A second recurring goal for the same tracker and period stays blocked. Scoped
  goals can coexist with recurring or other scoped goals and are listed
  separately.
- New optional multiline "Note" field; the same note is applied to every goal
  created in that submission.

### Edit goal form

- Same schedule control, prefilled from the goal (`Every period` when scope is
  null).
- Changing the period while scoped re-derives the scope from the period that
  contains the previous `scope_start`.
- Note field is editable.
- Recurring conflict rule is preserved; scoped goals are exempt.

### Note display

- Goal detail shows the note under the summary.
- The note is not duplicated on Today rows; the detail screen is the place to
  read it.

## i18n

New strings under `goalForm`:

- `schedule`, `everyPeriod`, `specificPeriod`, `chooseDate`, `scopeHint`
- `note`, `notePlaceholder`, `noteHint`
- `scopeStarts`, `scopeNotActive`, `overlapHint`

New strings under `goalDetail`:

- `note`, `scopeLabel`

## Files

- `src/db/schema.ts`, `src/db/migrations.ts`
- `src/domain/types.ts`, `src/domain/scope.ts`, `src/domain/progress.ts`
- `src/db/repositories/goals.ts`, `src/db/dashboard.ts`, `src/db/stats.ts`,
  `src/db/goal-detail.ts`, `src/db/logging.ts`
- `src/lib/reminders.ts`
- `src/app/goal/new.tsx`, `src/app/goal/edit.tsx`, `src/app/goal/[id].tsx`
- `src/app/(tabs)/goals.tsx`, `src/app/(tabs)/stats.tsx`
- `src/i18n/strings.ts`
- `src/domain/__tests__/scope.test.ts`

## Testing

- Unit tests for scope activation, intersection, and week/month/year boundaries.
- Unit tests for progress with a partial scope overlap.
- Existing tests must keep passing (`npm test`).
- `npx tsc --noEmit` and `npx expo lint`.
- Manual check on Android with both 3-button and gesture navigation: create a
  weekly goal for next week, verify it is not on Today, appears in Goals with
  its date, then becomes active when the week starts.
