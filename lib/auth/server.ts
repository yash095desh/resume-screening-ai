import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

/**
 * Drop-in replacement for @clerk/nextjs/server auth()
 * Reads JWT from cookie, verifies, returns { userId }
 */
export async function auth(): Promise<{ userId: string | null }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return { userId: null };
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return { userId: decoded.userId };
  } catch {
    return { userId: null };
  }
}
