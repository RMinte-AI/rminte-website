PRAGMA foreign_keys = ON;
CREATE TABLE users (
 id TEXT PRIMARY KEY,
 username TEXT NOT NULL UNIQUE,
 role TEXT NOT NULL CHECK(role IN ('admin','user')),
 password_mac TEXT NOT NULL,
 password_cipher TEXT,
 can_demo INTEGER NOT NULL DEFAULT 0 CHECK(can_demo IN (0,1)),
 can_download INTEGER NOT NULL DEFAULT 0 CHECK(can_download IN (0,1)),
 created_at INTEGER NOT NULL
);
CREATE TABLE sessions (
 token_hash TEXT PRIMARY KEY,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE login_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 occurred_at INTEGER NOT NULL,
 ip TEXT NOT NULL,
 country TEXT NOT NULL,
 region TEXT NOT NULL,
 city TEXT NOT NULL
);
CREATE INDEX login_user_time ON login_events(user_id,occurred_at DESC);
CREATE INDEX login_time ON login_events(occurred_at DESC);
CREATE TABLE applications (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind = 'software'),
 name TEXT NOT NULL,
 company TEXT NOT NULL,
 email TEXT NOT NULL,
 message TEXT NOT NULL,
 experience TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 read_at INTEGER
);
CREATE INDEX applications_time ON applications(created_at DESC);
CREATE TABLE rate_limits (
 key TEXT PRIMARY KEY,
 hits INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX rate_expiry ON rate_limits(expires_at);
