import React from 'react';
import { Tile } from '@carbon/react';
import './PlayerCard.scss';

const FALLBACK = '—';

function stat(value) {
  return value !== null && value !== undefined && value !== '' ? value : FALLBACK;
}

function PlayerCard({ entry }) {
  const { player, statistics } = entry;
  const stats = statistics[0] ?? {};
  // Some players have null rating in stats[0] but a real rating in a later entry.
  const statsWithRating = statistics.find(s => s.games?.rating !== null) ?? stats;
  const team = stats.team?.name ?? FALLBACK;
  const position = stats.games?.position ?? FALLBACK;
  const rating = statsWithRating.games?.rating ? parseFloat(statsWithRating.games.rating) : null;
  const formLabel = rating === null  ? null
    : rating >= 8.0                  ? 'In strong form'
    : rating >= 6.0                  ? 'Showing consistent form'
    :                                  'Building form';

  const rows = [
    { label: 'Position',    value: stat(position) },
    { label: 'Age',         value: stat(player.age) },
    { label: 'Nationality', value: stat(player.nationality) },
    { label: 'Club',        value: stat(team) },
    ...(formLabel ? [{ label: 'Form', value: formLabel }] : []),
  ];

  return (
    <Tile className="player-card">
      {player.photo && (
        <div className="player-card__photo-wrap">
          <img
            src={player.photo}
            alt={player.name}
            className="player-card__photo"
            width={120}
            height={120}
          />
        </div>
      )}
      <h2 className="player-card__name">{player.name}</h2>
      <dl className="player-card__stats">
        {rows.map(({ label, value }) => (
          <div key={label} className="player-card__stat-row">
            <dt className="player-card__stat-label">{label}</dt>
            <dd className="player-card__stat-value">{value}</dd>
          </div>
        ))}
      </dl>
    </Tile>
  );
}

export default PlayerCard;
