'use client';

import { CONFIG, TEAM_COLORS } from '@/lib/config';
import { type PlayerStat, topAssists, topScorers } from '@/lib/fixtures';
import { useAuction } from './AuctionProvider';
import Header from './Header';
import Stage from './Stage';

function Board({ title, list, main }: { title: string; list: PlayerStat[]; main: 'goals' | 'assists' }) {
  const { teams } = useAuction();
  const other = main === 'goals' ? 'assists' : 'goals';
  const leader = list[0]?.[main];
  return (
    <div className="card st-board">
      <div className="h-title">
        <span className="cond st-title">{title}</span>
        <span className="count">{list.length} players</span>
      </div>
      {list.length === 0 ? (
        <div className="empty">No {main} recorded yet</div>
      ) : (
        <div className="st-rows">
          <div className="st-row st-headrow">
            <span>#</span>
            <span>Player</span>
            <span>{main === 'goals' ? 'Goals' : 'Assists'}</span>
            <span>{other === 'goals' ? 'Goals' : 'Assists'}</span>
          </div>
          {list.map((p, k) => {
            const rank = list.findIndex((q) => q[main] === p[main]) + 1; // ties share a rank
            const top = p[main] === leader;
            return (
              <div key={`${p.team}-${p.name}`} className={`st-row${top ? ' top' : ''}`}>
                <span className="st-rank cond">{rank}</span>
                <span className="st-player">
                  <span className="dot" style={{ background: TEAM_COLORS[p.team] }} />
                  <span className="st-name">{p.name}</span>
                  <span className="st-team">{teams[p.team]}</span>
                  {top && <span className="fx-q">{main === 'goals' ? 'Golden boot' : 'Top assist'}</span>}
                </span>
                <span className="st-val cond">{p[main]}</span>
                <span className="st-other cond">{p[other]}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StatsScreen() {
  const { S } = useAuction();
  return (
    <Stage>
      <Header />
      <div className="st-main">
        <Board title="Most goals" list={topScorers(S.tour)} main="goals" />
        <Board title="Most assists" list={topAssists(S.tour)} main="assists" />
      </div>
    </Stage>
  );
}
