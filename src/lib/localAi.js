// Optional on-device AI. The model is downloaded once from Hugging Face (through WebLLM) and cached by the
// browser; after that it runs offline on the device's GPU. Lab results are passed to the model in this tab only
// and never leave the device. The library is loaded only when someone turns this feature on.

export const LOCAL_AI_KEY = 'health-insights.local-ai.v1';

// Sizes are WebLLM's published memory requirements, which are close to the download size.
export const LOCAL_MODELS = [
  { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', label: 'Qwen 2.5 1.5B (recommended)', size: 'about 1.6 GB' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B (smallest, fastest)', size: 'about 0.9 GB' },
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B (best answers, slowest)', size: 'about 2.3 GB' },
];

/** True when the browser exposes WebGPU and a usable graphics adapter. */
export async function isLocalAiSupported() {
  try {
    return Boolean(typeof navigator !== 'undefined' && navigator.gpu && (await navigator.gpu.requestAdapter()));
  } catch {
    return false;
  }
}

export function getLocalAiSettings() {
  try {
    const s = JSON.parse(globalThis.localStorage?.getItem(LOCAL_AI_KEY) || '{}');
    return { model: LOCAL_MODELS.some((m) => m.id === s.model) ? s.model : LOCAL_MODELS[0].id, downloaded: Boolean(s.downloaded) };
  } catch {
    return { model: LOCAL_MODELS[0].id, downloaded: false };
  }
}

export function saveLocalAiSettings(settings) {
  try {
    globalThis.localStorage?.setItem(LOCAL_AI_KEY, JSON.stringify(settings));
  } catch {
    // Only a convenience: the model stays in the browser cache either way.
  }
}

/** Downloads (first time) or loads (later) the model. `onProgress` receives { progress: 0..1, text }. */
export async function loadLocalModel(modelId, onProgress) {
  const webllm = await import('@mlc-ai/web-llm');
  const worker = new Worker(new URL('./localAi.worker.js', import.meta.url), { type: 'module' });
  const engine = await webllm.CreateWebWorkerMLCEngine(worker, modelId, { initProgressCallback: onProgress });
  return { engine, worker };
}

export async function deleteLocalModel(modelId) {
  const webllm = await import('@mlc-ai/web-llm');
  await webllm.deleteModelAllInfoInCache(modelId);
}

/** A compact, factual summary of one profile's data for the model to answer from. */
export function buildContext(model) {
  const lines = [`Person: ${model.profile.name}. Latest results collected ${model.latestDate || 'on an unknown date'}.`];
  lines.push('Lab results (latest value, status from the lab range, lab range):');
  for (const r of model.labRecords) {
    if (r.value === null || r.value === undefined) continue;
    lines.push(`- ${r.test_name}: ${r.value}${r.unit ? ` ${r.unit}` : ''}, ${r.status}, range ${r.range_text}${r.previous_value != null ? `, previous ${r.previous_value}` : ''}`);
  }
  const findings = model.healthInsights.findings.filter((f) => !f.lowConcern);
  if (findings.length) lines.push(`Findings from the rule engine: ${findings.map((f) => `${f.title} (${f.level})`).join('; ')}.`);
  if (model.progress.length) lines.push(`Changes since the previous report: ${model.progress.map((p) => p.text).join(' ')}`);
  const p = model.preferences;
  lines.push(`Food preferences: diet ${p.diet}, cuisine ${p.cuisine}${p.avoid.length ? `, avoids ${p.avoid.join(', ')}` : ''}.`);
  const top = model.foodRecommendations.top10.map((f) => f.name);
  if (top.length) lines.push(`Top suggested foods from the app: ${top.join(', ')}.`);
  return lines.join('\n');
}

export const SYSTEM_PROMPT = [
  'You help a person understand their own blood test results in plain language.',
  'Use only the data provided below. If something is not in the data, say it is not in the results.',
  'Never diagnose, never suggest starting or changing medicines or doses, and recommend talking to a clinician about anything out of range.',
  'Respect the food preferences: do not suggest foods that conflict with the diet or the items to avoid.',
  'Answer in under 150 words, in short paragraphs or a short list.',
].join(' ');

/** Streams an answer. `onToken` receives the text so far. */
export async function askLocalModel(engine, model, question, onToken) {
  const stream = await engine.chat.completions.create({
    stream: true,
    temperature: 0.3,
    max_tokens: 400,
    messages: [
      { role: 'system', content: `${SYSTEM_PROMPT}\n\n${buildContext(model)}` },
      { role: 'user', content: question },
    ],
  });
  let text = '';
  for await (const chunk of stream) {
    text += chunk.choices[0]?.delta?.content || '';
    onToken(text);
  }
  return text;
}
