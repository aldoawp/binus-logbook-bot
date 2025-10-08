const greet = (name: string): string => `Hello, ${name}!`;

const getCurrentTime = (): string => {
  return new Date().toLocaleString();
};

export default {
  greet,
  getCurrentTime
};
