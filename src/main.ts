import LoginBot from './core/login.js';
import ActivityBot from './core/bot.js';
import { BotConfig } from './types/bot.js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Set environment variables explicitly for testing
process.env.EMAIL = 'aldo.wibowo@binus.ac.id';
process.env.PASSWORD = 'Piloka121';

// Debug: Check if environment variables are loaded
console.log('🔍 Environment variables loaded');

async function main() {
  const loginBot = new LoginBot();
  
  try {
    console.log('🚀 Starting logbook automation bot...');
    
    // Always perform fresh login
    console.log('🔐 Performing fresh login...');
    const success = await loginBot.login();
    
    if (success) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login failed');
      process.exit(1);
    }
    
    // Initialize activity bot with configuration
    const botConfig: BotConfig = {
      clockInTime: '08:00 am',
      clockOutTime: '05:00 pm',
      excelFilePath: path.join(process.cwd(), 'src', 'data', 'monthly_activity.xlsx')
    };
    
    const activityBot = new ActivityBot(loginBot.getPage()!, botConfig);
    
    try {
      // Phase 1: Navigate to activity page
      console.log('\n🎯 Starting Phase 1: Navigation...');
      await activityBot.navigateToActivityPage();
      
      // Phase 2: Fill all activities
      console.log('\n🎯 Starting Phase 2: Activity Filling...');
      await activityBot.fillAllActivities();
      
      // Display final results
      const state = activityBot.getState();
      const errors = activityBot.getErrors();
      
      console.log('\n📊 Final Results:');
      console.log(`✅ Successfully processed: ${state.processedDates.length} dates`);
      console.log(`📅 Processed dates: ${state.processedDates.join(', ')}`);
      
      if (errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${errors.length}`);
        errors.forEach(error => console.log(`   - ${error}`));
      }
      
      console.log('\n🎉 Bot execution completed successfully!');
      
    } catch (error) {
      console.error('❌ Activity bot failed:', error);
      
      // Display partial results
      const state = activityBot.getState();
      const errors = activityBot.getErrors();
      
      console.log('\n📊 Partial Results:');
      console.log(`✅ Successfully processed: ${state.processedDates.length} dates`);
      console.log(`📅 Processed dates: ${state.processedDates.join(', ')}`);
      
      if (errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${errors.length}`);
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
    console.log('✅ Browser closed');
  }
}

// Run the main function
main().catch(console.error);
