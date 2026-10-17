import React from 'react';
import { loadManifest, loadProfileFiles, uploadedFilesFor } from './lib/loadData.js';
import { buildProfileModel } from './lib/model.js';
import { listReports } from './lib/storage.js';
import AddReport from './components/AddReport.jsx';
import { DISCLAIMER, fmtDate } from './components/ui.jsx';
import Overview from './components/Overview.jsx';
import LabResults from './components/LabResults.jsx';
import Findings from './components/Findings.jsx';
import Nutrition from './components/Nutrition.jsx';
import TopFoods from './components/TopFoods.jsx';
import MealPlan from './components/MealPlan.jsx';
import Trends from './components/Trends.jsx';
import Goals from './components/Goals.jsx';
import Ask from './components/Ask.jsx';
import LabDetail from './components/LabDetail.jsx';
import DataSources from './components/DataSources.jsx';

export const TABS = [
  { id: 'overview', label: 'Overview', icon: '🏠' },
  { id: 'labs', label: 'Lab Results', icon: '📊' },
  { id: 'attention', label: 'What Needs Attention', icon: '🔎' },
  { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
  { id: 'foods', label: 'Top 10 Foods', icon: '⭐' },
  { id: 'meals', label: 'Meal Plan', icon: '🍽️' },
  { id: 'trends', label: 'Trends', icon: '📈' },
  { id: 'goals', label: 'Health Goals', icon: '🎯' },
  { id: 'ask', label: 'Ask About My Results', icon: '💬' },
  { id: 'add', label: 'Add Report', icon: '➕' },
  { id: 'sources', label: 'Sources', icon: '📚' },
];

function readHash() {
  const [, profile, tab] = window.location.hash.replace(/^#/, '').split('/');
  return { profile, tab };
}

export default function App() {
  const [manifest, setManifest] = React.useState(null);
  const [profileId, setProfileId] = React.useState(readHash().profile || null);
  const [tab, setTab] = React.useState(TABS.some((t) => t.id === readHash().tab) ? readHash().tab : 'overview');
  const [baseFiles, setBaseFiles] = React.useState({}); // bundled files, one entry per profile id; never merged
  const [reports, setReports] = React.useState([]); // reports added in the app (each tagged with one profile_id)
  const [error, setError] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [vegetarian, setVegetarian] = React.useState(false);

  React.useEffect(() => {
    loadManifest()
      .then((m) => {
        setManifest(m);
        setProfileId((cur) => (m.profiles.some((p) => p.id === cur) ? cur : m.profiles[0].id));
      })
      .catch((e) => setError(e.message));
  }, []);

  const refreshReports = React.useCallback(() => listReports().then(setReports).catch((e) => setError(`Saved reports could not be read: ${e.message || e.code}`)), []);
  React.useEffect(() => { refreshReports(); }, [refreshReports]);

  React.useEffect(() => {
    if (!manifest || !profileId || baseFiles[profileId]) return;
    const entry = manifest.profiles.find((p) => p.id === profileId);
    loadProfileFiles(entry)
      .then((files) => setBaseFiles((prev) => ({ ...prev, [profileId]: files })))
      .catch((e) => setError(e.message));
  }, [manifest, profileId, baseFiles]);

  // The model is rebuilt from this profile's bundled files + this profile's uploaded reports only.
  const model = React.useMemo(() => {
    if (!manifest || !baseFiles[profileId]) return null;
    const entry = manifest.profiles.find((p) => p.id === profileId);
    return buildProfileModel({ id: entry.id, name: entry.name }, [...baseFiles[profileId], ...uploadedFilesFor(entry.id, reports)]);
  }, [manifest, baseFiles, profileId, reports]);

  React.useEffect(() => {
    if (profileId) window.history.replaceState(null, '', `#/${profileId}/${tab}`);
  }, [profileId, tab]);

  // Close any open detail panel when the profile changes, so a result is never shown under another profile's name.
  React.useEffect(() => setDetail(null), [profileId]);

  const go = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); };
  const open = (rec) => setDetail(rec);
  const showEmptyState = model && !model.labRecords.length && tab !== 'add' && tab !== 'sources';

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="logo" aria-hidden="true">🩺</span>
            <div>
              <div className="brand-name">Health Insights</div>
              <div className="brand-sub">{model?.latestDate ? `Latest labs ${fmtDate(model.latestDate)}` : 'Personal lab insights'}</div>
            </div>
          </div>
          {manifest && (
            <div className="switcher" role="tablist" aria-label="Choose profile">
              {manifest.profiles.map((p) => (
                <button key={p.id} role="tab" aria-selected={p.id === profileId} className={p.id === profileId ? 'active' : ''} onClick={() => setProfileId(p.id)}>
                  <span className="avatar" aria-hidden="true">{p.name[0]}</span>{p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <nav className="tabs" aria-label="Sections">
          <div className="tabs-inner">
            {TABS.map((t) => (
              <button key={t.id} className={t.id === tab ? 'active' : ''} aria-current={t.id === tab ? 'page' : undefined} onClick={() => go(t.id)}>
                <span aria-hidden="true">{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="main" key={profileId}>
        {error && <div className="card error">Could not load lab data: {error}</div>}
        {!error && !model && <div className="loading">Loading {profileId ? `${profileId}'s` : ''} results…</div>}
        {model && (
          <>
            <div className="profile-banner">
              <span>Showing results for <strong>{model.profile.name}</strong> only</span>
              <span className="muted"> · {model.labRecords.length} results · {model.reports.length} report{model.reports.length === 1 ? '' : 's'} · collected {fmtDate(model.latestDate)}</span>
            </div>
            {showEmptyState ? (
              <div className="card">
                <h3>No lab results for {model.profile.name} yet</h3>
                <p>Add a report in the app, or list data files for this profile in <code>profiles.json</code>.</p>
                <button className="btn" onClick={() => go('add')}>Add a report</button>
              </div>
            ) : (
              <>
                {tab === 'overview' && <Overview model={model} go={go} open={open} />}
                {tab === 'labs' && <LabResults model={model} open={open} />}
                {tab === 'attention' && <Findings model={model} open={open} />}
                {tab === 'nutrition' && <Nutrition model={model} vegetarian={vegetarian} setVegetarian={setVegetarian} />}
                {tab === 'foods' && <TopFoods model={model} vegetarian={vegetarian} setVegetarian={setVegetarian} />}
                {tab === 'meals' && <MealPlan model={model} vegetarian={vegetarian} setVegetarian={setVegetarian} />}
                {tab === 'trends' && <Trends model={model} open={open} />}
                {tab === 'goals' && <Goals model={model} open={open} />}
                {tab === 'ask' && <Ask model={model} open={open} />}
                {tab === 'add' && <AddReport manifest={manifest} model={model} reports={reports} onChange={refreshReports} go={go} setProfileId={setProfileId} />}
                {tab === 'sources' && <DataSources model={model} reports={reports} go={go} />}
              </>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p><strong>⚕️ Medical safety:</strong> {DISCLAIMER}</p>
      </footer>

      {detail && model && detail.profile_id === model.profile.id && <LabDetail rec={detail} model={model} onClose={() => setDetail(null)} />}
    </div>
  );
}
