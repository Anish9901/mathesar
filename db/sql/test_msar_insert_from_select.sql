
-- SELECT plan(4);  -- moved to db/sql/test_sql_functions.sql

DROP TABLE IF EXISTS tmp_src_insert;
DROP TABLE IF EXISTS tmp_dst_insert;
CREATE TABLE tmp_src_insert (text_col text, num_col text);
INSERT INTO tmp_src_insert VALUES ('100','10'), ('200','20'), ('x','30'); 

CREATE TABLE tmp_dst_insert (id integer, value integer);

-- DEPRECATED: tests for msar.insert_from_select were migrated into
-- `db/sql/test_sql_functions.sql` and should be run from there. This file is
-- intentionally a non-runnable placeholder to avoid duplicate test runs.

-- See: db/sql/test_sql_functions.sql -> test_msar_insert_from_select

SELECT lives_ok($$
  SELECT msar.insert_from_select(
    src_tab := 'tmp_src_insert',
    dst_tab := 'tmp_dst_insert',
    mappings := ARRAY[
      json_build_object('src','num_col','dst','value'),
      json_build_object('src','text_col','dst','id')
    ]::json[]
  );
$$, 'insert_from_select runs for castable mappings');

SELECT is((SELECT COUNT(*) FROM tmp_dst_insert WHERE id IN (100,200)), 2, 'two castable rows inserted');

SELECT dies_ok($$
  SELECT msar.insert_from_select(
    src_tab := 'tmp_src_insert',
-- DEPRECATED: tests for msar.insert_from_select were migrated into
-- `db/sql/test_sql_functions.sql` and should be run from there. This file was
-- left as a placeholder to avoid duplicate test runs.

-- See: db/sql/test_sql_functions.sql -> test_msar_insert_from_select
    mappings := ARRAY[
      json_build_object('src','text_col','dst','id')
    ]::json[]
  );
$$, 'insert_from_select raises when uncastable text -> integer mapping exists');

DROP TABLE IF EXISTS tmp_src_insert;
DROP TABLE IF EXISTS tmp_dst_insert;
-- SELECT finish();  -- moved to db/sql/test_sql_functions.sql
