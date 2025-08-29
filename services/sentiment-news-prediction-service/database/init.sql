-- create the database
CREATE DATABASE news_sentiment
  WITH OWNER = postgres
  ENCODING = 'UTF8'
  LC_COLLATE = 'en_US.utf8'
  LC_CTYPE = 'en_US.utf8'
  TABLESPACE = pg_default
  CONNECTION LIMIT = -1;

-- connect to the database
\c news_sentiment;

-- create news table
CREATE TABLE IF NOT EXISTS news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  text TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  utc_published_at FLOAT NOT NULL,
  sentiment_score FLOAT CHECK (sentiment_score in (-1,0,1)) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- create a Btree index
CREATE INDEX idx_news_published_at ON news (utc_published_at);

-- create a trigger to update last_modified_at on update
CREATE OR REPLACE FUNCTION update_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_last_modified
BEFORE UPDATE ON news
FOR EACH ROW
EXECUTE FUNCTION update_last_modified();