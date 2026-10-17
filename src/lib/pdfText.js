// Extracts printed lines from a text-based PDF, entirely in the browser (nothing is uploaded anywhere).
// Items on the same baseline are joined; wide gaps become two spaces so table columns stay separable.

export function itemsToLines(items) {
  const rows = [];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = it.transform[4], y = it.transform[5];
    const h = Math.abs(it.transform[3]) || it.height || 8;
    let row = rows.find((r) => Math.abs(r.y - y) < h * 0.45);
    if (!row) { row = { y, h, items: [] }; rows.push(row); }
    row.items.push({ x, w: it.width, str: it.str });
  }
  rows.sort((a, b) => b.y - a.y);
  return rows.map((r) => {
    r.items.sort((a, b) => a.x - b.x);
    let out = '', end = null;
    for (const it of r.items) {
      if (end !== null) {
        const gap = it.x - end;
        out += gap > r.h * 0.9 ? '    ' : gap > r.h * 0.15 ? ' ' : '';
      }
      out += it.str;
      end = it.x + (it.w || it.str.length * r.h * 0.5);
    }
    return out.replace(/\s+$/, '');
  });
}

export async function pdfToLines(arrayBuffer) {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  const lines = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    lines.push(...itemsToLines(content.items));
  }
  return lines;
}
