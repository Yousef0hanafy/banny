# Supplied cover illustrations

The founder supplied ten PNG illustrations in `public/series_images` on 2026-10-10.
Their originals are retained. Run `node scripts/prepare-supplied-covers.mjs` to
create WebP derivatives in `public/art/supplied-covers` (maximum 900 × 1350,
aspect ratio preserved, quality 84).

Six illustrations fill the remaining legacy abstract covers through
`src/lib/demo-cover-art.ts`; existing illustrated covers and custom uploaded
cover URLs remain unchanged. The mapping is presentation-only, without a
database migration or reseed. Four additional optimized illustrations are
available for later assignments. These illustrations are temporary cover
assignments, not evidence of the works' actual authorship or publication status.

The five supplied PDFs in `public/series` are not converted, copied into
chapters, or imported into the database in this change. Existing chapter
content remains unchanged. Public preview notices and credential-fill cards
were removed at the founder's request; account creation, content uploads,
payments and production deployment are not implemented by this change.
