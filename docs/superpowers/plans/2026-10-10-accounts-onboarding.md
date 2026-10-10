# Accounts and onboarding implementation plan

> **For agentic workers:** Execute sequential bounded tasks with Antigravity implementation, coordinator verification and one final Claude review. Existing founder approval covers the spec; do not request it again.

**Goal:** Let real readers and invited team members enter and manage their accounts with a clear Arabic first-use experience.

**Architecture:** Extend Profile and NextAuth credentials using versioned sessions, purpose-bound hashed tokens, serializable account transitions and a private mail adapter. Keep existing profile/content identities and centralize destination validation.

**Tech Stack:** Next.js 16.3, Prisma/PostgreSQL, NextAuth, SMTP via Nodemailer, existing RTL components.

**Spec:** ../specs/2026-10-10-accounts-onboarding.md

## Constraints

Preserve existing design/logo/readers/studio and all user files. Work in the existing clean isolated checkout. No live SMTP sends or external database mutations. One review package and targeted security checks; do not repeat full QA without changed source or a relevant failure. Do not expose raw tokens, hashes, credentials or private mailbox contents to anonymous requests.

## Tasks

- [ ] Schema/migration, validated account/token/throttle services, mail transport, registration/verification/reset/invitation/state/password operations and fresh NextAuth session validation. Tests for the trust boundaries first; preserve existing role/action tests.
- [ ] Arabic account forms, onboarding, settings/avatar, return destinations, admin invitations/status, private local admin mailbox and helpful initial empty states. Keep guest reading open.
- [ ] Isolated security tests, one production build, focused desktop/mobile browser journeys and one read-only Claude review. Fix material findings together and repeat affected checks only.
- [ ] Operator SMTP instructions, verification evidence, local integration and loopback migration without resetting data.
