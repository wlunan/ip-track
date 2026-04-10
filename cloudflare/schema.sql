CREATE TABLE IF NOT EXISTS click_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  device_user_agent TEXT,
  country TEXT,
  city TEXT,
  visited_at TEXT NOT NULL,
  url TEXT
);

CREATE INDEX IF NOT EXISTS idx_click_events_visitor_id ON click_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_click_events_ip_address ON click_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_click_events_visited_at ON click_events(visited_at);
