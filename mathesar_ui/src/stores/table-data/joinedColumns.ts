import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';
import type { JoinPath, JoinableTablesResult } from '@mathesar/api/rpc/tables';
import { getCellCap } from '@mathesar/components/cell-fabric/utils';
import type { ComponentAndProps } from '@mathesar-component-library/types';

import type { Joining } from './joining';
import type { ProcessedColumn } from './processedColumns';

type TargetTableJoinedColumn = Pick<
  RawColumnWithMetadata,
  'id' | 'type' | 'type_options' | 'metadata'
>;

function createTargetTableJoinedColumn(
  columns: JoinableTablesResult['target_table_info'][string]['columns'],
): TargetTableJoinedColumn | null {
  const pkEntry = Object.entries(columns).find(([, col]) => col.primary_key);
  if (!pkEntry) return null;
  const [attnum, info] = pkEntry;
  return {
    id: Number(attnum),
    type: '_array',
    type_options: {
      item_type: info.type,
    },
    metadata: null,
  };
}

export class SimpleManyToManyJoinedColumn {
  readonly type = 'simple-many-to-many' as const;

  readonly id: string;

  readonly displayName: string;

  readonly targetTableOid: number;

  readonly intermediateTableOid: number;

  readonly joinPath: JoinPath;

  readonly column: TargetTableJoinedColumn;

  readonly cellComponentAndProps: ComponentAndProps;

  readonly isEditable: boolean = true;

  constructor(props: {
    targetTableOid: number;
    intermediateTableOid: number;
    joinPath: JoinPath;
    targetTableName: string;
    targetTableJoinedColumn: TargetTableJoinedColumn;
    id: string;
  }) {
    this.targetTableOid = props.targetTableOid;
    this.intermediateTableOid = props.intermediateTableOid;
    this.joinPath = props.joinPath;
    this.id = props.id;
    this.displayName = props.targetTableName;
    this.column = props.targetTableJoinedColumn;
    this.cellComponentAndProps = getCellCap({
      cellInfo: { type: 'array' },
      column: this.column,
      joinedColumnInfo: {
        alias: this.id,
        joinPath: this.joinPath,
        targetTableOid: this.targetTableOid,
        type: this.type,
      },
    });
  }

  static createFromJoining(
    joining: Joining,
    joinableTablesResult: JoinableTablesResult,
  ): SimpleManyToManyJoinedColumn[] {
    return joining
      .getSimpleManyToManyJoins()
      .map(({ alias, intermediateTableOid, targetTableOid, joinPath }) => {
        if (!targetTableOid) return null;

        const tableInfo =
          joinableTablesResult.target_table_info[String(targetTableOid)];
        if (!tableInfo) {
          console.warn(`Table info not found for table ${targetTableOid}`);
          return null;
        }

        const pkColumn = createTargetTableJoinedColumn(tableInfo.columns);
        if (!pkColumn) {
          console.warn(`No primary key found for table ${targetTableOid}`);
          return null;
        }

        return new SimpleManyToManyJoinedColumn({
          targetTableOid,
          intermediateTableOid,
          joinPath,
          targetTableName: tableInfo.name,
          targetTableJoinedColumn: pkColumn,
          id: alias,
        });
      })
      .filter((col): col is SimpleManyToManyJoinedColumn => col !== null);
  }
}

// This would be a union type when we have more joined column types.
export type JoinedColumn = SimpleManyToManyJoinedColumn;

export function isJoinedColumn(
  col: ProcessedColumn | JoinedColumn,
): col is JoinedColumn {
  return 'type' in col && col.type === 'simple-many-to-many';
}
