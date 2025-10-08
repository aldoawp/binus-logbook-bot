// Login-related types and interfaces

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginSession {
  cookies: any[];
  localStorage: any;
  sessionStorage: any;
  timestamp: string;
}
