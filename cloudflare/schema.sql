CREATE TABLE IF NOT EXISTS click_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  client_ipv4 TEXT,
  client_ipv6 TEXT,
  client_city TEXT,
  device_user_agent TEXT,
  country TEXT,
  city TEXT,
  visited_at TEXT NOT NULL,
  url TEXT
);

CREATE INDEX IF NOT EXISTS idx_click_events_visitor_id ON click_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_click_events_ip_address ON click_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_click_events_client_ipv4 ON click_events(client_ipv4);
CREATE INDEX IF NOT EXISTS idx_click_events_visited_at ON click_events(visited_at);
