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
    ['Shimal', 'DEF'], ['Ansar', 'DEF'], ['Savad', 'DEF'],
    ['Nishan', 'MID'], ['Akhil', 'MID'], ['Riyas', 'MID'],
    ['Ajnas', 'FWD'], ['Jyodish', 'FWD'], ['Shafeeq', 'FWD'],
    ['Jassim', 'RB'], ['Majeed', 'RB'], ['Praveen', 'RB'],
    ['Sulthan', 'LB'], ['Cherian', 'LB'], ['Nikhil', 'LB'],
  ] as [string, string][],
};
/* ========================================================== */

export const TEAM_COLORS = ['#4C9AFF', '#FF9F43', '#2EC4B6', '#E05BC1', '#F4D35E', '#8C7AE6', '#FF6B6B', '#7BD389'];

export const META: Record<string, { label: string; color: string }> = {
  GK: { label: 'Goalkeeper', color: '#F4D35E' },
  DEF: { label: 'Defender', color: '#4C9AFF' },
  MID: { label: 'Midfielder', color: '#2EC4B6' },
  FWD: { label: 'Forward', color: '#FF7A1A' },
  RB: { label: 'Right Defender', color: '#8C7AE6' },
  LB: { label: 'Left Defender', color: '#E05BC1' },
};

export const STORAGE_KEY = 'bsl-2026-auction';

export const fmt = (n: number) =>
  CONFIG.currency === 'Pts' ? n.toLocaleString('en-IN') + ' pts' : CONFIG.currency + n.toLocaleString('en-IN');

export const steps = () => [CONFIG.increment, CONFIG.increment * 2, CONFIG.increment * 3];
