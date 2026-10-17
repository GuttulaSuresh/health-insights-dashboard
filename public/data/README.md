# Sample data

**Synthetic sample data for demonstration only.** These profiles and lab values were invented to show how the
dashboard works. They do not describe any real person.

- `profiles.json` lists the profiles and which files belong to each.
- `jane-doe/` has three collection dates (one CSV, two JSON) so trends and charts have history.
- `john-doe/` has two collection dates and includes a test that is not in the marker catalog (uric acid) to show
  how unknown tests are handled.

To use your own data, do not edit these files. Copy this folder to `public/local-data/` (ignored by git) and set
`VITE_DATA_DIR=local-data` in `.env`. See `docs/DATA_FORMAT.md` for the record format.
