<script lang="ts">
  import { derived, writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
  import { Help } from '@mathesar/component-library';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconRecord } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import {
    ImperativeFilterController,
    imperativeFilterControllerContext,
  } from '@mathesar/pages/table/ImperativeFilterController';
  import { storeToGetTablePageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    Meta,
    TabularData,
    setTabularDataStoreInContext,
  } from '@mathesar/stores/table-data';
  import { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import { currentTablesData } from '@mathesar/stores/tables';
  import MiniActionsPane from '@mathesar/systems/table-view/actions-pane/MiniActionsPane.svelte';
  import TableView from '@mathesar/systems/table-view/TableView.svelte';
  import Pagination from '@mathesar/utils/Pagination';
  import { orderProcessedColumns } from '@mathesar/utils/tables';

  const meta = new Meta({
    pagination: new Pagination({ size: 10 }),
  });

  const imperativeFilterController = new ImperativeFilterController();
  imperativeFilterControllerContext.set(imperativeFilterController);

  export let recordPk: string;
  export let recordSummary: string;
  export let table: Table;
  export let fkColumn: Pick<RawColumnWithMetadata, 'id' | 'name' | 'metadata'>;
  export let isInModal = false;

  const tableStore = writable(table);

  $: {
    const currentTable = $currentTablesData.tablesMap.get(table.oid);
    if (currentTable) {
      tableStore.set(currentTable);
    }
  }

  const tabularData = new TabularData({
    database: table.schema.database,
    table,
    meta,
    contextualFilters: new Map([[fkColumn.id, recordPk]]),
  });

  tabularData.processedColumns = derived(
    [
      tabularData.columnsDataStore.columns,
      tabularData.constraintsDataStore,
      tableStore,
    ],
    ([columns, constraintsData, currentTable]) =>
      orderProcessedColumns(
        new Map(
          columns.map((column, columnIndex) => [
            column.id,
            new ProcessedColumn({
              tableOid: currentTable.oid,
              column,
              columnIndex,
              constraints: constraintsData.constraints,
              hasEnhancedPrimaryKeyCell: true,
            }),
          ]),
        ),
        currentTable,
      ),
  );

  const tabularDataStore = setTabularDataStoreInContext(tabularData);
  tabularDataStore.set(tabularData);

  $: currentTable = $tableStore;
  $: ({ currentRolePrivileges } = currentTable.currentAccess);
  $: canViewTable = $currentRolePrivileges.has('SELECT');
  $: getTablePageUrl = $storeToGetTablePageUrl;
  $: href = isInModal
    ? undefined
    : getTablePageUrl({ tableId: currentTable.oid });
</script>

<div class="table-widget">
  <div class="top">
    <h3 class="bold-header">
      {#if href}
        <a class="table-link" {href}>
          <TableName table={currentTable} truncate={false} />
        </a>
      {:else}
        <TableName table={currentTable} truncate={false} />
      {/if}
      <Help>
        <RichText text={$_('related_records_help')} let:slotName>
          {#if slotName === 'tableName'}
            <TableName table={currentTable} truncate={false} />
          {/if}
          {#if slotName === 'recordSummary'}
            <NameWithIcon icon={iconRecord} truncate={false} bold>
              {recordSummary}
            </NameWithIcon>
          {/if}
          {#if slotName === 'columnName'}
            <ColumnName
              column={{
                name: fkColumn.name,
                type: 'unknown',
                type_options: null,
                metadata: fkColumn.metadata,
                constraintsType: ['foreignkey'],
              }}
              truncate={false}
              bold
            />
          {/if}
        </RichText>
      </Help>
    </h3>

    {#if canViewTable}
      <MiniActionsPane />
    {/if}
  </div>

  <div class="results">
    {#if canViewTable}
      <TableView context="widget" table={currentTable} />
    {:else}
      <WarningBox fullWidth>
        {$_('no_privileges_view_table')}
      </WarningBox>
    {/if}
  </div>
</div>

<style lang="scss">
  .top {
    display: grid;
    grid-template: auto / 1fr auto;
    gap: 0.5rem;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    color: var(--color-fg-base);
    margin-bottom: var(--sm1);
  }
  .top > :global(*) {
    overflow: hidden;
  }
  .bold-header {
    margin: 0;
  }
  .results {
    margin-top: var(--sm1);
    border: transparent;
  }
  .table-link {
    color: inherit;
    text-decoration: none;
  }
  .table-link:hover {
    text-decoration: underline;
  }
</style>
