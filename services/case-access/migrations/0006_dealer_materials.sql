CREATE TABLE dealer_materials (
 id TEXT PRIMARY KEY, titles_json TEXT NOT NULL CHECK(json_valid(titles_json)), file_language TEXT NOT NULL,
 object_key TEXT NOT NULL UNIQUE, obsolete_key TEXT, file_name TEXT NOT NULL, size INTEGER,
 status TEXT NOT NULL CHECK(status IN ('draft','published','deleting')),
 row_version INTEGER NOT NULL DEFAULT 1, created_by TEXT REFERENCES users(id),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
-- Keep the existing download ID and private object. A missing object is not advertised.
INSERT INTO dealer_materials VALUES (
 'rm01-product-comparison',
 '{"zh":"RM-01 产品横向参数对比（中文）","en":"RM-01 Product Specification Comparison (Chinese)","ja":"RM-01 製品仕様比較（中国語）","ko":"RM-01 제품 사양 비교 (중국어)","es":"Comparativa de especificaciones de RM-01 (chino)","fr":"Comparatif des caractéristiques de RM-01 (chinois)"}',
 'zh','dealer/rm01-product-comparison.pdf',NULL,'RM-01-产品横向参数对比.pdf',NULL,'published',1,NULL,
 strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now')
);
