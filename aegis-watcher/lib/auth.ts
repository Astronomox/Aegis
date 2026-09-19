import { cookies } from 'next/headers';

// On-site: change this or move to env var
const PASSCODE = process.env.AEGIS_PASSCODE || '1234';
const COOKIE_NAME = 'aegis-session';

export function validatePasscode(input: string): boolean {
  return input === PASSCODE;
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === 'authenticated';
}
