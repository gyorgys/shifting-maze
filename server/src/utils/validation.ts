export function isValidUsername(username: string): boolean {
  // Alphanumeric + underscore, 3-20 chars, no spaces
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidDisplayName(displayName: string): boolean {
  // 1-50 chars, allow spaces
  return displayName.length >= 1 && displayName.length <= 50;
}

export function isValidGameName(name: string): boolean {
  // 1-100 chars
  return name.length >= 1 && name.length <= 100;
}

export function isValidGameCode(code: string): boolean {
  // Exactly 4 uppercase letters
  return /^[A-Z]{4}$/.test(code);
}

export function generateGameCode(): string {
  // Generate random 4-letter code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}
