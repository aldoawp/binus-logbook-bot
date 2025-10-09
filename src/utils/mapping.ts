// Utility functions for mapping environment variables to application values

/**
 * Month translation mapping from environment variable to full month name
 */
export const MONTH_TRANSLATION: { [key: string]: string } = {
  'FEB': 'February',
  'MAR': 'March', 
  'APR': 'April',
  'MAY': 'May',
  'JUN': 'June',
  'JUL': 'July',
  'AUG': 'August',
  'SEP': 'September',
  'OCT': 'October',
  'NOV': 'November',
  'DEC': 'December',
  'JAN': 'January'
};

/**
 * Semester translation mapping from environment variable to semester code
 */
export const SEMESTER_TRANSLATION: { [key: string]: string } = {
  'EVEN': '2420',
  'ODD': '2510'
};

/**
 * Get the full month name from environment variable
 * @param monthEnv - The month environment variable (e.g., 'SEP', 'OCT')
 * @returns The full month name (e.g., 'September', 'October')
 */
export function getMonthName(monthEnv: string): string {
  return MONTH_TRANSLATION[monthEnv] || 'September';
}

/**
 * Get the semester code from environment variable
 * @param semesterEnv - The semester environment variable ('EVEN' or 'ODD')
 * @returns The semester code ('2420' for EVEN, '2510' for ODD)
 */
export function getSemesterCode(semesterEnv: string): string {
  return SEMESTER_TRANSLATION[semesterEnv] || '2510';
}

/**
 * Get the email from environment variable
 * @returns The email address from environment variable
 */
export function getEmail(): string {
  return process.env.EMAIL || '';
}
