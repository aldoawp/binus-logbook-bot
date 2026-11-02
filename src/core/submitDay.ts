import LoginBot from './login.js';
import ActivityBot from './bot.js';
import { ActivityData, BotConfig } from '../types/bot.js';
import { MONTH_NUMBER, getMonthName, getSemesterCode } from '../utils/mapping.js';

export interface SubmitDayResult {
  ok: boolean;
  message: string;
  screenshot?: Buffer;
}

export function todayInJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
}

function monthKeyFromDate(date: string): string {
  const month = Number(date.slice(5, 7));
  return Object.keys(MONTH_NUMBER).find(key => MONTH_NUMBER[key] === month)!;
}

export function buildDayConfig(date: string): BotConfig {
  const monthKey = monthKeyFromDate(date);
  return {
    clockInTime: process.env.CLOCK_IN_TIME || '08:00 am',
    clockOutTime: process.env.CLOCK_OUT_TIME || '05:00 pm',
    excelFilePath: '',
    logbookMonth: getMonthName(monthKey),
    logbookMonthNumber: MONTH_NUMBER[monthKey],
    internshipSemester: process.env.SEMESTER_CODE || getSemesterCode(process.env.INTERNSHIP_SEMESTER || 'ODD'),
    dryRun: false,
    onlyDates: [date]
  };
}

export async function submitDay(entry: ActivityData): Promise<SubmitDayResult> {
  const loginBot = new LoginBot();
  try {
    if (!(await loginBot.login())) {
      return { ok: false, message: 'Login BINUS gagal (cek EMAIL/PASSWORD atau MFA).' };
    }

    const page = loginBot.getPage()!;
    const activityBot = new ActivityBot(page, buildDayConfig(entry.date));

    try {
      await activityBot.navigateToActivityPage();
      await activityBot.submitRows([entry]);
    } catch (error) {
      const screenshot = await page.screenshot().catch(() => undefined);
      return { ok: false, message: error instanceof Error ? error.message : String(error), screenshot };
    }

    const state = activityBot.getState();
    if (state.processedDates.includes(entry.date)) {
      return { ok: true, message: `Tersimpan untuk ${entry.date}` };
    }
    const reason = [...state.errors, ...state.skippedDates].join('\n') || 'Tidak ada baris yang tersimpan';
    const screenshot = await page.screenshot().catch(() => undefined);
    return { ok: false, message: reason, screenshot };
  } finally {
    await loginBot.close();
  }
}
