import React, { useEffect, useState } from 'react';
import { Tile } from '@carbon/react';
import './WikiSummary.scss';

function firstSentences(text, n) {
  const parts = text.split(/(?<=\.\s)(?=[A-Z])/);
  return parts.slice(0, n).join('').trim();
}

function buildSearchUrl(query) {
  const encoded = encodeURIComponent(query);
  return `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encoded}&limit=1&format=json&origin=*`;
}

function buildSummaryUrl(title) {
  const encoded = encodeURIComponent(title);
  return `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`;
}

function shortName(firstname, lastname) {
  const surname = lastname.split(' ')[0];
  return `${firstname} ${surname}`;
}

async function fetchWikiSummary(firstname, lastname) {
  const name = shortName(firstname, lastname);

  const directRes = await fetch(buildSummaryUrl(name));
  if (directRes.ok) {
    const data = await directRes.json();
    if (data.extract) return firstSentences(data.extract, 3);
  }

  const searchRes = await fetch(buildSearchUrl(name));
  if (!searchRes.ok) throw new Error('Search failed');

  const [, titles] = await searchRes.json();
  if (!titles.length) throw new Error('No Wikipedia article found');

  const summaryRes = await fetch(buildSummaryUrl(titles[0]));
  if (!summaryRes.ok) throw new Error('Summary fetch failed');

  const data = await summaryRes.json();
  if (!data.extract) throw new Error('No extract in response');

  return firstSentences(data.extract, 3);
}

function WikiSummary({ firstname, lastname }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    setError(null);
    setLoading(true);

    fetchWikiSummary(firstname, lastname)
      .then((text) => {
        if (!cancelled) { setSummary(text); setLoading(false); }
      })
      .catch((err) => {
        if (!cancelled) { setError(err.message); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [firstname, lastname]);

  return (
    <Tile className="wiki-summary">
      <p className="wiki-summary__label">Player Information</p>
      {loading && <p className="wiki-summary__loading">Loading…</p>}
      {error   && <p className="wiki-summary__error">No Wikipedia summary available.</p>}
      {summary && (
        <>
          <p className="wiki-summary__text">{summary}</p>
          <p className="wiki-summary__source">Source: Wikipedia</p>
        </>
      )}
    </Tile>
  );
}

export default WikiSummary;
