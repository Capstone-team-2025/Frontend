import 'server-only';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export type Carrier = "SKT" | "KT" | "LGU+";

export type MeOkUser = {
  id: number;
  nickname: string;
  profileImage: string;
  kakaoId: number;
  level: string;
  levelDisplayName: string;
  carrier: Carrier;
};

async function absoluteUrl(path: string) {
  const h = await headers();

  const rawHost =
    h.get('x-forwarded-host') ||
    h.get('host') ||
    process.env.VERCEL_URL ||
    'localhost:3000';

  const isFull = rawHost.startsWith('http://') || rawHost.startsWith('https://');
  const xfProto = h.get('x-forwarded-proto');
  const proto = xfProto || (rawHost.includes('localhost') ? 'http' : 'https');
  const base = isFull ? rawHost : `${proto}://${rawHost}`;

  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function cookieHeader() {
  const c = await cookies();
  return c.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');
}

export async function getUserData() {
  const url = await absoluteUrl('/api/auth/me');
  const ck = await cookieHeader();

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { Cookie: ck },
  });

  if (res.status === 401) {
    redirect('/');
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch user: ${res.status}`);
  }

  const json = (await res.json()) as { user: MeOkUser };
  return json.user;
}
