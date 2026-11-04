CREATE TABLE IF NOT EXISTS approved_intakes (
    id BIGSERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
    programme TEXT NOT NULL,
    programme_key TEXT GENERATED ALWAYS AS (LOWER(BTRIM(programme))) STORED,
    academic_year TEXT NOT NULL,
    category TEXT NOT NULL,
    category_key TEXT GENERATED ALWAYS AS (LOWER(BTRIM(category))) STORED,
    approved_intake INTEGER NOT NULL CHECK (approved_intake >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (institution_id, programme_key, academic_year, category_key)
);
