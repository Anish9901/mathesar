import { writable, get as getStoreValue, derived } from 'svelte/store';
import {
  deleteAPI,
  getAPI,
  postAPI,
  States,
} from '@mathesar/utils/api';
import type {
  Writable,
  Updater,
  Subscriber,
  Unsubscriber,
  Readable,
} from 'svelte/store';
import type { PaginatedResponse } from '@mathesar/utils/api';
import type { CancellablePromise } from '@mathesar-component-library';
import type { DBObjectEntry } from '@mathesar/App.d';
import { setsAreEqual } from '@mathesar/utils/language';
import type { Column } from './columns';

export type ConstraintType = 'foreignkey' | 'primary' | 'unique' | 'check' | 'exclude';

export interface ConstraintBase {
  id: number,
  name: string,
  type: ConstraintType,
}

export interface SerializedConstraint extends ConstraintBase {
  columns: string[],
}

export interface Constraint extends ConstraintBase {
  columns: Set<string>,
}

function serialize<T extends Partial<Constraint>>(constraint: T) {
  return {
    ...constraint,
    columns: [...constraint.columns.values()],
  };
}

function deserialize<T extends Partial<SerializedConstraint>>(serializedConstraint: T) {
  return {
    ...serializedConstraint,
    columns: new Set(serializedConstraint.columns),
  };
}

export interface ConstraintsData {
  state: States,
  error?: string,
  constraints: Constraint[],
}

function api(url: string) {
  return {
    get() {
      return getAPI<PaginatedResponse<SerializedConstraint>>(`${url}?limit=500`);
    },
    add(constraintDetails: Partial<SerializedConstraint>) {
      return postAPI<Partial<SerializedConstraint>>(url, constraintDetails);
    },
    remove(constraintId: Constraint['id']) {
      return deleteAPI(`${url}${constraintId}/`);
    },
  };
}

export class ConstraintsDataStore implements Writable<ConstraintsData> {
  private parentId: DBObjectEntry['id'];

  private store: Writable<ConstraintsData>;

  private promise: CancellablePromise<PaginatedResponse<SerializedConstraint>> | null;

  private api: ReturnType<typeof api>;

  private fetchCallback: (storeData: ConstraintsData) => void;

  constructor(
    parentId: number,
    fetchCallback?: (storeData: ConstraintsData) => void,
  ) {
    this.parentId = parentId;
    this.store = writable({
      state: States.Loading,
      constraints: [],
    });
    this.fetchCallback = fetchCallback;
    this.api = api(`/tables/${this.parentId}/constraints/`);
    void this.fetch();
  }

  set(value: ConstraintsData): void {
    this.store.set(value);
  }

  update(updater: Updater<ConstraintsData>): void {
    this.store.update(updater);
  }

  subscribe(
    run: Subscriber<ConstraintsData>,
  ): Unsubscriber {
    return this.store.subscribe(run);
  }

  get(): ConstraintsData {
    return getStoreValue(this.store);
  }

  async fetch(): Promise<ConstraintsData> {
    this.update((existingData) => ({
      ...existingData,
      state: States.Loading,
    }));

    try {
      this.promise?.cancel();
      this.promise = this.api.get();

      const response = await this.promise;

      const storeData: ConstraintsData = {
        state: States.Done,
        constraints: response.results.map(deserialize),
      };
      this.set(storeData);
      this.fetchCallback?.(storeData);
      return storeData;
    } catch (err) {
      this.set({
        state: States.Error,
        error: err instanceof Error ? err.message : null,
        constraints: [],
      });
    } finally {
      this.promise = null;
    }
    return null;
  }

  async add(constraintDetails: Partial<Constraint>): Promise<Partial<Constraint>> {
    const constraint = deserialize(await this.api.add(serialize(constraintDetails)));
    await this.fetch();
    return constraint;
  }

  async remove(constraintId: number): Promise<void> {
    await this.api.remove(constraintId);
    await this.fetch();
  }

  /**
   * A constraint only matches if the set of its columns strictly equals the set
   * of columns supplied here. For example, if a constraint is set on three
   * columns, two of which are passed to this function, that constraint will
   * _not_ be returned.
   */
  constraintsThatMatchSetOfColumns(columnNames: Set<string>): Readable<Constraint[]> {
    return derived(this.store, (s) => s.constraints.filter(
      (constraint) => setsAreEqual(constraint.columns, columnNames),
    ));
  }

  /**
   * Caveat: even though primary key columns must be unique, this function will
   * give `false` for them because they don't usually have unique constraints
   * set too.
   */
  columnHasUniqueConstraint(column: Column): Readable<boolean> {
    const constraints = this.constraintsThatMatchSetOfColumns(new Set([column.name]));
    return derived(constraints, (c) => c.some((constraint) => constraint.type === 'unique'));
  }

  columnAllowsDuplicates(column: Column): Readable<boolean> {
    return derived(
      this.columnHasUniqueConstraint(column),
      (hasUniqueConstraint) => {
        if (column.primary_key) {
          return false;
        }
        return !hasUniqueConstraint;
      },
    );
  }

  async setUniquenessOfColumn(column: Column, shouldBeUnique: boolean): Promise<void> {
    if (column.primary_key) {
      if (!shouldBeUnique) {
        throw new Error(`Column "${column.name}" must remain unique because it is a primary key.`);
      }
      return;
    }

    const uniqueConstraintsForColumn = getStoreValue(
      this.constraintsThatMatchSetOfColumns(new Set([column.name])),
    ).filter((c) => c.type === 'unique');
    const currentlyIsUnique = uniqueConstraintsForColumn.length > 0;
    if (shouldBeUnique === currentlyIsUnique) {
      return;
    }
    if (shouldBeUnique) {
      await this.add({ type: 'unique', columns: new Set([column.name]) });
      return;
    }
    // Technically, one column can have two unique constraints applied on it,
    // with different names. So we need to make sure do delete _all_ of them.
    await Promise.all(uniqueConstraintsForColumn.map(
      (constraint) => this.api.remove(constraint.id),
    ));
    await this.fetch();
  }

  destroy(): void {
    this.promise?.cancel();
    this.promise = null;
  }
}
