ALTER TABLE users ADD COLUMN can_download_dealer INTEGER NOT NULL DEFAULT 0 CHECK(can_download_dealer IN (0,1));
