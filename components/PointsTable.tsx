'use client';

import { CONFIG, TEAM_COLORS } from '@/lib/config';
import { type Tournament, leagueDone, table } from '@/lib/fixtures';
import { useAuction } from './AuctionProvider';

/** League standings; the top 2 rows are the final spots. */
export default function PointsTable({ tour, big = false }: { tour: Tournament; big?: boolean }) {
  const { teams } = useAuction();
  const rows = table(tour);
  const done = leagueDone(tour);
  return (
    <div className={big ? 'pt-big' : undefined}>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th className="l">Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>GF</th>
            <th>GA</th>
            <th>GD</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, k) => (
            <tr key={r.team} className={k < 2 ? 'top' : ''}>
              <td className="pos cond">{k + 1}</td>
              <td className="l">
                <span className="fx-tteam">
                  <span className="dot" style={{ background: TEAM_COLORS[r.team] }} />
                  {teams[r.team]}
                  {k < 2 && done && <span className="fx-q">Final</span>}
                </span>
              </td>
              <td>{r.p}</td>
              <td>{r.w}</td>
              <td>{r.d}</td>
              <td>{r.l}</td>
              <td>{r.gf}</td>
              <td>{r.ga}</td>
              <td>{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              <td className="pts cond">{r.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
