-- Historical physical loans share the same one-machine allocation as online approvals.
CREATE TABLE sample_legacy_loans (
 id TEXT PRIMARY KEY,
 asset_id TEXT NOT NULL REFERENCES sample_assets(id),
 borrower TEXT NOT NULL, contact TEXT, lent_at TEXT, due_at TEXT, notes TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','returned','lost','corrected')),
 ended_at TEXT, end_reason TEXT, hold_reason TEXT,
 created_by TEXT NOT NULL REFERENCES users(id), recorded_at TEXT NOT NULL, updated_at TEXT NOT NULL,
 row_version INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE sample_allocations_next (
 asset_id TEXT PRIMARY KEY REFERENCES sample_assets(id),
 request_id TEXT UNIQUE REFERENCES sample_requests(id),
 legacy_loan_id TEXT UNIQUE REFERENCES sample_legacy_loans(id),
 allocated_at TEXT NOT NULL, operation_id TEXT NOT NULL,
 CHECK ((request_id IS NOT NULL AND legacy_loan_id IS NULL) OR (request_id IS NULL AND legacy_loan_id IS NOT NULL))
);
INSERT INTO sample_allocations_next(asset_id,request_id,allocated_at,operation_id)
 SELECT asset_id,request_id,allocated_at,operation_id FROM sample_allocations;
DROP TABLE sample_allocations;
ALTER TABLE sample_allocations_next RENAME TO sample_allocations;
CREATE INDEX sample_legacy_asset_history ON sample_legacy_loans(asset_id,recorded_at,id);
UPDATE sample_models SET name=replace(replace(replace(name,'(275 TOPS)','( 275 TOPS )'),'(1200 TFLOPS)','( 1200 TFLOPS )'),'(2070 TFLOPS)','( 2070 TFLOPS )');
