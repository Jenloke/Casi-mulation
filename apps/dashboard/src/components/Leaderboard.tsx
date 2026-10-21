import type { LeaderboardEntryDto } from '@casino/contracts';
import { Badge } from '@casino/ui/components/badge';
import {
  Card,
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
import { formatCount } from '../format.ts';

export function Leaderboard({ entries }: { entries: readonly LeaderboardEntryDto[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Chip leaderboard</h2>
        </CardTitle>
        <CardDescription>Richest players on the floor right now</CardDescription>
      </CardHeader>
      <CardContent>
        <Table data-testid="leaderboard">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="text-muted-foreground">
                #
              </TableHead>
              <TableHead scope="col" className="text-muted-foreground">
                Player
              </TableHead>
              <TableHead scope="col" className="text-muted-foreground">
                Type
              </TableHead>
              <TableHead scope="col" className="text-right text-muted-foreground">
                Chips
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => {
              const guest = entry.kind === 'human';
              return (
                <TableRow key={entry.playerId} className={guest ? 'font-semibold' : undefined}>
                  <TableCell className="tabular-nums">{index + 1}</TableCell>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell>
                    <Badge variant={guest ? 'secondary' : 'outline'}>
                      {guest ? 'Guest' : 'Bot'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCount(entry.chips)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
