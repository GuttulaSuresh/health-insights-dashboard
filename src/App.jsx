import React from 'react';
import { loadManifest, loadProfileFiles, uploadedFilesFor } from './lib/loadData.js';
import { DATA_DIR, SAMPLE_DIR } from './lib/config.js';
import { buildProfileModel } from './lib/model.js';
import { listReports, listProfiles, saveProfile, deleteProfile, getShowSample, setShowSample } from './lib/storage.js';
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
  const [fileProfiles, setFileProfiles] = React.useState(DATA_DIR ? null : []); // from VITE_DATA_DIR, if set
  const [sampleProfiles, setSampleProfiles] = React.useState([]);
  const [localProfiles, setLocalProfiles] = React.useState(null); // created in the app
  const [showSample, setShowSampleState] = React.useState(getShowSample);
  const [profileId, setProfileId] = React.useState(readHash().profile || null);
  const [tab, setTab] = React.useState(TABS.some((t) => t.id === readHash().tab) ? readHash().tab : 'overview');
  const [baseFiles, setBaseFiles] = React.useState({}); // bundled files, one entry per profile id; never merged
  const [reports, setReports] = React.useState([]); // reports added in the app (each tagged with one profile_id)
  const [error, setError] = React.useState(null);
  const [detail, setDetail] = React.useState(null);
  const [vegetarian, setVegetarian] = React.useState(false);

  React.useEffect(() => {
    if (!DATA_DIR) return;
    loadManifest(DATA_DIR, 'files').then(setFileProfiles).catch((e) => { setFileProfiles([]); setError(e.message); });
  }, []);

  React.useEffect(() => {
    if (!showSample || sampleProfiles.length) return;
    loadManifest(SAMPLE_DIR, 'sample').then(setSampleProfiles).catch((e) => setError(e.message));
  }, [showSample, sampleProfiles.length]);

  const refreshLocal = React.useCallback(() => Promise.all([listReports(), listProfiles()])
    .then(([r, p]) => { setReports(r); setLocalProfiles(p.map((x) => ({ ...x, source: 'local', files: [] }))); })
    .catch((e) => setError(`Saved data could not be read: ${e.message}`)), []);
  React.useEffect(() => { refreshLocal(); }, [refreshLocal]);

  const ready = fileProfiles !== null && localProfiles !== null;
  const profiles = React.useMemo(
    () => [...(fileProfiles || []), ...(localProfiles || []), ...(showSample ? sampleProfiles : [])],
    [fileProfiles, localProfiles, showSample, sampleProfiles],
  );
  const entry = profiles.find((p) => p.id === profileId) || null;

  // Fall back to the first available profile when the current one is missing (deleted, sample hidden, bad link).
  React.useEffect(() => {
    if (ready && !entry && profiles.length) setProfileId(profiles[0].id);
  }, [ready, entry, profiles]);

  React.useEffect(() => {
    if (!entry || baseFiles[entry.id]) return;
    loadProfileFiles(entry)
      .then((files) => setBaseFiles((prev) => ({ ...prev, [entry.id]: files })))
      .catch((e) => setError(e.message));
  }, [entry, baseFiles]);

  // The model is rebuilt from this profile's bundled files + this profile's uploaded reports only.
  const model = React.useMemo(() => {
    if (!entry || !baseFiles[entry.id]) return null;
    return buildProfileModel({ id: entry.id, name: entry.name }, [...baseFiles[entry.id], ...uploadedFilesFor(entry.id, reports)]);
  }, [entry, baseFiles, reports]);

  React.useEffect(() => {
    if (entry) window.history.replaceState(null, '', `#/${entry.id}/${tab}`);
    else if (ready && !profiles.length) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, [entry, tab, ready, profiles.length]);

  // Close any open detail panel when the profile changes, so a result is never shown under another profile's name.
  React.useEffect(() => setDetail(null), [profileId]);

  const go = (t) => { setTab(t); window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); };
  const open = (rec) => setDetail(rec);
  const toggleSample = (value) => { setShowSample(value); setShowSampleState(value); };
  const showProfile = (id, t = 'overview') => { setProfileId(id); go(t); };

  const renameProfile = async (profile, name) => {
    await saveProfile({ id: profile.id, name, match: profile.match || [], created_at: profile.created_at });
    await refreshLocal();
  };
  const removeProfile = async (profile) => {
    await deleteProfile(profile.id);
    setBaseFiles(({ [profile.id]: _removed, ...rest }) => rest);
    await refreshLocal();
    const next = profiles.find((p) => p.id !== profile.id);
    setProfileId(next ? next.id : null);
    go('overview');
  };

  const showEmptyState = model && !model.labRecords.length && tab !== 'add' && tab !== 'sources';
  const addReport = (
    <AddReport
      profiles={profiles}
      currentProfileId={entry?.id || null}
      reports={reports}
      onChange={refreshLocal}
      showProfile={showProfile}
    />
  );

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
          {profiles.length > 0 && (
            <div className="switcher" role="tablist" aria-label="Choose profile">
              {profiles.map((p) => (
                <button key={p.id} role="tab" aria-selected={p.id === entry?.id} className={p.id === entry?.id ? 'active' : ''} onClick={() => setProfileId(p.id)}>
                  <span className="avatar" aria-hidden="true">{p.name[0]}</span>{p.name}{p.source === 'sample' && <span className="tag">sample</span>}
                </button>
              ))}
            </div>
          )}
        </div>
        {profiles.length > 0 && <nav className="tabs" aria-label="Sections">
          <div className="tabs-inner">
            {TABS.map((t) => (
              <button key={t.id} className={t.id === tab ? 'active' : ''} aria-current={t.id === tab ? 'page' : undefined} onClick={() => go(t.id)}>
                <span aria-hidden="true">{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </nav>}
      </header>

      <main className="main" key={entry?.id || 'welcome'}>
        {error && <div className="card error">{error}</div>}
        {!ready && <div className="loading">Loading…</div>}
        {ready && !profiles.length && (
          <div className="stack">
            <div className="card welcome">
              <h2>Add your first lab report</h2>
              <p>Drop in a PDF, CSV or JSON lab report below. The app reads the name printed on it and creates a profile for that person. Each new person gets their own dashboard, and their results are never mixed with anyone else&apos;s.</p>
              <p className="muted small">Everything stays in this browser. Nothing is uploaded.</p>
              <button className="btn-ghost" onClick={() => toggleSample(true)}>Explore with sample data instead</button>
            </div>
            {addReport}
          </div>
        )}
        {ready && profiles.length > 0 && !model && !error && <div className="loading">Loading {entry ? `${entry.name}'s` : ''} results…</div>}
        {model && (
          <>
            <div className="profile-banner">
              <span>Showing results for <strong>{model.profile.name}</strong> only{entry?.source === 'sample' && ' (synthetic sample data)'}</span>
              <span className="muted"> · {model.labRecords.length} results · {model.reports.length} report{model.reports.length === 1 ? '' : 's'} · collected {fmtDate(model.latestDate)}</span>
            </div>
            {showEmptyState ? (
              <div className="card">
                <h3>No lab results for {model.profile.name} yet</h3>
                <p>Add a report for {model.profile.name} to see their dashboard.</p>
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
                {tab === 'add' && addReport}
                {tab === 'sources' && <DataSources model={model} entry={entry} reports={reports} go={go} onRename={renameProfile} onDelete={removeProfile} />}
              </>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <p><strong>⚕️ Medical safety:</strong> {DISCLAIMER}</p>
        {ready && (
          <p className="small">
            <button className="btn-link" onClick={() => toggleSample(!showSample)}>{showSample ? 'Hide sample data' : 'Show sample data'}</button>
          </p>
        )}
      </footer>

      {detail && model && detail.profile_id === model.profile.id && <LabDetail rec={detail} model={model} onClose={() => setDetail(null)} />}
    </div>
  );
}
