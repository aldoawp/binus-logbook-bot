import LoginBot from './core/login.js';
import ActivityBot from './core/bot.js';
import { BotConfig } from './types/bot.js';
import { getMonthName, getSemesterCode } from './utils/mapping.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ 
  path: '.env',
  encoding: 'utf8'
});

async function main() {
  const loginBot = new LoginBot();
  
  try {
    console.log('🚀 Starting logbook automation bot...');
    
    // Always perform fresh login
    const success = await loginBot.login();
    
    if (!success) {
      console.log('❌ Login failed');
      process.exit(1);
    }
    
    // Initialize activity bot with configuration from environment variables
    const logbookMonthEnv = process.env.LOGBOOK_MONTH || 'SEP';
    const internshipSemesterEnv = process.env.INTERNSHIP_SEMESTER || 'ODD';
    
    const botConfig: BotConfig = {
      clockInTime: process.env.CLOCK_IN_TIME || '08:00',
      clockOutTime: process.env.CLOCK_OUT_TIME || '17:00',
      excelFilePath: process.env.EXCEL_FILE_PATH || path.join(process.cwd(), 'src', 'data', 'monthly_activity.xlsx'),
      logbookMonth: getMonthName(logbookMonthEnv),
      internshipSemester: getSemesterCode(internshipSemesterEnv)
    };
    
    const activityBot = new ActivityBot(loginBot.getPage()!, botConfig);
    
    try {
      // Phase 1: Navigate to activity page
      await activityBot.navigateToActivityPage();
      
      // Phase 2: Fill all activities
      await activityBot.fillAllActivities();
      
      // Display final results
      const state = activityBot.getState();
      const errors = activityBot.getErrors();
      
      console.log(`✅ Successfully processed: ${state.processedDates.length} dates`);
      
      if (errors.length > 0) {
        console.log(`⚠️ Errors: ${errors.length}`);
        errors.forEach(error => console.log(`   - ${error}`));
      }
      
      console.log('🎉 Bot execution completed successfully!');
      
    } catch (error) {
      console.error('❌ Activity bot failed:', error);
      
      // Display partial results
      const state = activityBot.getState();
      const errors = activityBot.getErrors();
      
      console.log(`✅ Successfully processed: ${state.processedDates.length} dates`);
      
      if (errors.length > 0) {
        console.log(`⚠️ Errors: ${errors.length}`);
        errors.forEach(error => console.log(`   - ${error}`));
      }
      
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Always close the browser
    await loginBot.close();
  }
}

// Run the main function
main().catch(console.error);
