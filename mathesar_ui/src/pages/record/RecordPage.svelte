<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { makeSimplePageTitle } from '@mathesar/pages/pageTitleUtils';
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';
  import RecordViewGatekeeper from '@mathesar/systems/record-view/RecordViewGatekeeper.svelte';
  import WithModalRecordView from '@mathesar/systems/record-view-modal/WithModalRecordView.svelte';

  import RecordPageContent from './RecordPageContent.svelte';

  function goHome() {
    window.history.back();
  }

  export let record: RecordStore;

  $: recordStoreFetchRequest = record.fetchRequest;
  $: ({ summary } = record);
  $: recordStoreIsLoading = $recordStoreFetchRequest?.state === 'processing';
  $: recordStoreError =
    $recordStoreFetchRequest?.state === 'failure'
      ? $recordStoreFetchRequest?.errors
      : null;
  $: title = recordStoreIsLoading ? '' : $summary;
</script>

<svelte:head><title>{makeSimplePageTitle(title)}</title></svelte:head>

<LayoutWithHeader cssVariables={{ '--page-padding': '0' }} fitViewport>
  {#if recordStoreError}
    <div class="record-error-page">
      <h1>{$_('error')}</h1>
      <p>{$_('record_not_found')}</p>
      <button class="go-home-btn" on:click={goHome}>
        {$_('go_to_homepage')}
      </button>
    </div>
  {:else}
    <RecordViewGatekeeper {record}>
      <WithModalRecordView>
        <RecordPageContent {record} />
      </WithModalRecordView>
    </RecordViewGatekeeper>
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .record-error-page {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    min-height: 70vh;
    /* Adaptive background for light/dark themes */
    background: var(--color-bg-base, #f6f6f0);
    padding: 64px 40px;
    // margin: 0px auto;
    max-width: 700px;
    // border-radius: 8px;
    // box-shadow: var(--shadow-lg, 0 2px 12px rgba(0,0,0,0.08));
  }

  .record-error-page h1 {
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--color-fg-base, #353533);
    margin: 0 0 24px 0;
  }

  .record-error-page p {
    font-size: 1.3rem;
    color: var(--color-fg-base, #353533);
    margin: 0 0 24px 0;
  }

  .go-home-btn {
    background: var(--color-success, #46782d);
    color: var(--color-btn-primary-text, #fff);
    padding: 12px 22px;
    font-size: 1.1rem;
    font-weight: 700;
    border: none;
    border-radius: 6px;
    margin-top: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.07);
    cursor: pointer;
    transition: background 0.2s;
  }

  .go-home-btn:hover {
    background: var(--color-success-hover, #355922);
  }
</style>
