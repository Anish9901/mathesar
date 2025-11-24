<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Logo from '@mathesar/components/Logo.svelte';
  import MathesarName from '@mathesar/components/MathesarName.svelte';
  import { RichText } from '@mathesar/components/rich-text';
</script>

<div class="form-branding">
  <RichText text={$_('form_created_with_mathesar')} let:slotName>
    {#if slotName === 'mathesarLogo'}
      <a {...$$restProps} href="https://mathesar.org" target="_blank">
        <Logo />
        <MathesarName />
      </a>
    {/if}
  </RichText>
</div>

<style lang="scss">
  .form-branding a {
    color: var(--color-fg-base);
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    text-decoration: none;
    border-bottom: 2px solid transparent;
    fill: currentColor;
    stroke: currentColor;
  }

  .form-branding a:hover,
  .form-branding a:focus {
    border-bottom-color: currentColor;
  }
</style>
