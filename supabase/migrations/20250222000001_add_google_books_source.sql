/*
  # Add google_books as a valid source for book references

  Note: This migration runs before the source column is added (migration 6).
  It's a no-op here; the constraint is applied in migration 6 with the full column definition.
*/

-- No-op: source column and constraint are handled in 20250405135320_throbbing_crystal.sql
SELECT 1;
