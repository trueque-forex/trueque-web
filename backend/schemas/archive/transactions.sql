CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  sender_email TEXT,
  recipient_name TEXT,
  relationship TEXT,
  gateway TEXT,
  amount NUMERIC,
  status TEXT,
  tx_id TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);