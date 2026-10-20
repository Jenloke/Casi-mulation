import type { LeaderboardEntryDto } from '@casino/contracts';
import { formatCount } from '../format.ts';

export function Leaderboard({ entries }: { entries: readonly LeaderboardEntryDto[] }) {
  return (
    <figure className="card">
      <figcaption className="card-header">
        <div>
          <h2>Chip leaderboard</h2>
          <p className="subtitle">Richest players on the floor right now</p>
        </div>
      </figcaption>
      <table className="data-table" data-testid="leaderboard">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Player</th>
            <th scope="col">Type</th>
            <th scope="col" className="numeric">
              Chips
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={entry.playerId} className={entry.kind === 'human' ? 'guest-row' : undefined}>
              <td>{index + 1}</td>
              <td>{entry.name}</td>
              <td>
                <span className={`pill ${entry.kind}`}>
                  {entry.kind === 'human' ? 'Guest' : 'Bot'}
                </span>
              </td>
              <td className="numeric">{formatCount(entry.chips)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
