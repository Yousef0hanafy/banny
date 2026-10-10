# Account mail and local preview

`bun run dev:local` starts the loopback application and its existing local PostgreSQL database. It applies additive migrations and preserves existing data. Account messages are captured privately in `.local-preview/mailbox`; this command never sends SMTP messages, even if SMTP credentials exist in `.env.local`.

Use `/register` for reader signup. Open `/admin/mailbox` while signed in as an admin to follow captured verification/recovery/invitation links. Verification asks the mailbox owner to choose their password before activating the account; this prevents someone else's pending signup from choosing the owner's password. Opening a link alone never consumes it.

Team invitations are managed at `/admin/users`. Existing invited users must sign in to the matching verified account and explicitly accept. Acceptance changes their privileges and requires a fresh sign-in. Invitations stop working if the inviting admin's role, access, or authentication version changes.

## Enable actual SMTP later

Copy the variable names in `.env.example` into the private `.env.local`. For personal Gmail, use `smtp.gmail.com`, port `465`, the Gmail address as both `SMTP_USER` and `SMTP_FROM`, and a Google App Password as `SMTP_PASSWORD`. App Passwords require two-step verification and may be unavailable on some accounts: https://support.google.com/accounts/answer/185833 . Do not use the normal Gmail password or share credentials in chat.

Set `ACCOUNT_MAIL_MODE=smtp`, `APP_ORIGIN` and `NEXTAUTH_URL` to the actual HTTPS application origin. Port `587` is also supported with required STARTTLS. Credentials alone do not activate delivery; explicit SMTP mode is required. Test delivery only after configuring the intended environment. No live SMTP delivery has been verified by this phase's local tests.

Behind a trusted reverse proxy that **replaces** `X-Forwarded-For`, set `ACCOUNT_TRUST_PROXY_HEADER=1` to rate limit account operations per client address. Leave it unset for a direct server: arbitrary client forwarding headers are ignored. The direct-server fallback has a high shared ceiling and is not a substitute for an edge rate limiter before public launch. Email confirmation and recovery have independent recipient limits.

## Release boundary

Local preview/QA uses an isolated loopback database. No external database migration, deployment, real email delivery, social login, custom avatar upload, or advanced recommendation engine is part of this change. Genre onboarding stores preferences and can be skipped. Apply the reviewed migration through the normal release process after choosing the production database, origin, mail provider and edge protections.
