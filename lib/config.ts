/* ================= EDIT YOUR AUCTION HERE ================= */
export const CONFIG = {
  currency: '₹' as '₹' | 'Pts' | '$',
  basePrice: 5000,
  increment: 500, // raise buttons = 1x, 2x, 3x this
  totalPurse: 100000, // per team
  squadSize: 6, // players each team buys in the auction
  teams: ['Team A', 'Team B', 'Team C'],
  managers: ['Mustafa', 'Siraj', 'Ance'], // same order as teams
  iconPlayers: ['Shaheen', 'Ajmal', 'Ameen'], // drawn to teams; free, not counted in squadSize

  players: [
    ['Kiran', 'GK'], ['Dilshad', 'GK'], ['Safvan', 'GK'],
    ['Shimal', 'CB'], ['Ansar', 'CB'], ['Savad', 'CB'],
    ['Nishan', 'MID'], ['Akhil', 'MID'], ['Riyas', 'MID'],
    ['Ajnas', 'ST'], ['Jyodish', 'ST'], ['Shafeeq', 'ST'],
    ['Jassim', 'RB'], ['Majeed', 'RB'], ['Praveen', 'RB'],
    ['Sulthan', 'LB'], ['Cherian', 'LB'], ['Nikhil', 'LB'],
  ] as [string, string][],
};
/* ========================================================== */

export const TEAM_COLORS = ['#4C9AFF', '#FF9F43', '#2EC4B6', '#E05BC1', '#F4D35E', '#8C7AE6', '#FF6B6B', '#7BD389'];

export const META: Record<string, { label: string; color: string }> = {
  GK: { label: 'Goalkeeper', color: '#F4D35E' },
  CB: { label: 'Centre Back', color: '#4C9AFF' },
  MID: { label: 'Midfielder', color: '#2EC4B6' },
  ST: { label: 'Striker', color: '#FF7A1A' },
  RB: { label: 'Right Back', color: '#8C7AE6' },
  LB: { label: 'Left Back', color: '#E05BC1' },
};

/** Order positions are drawn in: every GK first, then CB, and so on. Within a position the draw is random. */
export const POSITION_ORDER = ['GK', 'CB', 'RB', 'LB', 'MID', 'ST'];

/** Old position codes from earlier saves → current codes. */
export const POSITION_RENAMES: Record<string, string> = { DEF: 'CB', FWD: 'ST' };

/** Fire reactions each team starts with on the Home screen (same order as teams). */
export const REACTION_BASE = [23, 25, 27];

/** Home-screen and admin countdown target: 25 November 2026, 7:00 PM IST. */
export const COUNTDOWN_AT = new Date('2026-11-25T19:00:00+05:30').getTime();
export const COUNTDOWN_LABEL = '25 Nov · 7:00 PM';

export const STORAGE_KEY = 'bsl-2026-auction';

export const fmt = (n: number) =>
  CONFIG.currency === 'Pts' ? n.toLocaleString('en-IN') + ' pts' : CONFIG.currency + n.toLocaleString('en-IN');

export const steps = () => [CONFIG.increment, CONFIG.increment * 2, CONFIG.increment * 3];
