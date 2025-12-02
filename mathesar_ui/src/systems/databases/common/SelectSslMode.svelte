<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { SslMode } from '@mathesar/api/rpc/servers';
  import { Select } from '@mathesar-component-library';

  import { sslModeOptions } from './sslModeUtils';

  export let value: SslMode = 'prefer';

  function getLabel(mode: SslMode | undefined) {
    if (mode === undefined) {
      return '';
    }
    const option = sslModeOptions.find((o) => o.value === mode);
    return option ? $_(option.labelKey) : mode;
  }

  $: options = sslModeOptions.map((o) => o.value);
</script>

<Select {...$$restProps} {options} bind:value {getLabel} />
