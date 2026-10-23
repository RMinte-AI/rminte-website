ALTER TABLE users ADD COLUMN is_owner INTEGER NOT NULL DEFAULT 0 CHECK(is_owner IN (0,1) AND (is_owner=0 OR role='admin'));
ALTER TABLE users ADD COLUMN disabled_at INTEGER;
ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0 CHECK(must_change_password IN (0,1));
ALTER TABLE users ADD COLUMN label TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN permissions_version INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX users_one_owner ON users(is_owner) WHERE is_owner=1;
CREATE TRIGGER protect_owner_delete BEFORE DELETE ON users WHEN OLD.is_owner=1 BEGIN SELECT RAISE(ABORT,'Owner cannot be deleted'); END;
CREATE TRIGGER protect_owner_update BEFORE UPDATE OF is_owner,role,disabled_at ON users
 WHEN OLD.is_owner=1 AND (NEW.is_owner<>1 OR NEW.role<>'admin' OR NEW.disabled_at IS NOT NULL)
 BEGIN SELECT RAISE(ABORT,'Owner cannot be demoted or disabled'); END;
CREATE TABLE case_grants (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 case_id TEXT NOT NULL,
 PRIMARY KEY(user_id,case_id)
);
CREATE TRIGGER grants_users_only BEFORE INSERT ON case_grants
 WHEN NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.user_id AND role='user')
 BEGIN SELECT RAISE(ABORT,'Case grants require a regular user'); END;
CREATE TABLE permission_events (
 id TEXT PRIMARY KEY,
 actor_id TEXT NOT NULL,
 target_id TEXT NOT NULL,
 action TEXT NOT NULL,
 details TEXT NOT NULL,
 occurred_at INTEGER NOT NULL
);
CREATE INDEX permission_events_time ON permission_events(occurred_at);
CREATE TABLE access_settings (
 id INTEGER PRIMARY KEY CHECK(id=1),
 ready INTEGER NOT NULL DEFAULT 0 CHECK(ready IN (0,1))
);
INSERT INTO access_settings(id,ready) VALUES(1,0);
