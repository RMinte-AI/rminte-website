-- NO is a product number shared by machines; only SN identifies one machine.
-- Keep existing columns and IDs so deployed APIs and all foreign keys remain valid.
PRAGMA defer_foreign_keys = on;
CREATE TABLE sample_assets_next (
 id TEXT PRIMARY KEY,
 model_key TEXT NOT NULL REFERENCES sample_models(model_key),
 no TEXT NOT NULL, sn TEXT NOT NULL,
 no_key TEXT NOT NULL, sn_key TEXT NOT NULL UNIQUE,
 notes TEXT NOT NULL DEFAULT '',
 lifecycle TEXT NOT NULL DEFAULT 'active' CHECK(lifecycle IN ('active','lost','retired')),
 row_version INTEGER NOT NULL DEFAULT 1,
 created_by TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO sample_assets_next(id,model_key,no,sn,no_key,sn_key,notes,lifecycle,row_version,created_by,created_at,updated_at)
 SELECT id,model_key,no,sn,no_key,sn_key,notes,lifecycle,row_version,created_by,created_at,updated_at FROM sample_assets;
DROP TABLE sample_assets;
ALTER TABLE sample_assets_next RENAME TO sample_assets;
PRAGMA defer_foreign_keys = off;
