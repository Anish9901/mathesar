<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Null from '@mathesar/components/Null.svelte';
  import { recordSelectorContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import { Icon, iconExpandDown } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { SimpleManyToManyJoinCellProps } from '../typeDefinitions';

  type $$Props = SimpleManyToManyJoinCellProps;

  const dispatch = createEventDispatcher();
  const recordSelector = recordSelectorContext.get();

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];
  export let columnAlias: $$Props['columnAlias'];
  export let joinPath: $$Props['joinPath'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let joinedRecordSummariesMap: $$Props['joinedRecordSummariesMap'] =
    undefined;

  let wasActiveBeforeClick = false;
  let cellWrapperElement: HTMLElement;

  $: items = value?.result ?? [];
  $: totalCount = value?.count ?? 0;
  $: itemsWithSummaries = items
    .filter((i) => i !== null)
    .map((itemId) => {
      const summary = joinedRecordSummariesMap?.get(String(itemId));
      return {
        id: itemId,
        summary: summary ?? String(itemId),
      };
    });

  async function launchRecordSelector(event?: MouseEvent) {
    if (!recordSelector) return;
    if (disabled) return;
    event?.stopPropagation();
    try {
      // TODO: Implement editing for many-to-many joined columns
      // eslint-disable-next-line no-console
      console.log(columnAlias, joinPath, tableId);
      await recordSelector.acquireUserInput({
        tableOid: tableId,
      });
      // do nothing for now
    } catch {
      // do nothing - record selector was closed
    }
    // Re-focus the cell element so that the user can use the keyboard to move
    // the active cell.
    cellWrapperElement?.focus();
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          void launchRecordSelector();
        }
        break;
      case 'Tab':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowUp':
        dispatch('movementKeyDown', {
          originalEvent: e,
          key: e.key,
        });
        break;
      default:
        break;
    }
  }

  function handleMouseDown() {
    wasActiveBeforeClick = isActive;
    dispatch('activate');
  }

  function handleClick() {
    if (wasActiveBeforeClick) {
      void launchRecordSelector();
    }
  }
</script>

<CellWrapper
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:click={handleClick}
  on:dblclick={launchRecordSelector}
  hasPadding={false}
  bind:element={cellWrapperElement}
>
  <div class="simple-many-to-many-join-cell" class:disabled>
    <div class="value">
      {#if value && value.result.length > 0}
        <div class="pills-container">
          {#each itemsWithSummaries as { id, summary } (id)}
            <span class="pill">
              {summary}
            </span>
          {/each}
        </div>
      {:else if value === null}
        <Null />
      {/if}
    </div>
    {#if totalCount > 0}
      <div class="total-count">
        <span class="count-number">{totalCount}</span>
        <span class="count-label">
          {$_('records_plural_without_count', {
            values: { count: totalCount },
          })}
        </span>
      </div>
    {/if}
    {#if !disabled}
      <button
        class="dropdown-button passthrough"
        on:click={launchRecordSelector}
        aria-label={$_('pick_record')}
        title={$_('pick_record')}
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<style>
  .simple-many-to-many-join-cell {
    flex: 1 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .value {
    padding: var(--cell-padding);
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }
  .pills-container {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.25rem;
    align-items: center;
    overflow: hidden;
  }
  .pill {
    padding: 0.1rem 0.4rem;
    background: var(--color-record-fk-20);
    border: 1px solid var(--color-record-fk-25);
    border-radius: 0.25rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .total-count {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
  }
  .count-number {
    font-size: var(--sm1);
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
  }
  .count-label {
    font-size: var(--sm3);
    color: var(--color-fg-base-muted);
    white-space: nowrap;
    margin-top: 0.1rem;
  }
  .disabled .value {
    padding-right: var(--cell-padding);
  }
  .dropdown-button {
    cursor: pointer;
    padding: 0 var(--cell-padding);
    display: flex;
    align-items: center;
    color: var(--color-fg-base-disabled);
  }
  .dropdown-button:hover {
    color: var(--color-fg-base);
  }
</style>
