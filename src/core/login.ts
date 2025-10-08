import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { LOGIN_LOCATORS } from '../constant/locator.js';
import { URLS } from '../constant/url.js';
import { LoginCredentials } from '../types/login.js';

class LoginBot {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor() {
    // LoginBot initialized
  }

  /**
   * Load credentials from environment variables
   */
  private loadCredentials(): LoginCredentials {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!email || !password) {
      throw new Error('Missing credentials. Please set EMAIL and PASSWORD environment variables.');
    }

    return { email, password };
  }

  /**
   * Initialize browser with stateful context
   */
  private async initializeBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      headless: false, // Set to true for production
      slowMo: 1000, // Slow down operations for better visibility
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page = await this.context.newPage();
  }

  /**
   * Navigate to login page
   */
  private async navigateToLoginPage(): Promise<void> {
    await this.page!.goto(URLS.LOGIN_PAGE, { 
      waitUntil: 'domcontentloaded', // Faster than networkidle
      timeout: 30000 
    });
  }

  /**
   * Step 2: Click initial login button
   */
  private async clickInitialLoginButton(): Promise<void> {
    await this.page!.waitForSelector(LOGIN_LOCATORS.INITIAL_LOGIN_BUTTON, { timeout: 10000 });
    await this.page!.click(LOGIN_LOCATORS.INITIAL_LOGIN_BUTTON);
    await this.page!.waitForTimeout(2000); // Faster than waiting for full page load
  }

  /**
   * Step 3: Click Microsoft sign in button
   */
  private async clickMicrosoftSignInButton(): Promise<void> {
    await this.page!.waitForSelector(LOGIN_LOCATORS.MICROSOFT_SIGNIN_BUTTON, { timeout: 10000 });
    await this.page!.click(LOGIN_LOCATORS.MICROSOFT_SIGNIN_BUTTON);
    await this.page!.waitForTimeout(2000); // Faster than waiting for full page load
  }

  /**
   * Step 4: Fill email and click next
   */
  private async fillEmailAndNext(credentials: LoginCredentials): Promise<void> {
    await this.page!.waitForSelector(LOGIN_LOCATORS.EMAIL_INPUT, { timeout: 10000 });
    await this.page!.fill(LOGIN_LOCATORS.EMAIL_INPUT, credentials.email);
    
    // Try multiple possible selectors for the next button
    const nextButtonSelectors = [
      LOGIN_LOCATORS.EMAIL_NEXT_BUTTON,
      'input[type="submit"][value="Next"]',
      'input[type="submit"][value="Sign in"]',
      'button[type="submit"]',
      '#idSIButton9',
      'input#idSIButton9'
    ];
    
    let buttonClicked = false;
    for (const selector of nextButtonSelectors) {
      try {
        await this.page!.waitForSelector(selector, { timeout: 5000 });
        await this.page!.click(selector);
        buttonClicked = true;
        break;
      } catch (error) {
        // Try next selector
      }
    }
    
    if (!buttonClicked) {
      await this.page!.screenshot({ path: 'debug-email-page.png' });
      throw new Error('Could not find the next button with any of the expected selectors');
    }
    
    await this.page!.waitForTimeout(2000); // Faster than waiting for full page load
  }

  /**
   * Step 6: Fill password and sign in
   */
  private async fillPasswordAndSignIn(credentials: LoginCredentials): Promise<void> {
    await this.page!.waitForSelector(LOGIN_LOCATORS.PASSWORD_INPUT, { timeout: 10000 });
    await this.page!.fill(LOGIN_LOCATORS.PASSWORD_INPUT, credentials.password);
    await this.page!.click(LOGIN_LOCATORS.PASSWORD_SIGNIN_BUTTON);
    await this.page!.waitForTimeout(2000); // Faster than waiting for full page load
  }

  /**
   * Step 8: Handle "Stay signed in" prompt
   */
  private async handleStaySignedIn(): Promise<void> {
    try {
      await this.page!.waitForSelector(LOGIN_LOCATORS.STAY_SIGNED_IN_BUTTON, { timeout: 5000 });
      await this.page!.click(LOGIN_LOCATORS.STAY_SIGNED_IN_BUTTON);
      await this.page!.waitForTimeout(2000); // Faster than waiting for full page load
    } catch (error) {
      // Stay signed in prompt not found or already handled
    }
  }


  /**
   * Main login process
   */
  public async login(): Promise<boolean> {
    try {
      // Load credentials
      const credentials = this.loadCredentials();
      
      // Initialize browser
      await this.initializeBrowser();
      
      // Navigate to login page
      await this.navigateToLoginPage();
      
      // Step 2: Click initial login button
      await this.clickInitialLoginButton();
      
      // Step 3: Click Microsoft sign in button
      await this.clickMicrosoftSignInButton();
      
      // Step 4: Fill email and click next
      await this.fillEmailAndNext(credentials);
      
      // Step 6: Fill password and sign in
      await this.fillPasswordAndSignIn(credentials);
      
      // Step 8: Handle stay signed in prompt
      await this.handleStaySignedIn();
      
      return true;
      
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  /**
   * Close browser and cleanup
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Get current page for further operations
   */
  public getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current context for further operations
   */
  public getContext(): BrowserContext | null {
    return this.context;
  }

}

export default LoginBot;
