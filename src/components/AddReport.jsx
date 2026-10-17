import React from 'react';
import { Card, SectionTitle, fmtDate } from './ui.jsx';
import { parseReportLines, suggestProfile, toLabRecords } from '../lib/reportParser.js';
import { extractRawRecords, resolveMarker, normalizeProfileData, computeStatus, referenceRule } from '../lib/normalize.js';
import { loadProfileFiles, uploadedFilesFor } from '../lib/loadData.js';
import { saveReport, deleteReport, saveProfile, newId } from '../lib/storage.js';
import { createProfile, displayNameFromReport } from '../lib/profiles.js';

const UNASSIGNED = 'unassigned';
const NEW_PROFILE = '__new__';

/** Reads one file into a draft: rows to review + what the report says about whose it is. */
async function readFile(file) {
  const name = file.name;
  if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
    const { pdfToLines } = await import('../lib/pdfText.js');
    const lines = await pdfToLines(await file.arrayBuffer());
    const parsed = parseReportLines(lines);
    if (!parsed.records.length) {
      throw new Error(lines.join('').trim().length < 20
        ? 'This PDF has no readable text (it may be a scanned image). Try the lab portal\'s downloadable PDF, or enter values as CSV/JSON.'
        : 'No lab results were recognized in this PDF.');
    }
    return { kind: 'PDF', fileName: name, ...parsed, rows: parsed.records.map((r) => ({ ...r, include: true })) };
  }
  const raw = extractRawRecords(await file.text(), name);
  const ids = [...new Set(raw.map((r) => String(r.profile_id || '').toLowerCase()).filter(Boolean))];
  if (ids.length > 1) throw new Error(`This file mixes records for ${ids.join(' and ')}. Split it into one file per person.`);
  const dates = raw.map((r) => r.collection_date).filter(Boolean).sort();
  return {
    kind: /\.csv$/i.test(name) ? 'CSV' : 'JSON', fileName: name,
    patientName: raw.find((r) => r.profile_name)?.profile_name || ids[0] || null, fileProfileId: ids[0] || null,
    collectionDate: dates[dates.length - 1] || null, laboratory: raw.find((r) => r.laboratory_name)?.laboratory_name || null,
    reports: [...new Set(raw.map((r) => r.report).filter(Boolean))], fasting: false,
    rows: raw.map((r) => {
      const lo = r.reference_low === '' || r.reference_low == null ? null : Number(r.reference_low);
      const hi = r.reference_high === '' || r.reference_high == null ? null : Number(r.reference_high);
      const v = r.value === '' || r.value == null ? null : isNaN(Number(r.value)) ? String(r.value) : Number(r.value);
      return {
        test_name: r.test_name, marker_id: resolveMarker(r.test_name)?.id || null, value: v,
        notReported: v === null && /not reported/i.test(r.status || ''), unit: r.unit || '', lab_flag: r.lab_flag || null,
        reference_low: lo, reference_high: hi, reference_rule: r.reference_rule || referenceRule({ reference_low: lo, reference_high: hi }),
        range_source: lo != null || hi != null ? 'file' : null, report: r.report || null, collection_date: r.collection_date || null, include: true,
      };
    }),
  };
}

function useProfileRecords(profiles, reports) {
  const cache = React.useRef({});
  const [, force] = React.useState(0);
  const get = (pid) => {
    if (!pid || pid === UNASSIGNED) return [];
    if (cache.current[pid]?.reportsRef === reports) return cache.current[pid].records;
    if (!cache.current[pid]?.loading) {
      const entry = profiles.find((p) => p.id === pid);
      if (!entry) return [];
      cache.current[pid] = { loading: true, records: cache.current[pid]?.records || [] };
      loadProfileFiles(entry).then((files) => {
        const d = normalizeProfileData({ id: entry.id, name: entry.name }, [...files, ...uploadedFilesFor(entry.id, reports)]);
        cache.current[pid] = { records: d.allRecords, reportsRef: reports };
        force((n) => n + 1);
      }).catch(() => {
        // Without existing records the draft still works; it just cannot pre-fill ranges or spot duplicates.
        cache.current[pid] = { records: [], reportsRef: reports };
        force((n) => n + 1);
      });
    }
    return cache.current[pid].records;
  };
  return get;
}

/** Who a new draft should go to: the matching profile, a new profile named after the report, or the profile on screen. */
function defaultOwner(draft, profiles, currentProfileId) {
  const byId = draft.fileProfileId && profiles.some((p) => p.id === draft.fileProfileId) ? draft.fileProfileId : null;
  const suggested = byId || suggestProfile(draft.patientName, profiles);
  if (suggested) return { suggested, pid: suggested };
  if (draft.patientName || !profiles.length) return { suggested: null, pid: NEW_PROFILE };
  return { suggested: null, pid: currentProfileId && profiles.some((p) => p.id === currentProfileId) ? currentProfileId : NEW_PROFILE };
}

function DraftCard({ draft, profiles, currentProfileId, profileRecords, onSaved, onDiscard }) {
  const [{ suggested, pid: initialPid }] = React.useState(() => defaultOwner(draft, profiles, currentProfileId));
  const [pid, setPid] = React.useState(initialPid);
  const [newName, setNewName] = React.useState(displayNameFromReport(draft.patientName));
  const [date, setDate] = React.useState(draft.collectionDate || '');
  const [rows, setRows] = React.useState(draft.rows);
  const [confirmMismatch, setConfirmMismatch] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState(null);
  const profile = profiles.find((p) => p.id === pid);
  const creating = pid === NEW_PROFILE;
  const existing = profileRecords(pid);

  // Fill a missing range from this same person's earlier result for the same test and unit (clearly labeled).
  const view = rows.map((r) => {
    if (r.reference_rule || r.expected || r.notReported || !r.marker_id) return r;
    const prev = [...existing].reverse().find((x) => x.marker_id === r.marker_id && (x.unit || '') === (r.unit || '') && x.reference_rule);
    return prev ? { ...r, reference_low: prev.reference_low, reference_high: prev.reference_high, reference_rule: prev.reference_rule, range_source: 'previous report' } : r;
  });
  const mismatch = draft.patientName && profile && suggested && suggested !== pid;
  const unknownOwner = profile && !suggested;
  const dupCount = view.filter((r) => r.include && existing.some((x) => x.marker_id === r.marker_id && x.collection_date === (r.collection_date || date) && String(x.value) === String(r.value))).length;
  const set = (i, k, v) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const num = (v) => (v === '' ? '' : isNaN(Number(v)) ? v : Number(v));
  const included = view.filter((r) => r.include);
  const canSave = included.length && date && (!creating || newName.trim()) && (!mismatch || confirmMismatch) && (!unknownOwner || confirmMismatch);

  const save = async () => {
    setSaving(true); setErr(null);
    try {
      let target = profile || { id: UNASSIGNED, name: 'Unassigned' };
      if (creating) {
        target = createProfile(newName, { match: [draft.patientName], existingIds: profiles.map((p) => p.id) });
        await saveProfile(target);
      }
      const records = toLabRecords(view, { profile: target, collectionDate: date, laboratory: draft.laboratory, source: `Uploaded Lab Report (${draft.kind})`, fasting: draft.fasting });
      await saveReport({
        id: newId(), profile_id: target.id, file_name: draft.fileName, uploaded_at: new Date().toISOString(),
        collection_date: date, patient_name: draft.patientName, laboratory: draft.laboratory, reports: draft.reports, records,
      });
      onSaved(target, records.length);
    } catch (e) {
      setErr(`Could not save: ${e.message}`);
      setSaving(false);
    }
  };

  return (
    <Card className="draft">
      <div className="draft-head">
        <div>
          <h3>{draft.fileName}</h3>
          <div className="muted small">{draft.kind} · {draft.rows.length} results found{draft.reports.length ? ` · ${draft.reports.join(', ')}` : ''}</div>
        </div>
        <button className="btn-ghost" onClick={onDiscard}>Discard</button>
      </div>

      <div className="draft-meta">
        <div><div className="label">Name on report</div><div>{draft.patientName || <span className="muted">Not found</span>}</div></div>
        <div><div className="label">Laboratory</div><div>{draft.laboratory || <span className="muted">Not found</span>}</div></div>
        <label><div className="label">Collection date</div><input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
        <label><div className="label">Whose report is this?</div>
          <select value={pid} onChange={(e) => { setPid(e.target.value); setConfirmMismatch(false); }}>
            <option value={NEW_PROFILE}>New person…</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}{p.id === suggested ? ' (matches name on report)' : ''}</option>)}
            <option value={UNASSIGNED}>Unassigned (decide later, not analyzed)</option>
          </select>
        </label>
        {creating && (
          <label><div className="label">New person&apos;s name</div>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name for this profile" aria-label="New person's name" />
          </label>
        )}
      </div>
      {creating && <p className="note small">A new profile{newName.trim() ? ` for ${newName.trim()}` : ''} will be created with this report. You can rename or delete it later under Sources.</p>}
      {creating && !newName.trim() && <p className="warn">Enter a name for the new profile.</p>}

      {mismatch && (
        <label className="warn"><input type="checkbox" checked={confirmMismatch} onChange={(e) => setConfirmMismatch(e.target.checked)} /> The name on this report matches {profiles.find((p) => p.id === suggested)?.name}, not {profile?.name}. Tick to confirm it really belongs to {profile?.name}.</label>
      )}
      {unknownOwner && !mismatch && (
        <label className="warn"><input type="checkbox" checked={confirmMismatch} onChange={(e) => setConfirmMismatch(e.target.checked)} /> The report does not show a name that matches {profile?.name}. Tick to confirm it belongs to {profile?.name}, or choose Unassigned.</label>
      )}
      {!date && <p className="warn">Enter the collection date before saving.</p>}
      {dupCount > 0 && <p className="note small">{dupCount} of these results are already on {profile?.name}'s dashboard for this date; they will be merged, not counted twice.</p>}

      <div className="table-wrap">
        <table className="table review">
          <thead><tr><th>Use</th><th>Test (as printed)</th><th>Recognized as</th><th>Value</th><th>Unit</th><th>Range low</th><th>Range high</th><th>Status</th></tr></thead>
          <tbody>
            {view.map((r, i) => {
              const st = computeStatus({ value: r.notReported ? null : r.value, lo: r.reference_low, hi: r.reference_high, rule: r.reference_rule || referenceRule(r), expected: r.expected, fileStatus: r.notReported ? 'NOT REPORTED' : null });
              return (
                <tr key={i} className={r.include ? '' : 'excluded'}>
                  <td data-label="Use"><input type="checkbox" checked={r.include} onChange={(e) => set(i, 'include', e.target.checked)} aria-label={`Include ${r.test_name}`} /></td>
                  <td data-label="Test">{r.test_name}</td>
                  <td data-label="Recognized">{r.marker_id ? resolveMarker(r.test_name)?.short : <span className="muted">Not recognized (Other Tests)</span>}</td>
                  <td data-label="Value">{r.notReported ? <span className="muted">Not reported</span> : <input className="cell" value={r.value ?? ''} onChange={(e) => set(i, 'value', num(e.target.value))} aria-label={`${r.test_name} value`} />}{r.lab_flag && <span className="flag"> {r.lab_flag}</span>}</td>
                  <td data-label="Unit"><input className="cell" value={r.unit} onChange={(e) => set(i, 'unit', e.target.value)} aria-label={`${r.test_name} unit`} /></td>
                  <td data-label="Low"><input className="cell" value={r.reference_low ?? ''} onChange={(e) => { set(i, 'reference_low', e.target.value === '' ? null : num(e.target.value)); set(i, 'reference_rule', null); set(i, 'range_source', 'edited'); }} aria-label={`${r.test_name} range low`} /></td>
                  <td data-label="High"><input className="cell" value={r.reference_high ?? ''} onChange={(e) => { set(i, 'reference_high', e.target.value === '' ? null : num(e.target.value)); set(i, 'reference_rule', null); set(i, 'range_source', 'edited'); }} aria-label={`${r.test_name} range high`} />
                    {r.expected && <div className="muted small">Expected: {r.expected}</div>}
                    {r.range_source === 'report note' && <div className="muted small">From lab comment</div>}
                    {r.range_source === 'previous report' && <div className="warn-text small">Copied from earlier report, please check</div>}
                    {!r.reference_rule && !r.expected && !r.notReported && r.reference_low == null && r.reference_high == null && <div className="warn-text small">No range found</div>}
                  </td>
                  <td data-label="Status"><span className={`pill ${st === 'IN RANGE' ? 'sev-ok' : st === 'HIGH' || st === 'LOW' || st === 'ABNORMAL' ? 'sev-attention' : 'sev-na'}`}>{st === 'IN RANGE' ? 'Normal' : st.charAt(0) + st.slice(1).toLowerCase()}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {err && <p className="warn">{err}</p>}
      <div className="draft-actions">
        <button className="btn" disabled={!canSave || saving} onClick={save}>
          {saving ? 'Saving…' : pid === UNASSIGNED ? `Save ${included.length} results as unassigned` : creating ? `Create ${newName.trim() || 'profile'} and add ${included.length} results` : `Add ${included.length} results to ${profile?.name}`}
        </button>
        <span className="muted small">Check the values against your report before saving.</span>
      </div>
    </Card>
  );
}

export default function AddReport({ profiles, currentProfileId, reports, onChange, showProfile }) {
  const [drafts, setDrafts] = React.useState([]);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const [errors, setErrors] = React.useState([]);
  const [pendingDelete, setPendingDelete] = React.useState(null);
  const [assignTo, setAssignTo] = React.useState({});
  const [drag, setDrag] = React.useState(false);
  const profileRecords = useProfileRecords(profiles, reports);

  const handleFiles = async (files) => {
    setBusy(true); setMsg(null); setErrors([]);
    const out = [], errs = [];
    for (const f of files) {
      try { out.push({ key: newId(), ...(await readFile(f)) }); } catch (e) { errs.push(`${f.name}: ${e.message}`); }
    }
    setDrafts((d) => [...d, ...out]); setErrors(errs); setBusy(false);
  };

  const onSaved = (key) => async (profile, n) => {
    const remaining = drafts.filter((x) => x.key !== key);
    setDrafts(remaining);
    await onChange();
    // With nothing else left to review, go straight to the dashboard the report was added to.
    if (profile.id !== UNASSIGNED && !remaining.length) { showProfile(profile.id); return; }
    setMsg(profile.id === UNASSIGNED
      ? { text: `Saved ${n} results as unassigned. They are not analyzed until you assign them below.` }
      : { text: `Added ${n} results to ${profile.name}'s dashboard. Every tab now includes them.`, profile });
  };

  const assign = async (r) => {
    const pid = assignTo[r.id];
    let p = profiles.find((x) => x.id === pid);
    try {
      if (pid === NEW_PROFILE) {
        p = createProfile(displayNameFromReport(r.patient_name) || r.file_name.replace(/\.[^.]+$/, ''), { match: [r.patient_name], existingIds: profiles.map((x) => x.id) });
        await saveProfile(p);
      }
      if (!p) return;
      await saveReport({ ...r, profile_id: p.id, records: r.records.map((x) => ({ ...x, profile_id: p.id, profile_name: p.name })) });
    } catch (e) {
      setErrors([`Could not assign ${r.file_name}: ${e.message}`]);
      return;
    }
    await onChange();
    setMsg({ text: `Assigned ${r.file_name} to ${p.name}.`, profile: p });
  };
  const remove = async (r) => {
    try {
      await deleteReport(r.id);
    } catch (e) {
      setErrors([`Could not remove ${r.file_name}: ${e.message}`]);
    }
    setPendingDelete(null);
    await onChange();
  };
  const nameOf = (pid) => profiles.find((p) => p.id === pid)?.name || 'Unassigned';
  const sorted = [...reports].sort((a, b) => String(b.uploaded_at).localeCompare(String(a.uploaded_at)));

  return (
    <div className="stack">
      <SectionTitle icon="➕" title="Add a Lab Report" sub="Upload a new report and it flows into every tab: results, status, trends, findings, foods, meal plan and goals. You choose whose report it is and check the values before anything is saved." />

      <label className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles([...e.dataTransfer.files]); }}>
        <input id="report-file" type="file" accept=".pdf,.json,.csv,application/pdf,application/json,text/csv" multiple onChange={(e) => { handleFiles([...e.target.files]); e.target.value = ''; }} />
        <span className="dz-icon" aria-hidden="true">📄</span>
        <strong>{busy ? 'Reading…' : 'Choose files or drop them here'}</strong>
        <span className="muted small">Text-based PDF lab reports, or JSON / CSV in the dashboard's record format. Files are read on this device.</span>
      </label>
      {errors.map((e) => <p key={e} className="warn">{e}</p>)}
      {msg && (
        <div className="success">
          <span>✅ {msg.text}</span>
          {msg.profile && msg.profile.id !== UNASSIGNED && <button className="btn" onClick={() => showProfile(msg.profile.id)}>View {msg.profile.name}'s overview</button>}
        </div>
      )}

      {drafts.map((d) => (
        <DraftCard key={d.key} draft={d} profiles={profiles} currentProfileId={currentProfileId} profileRecords={profileRecords} onSaved={onSaved(d.key)} onDiscard={() => setDrafts((x) => x.filter((y) => y.key !== d.key))} />
      ))}

      <SectionTitle title="Reports added in the app" sub="Saved in this browser on this device only. Clearing site data removes them." />
      {!sorted.length ? <p className="muted">No reports added yet.</p> : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>File</th><th>Profile</th><th>Collected</th><th>Results</th><th>Added</th><th></th></tr></thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td data-label="File"><strong>{r.file_name}</strong>{r.patient_name && <div className="muted small">Name on report: {r.patient_name}</div>}</td>
                  <td data-label="Profile">
                    {r.profile_id === UNASSIGNED ? (
                      <div className="assign">
                        <span className="pill sev-na">Unassigned</span>
                        <select value={assignTo[r.id] || ''} onChange={(e) => setAssignTo((a) => ({ ...a, [r.id]: e.target.value }))} aria-label="Assign to">
                          <option value="">Assign to…</option>
                          <option value={NEW_PROFILE}>New person{r.patient_name ? ` (${displayNameFromReport(r.patient_name)})` : ''}</option>
                          {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <button className="btn-ghost" disabled={!assignTo[r.id]} onClick={() => assign(r)}>Assign</button>
                      </div>
                    ) : nameOf(r.profile_id)}
                  </td>
                  <td data-label="Collected">{fmtDate(r.collection_date)}</td>
                  <td data-label="Results" className="num">{r.records.length}</td>
                  <td data-label="Added">{fmtDate(String(r.uploaded_at).slice(0, 10))}</td>
                  <td data-label="">
                    {pendingDelete === r.id
                      ? <span className="confirm-row">Remove from dashboard? <button className="btn-danger" onClick={() => remove(r)}>Remove</button> <button className="btn-ghost" onClick={() => setPendingDelete(null)}>Keep</button></span>
                      : <button className="btn-ghost" onClick={() => setPendingDelete(r.id)}>Remove</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
