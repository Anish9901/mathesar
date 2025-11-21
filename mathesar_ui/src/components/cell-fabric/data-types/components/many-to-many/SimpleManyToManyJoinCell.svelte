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

  let wasActiveBeforeClick = false;
  let cellWrapperElement: HTMLElement;

  $: hasValue = value !== undefined && value !== null;

  async function launchRecordSelector(event?: MouseEvent) {
    if (!recordSelector) return;
    if (disabled) return;
    event?.stopPropagation();
    try {
      const result = await recordSelector.acquireUserInput({
        tableOid: tableId,
      });
      if (result) {
        value = result.recordId;
      } else {
        value = null;
      }
      dispatch('update', { value });
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

  // Reference the props to avoid unused export warnings
  $: _unusedColumnAlias = columnAlias;
  $: _unusedJoinPath = joinPath;
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
      {#if hasValue}
        {value}
      {:else if value === null}
        <Null />
      {/if}
    </div>
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
    justify-content: space-between;
  }
  .value {
    padding: var(--cell-padding);
    align-self: center;
    overflow: hidden;
    width: max-content;
    max-width: 100%;
    color: var(--color-fg-base);
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
