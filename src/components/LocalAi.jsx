import React from 'react';
import { Card } from './ui.jsx';
import { LOCAL_MODELS, isLocalAiSupported, getLocalAiSettings, saveLocalAiSettings, loadLocalModel, deleteLocalModel } from '../lib/localAi.js';

// The loaded engine is shared across tabs and profiles for the life of the page, so it loads only once.
let shared = { status: 'idle', engine: null, worker: null, progress: 0, text: '', error: null, enabled: true, model: null };
const listeners = new Set();
const set = (patch) => { shared = { ...shared, ...patch }; listeners.forEach((l) => l(shared)); };

export function useLocalAi() {
  const [state, setState] = React.useState(shared);
  React.useEffect(() => { listeners.add(setState); return () => listeners.delete(setState); }, []);
  return state;
}

async function start(modelId) {
  set({ status: 'loading', progress: 0, text: 'Starting…', error: null, model: modelId });
  try {
    const { engine, worker } = await loadLocalModel(modelId, (p) => set({ progress: p.progress ?? 0, text: p.text || '' }));
    saveLocalAiSettings({ model: modelId, downloaded: true });
    set({ status: 'ready', engine, worker, enabled: true });
  } catch (e) {
    const message = e?.message || String(e);
    set({ status: 'error', error: /fetch|network/i.test(message) ? 'the model could not be downloaded. The first start needs an internet connection; check it and try again.' : message });
  }
}

function stop() {
  shared.worker?.terminate();
  set({ status: 'idle', engine: null, worker: null, progress: 0, text: '' });
}

async function remove(modelId) {
  stop();
  await deleteLocalModel(modelId).catch(() => {});
  saveLocalAiSettings({ model: modelId, downloaded: false });
  set({});
}

/** Settings card for the optional on-device AI in the Ask tab. */
export default function LocalAiPanel() {
  const ai = useLocalAi();
  const [settings, setSettings] = React.useState(getLocalAiSettings);
  const [supported, setSupported] = React.useState(null);
  React.useEffect(() => { isLocalAiSupported().then(setSupported); }, []);
  const chosen = LOCAL_MODELS.find((m) => m.id === settings.model) || LOCAL_MODELS[0];

  if (supported === null) return null;
  if (!supported) {
    return (
      <Card className="local-ai">
        <h3>On-device AI (optional)</h3>
        <p className="small muted">This browser does not support WebGPU, so the on-device AI cannot run here. Recent versions of Chrome or Edge on a computer with a modern graphics chip usually work. The answers above still work everywhere.</p>
      </Card>
    );
  }

  return (
    <Card className="local-ai">
      <h3>On-device AI (optional)</h3>
      <p className="small">Adds a free-form AI answer under each rule-based answer. The model is downloaded once and stored in this browser, then runs on this device, offline. Your results are never sent anywhere.</p>
      {ai.status === 'ready' ? (
        <>
          <label className="small"><input type="checkbox" checked={ai.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Also answer with {LOCAL_MODELS.find((m) => m.id === ai.model)?.label || 'the on-device model'}</label>
          <p className="muted tiny">AI answers can be wrong. They are labeled, and the rule-based answer is always shown first.</p>
          <div className="chip-row">
            <button type="button" className="btn-ghost" onClick={stop}>Turn off</button>
            <button type="button" className="btn-link small" onClick={() => remove(ai.model).then(() => setSettings(getLocalAiSettings()))}>Delete the downloaded model</button>
          </div>
        </>
      ) : ai.status === 'loading' ? (
        <>
          <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ai.progress * 100)}><span style={{ width: `${Math.round(ai.progress * 100)}%` }} /></div>
          <p className="muted tiny">{ai.text}</p>
        </>
      ) : (
        <>
          <label className="small">Model{' '}
            <select value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })}>
              {LOCAL_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}, {m.size}</option>)}
            </select>
          </label>
          <div className="chip-row">
            <button type="button" className="btn" onClick={() => start(settings.model)}>{settings.downloaded && settings.model === chosen.id ? 'Start on-device AI' : `Download and start (${chosen.size}, one time)`}</button>
          </div>
          <p className="muted tiny">The first start downloads the model from Hugging Face and needs an internet connection. Later starts load it from this browser and work offline.</p>
          {ai.status === 'error' && <p className="small error-text">Could not start the model: {ai.error}</p>}
        </>
      )}
    </Card>
  );
}
