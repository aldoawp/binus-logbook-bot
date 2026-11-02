import { Page, Response } from 'playwright';
import { BOT_LOCATORS } from '../constant/locator.js';
import { ActivityData, BotConfig, BotState, LogBookEntry, LogBookSavePayload } from '../types/bot.js';
import { EMPTY_ID, saveLogBookEntry } from './api.js';
import XLSX from 'xlsx';

class ActivityBot {
  private page: Page;
  private config: BotConfig;
  private state: BotState;
  private excelData: ActivityData[] = [];
  // Logbook entries captured from the LMS list response, keyed by date (YYYY-MM-DD)
  private logBookEntries = new Map<string, LogBookEntry>();
  private listIsPaged = false;

  constructor(page: Page, config: BotConfig) {
    this.page = page;
    this.config = config;
    this.state = {
      currentRow: 0,
      totalRows: 0,
      processedDates: [],
      skippedDates: [],
      errors: []
    };
  }

  /**
   * Convert an Excel date cell (serial number or YYYY-MM-DD text) to YYYY-MM-DD
   */
  private parseExcelDate(value: unknown): string | null {
    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
    const match = String(value ?? '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return null;
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  /**
   * Load Excel data from file
   */
  private async loadExcelData(): Promise<void> {
    try {
      const workbook = XLSX.readFile(this.config.excelFilePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Date is in column A, Activity in column B, Description in column C
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: ['date', 'activity', 'description'],
        range: 1, // Skip header row (row 1), start from row 2
        raw: true // Keep dates as serial numbers to avoid timezone shifts
      });

      this.excelData = [];
      jsonData.forEach((row: any, index: number) => {
        // Only include rows with both activity and description
        if (!row.activity || !row.description) return;

        const date = this.parseExcelDate(row.date);
        if (!date) {
          this.state.errors.push(`Excel row ${index + 2}: invalid or missing date in column A`);
          return;
        }

        this.excelData.push({
          date,
          activity: row.activity.toString().trim(),
          description: row.description.toString().trim()
        });
      });

      this.state.totalRows = this.excelData.length;

      console.log(`📊 Loaded ${this.excelData.length} activities from Excel`);
    } catch (error) {
      console.error('❌ Failed to load Excel data:', error);
      throw error;
    }
  }

  /**
   * Capture the logbook list ("data": [...]) the LMS loads when a month tab is opened
   */
  private async captureLogBookList(response: Response): Promise<void> {
    if (!(response.headers()['content-type'] || '').includes('application/json')) return;

    try {
      const body = await response.json();
      if (!Array.isArray(body?.data)) return;

      const entries = (body.data as LogBookEntry[]).filter(entry => entry?.logBookHeaderID && entry?.date);
      if (entries.length === 0) return;

      // Server-side paging would hide entries and cause duplicates, so detect it
      const total = body.recordsTotal ?? body.recordsFiltered;
      if (typeof total === 'number' && total > body.data.length) {
        this.listIsPaged = true;
      }

      entries.forEach(entry => this.logBookEntries.set(entry.date.slice(0, 10), entry));
    } catch (error) {
      // Not the response we are looking for
    }
  }

  /**
   * Get captured logbook entries for the configured month
   */
  private getMonthEntries(): LogBookEntry[] {
    return [...this.logBookEntries.values()]
      .filter(entry => Number(entry.date.slice(5, 7)) === this.config.logbookMonthNumber);
  }

  /**
   * Phase 1: Navigate to the activity page
   */
  public async navigateToActivityPage(): Promise<void> {
    try {
      this.page.on('response', response => this.captureLogBookList(response));

      // Step 1: Wait for dashboard to load
      await this.page.waitForLoadState('domcontentloaded'); // Faster than networkidle

      // Step 2: Click semester dropdown
      await this.page.waitForSelector(BOT_LOCATORS.SEMESTER_DROPDOWN, { timeout: 15000 });
      await this.page.click(BOT_LOCATORS.SEMESTER_DROPDOWN);
      await this.page.waitForTimeout(2000);

      // Step 3: Select semester based on configuration
      const semesterSelector = `div.menu.transition div.item[data-value="${this.config.internshipSemester}"]`;
      try {
        await this.page.waitForSelector(semesterSelector, { timeout: 5000 });
      } catch (error) {
        const options = await this.page.$$eval('div.menu.transition div.item[data-value]', items =>
          items.map(item => `${item.getAttribute('data-value')} = ${item.textContent?.trim()}`)
        );
        throw new Error(
          `Semester code ${this.config.internshipSemester} not found. Set SEMESTER_CODE in .env to one of:\n   ${options.join('\n   ')}`
        );
      }
      await this.page.click(semesterSelector);
      await this.page.waitForTimeout(1000); // Short wait instead of full page load

      // Step 4: Click "Go to Activity Enrichment Apps" button
      await this.page.waitForSelector(BOT_LOCATORS.ACTIVITY_BUTTON, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.ACTIVITY_BUTTON);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load

      // Step 5: Click account tile
      await this.page.waitForSelector(BOT_LOCATORS.ACCOUNT_TILE, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.ACCOUNT_TILE);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load

      // Step 6: Click Logbook tab
      await this.page.waitForSelector(BOT_LOCATORS.LOGBOOK_TAB, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.LOGBOOK_TAB);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load

      // Step 7: Click logbook month tab based on configuration
      const monthTabSelector = `a[onclick*="tabClick"][href="#"]:has-text("${this.config.logbookMonth}")`;
      await this.page.waitForSelector(monthTabSelector, { timeout: 10000 });
      await this.page.click(monthTabSelector);

      // Step 8: Wait until the logbook list for this month has been captured
      for (let i = 0; i < 30 && this.getMonthEntries().length === 0; i++) {
        await this.page.waitForTimeout(500);
      }
      if (this.getMonthEntries().length === 0) {
        throw new Error(`Could not capture the ${this.config.logbookMonth} logbook list from the LMS`);
      }

      console.log(`✅ Navigation completed (${this.getMonthEntries().length} logbook rows found for ${this.config.logbookMonth})`);

    } catch (error) {
      console.error('❌ Navigation failed:', error);
      throw error;
    }
  }

  /**
   * Build the StudentSave payload for one Excel row
   */
  private buildPayload(activityData: ActivityData, headerId: string, existing?: LogBookEntry): LogBookSavePayload {
    const isOffDay =
      activityData.activity.toUpperCase() === 'OFF' ||
      activityData.description.toUpperCase() === 'OFF';

    const existingId = existing?.id && existing.id !== EMPTY_ID ? existing.id : EMPTY_ID;

    return {
      id: existingId,
      logBookHeaderID: headerId,
      date: `${activityData.date}T00:00:00`,
      activity: isOffDay ? 'OFF' : activityData.activity,
      clockIn: isOffDay ? 'OFF' : this.config.clockInTime.toUpperCase(),
      clockOut: isOffDay ? 'OFF' : this.config.clockOutTime.toUpperCase(),
      description: isOffDay ? 'OFF' : activityData.description,
      flagjulyactive: existing?.flagjulyactive ?? false
    };
  }

  /**
   * Phase 2: Submit all activity entries via LogBook/StudentSave
   */
  public async fillAllActivities(): Promise<void> {
    await this.loadExcelData();
    await this.submitRows(this.excelData);
  }

  /**
   * Submit the given rows via LogBook/StudentSave, matched to the LMS list by date
   */
  public async submitRows(inputRows: ActivityData[]): Promise<void> {
    try {
      if (this.listIsPaged) {
        throw new Error('The LMS logbook list is paged, so existing entries cannot be matched safely');
      }

      const monthEntries = this.getMonthEntries();
      const headerIds = new Set(monthEntries.map(entry => entry.logBookHeaderID));
      if (headerIds.size !== 1) {
        throw new Error(`Expected one LogBookHeaderID for ${this.config.logbookMonth}, found ${headerIds.size}`);
      }
      const headerId = [...headerIds][0];

      const rows = inputRows.filter(row =>
        this.config.onlyDates.length === 0 || this.config.onlyDates.includes(row.date)
      );

      console.log(`🔄 Processing ${rows.length} activities${this.config.dryRun ? ' (DRY RUN - nothing will be submitted)' : ''}...`);

      const preview: object[] = [];

      for (let i = 0; i < rows.length; i++) {
        const activityData = rows[i];
        this.state.currentRow = i + 1;

        try {
          if (Number(activityData.date.slice(5, 7)) !== this.config.logbookMonthNumber) {
            this.state.skippedDates.push(`${activityData.date} (not in ${this.config.logbookMonth})`);
            preview.push({ date: activityData.date, action: 'SKIP: other month' });
            continue;
          }

          const existing = this.logBookEntries.get(activityData.date);

          if (!existing) {
            console.log(`⚠️ ${activityData.date} not found in LMS list, it will be created as a new entry`);
          }

          const payload = this.buildPayload(activityData, headerId, existing);

          preview.push({
            date: activityData.date,
            action: payload.id === EMPTY_ID ? 'NEW' : 'UPDATE',
            clockIn: payload.clockIn,
            clockOut: payload.clockOut,
            activity: payload.activity.slice(0, 40)
          });

          if (this.config.dryRun) continue;

          const status = await saveLogBookEntry(this.page, payload);
          console.log(`✅ ${activityData.date}: ${status}`);
          this.state.processedDates.push(activityData.date);

        } catch (error) {
          console.error(`❌ Failed to process ${activityData.date}:`, error);
          this.state.errors.push(`${activityData.date}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      console.table(preview);
      if (this.config.dryRun) {
        console.log('🧪 DRY RUN: nothing was submitted. Set DRY_RUN=false in .env to submit the rows above.');
      } else {
        console.log(`✅ Processed ${this.state.processedDates.length} activities`);
      }

    } catch (error) {
      console.error('❌ Activity filling failed:', error);
      throw error;
    }
  }

  /**
   * Get current bot state
   */
  public getState(): BotState {
    return this.state;
  }

  /**
   * Get processed dates
   */
  public getProcessedDates(): string[] {
    return this.state.processedDates;
  }

  /**
   * Get errors
   */
  public getErrors(): string[] {
    return this.state.errors;
  }
}

export default ActivityBot;
