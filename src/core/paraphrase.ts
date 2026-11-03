const SYSTEM_PROMPT = [
  'Kamu membantu mahasiswa magang menulis logbook harian BINUS dalam Bahasa Indonesia yang formal dan ringkas.',
  'Ubah catatan mentah menjadi deskripsi logbook berupa SATU paragraf utuh yang mengalir, tanpa poin, tanpa tanda "-", tanpa penomoran, tanpa baris baru, dan tanpa format markdown.',
  'Gunakan kalimat aktif dengan kata kerja (mengembangkan, memperbaiki, menganalisis, dll).',
  'Pertahankan semua fakta, nama teknis, angka, dan istilah. Jangan menambah pekerjaan yang tidak disebutkan.',
  'Balas hanya dengan paragraf deskripsi, tanpa judul, pembuka, atau penutup.'
].join(' ');

// Force a single plain paragraph: strip list markers/markdown and join lines into sentences
export function toParagraph(text: string): string {
  return text
    .replace(/[`*_#]/g, '')
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*(?:[-–•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .map(line => (/[.!?:;,]$/.test(line) ? line : `${line}.`))
    .map(line => line.charAt(0).toUpperCase() + line.slice(1))
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Some routers stream SSE ("data: {...}") even when stream=false, so accept both formats
export function extractContent(body: string): string {
  const trimmed = body.trim();
  if (!trimmed.startsWith('data:')) {
    return String(JSON.parse(trimmed)?.choices?.[0]?.message?.content ?? '').trim();
  }
  return trimmed
    .split('\n')
    .filter(line => line.startsWith('data:') && !line.includes('[DONE]'))
    .map(line => {
      try {
        return JSON.parse(line.slice(5))?.choices?.[0]?.delta?.content ?? '';
      } catch {
        return '';
      }
    })
    .join('')
    .trim();
}

export function isParaphraseEnabled(): boolean {
  return !!process.env.LLM_BASE_URL && !!process.env.LLM_MODEL;
}

export async function paraphrase(title: string, rawText: string): Promise<string> {
  const baseUrl = process.env.LLM_BASE_URL!.replace(/\/+$/, '');
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.LLM_API_KEY ? { Authorization: `Bearer ${process.env.LLM_API_KEY}` } : {})
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      temperature: 0.3,
      stream: false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Project: ${title}\n\nCatatan hari ini:\n${rawText}` }
      ]
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    throw new Error(`LLM HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }

  const content = toParagraph(extractContent(await response.text()));
  if (!content) throw new Error('LLM returned empty response');
  return content;
}
