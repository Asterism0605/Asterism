CREATE TABLE IF NOT EXISTS images (
  id              TEXT PRIMARY KEY,
  url             TEXT NOT NULL,
  title           TEXT NOT NULL,
  style_group     TEXT NOT NULL,
  style           TEXT[] NOT NULL DEFAULT '{}',
  medium          TEXT,
  sub_medium      TEXT,
  color_palette   TEXT[] NOT NULL DEFAULT '{}',
  source          TEXT NOT NULL,
  attribution     TEXT NOT NULL,
  confidence      JSONB NOT NULL,
  needs_review    JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
