# Contributing to Scrap-it

Branching, commit, and release conventions for this monorepo (`admin`, `collector`, `backend`, `mobile`). Written to work today as a solo founder and scale cleanly once collaborators join — nothing here needs to be re-architected later, only turned on.

## 1. Philosophy

`main` is always production-ready and deployable. All work happens on short-lived branches (days, not weeks) that branch off `main` and merge back into it via PR.

We deliberately **don't** use Git Flow (`develop`, `release/*`, `hotfix/*` branches). Git Flow exists to manage slow, versioned release trains — it fights against continuous deployment. `admin`, `collector`, and `backend` deploy continuously via Vercel (prod on merge to `main`, preview per PR), so a long-lived integration branch would just be extra merge overhead with no benefit. This is trunk-based development / GitHub Flow, the current industry standard for teams shipping continuously.

The one app with a genuinely different release cadence is `mobile` (app store review is not continuous) — see [Section 5](#5-mobile-release-process) for how that's handled without introducing a second branching model.

## 2. Branch naming

```
<type>/<scope>-<short-desc>
```

- **type**: `feat`, `fix`, `chore`, `refactor`, `docs`
- **scope**: the app you're touching — `collector`, `admin`, `backend`, `mobile`, or `shared` for anything in `packages/*` that affects more than one app
- **short-desc**: kebab-case, a few words

Examples (based on real recent work in this repo):

```
feat/collector-pricing-engine
fix/mobile-i18n-address-screen
chore/backend-lockfile-update
refactor/collector-dashboard-earnings
```

## 3. Workflow

1. Branch off latest `main`.
2. Commit as you go (see [commit convention](#4-commit-convention)).
3. Open a PR back into `main` — **even solo**. This costs nothing and buys you two things immediately: a Vercel preview URL per PR (free integration testing) and the habit already in place for when someone else is reviewing your code.
4. Merge (squash or regular — pick one and stay consistent; squash keeps `main` history one-commit-per-change, which pairs well with Conventional Commits).
5. Delete the branch after merge.

No long-lived `develop` branch. No branch should outlive the feature it was created for.

## 4. Commit convention

You're already writing these informally (`feat:`, `fix:`, `chore:` show up throughout the history) — this just formalizes it with scopes, matching [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

```
feat(collector): add recent pickups section to dashboard
fix(mobile): remove duplicate address screen translation key
chore(backend): update pnpm-lock for express dependency
```

Scope matches the branch scope (app name, or `shared`). This costs nothing today and sets up automatic per-app changelogs later without rewriting history.

## 5. Mobile release process

`apps/mobile` is pre-release with no EAS config yet — set this up now while there's no existing process to migrate off of:

- Adopt **EAS Build + EAS Update**, and map branches to channels instead of using Git Flow `release/*` branches:
  - `main` → `production` channel (source of store submissions)
  - a shared `preview` branch/channel → internal testers (TestFlight / Play internal track)
- Version bumps (`app.json` / `package.json` version) land as normal commits on `main` via the standard PR flow — no separate release branch needed.
- After a store submission, tag the commit that shipped: `mobile-v1.0.0` (scoped tag, since this is a multi-deployable monorepo — the web apps don't need tags since they deploy continuously and Vercel already tracks what's live).

## 6. Scaling checkpoints

**Day 1 (solo, now):**
- PR into `main` for every change, but no required reviewers.
- No branch protection enforced yet — discipline is manual.

**When you add a collaborator — flip these on in GitHub repo settings:**
- Branch protection on `main`: require 1 approval, require status checks to pass, disallow direct pushes and force-pushes.
- Add a `CODEOWNERS` file scoped by directory (e.g. `apps/mobile/* @mobile-owner`, `apps/collector/* @web-owner`) so review requests route automatically.
- Consider requiring linear history (squash-only merges) if you haven't already standardized on it.

Nothing above requires restructuring branches or history — it's purely settings + one new file.

## 7. Repo hygiene checklist

- Enable **"Automatically delete head branches"** in GitHub repo settings — keeps the branch list from accumulating merged branches.
- **Known issue to fix separately:** `apps/collector/.next/` (Next.js build cache) is currently tracked in git and shows up as hundreds of "modified" files on every local build. This should be added to `.gitignore` and untracked — it's actively working against the "clean branches" goal this doc is meant to support.
- Forward-looking: once CI is added, scope build/lint/test jobs to only affected apps with Turbo's filter syntax (`turbo run build --filter=...[HEAD^1]`) rather than rebuilding the whole monorepo on every PR — this matters more as `packages/*` and app count grow.
