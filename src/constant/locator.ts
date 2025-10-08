// Login page locators based on the algorithm specification
export const LOGIN_LOCATORS = {
  // Step 2: Initial login button
  INITIAL_LOGIN_BUTTON: 'a.button.button-primary[href="/Login/Student/Login"]',
  
  // Step 3: Microsoft sign in button
  MICROSOFT_SIGNIN_BUTTON: 'button.btnLogin#btnLogin[name="btnLogin"]',
  
  // Step 4: Email input field
  EMAIL_INPUT: 'input[name="loginfmt"]#i0116[type="email"]',
  
  // Step 5: Next button after email
  EMAIL_NEXT_BUTTON: 'input#idSIButton9[type="submit"][value="Sign in"]',
  
  // Step 6: Password input field
  PASSWORD_INPUT: 'input[name="passwd"]#i0118[type="password"]',
  
  // Step 7: Sign in button after password
  PASSWORD_SIGNIN_BUTTON: 'input#idSIButton9[type="submit"][value="Sign in"]',
  
  // Step 8: Stay signed in "Yes" button
  STAY_SIGNED_IN_BUTTON: 'input#idSIButton9[type="submit"][value="Yes"]'
} as const;
