import LoginBot from './core/login.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
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
    console.log('🚀 Starting login bot...');
    
    // Check if login session exists
    const sessionPath = path.join(process.cwd(), 'src', 'data', 'login-session.json');
    let hasValidSession = false;
    
    if (fs.existsSync(sessionPath)) {
      try {
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
        const sessionAge = Date.now() - new Date(sessionData.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        if (sessionAge < maxAge) {
          console.log('✅ Using existing session');
          hasValidSession = true;
        } else {
          console.log('⚠️ Session expired, performing fresh login');
        }
      } catch (error) {
        console.log('⚠️ Invalid session, performing fresh login');
      }
    } else {
      console.log('📄 No session found, performing fresh login');
    }
    
    if (hasValidSession) {
      // Load existing session and navigate to dashboard
      await loginBot.loadSession();
      await loginBot.navigateToDashboard();
      
      console.log('✅ Session restored successfully');
      
      // Keep the browser open for 5 seconds to see the result
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } else {
      // Perform fresh login
      const success = await loginBot.login();
      
      if (success) {
        console.log('✅ Login successful');
        
        // Keep the browser open for 5 seconds to see the result
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } else {
        console.log('❌ Login failed');
        process.exit(1);
      }
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
