<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { ConstraintType } from '@mathesar/api/rpc/constraints';
  import {
    dndDragHandle,
    dndDraggable,
    dndDroppable,
  } from '@mathesar/components/drag-and-drop/dnd';
  import { iconGrip } from '@mathesar/icons';
  import type AssociatedCellData from '@mathesar/stores/AssociatedCellData';
  import type { ReadableMapLike } from '@mathesar/typeUtils';
  import { Icon, Select } from '@mathesar-component-library';

  import Filter from './Filter.svelte';
  import FilterGroupActions from './FilterGroupActions.svelte';
  import type {
    FilterEntryColumn,
    FilterGroup,
    IndividualFilter,
  } from './utils';

  interface $$Events {
    update: void;
  }

  const dispatch = createEventDispatcher<$$Events>();
  const filterOperators = ['and', 'or'] as const;

  export let columns: ReadableMapLike<
    FilterEntryColumn['id'],
    FilterEntryColumn
  >;
  export let getColumnLabel: (column: FilterEntryColumn) => string;
  export let getColumnConstraintType: (
    column: FilterEntryColumn,
  ) => ConstraintType[] | undefined = () => undefined;

  export let level = 0;
  export let getFilterGroup: () => FilterGroup;
  export let operator: FilterGroup['operator'];
  export let args: FilterGroup['args'];

  export let recordSummaries: AssociatedCellData<string>;

  function remove(filter: IndividualFilter | FilterGroup) {
    args = args.filter((f) => f !== filter);
    dispatch('update');
  }
</script>

<div
  class="filter-group"
  class:top-level={level === 0}
  class:empty={!args.length}
>
  <div class="connecting-line"></div>

  <div class="group-header">
    <Select
      triggerAppearance="action"
      options={filterOperators}
      bind:value={operator}
      on:change={() => dispatch('update')}
    />
    <span>
      {#if operator === 'and'}
        {$_('all')}
      {:else}
        {$_('any')}
      {/if}
    </span>
    <slot />
  </div>

  {#if !args.length}
    <slot name="empty" />
  {/if}

  <div class="group" use:dndDroppable={{ getItem: () => getFilterGroup() }}>
    {#each args as innerFilter, index (innerFilter)}
      <div
        class="filter"
        use:dndDraggable={{
          getItem: () => innerFilter,
        }}
      >
        {#if innerFilter.type === 'group'}
          <div class="horizontal-connector"></div>
        {/if}
        {#if index > 0}
          <div class="prefix">
            {operator}
          </div>
        {/if}
        <div class="handle" use:dndDragHandle>
          <Icon {...iconGrip} />
        </div>
        <div class="content">
          <Filter
            {columns}
            {getColumnLabel}
            {getColumnConstraintType}
            {recordSummaries}
            level={level + 1}
            bind:filter={innerFilter}
            on:update
            on:remove={() => remove(innerFilter)}
          />
        </div>
      </div>
    {:else}
      {#if level > 0}
        <div class="empty-group-text">
          {$_('drag_filter_items_here')}
        </div>
      {/if}
    {/each}
  </div>
  <FilterGroupActions
    showTextInButtons
    {level}
    {columns}
    {getColumnLabel}
    {getColumnConstraintType}
    bind:operator
    bind:args
    on:update
  />
</div>

<style lang="scss">
  .filter-group {
    border-radius: var(--border-radius-m);
    gap: 1rem;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    flex-grow: 1;

    .connecting-line {
      position: absolute;
      top: 1rem;
      bottom: 1rem;
      left: 0.5em;
      width: calc(1.4rem - 0.5em);
      height: calc(100% - 2rem);
      border-left: 1px solid black;
      border-bottom: 1px solid black;
      border-radius: 0 0 0 var(--border-radius-m);
    }

    .handle {
      cursor: grab;
      color: var(--color-fg-subtle-2);
      margin-top: 4px;
      background: #fff;
    }

    .group-header {
      margin-left: 1.4rem;
      display: flex;
    }

    &:not(.top-level) {
      margin-bottom: var(--sm3);
      margin-left: var(--sm3);
    }

    .group {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .filter {
        display: flex;
        flex-direction: row;
        gap: var(--sm2);
        align-items: start;
        position: relative;

        .horizontal-connector {
          position: absolute;
          left: 1.2em;
          top: calc(0.5em + 6px);
          width: 2.5rem;
          height: 1px;
          background: black;
        }

        .prefix {
          background: #fff;
          font-size: var(--sm2);
          border-radius: var(--border-radius-m);
          position: absolute;
          transform: translateY(-100%);
        }

        .content {
          overflow: hidden;
          flex-grow: 1;
        }
      }
    }

    .empty-group-text {
      width: 100%;
      min-width: 20rem;
    }
  }
  :global([data-ghost]) {
    .prefix {
      visibility: hidden;
    }
  }
</style>
