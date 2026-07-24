#!/usr/bin/env node
/**
 * scripts/fetchPlayers.js
 *
 * Downloads Premier League player data from API-Football (api-sports.io direct)
 * and writes the result to data/players.json.
 *
 * Required environment variables (add to .env):
 *   API_FOOTBALL_KEY   - Your API key from dashboard.api-football.com
 *
 * Optional environment variables:
 *   API_FOOTBALL_SEASON - Season year (default: 2024)
 *   API_FOOTBALL_LEAGUE - League ID     (default: 39, Premier League)
 *
 * Usage:
 *   node scripts/fetchPlayers.js
 *   yarn fetch:players
 */

require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY    = process.env.API_FOOTBALL_KEY;
const SEASON     = process.env.API_FOOTBALL_SEASON || '2024';
const LEAGUE_ID  = process.env.API_FOOTBALL_LEAGUE || '39'; // 39 = Premier League
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'players.json');

if (!API_KEY) {
  console.error('Error: API_FOOTBALL_KEY is not set in your .env file.');
  console.error('Get a free key at https://dashboard.api-football.com');
  process.exit(1);
}

/**
 * Fetches a single page of players from the API.
 * @param {number} page
 * @returns {Promise<object>} Parsed JSON response body
 */
function fetchPage(page) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: 'v3.football.api-sports.io',
      path: `/players?league=${LEAGUE_ID}&season=${SEASON}&page=${page}`,
      headers: {
        'x-apisports-key': API_KEY,
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
        }
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Fetches all pages of players and returns a flat array.
 * @returns {Promise<object[]>}
 */
async function fetchAllPlayers() {
  const firstPage = await fetchPage(1);
  const totalPages = firstPage.paging?.pages ?? 1;
  console.log(`Fetching ${totalPages} page(s) for league ${LEAGUE_ID}, season ${SEASON}...`);

  const allPlayers = [...(firstPage.response ?? [])];

  for (let page = 2; page <= totalPages; page++) {
    console.log(`  Page ${page} / ${totalPages}`);
    const data = await fetchPage(page);
    allPlayers.push(...(data.response ?? []));
  }

  return allPlayers;
}

(async () => {
  try {
    const players = await fetchAllPlayers();
    console.log(`Fetched ${players.length} players total.`);

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(players, null, 2), 'utf8');
    console.log(`Saved to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }
})();
