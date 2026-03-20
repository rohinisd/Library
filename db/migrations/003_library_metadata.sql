-- Enrich catalog for typical ILS-style fields (circulation / OPAC)
ALTER TABLE books ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_year INT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publisher VARCHAR(255);
ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(64) DEFAULT 'English';
ALTER TABLE books ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(64);

COMMENT ON COLUMN books.description IS 'Summary or annotation for OPAC display';
COMMENT ON COLUMN books.shelf_location IS 'Call number / shelf label (e.g. Dewey zone)';

-- Loan renewals (standard ILS: limited renewals per loan)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS renewal_count INT NOT NULL DEFAULT 0;
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_renewal_count_check;
ALTER TABLE loans ADD CONSTRAINT loans_renewal_count_check CHECK (renewal_count >= 0 AND renewal_count <= 2);

CREATE INDEX IF NOT EXISTS idx_books_pub_year ON books(publication_year);
CREATE INDEX IF NOT EXISTS idx_books_publisher ON books(publisher);
