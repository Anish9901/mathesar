<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import { dndDragHandle } from '@mathesar/components/drag-and-drop/dnd';
  import { iconDeleteMinor, iconGrip } from '@mathesar/icons';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Button, Icon } from '@mathesar-component-library';

  import FilterEntry from './FilterEntry.svelte';
  import FilterGroupComponent from './FilterGroup.svelte';
  import type {
    FilterEntryColumn,
    FilterGroup,
    IndividualFilter,
  } from './utils';

  type T = $$Generic;
  type ColumnLikeType = FilterEntryColumn<T>;

  interface $$Events {
    update: void;
    remove: void;
  }

  const dispatch = createEventDispatcher<$$Events>();

  export let columns: ReadableMapLike<ColumnLikeType['id'], ColumnLikeType>;
  export let getColumnLabel: (column: ColumnLikeType) => string;
  export let getColumnConstraintType: (
    column: ColumnLikeType,
  ) => ConstraintType[] | undefined = () => undefined;
  export let recordSummaries: AssociatedCellData<string>;

  export let filter: FilterGroup<T> | IndividualFilter<T>;
  export let level = 0;

  function filterGroupTypeGuard(filterGroup: FilterGroup<T>) {
    return () => filterGroup;
  }
</script>

<div class="filter-row">
  <div class="handle" use:dndDragHandle>
    <Icon {...iconGrip} />
  </div>
  {#if filter.type === 'individual'}
    <FilterEntry
      {columns}
      {getColumnLabel}
      {getColumnConstraintType}
      recordSummaryStore={recordSummaries}
      bind:columnIdentifier={filter.columnId}
      bind:conditionIdentifier={filter.conditionId}
      bind:value={filter.value}
      on:update
    >
      <div class="close">
        <Button appearance="plain" on:click={() => dispatch('remove')}>
          <Icon {...iconDeleteMinor} />
        </Button>
      </div>
    </FilterEntry>
  {:else}
    <FilterGroupComponent
      {columns}
      {getColumnLabel}
      {getColumnConstraintType}
      {recordSummaries}
      {level}
      getFilterGroup={filterGroupTypeGuard(filter)}
      bind:operator={filter.operator}
      bind:args={filter.args}
      on:update
    >
      <div class="close">
        <Button appearance="plain" on:click={() => dispatch('remove')}>
          <Icon {...iconDeleteMinor} />
        </Button>
      </div>
    </FilterGroupComponent>
  {/if}
</div>

<style lang="scss">
  .filter-row {
    display: flex;
    gap: 0.5rem;
    align-items: top;
  }
  .handle {
    cursor: grab;
    color: var(--color-fg-subtle-2);
  }
  .close {
    --button-color: var(--color-fg-subtle-2);
    --button-padding: var(--sm6);
  }
</style>
