
-- SELECT plan(5);  -- DEPRECATED: moved to db/sql/test_sql_functions.sql

DROP TABLE IF EXISTS tmp_src_prepare;
CREATE TABLE tmp_src_prepare(id text, other text);
INSERT INTO tmp_src_prepare VALUES ('1','a'), ('2','b');

-- SELECT lives_ok($$
--   SELECT msar.prepare_temp_table_for_import(
--     tab_name := NULL,
--     col_names := ARRAY['id','other'], 
--     src_tab := 'tmp_src_prepare'
--   );
-- $$, 'prepare_temp_table_for_import does not raise when col includes id');

-- DEPRECATED: tests for msar.prepare_temp_table_for_import were migrated into
-- `db/sql/test_sql_functions.sql` and should be run from there. This file is
-- intentionally a non-runnable placeholder to avoid duplicate test runs.

-- See: db/sql/test_sql_functions.sql -> test_msar_prepare_temp_table_for_import
