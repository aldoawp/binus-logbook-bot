import * as dotenv from 'dotenv';
import { ActivityData } from './types/bot.js';
import { submitDay, todayInJakarta } from './core/submitDay.js';
import { isParaphraseEnabled, paraphrase, toParagraph } from './core/paraphrase.js';

dotenv.config({ path: '.env', encoding: 'utf8' });

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_CHAT_ID = Number(process.env.TELEGRAM_ALLOWED_CHAT_ID);
if (!TOKEN || !ALLOWED_CHAT_ID) {
  throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_ALLOWED_CHAT_ID in .env');
}

const API = `https://api.telegram.org/bot${TOKEN}`;

type Session =
  | { step: 'idle' }
  | { step: 'title' }
  | { step: 'content'; title: string }
  | { step: 'review'; title: string; raw: string; entry: ActivityData };

let session: Session = { step: 'idle' };
let lastTitle = '';
let busy = false;

async function call(method: string, body: Record<string, unknown>): Promise<any> {
  const response = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const json = await response.json();
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

function send(text: string, extra: Record<string, unknown> = {}) {
  return call('sendMessage', { chat_id: ALLOWED_CHAT_ID, text, ...extra });
}

async function sendPhoto(photo: Buffer, caption: string) {
  const form = new FormData();
  form.append('chat_id', String(ALLOWED_CHAT_ID));
  form.append('caption', caption.slice(0, 1000));
  form.append('photo', new Blob([new Uint8Array(photo)]), 'error.png');
  await fetch(`${API}/sendPhoto`, { method: 'POST', body: form });
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('id-ID', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
}

const REVIEW_KEYBOARD = {
  inline_keyboard: [
    [{ text: '✅ Submit', callback_data: 'submit' }, { text: '🔁 Paraphrase ulang', callback_data: 'redo' }],
    [{ text: '📝 Pakai teks asli', callback_data: 'raw' }, { text: '✖️ Batal', callback_data: 'cancel' }]
  ]
};

async function askTitle() {
  session = { step: 'title' };
  const extra = lastTitle
    ? { reply_markup: { keyboard: [[{ text: lastTitle }]], resize_keyboard: true, one_time_keyboard: true } }
    : {};
  await send(`📅 Logbook ${formatDate(todayInJakarta())}\n\nTitle hari ini apa?`, extra);
}

async function showReview(title: string, raw: string, description: string) {
  const entry: ActivityData = { date: todayInJakarta(), activity: title, description: toParagraph(description) };
  session = { step: 'review', title, raw, entry };
  await send([
    `📅 ${formatDate(entry.date)}`,
    `🕗 ${process.env.CLOCK_IN_TIME} - ${process.env.CLOCK_OUT_TIME}`,
    `📌 Title: ${title}`,
    '',
    entry.description,
    '',
    'Balas "submit" untuk kirim ke logbook, atau ketik ulang isinya untuk mengganti.'
  ].join('\n'), { reply_markup: REVIEW_KEYBOARD });
}

async function processContent(title: string, raw: string) {
  if (!isParaphraseEnabled()) {
    await showReview(title, raw, raw);
    return;
  }
  await call('sendChatAction', { chat_id: ALLOWED_CHAT_ID, action: 'typing' }).catch(() => undefined);
  try {
    await showReview(title, raw, await paraphrase(title, raw));
  } catch (error) {
    await send(`⚠️ Paraphrase gagal (${error instanceof Error ? error.message : String(error)}). Pakai teks asli.`);
    await showReview(title, raw, raw);
  }
}

async function runSubmit(entry: ActivityData) {
  if (busy) {
    await send('Masih memproses submit sebelumnya, tunggu sebentar.');
    return;
  }
  busy = true;
  session = { step: 'idle' };
  if (entry.activity !== 'OFF') lastTitle = entry.activity;
  await send(`⏳ Login ke BINUS dan submit ${entry.date}...`, { reply_markup: { remove_keyboard: true } });
  try {
    const result = await submitDay(entry);
    if (result.ok) {
      await send(`✅ ${result.message}`);
    } else if (result.screenshot) {
      await sendPhoto(result.screenshot, `❌ Gagal: ${result.message}`);
    } else {
      await send(`❌ Gagal: ${result.message}`);
    }
  } catch (error) {
    await send(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    busy = false;
  }
}

async function handleAction(action: string) {
  if (action === 'cancel') {
    session = { step: 'idle' };
    await send('Dibatalkan. Ketik "logbook" untuk mulai lagi.', { reply_markup: { remove_keyboard: true } });
    return;
  }
  if (session.step !== 'review') {
    await send('Tidak ada logbook yang menunggu. Ketik "logbook" untuk mulai.');
    return;
  }
  const { title, raw, entry } = session;
  if (action === 'submit') await runSubmit(entry);
  else if (action === 'redo') await processContent(title, raw);
  else if (action === 'raw') await showReview(title, raw, raw);
}

async function handleText(text: string) {
  const command = text.trim().toLowerCase();

  if (/^\/?(start|help)$/.test(command)) {
    await send([
      'Cara pakai:',
      '1. Ketik "logbook"',
      '2. Jawab title hari ini',
      '3. Jawab isi kegiatan hari ini (bebas, nanti dirapikan AI)',
      '4. Cek hasilnya, lalu ketik "submit"',
      '',
      '/off = tandai hari ini OFF',
      '/batal = batalkan',
      'Tanggal otomatis hari ini (WIB), jam dari .env.'
    ].join('\n'));
    return;
  }
  if (/^\/?(logbook|log)$/.test(command)) return askTitle();
  if (/^\/?(batal|cancel)$/.test(command)) return handleAction('cancel');
  if (/^\/?off$/.test(command)) {
    return runSubmit({ date: todayInJakarta(), activity: 'OFF', description: 'OFF' });
  }
  if (/^\/?(submit|logbook submit|kirim)$/.test(command)) return handleAction('submit');

  switch (session.step) {
    case 'title':
      session = { step: 'content', title: text.trim() };
      await send('Isinya apa hari ini? (boleh poin-poin atau cerita bebas)', { reply_markup: { remove_keyboard: true } });
      return;
    case 'content':
    case 'review': {
      const title = session.title;
      await processContent(title, text.trim());
      return;
    }
    default:
      await send('Ketik "logbook" untuk mulai isi logbook hari ini.');
  }
}

async function handleUpdate(update: any) {
  const message = update.message;
  const callback = update.callback_query;
  const chatId = message?.chat?.id ?? callback?.message?.chat?.id;
  if (chatId !== ALLOWED_CHAT_ID) return;

  if (callback) {
    await call('answerCallbackQuery', { callback_query_id: callback.id });
    await call('editMessageReplyMarkup', {
      chat_id: chatId, message_id: callback.message.message_id, reply_markup: { inline_keyboard: [] }
    }).catch(() => undefined);
    await handleAction(String(callback.data));
    return;
  }

  if (typeof message?.text === 'string') await handleText(message.text);
}

async function poll() {
  let offset = 0;
  console.log(`🤖 Telegram bot running (paraphrase: ${isParaphraseEnabled() ? process.env.LLM_MODEL : 'off'})`);
  for (;;) {
    try {
      const updates = await call('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] });
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update).catch(error => console.error('❌ Update failed:', error));
      }
    } catch (error) {
      console.error('❌ Polling error:', error instanceof Error ? error.message : error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

poll();
