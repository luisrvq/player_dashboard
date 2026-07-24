import React from 'react';
import { Select, SelectItem } from '@carbon/react';

function PlayerSelect({ players, selectedId, onChange }) {
  function handleChange(e) {
    const val = e.target.value;
    onChange(val === '' ? null : Number(val));
  }

  return (
    <Select
      id="player-select"
      labelText="Player"
      value={selectedId ?? ''}
      onChange={handleChange}
    >
      <SelectItem value="" text="Select a player..." />
      {players.map(({ player }) => (
        <SelectItem key={player.id} value={player.id} text={player.name} />
      ))}
    </Select>
  );
}

export default PlayerSelect;
