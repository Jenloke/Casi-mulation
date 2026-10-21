import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@casino/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@casino/ui/components/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@casino/ui/components/tabs';
import type { ReactNode } from 'react';

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
  return (
    <Card className={wide ? 'col-span-full' : undefined}>
      <Tabs defaultValue="chart" className="contents">
        <CardHeader>
          <CardTitle>
            <h2>{title}</h2>
          </CardTitle>
          <CardDescription>{subtitle}</CardDescription>
          <CardAction>
            <TabsList>
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TabsContent value="chart">
            {legend}
            {children}
          </TabsContent>
          <TabsContent value="table">
            <DataTable table={table} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

export function DataTable(props: { table: TableView; testId?: string }) {
  const { columns, rows } = props.table;
  return (
    <Table data-testid={props.testId}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column} scope="col" className="text-muted-foreground">
              {column}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.join('|')}>
            {columns.map((column, index) => (
              <TableCell key={column} className="tabular-nums">
                {row[index]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
