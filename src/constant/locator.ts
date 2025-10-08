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

// Main bot locators for activity filling
export const BOT_LOCATORS = {
  // Phase 1: Navigation locators
  SEMESTER_DROPDOWN: 'div.ui.fluid.search.dropdown.faculty.selection',
  SEMESTER_OPTION_ODD: 'div.menu.transition div.item[data-value="2510"]',
  ACTIVITY_BUTTON: 'a.button.button-orange.button-padding-semesta[href*="/Login/Student/SSOToActivity"]',
  ACCOUNT_TILE: 'div.table[data-test-id="aldo.wibowo@binus.ac.id"]',
  LOGBOOK_TAB: 'li.logBookTab a#btnLogBook',
  SEPTEMBER_TAB: 'a[onclick*="tabClick"][href="#"]:has-text("September")',
  
  // Phase 2: Activity form locators
  LOG_BOOK_TABLE: 'table#logBookTable.bordered.table-semesta.dataTable',
  ENTRY_BUTTON: 'button.button.button-primary.detailsbtn',
  EDIT_BUTTON: 'button.button.button-orange.detailsbtn',
  
  // Combined button selectors for both ENTRY and Edit buttons
  ACTION_BUTTONS: [
    'button.button.button-primary.detailsbtn',
    'button.button.button-orange.detailsbtn'
  ],
  
  // Modal form locators
  CLOCK_IN_INPUT: 'input#editClockIn.timepicker.hasDatepicker',
  CLOCK_OUT_INPUT: 'input#editClockOut.timepicker.hasDatepicker',
  ACTIVITY_INPUT: 'input#editActivity',
  DESCRIPTION_TEXTAREA: 'textarea#editDescription',
  
  // Submit button with fallbacks
  SUBMIT_BUTTON: 'a-encoded.button.button-primary[onclick="editSaveClick()"]',
  SUBMIT_BUTTON_FALLBACKS: [
    'a-encoded.button.button-primary[onclick="editSaveClick()"]',
    'button[onclick="editSaveClick()"]',
    'input[onclick="editSaveClick()"]',
    'a[onclick="editSaveClick()"]',
    'button.button-primary:has-text("Submit")',
    'input.button-primary[value="Submit"]',
    'button:has-text("Submit")',
    'input[type="submit"]',
    'button[type="submit"]'
  ] as string[],
  
  // OFF button with fallbacks
  OFF_BUTTON: 'a-encoded.button.button-primary[onclick="OffClick()"]',
  OFF_BUTTON_FALLBACKS: [
    'a-encoded.button.button-primary[onclick="OffClick()"]',
    'button[onclick="OffClick()"]',
    'input[onclick="OffClick()"]',
    'a[onclick="OffClick()"]',
    'button.button-primary:has-text("OFF")',
    'input.button-primary[value="OFF"]',
    'button:has-text("OFF")'
  ] as string[],
  
  // Date column selector
  DATE_COLUMN: 'td.dt-center.sorting_1'
} as const;