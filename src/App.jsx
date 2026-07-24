import React, { useState, useMemo } from 'react';
import {
  Header,
  HeaderName,
  HeaderNavigation,
  HeaderMenuItem,
  SkipToContent,
  Content,
  Theme,
  Button,
  Select,
  SelectItem,
} from '@carbon/react';
import PlayerSelect from './components/PlayerSelect/PlayerSelect';
import PlayerCard from './components/PlayerCard/PlayerCard';
import WikiSummary from './components/WikiSummary/WikiSummary';
import FormationBoard from './components/FormationBoard/FormationBoard';
import players from './data/players.json';
import './App.scss';

/** @param {any[]} arr @param {number} n */
function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// ─── pages ───────────────────────────────────────────────────────────────────
const PAGE_BROWSER   = 'browser';
const PAGE_FORMATION = 'formation';

// Derive sorted unique team and position lists once from the full dataset
const ALL_TEAMS = [...new Set(
  players.map(e => e.statistics[0]?.team?.name).filter(Boolean)
)].sort();

const ALL_POSITIONS = [...new Set(
  players.map(e => e.statistics[0]?.games?.position).filter(Boolean)
)].sort();

// ─── browser page ─────────────────────────────────────────────────────────────
function BrowserPage() {
  const [selectedId, setSelectedId]   = useState(null);
  const [teamFilter, setTeamFilter]   = useState('');
  const [posFilter, setPosFilter]     = useState('');

  function handleTeamChange(e) {
    setTeamFilter(e.target.value);
    setSelectedId(null);
  }

  function handlePosChange(e) {
    setPosFilter(e.target.value);
    setSelectedId(null);
  }

  const filteredPlayers = useMemo(() => players.filter(({ statistics }) => {
    const stats = statistics[0];
    const teamMatch = !teamFilter || stats?.team?.name === teamFilter;
    const posMatch  = !posFilter  || stats?.games?.position === posFilter;
    return teamMatch && posMatch;
  }), [teamFilter, posFilter]);

  const selectedPlayer = selectedId !== null
    ? filteredPlayers.find(({ player }) => player.id === selectedId) ?? null
    : null;

  return (
    <div className="page-container">
      <div className="filter-row">
        <Select
          id="team-filter"
          labelText="Team"
          value={teamFilter}
          onChange={handleTeamChange}
        >
          <SelectItem value="" text="All teams" />
          {ALL_TEAMS.map(t => (
            <SelectItem key={t} value={t} text={t} />
          ))}
        </Select>
        <Select
          id="position-filter"
          labelText="Position"
          value={posFilter}
          onChange={handlePosChange}
        >
          <SelectItem value="" text="All positions" />
          {ALL_POSITIONS.map(p => (
            <SelectItem key={p} value={p} text={p} />
          ))}
        </Select>
      </div>
      <PlayerSelect
        players={filteredPlayers}
        selectedId={selectedId}
        onChange={setSelectedId}
      />
      {selectedPlayer && (
        <>
          <PlayerCard entry={selectedPlayer} />
          <WikiSummary
            firstname={selectedPlayer.player.firstname}
            lastname={selectedPlayer.player.lastname}
          />
        </>
      )}
    </div>
  );
}

// ─── formation page ───────────────────────────────────────────────────────────
function FormationPage() {
  const [teamPlayers, setTeamPlayers] = useState([]);

  return (
    <div className="page-container page-container--formation">
      <h1>Team Formation Visualizer</h1>
      <Button kind="secondary" size="md" onClick={() => setTeamPlayers(pickRandom(players, 11))}>
        Generate Random Team
      </Button>
      <div className="formation-board-wrap">
        <FormationBoard players={teamPlayers} />
      </div>
    </div>
  );
}

// ─── app shell ────────────────────────────────────────────────────────────────
function App() {
  const [page, setPage] = useState(PAGE_BROWSER);

  return (
    <Theme theme="g90">
      <Header aria-label="Player Dashboard">
        <SkipToContent />
        <HeaderName href="#" prefix="IBM">
          Player Dashboard
        </HeaderName>
        <HeaderNavigation aria-label="Main navigation">
          <HeaderMenuItem
            isCurrentPage={page === PAGE_BROWSER}
            onClick={() => setPage(PAGE_BROWSER)}
            href="#"
          >
            Player Browser
          </HeaderMenuItem>
          <HeaderMenuItem
            isCurrentPage={page === PAGE_FORMATION}
            onClick={() => setPage(PAGE_FORMATION)}
            href="#"
          >
            Team Formation
          </HeaderMenuItem>
        </HeaderNavigation>
      </Header>

      <Content>
        {page === PAGE_BROWSER   && <BrowserPage />}
        {page === PAGE_FORMATION && <FormationPage />}
      </Content>
    </Theme>
  );
}

export default App;
