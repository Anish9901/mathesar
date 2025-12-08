<script lang="ts">
  import { takeLast } from 'iter-tools';
  import { onMount, tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { LinkedRecordInputElement } from '@mathesar/components/cell-fabric/types';
  import {
    type DndChangeDetail,
    dnd,
  } from '@mathesar/components/drag-and-drop/dnd';
  import FilterGroupComponent from '@mathesar/components/filter/FilterGroup.svelte';
  import {
    FILTER_INPUT_CLASS,
    FilterGroup,
    type IndividualFilter,
    makeIndividualFilter,
  } from '@mathesar/components/filter/utils';
  import { iconFiltering } from '@mathesar/icons';
  import { imperativeFilterControllerContext } from '@mathesar/pages/table/ImperativeFilterController';
  import {
    Filtering,
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { getColumnConstraintTypeByColumnId } from '@mathesar/utils/columnUtils';

  import OperationDropdown from '../OperationDropdown.svelte';

  const tabularData = getTabularDataStoreFromContext();

  let isOpen = false;
  let content: HTMLElement | undefined;

  $: ({ meta, processedColumns, recordsData } = $tabularData);
  $: ({ filtering } = meta);
  $: filteringSqlExpr = JSON.stringify($filtering.sqlExpr);

  const imperativeFilterController = imperativeFilterControllerContext.get();

  let filterGroup = new FilterGroup();
  function onExternalFilteringChange(_extFiltering: Filtering) {
    if (!_extFiltering.root.equals(filterGroup)) {
      filterGroup = _extFiltering.root.clone();
    }
  }
  $: onExternalFilteringChange($filtering);
  $: addedFilterCount = $filtering.addedFilterCount;

  function activateLastFilterInput() {
    const lastFilterInput = takeLast(
      content?.querySelectorAll<HTMLElement | LinkedRecordInputElement>(
        `.${FILTER_INPUT_CLASS}`,
      ),
    );
    if (lastFilterInput) {
      if ('launchRecordSelector' in lastFilterInput) {
        void lastFilterInput.launchRecordSelector();
      } else {
        lastFilterInput.focus();
      }
    }
  }

  function setFilteringIfSqlExprHasChanged() {
    const newFiltering = new Filtering(filterGroup.clone());
    addedFilterCount = newFiltering.addedFilterCount;
    if (JSON.stringify(newFiltering.sqlExpr) !== filteringSqlExpr) {
      filtering.set(newFiltering);
    }
  }

  function onChange(e: DndChangeDetail<IndividualFilter, FilterGroup>) {
    e.fromParent.removeArgument(e.item);
    e.toParent.addArgument(e.item, e.toIndex);
    filterGroup = filterGroup.clone();
    setFilteringIfSqlExprHasChanged();
  }

  function addFilter(columnId: string) {
    const filter = makeIndividualFilter(
      $processedColumns,
      (c) => getColumnConstraintTypeByColumnId(c.id, $processedColumns),
      columnId,
    );
    if (filter) {
      filterGroup.addArgument(filter, filterGroup.args.length);
      filterGroup = filterGroup.clone();
      setFilteringIfSqlExprHasChanged();
    }
  }

  async function addColumnToOperation(column: ProcessedColumn) {
    addFilter(column.id);
    await tick();
    activateLastFilterInput();
  }

  onMount(() =>
    imperativeFilterController?.onOpenDropdown(() => {
      isOpen = true;
    }),
  );
  onMount(() => imperativeFilterController?.onAddFilter(addFilter));
  onMount(() =>
    imperativeFilterController?.onActivateLastFilterInput(
      activateLastFilterInput,
    ),
  );
</script>

<OperationDropdown
  bind:isOpen
  label={$_('filter')}
  icon={{ ...iconFiltering, size: '0.8em' }}
  badgeCount={addedFilterCount}
  {addColumnToOperation}
  applied={addedFilterCount > 0}
  {...$$restProps}
>
  <div class="filters" bind:this={content} use:dnd={{ onChange }}>
    <div class="header">{$_('filter_records')}</div>
    <div class="content">
      <FilterGroupComponent
        columns={$processedColumns}
        getColumnLabel={(c) => $processedColumns.get(c.id)?.column.name ?? ''}
        getColumnConstraintType={(c) =>
          getColumnConstraintTypeByColumnId(c.id, $processedColumns)}
        recordSummaries={recordsData.linkedRecordSummaries}
        getFilterGroup={() => filterGroup}
        bind:operator={filterGroup.operator}
        bind:args={filterGroup.args}
        on:update={setFilteringIfSqlExprHasChanged}
      />
    </div>
  </div>
</OperationDropdown>

<style lang="scss">
  .filters {
    padding: 1rem;
    min-width: min(41rem, calc(100svw - 1rem));
  }
  .header {
    font-weight: bolder;
  }
  .content {
    margin-top: 0.8rem;
  }
</style>
