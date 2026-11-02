const SYSTEM_PROMPT = [
  'Kamu membantu mahasiswa magang menulis logbook harian BINUS dalam Bahasa Indonesia yang formal dan ringkas.',
  'Ubah catatan mentah menjadi deskripsi logbook berupa poin-poin, setiap poin diawali "- " dan kata kerja (Mengembangkan, Memperbaiki, Menganalisis, dll).',
  'Pertahankan semua fakta, nama teknis, angka, dan istilah. Jangan menambah pekerjaan yang tidak disebutkan.',
  'Balas hanya dengan deskripsi, tanpa judul, pembuka, atau penutup.'
].join(' ');

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

  const json: any = await response.json();
  const content = String(json?.choices?.[0]?.message?.content ?? '').trim();
  if (!content) throw new Error('LLM returned empty response');
  return content;
}
