<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import TableName from '@mathesar/components/TableName.svelte';
  import {
    Checkbox,
    Collapsible,
    Help,
    LabeledInput,
  } from '@mathesar-component-library';
  import { Joining } from '@mathesar/stores/table-data';

  import {
    getSimpleManyToManyJoinPath,
    type SimpleManyToManyRelationship,
  } from './joinConfigUtils';

  export let simpleManyToManyRelationships: SimpleManyToManyRelationship[];
  export let joining: Writable<Joining>;

  function handleCheckboxChange(
    relationship: SimpleManyToManyRelationship,
    checked: boolean,
  ) {
    const intermediateTableOid = relationship.intermediateTable.oid;
    const joinPath = getSimpleManyToManyJoinPath(relationship);

    joining.update(($joining) => {
      if (checked) {
        return $joining.withEntry(intermediateTableOid, joinPath);
      } else {
        return $joining.withoutEntry(intermediateTableOid);
      }
    });
  }

  function isChecked(
    relationship: SimpleManyToManyRelationship,
    $joining: Joining,
  ): boolean {
    return $joining.simpleManyToMany.has(relationship.intermediateTable.oid);
  }
</script>

<div class="join-config">
  <Collapsible triggerAppearance="ghost" isOpen>
    <div slot="header">
      {$_('simple_many_to_many_relationships')}
      <Help>{$_('simple_many_to_many_relationships_help')}</Help>
    </div>
    <section slot="content">
      {#if simpleManyToManyRelationships.length}
        {#each simpleManyToManyRelationships as relationship}
          {@const checked = isChecked(relationship, $joining)}
          <LabeledInput layout="inline-input-first">
            <span slot="label">
              <TableName table={{ name: relationship.targetTable.name }} />
            </span>
            <Checkbox
              {checked}
              on:change={(e) => handleCheckboxChange(relationship, e.detail)}
            />
          </LabeledInput>
        {/each}
      {:else}
        <div class="empty">({$_('none')})</div>
      {/if}
    </section>
  </Collapsible>
</div>

<style>
  section {
    padding-left: 2rem;
  }
  .empty {
    color: var(--color-fg-subtle-2);
  }
</style>
