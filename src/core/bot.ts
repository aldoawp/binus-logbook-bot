import { Page } from 'playwright';
import { BOT_LOCATORS } from '../constant/locator.js';
import { ActivityData, BotConfig, BotState } from '../types/bot.js';
import XLSX from 'xlsx';

class ActivityBot {
  private page: Page;
  private config: BotConfig;
  private state: BotState;
  private excelData: ActivityData[] = [];

  constructor(page: Page, config: BotConfig) {
    this.page = page;
    this.config = config;
    this.state = {
      currentRow: 0,
      totalRows: 0,
      processedDates: [],
      errors: []
    };
  }

  /**
   * Load Excel data from file
   */
  private async loadExcelData(): Promise<void> {
    console.log('📊 Loading Excel data...');
    
    try {
      const workbook = XLSX.readFile(this.config.excelFilePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON, starting from row 2 (A2, B2, etc.)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: ['activity', 'description'],
        range: 1 // Skip header row
      });
      
      this.excelData = jsonData as ActivityData[];
      this.state.totalRows = this.excelData.length;
      
      console.log(`✅ Loaded ${this.excelData.length} rows from Excel`);
    } catch (error) {
      console.error('❌ Failed to load Excel data:', error);
      throw error;
    }
  }

  /**
   * Phase 1: Navigate to the activity page
   */
  public async navigateToActivityPage(): Promise<void> {
    console.log('🚀 Phase 1: Navigating to activity page...');
    
    try {
      // Step 1: Wait for dashboard to load
      console.log('📍 Step 1: Waiting for dashboard to load...');
      await this.page.waitForLoadState('domcontentloaded'); // Faster than networkidle
      
      // Debug: Take screenshot and log current URL
      console.log(`📍 Current URL: ${this.page.url()}`);
      await this.page.screenshot({ path: 'debug-dashboard.png' });
      
      // Step 2: Click semester dropdown
      console.log('📍 Step 2: Clicking semester dropdown...');
      await this.page.waitForSelector(BOT_LOCATORS.SEMESTER_DROPDOWN, { timeout: 15000 });
      await this.page.click(BOT_LOCATORS.SEMESTER_DROPDOWN);
      await this.page.waitForTimeout(2000);
      
      // Step 3: Select Odd Semester 2025/2026
      console.log('📍 Step 3: Selecting Odd Semester 2025/2026...');
      await this.page.waitForSelector(BOT_LOCATORS.SEMESTER_OPTION_ODD, { timeout: 5000 });
      await this.page.click(BOT_LOCATORS.SEMESTER_OPTION_ODD);
      await this.page.waitForTimeout(1000); // Short wait instead of full page load
      
      // Step 4: Click "Go to Activity Enrichment Apps" button
      console.log('📍 Step 4: Clicking Activity button...');
      await this.page.waitForSelector(BOT_LOCATORS.ACTIVITY_BUTTON, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.ACTIVITY_BUTTON);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      // Step 5: Click account tile
      console.log('📍 Step 5: Clicking account tile...');
      await this.page.waitForSelector(BOT_LOCATORS.ACCOUNT_TILE, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.ACCOUNT_TILE);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      // Step 6: Click Logbook tab
      console.log('📍 Step 6: Clicking Logbook tab...');
      await this.page.waitForSelector(BOT_LOCATORS.LOGBOOK_TAB, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.LOGBOOK_TAB);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      // Step 7: Click September tab
      console.log('📍 Step 7: Clicking September tab...');
      await this.page.waitForSelector(BOT_LOCATORS.SEPTEMBER_TAB, { timeout: 10000 });
      await this.page.click(BOT_LOCATORS.SEPTEMBER_TAB);
      await this.page.waitForTimeout(2000); // Short wait instead of full page load
      
      console.log('✅ Phase 1 completed: Successfully navigated to activity page');
      
    } catch (error) {
      console.error('❌ Phase 1 failed:', error);
      throw error;
    }
  }

  /**
   * Extract day from date string (e.g., "Tue, 02 Sep 2025" -> "Tue")
   */
  private extractDayFromDate(dateText: string): string {
    return dateText.split(' ')[0];
  }

  /**
   * Click element with fallback locators
   */
  private async clickWithFallback(selectors: string[], elementName: string): Promise<void> {
    let clicked = false;
    
    for (let i = 0; i < selectors.length; i++) {
      try {
        console.log(`📍 Trying ${elementName} selector ${i + 1}/${selectors.length}: ${selectors[i]}`);
        // Wait for element to be visible and enabled (faster than full page load)
        await this.page.waitForSelector(selectors[i], { 
          timeout: 2000, // Reduced timeout for faster execution
          state: 'visible' 
        });
        await this.page.click(selectors[i]);
        console.log(`✅ Successfully clicked ${elementName} with selector ${i + 1}`);
        clicked = true;
        break;
      } catch (error) {
        console.log(`⚠️ Selector ${i + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
        // Try next selector
      }
    }
    
    if (!clicked) {
      // Take screenshot for debugging
      await this.page.screenshot({ path: `debug-${elementName.toLowerCase().replace(' ', '-')}-failed.png` });
      throw new Error(`Could not find ${elementName} with any of the ${selectors.length} selectors`);
    }
  }

  /**
   * Fill activity form for a specific row
   */
  private async fillActivityForm(rowIndex: number): Promise<void> {
    console.log(`📝 Filling activity form for row ${rowIndex + 1}...`);
    
    try {
      // Get activity data from Excel
      const activityData = this.excelData[rowIndex];
      if (!activityData) {
        throw new Error(`No activity data found for row ${rowIndex + 1}`);
      }
      
      // Fill clock in time - set value directly without triggering popup
      console.log(`⏰ Setting clock in time to ${this.config.clockInTime}...`);
      await this.page.evaluate(({ selector, value }) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.removeAttribute('readonly');
          element.value = value;
          // Trigger input event to ensure the value is properly set
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { selector: BOT_LOCATORS.CLOCK_IN_INPUT, value: this.config.clockInTime });
      
      // Fill clock out time - set value directly without triggering popup
      console.log(`⏰ Setting clock out time to ${this.config.clockOutTime}...`);
      await this.page.evaluate(({ selector, value }) => {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.removeAttribute('readonly');
          element.value = value;
          // Trigger input event to ensure the value is properly set
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, { selector: BOT_LOCATORS.CLOCK_OUT_INPUT, value: this.config.clockOutTime });
      
      // Fill activity title
      console.log(`📋 Setting activity: ${activityData.activity}...`);
      await this.page.fill(BOT_LOCATORS.ACTIVITY_INPUT, activityData.activity);
      
      // Fill description
      console.log(`📄 Setting description: ${activityData.description}...`);
      await this.page.fill(BOT_LOCATORS.DESCRIPTION_TEXTAREA, activityData.description);
      
      // Submit form with fallback locators
      console.log('💾 Submitting form...');
      await this.clickWithFallback(BOT_LOCATORS.SUBMIT_BUTTON_FALLBACKS, 'Submit button');
      await this.page.waitForTimeout(1500); // Reduced wait time for faster execution
      
      // Ensure modal is fully closed before proceeding (with shorter timeout)
      try {
        await this.page.waitForSelector('.fancybox-overlay', { state: 'hidden', timeout: 2000 });
      } catch (error) {
        // Modal might already be closed, continue
      }
      
      console.log(`✅ Successfully filled and submitted form for row ${rowIndex + 1}`);
      
    } catch (error) {
      console.error(`❌ Failed to fill form for row ${rowIndex + 1}:`, error);
      throw error;
    }
  }

  /**
   * Handle Saturday (OFF) entries
   */
  private async handleSaturdayEntry(): Promise<void> {
    console.log('📅 Handling Saturday entry (OFF)...');
    
    try {
      // Click OFF button with fallback locators
      console.log('🔘 Clicking OFF button...');
      await this.clickWithFallback(BOT_LOCATORS.OFF_BUTTON_FALLBACKS, 'OFF button');
      await this.page.waitForTimeout(1000);
      
      // Submit form with fallback locators
      console.log('💾 Submitting OFF form...');
      await this.clickWithFallback(BOT_LOCATORS.SUBMIT_BUTTON_FALLBACKS, 'Submit button');
      await this.page.waitForTimeout(1500); // Reduced wait time for faster execution
      
      // Ensure modal is fully closed before proceeding (with shorter timeout)
      try {
        await this.page.waitForSelector('.fancybox-overlay', { state: 'hidden', timeout: 2000 });
      } catch (error) {
        // Modal might already be closed, continue
      }
      
      console.log('✅ Successfully handled Saturday entry');
      
    } catch (error) {
      console.error('❌ Failed to handle Saturday entry:', error);
      throw error;
    }
  }

  /**
   * Phase 2: Fill all activity entries
   */
  public async fillAllActivities(): Promise<void> {
    console.log('🚀 Phase 2: Filling all activities...');
    
    try {
      // Load Excel data first
      await this.loadExcelData();
      
      // Wait for logbook table to load
      console.log('📍 Waiting for logbook table to load...');
      await this.page.waitForSelector(BOT_LOCATORS.LOG_BOOK_TABLE, { timeout: 15000 });
      
      // Get all action buttons (both ENTRY and Edit buttons)
      const entryButtons = await this.page.locator(BOT_LOCATORS.ENTRY_BUTTON).all();
      const editButtons = await this.page.locator(BOT_LOCATORS.EDIT_BUTTON).all();
      console.log(`📍 Found ${entryButtons.length} entry buttons and ${editButtons.length} edit buttons`);
      
      // Combine all buttons for processing
      const allButtons = [...entryButtons, ...editButtons];
      console.log(`📍 Total action buttons found: ${allButtons.length}`);
      
      this.state.totalRows = allButtons.length;
      
      // Process each row
      for (let i = 0; i < allButtons.length; i++) {
        console.log(`\n🔄 Processing row ${i + 1}/${allButtons.length}...`);
        
        try {
          // Get the date for this row
          const dateCell = await this.page.locator(BOT_LOCATORS.DATE_COLUMN).nth(i);
          const dateText = await dateCell.textContent();
          
          if (!dateText) {
            console.log(`⚠️ No date found for row ${i + 1}, skipping...`);
            continue;
          }
          
          const dayOfWeek = this.extractDayFromDate(dateText.trim());
          console.log(`📅 Date: ${dateText.trim()}, Day: ${dayOfWeek}`);
          
          // Find the correct button for this row (either ENTRY or Edit)
          let actionButton = null;
          try {
            // First try to find ENTRY button for this row
            actionButton = await this.page.locator(BOT_LOCATORS.ENTRY_BUTTON).nth(i);
            await actionButton.waitFor({ state: 'visible', timeout: 1000 });
            console.log(`🔘 Found ENTRY button for row ${i + 1}`);
          } catch (error) {
            try {
              // If ENTRY button not found, try Edit button
              actionButton = await this.page.locator(BOT_LOCATORS.EDIT_BUTTON).nth(i);
              await actionButton.waitFor({ state: 'visible', timeout: 1000 });
              console.log(`🔘 Found Edit button for row ${i + 1}`);
            } catch (editError) {
              console.log(`⚠️ No action button found for row ${i + 1}, skipping...`);
              continue;
            }
          }
          
          // Click the action button for this row
          console.log(`🔘 Clicking action button for row ${i + 1}...`);
          await actionButton.click();
          await this.page.waitForTimeout(1500); // Reduced wait time for faster execution
          
          // Check if it's Saturday
          if (dayOfWeek === 'Sat') {
            console.log('📅 Saturday detected - setting OFF...');
            await this.handleSaturdayEntry();
          } else {
            console.log('📅 Weekday detected - filling activity...');
            await this.fillActivityForm(i);
          }
          
          this.state.processedDates.push(dateText.trim());
          this.state.currentRow = i + 1;
          
          console.log(`✅ Successfully processed row ${i + 1}`);
          
        } catch (error) {
          console.error(`❌ Failed to process row ${i + 1}:`, error);
          this.state.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
          
          // Try to close any open modal
          try {
            await this.page.keyboard.press('Escape');
            await this.page.waitForTimeout(1000);
          } catch (closeError) {
            // Ignore close errors
          }
        }
      }
      
      console.log(`\n✅ Phase 2 completed: Processed ${this.state.processedDates.length} dates`);
      console.log(`📊 Success rate: ${this.state.processedDates.length}/${this.state.totalRows}`);
      
      if (this.state.errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${this.state.errors.length}`);
        this.state.errors.forEach(error => console.log(`   - ${error}`));
      }
      
    } catch (error) {
      console.error('❌ Phase 2 failed:', error);
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