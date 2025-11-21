
SELECT plan(5);

DROP TABLE IF EXISTS tmp_src_prepare;
CREATE TABLE tmp_src_prepare(id text, other text);
INSERT INTO tmp_src_prepare VALUES ('1','a'), ('2','b');

SELECT lives_ok($$
  SELECT msar.prepare_temp_table_for_import(
    tab_name := NULL,
    col_names := ARRAY['id','other'],
    src_tab := 'tmp_src_prepare'
  );
$$, 'prepare_temp_table_for_import does not raise when col includes id');

WITH r AS (
  SELECT (msar.prepare_temp_table_for_import(
    tab_name := NULL,
    col_names := ARRAY['id','other'],
    src_tab := 'tmp_src_prepare'
  )).* 
)
SELECT ok(
  (SELECT (SELECT relpersistence = 't' FROM pg_class WHERE oid = r.table_oid) FROM r),
  'temporary table created when tab_name is NULL'
);

WITH r2 AS (
  SELECT (msar.prepare_temp_table_for_import(
    tab_name := 'tmp_explicit_' || replace(clock_timestamp()::text, ' ', '_'),
    col_names := ARRAY['id','other'],
    src_tab := 'tmp_src_prepare'
  )).* 
)
SELECT ok(
  (SELECT (SELECT relpersistence = 't' FROM pg_class WHERE oid = r2.table_oid) FROM r2),
  'explicit tab_name created as temporary table'
);

WITH r3 AS (
  SELECT (msar.prepare_temp_table_for_import(
    tab_name := 'tmp_copy_check_' || replace(clock_timestamp()::text, ' ', '_'),
    col_names := ARRAY['id','other'],
    src_tab := 'tmp_src_prepare'
  )).* 
)
SELECT ok((SELECT copy_sql LIKE 'COPY %' FROM r3), 'copy_sql returned and starts with COPY');

DROP TABLE IF EXISTS tmp_src_prepare;
SELECT finish();
