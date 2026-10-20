import { type ReactNode, useState } from 'react';

export interface TableView {
  readonly columns: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

interface ChartCardProps {
  readonly title: string;
  readonly subtitle: string;
  /** The same numbers as the chart, for readers who can't or don't want to hover. */
  readonly table: TableView;
  readonly legend?: ReactNode;
  readonly wide?: boolean;
  readonly children: ReactNode;
}

export function ChartCard({ title, subtitle, table, legend, wide, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure className={wide ? 'card wide' : 'card'}>
      <figcaption className="card-header">
        <div>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
        </div>
        <button
          type="button"
          className="ghost"
          aria-pressed={showTable}
          onClick={() => setShowTable((shown) => !shown)}
        >
          {showTable ? 'Chart view' : 'Table view'}
        </button>
      </figcaption>
      {!showTable && legend}
      {showTable ? <DataTable table={table} /> : children}
    </figure>
  );
}

export function DataTable(props: { table: TableView; testId?: string }) {
  const { columns, rows } = props.table;
  return (
    <table className="data-table" data-testid={props.testId}>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join('|')}>
            {columns.map((column, index) => (
              <td key={column}>{row[index]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
