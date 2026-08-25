import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { decodeJWT, isTokenExpired } from '@/lib/decodeToken';

const createMockJWT = (payload: any) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const signature = 'dummy-signature';
  return `${header}.${body}.${signature}`;
};

describe('DecodeToken - decodeJWT', () => {
  it('harus men-decode token JWT valid (Happy Path)', () => {
    const token = createMockJWT({ userId: 1, role: 'admin' });
    const result = decodeJWT(token);
    expect(result).toEqual({ userId: 1, role: 'admin' });
  });

  it('harus mengembalikan object kosong jika input kosong/bukan string (Unhappy Path)', () => {
    expect(decodeJWT('')).toEqual({});
    expect(decodeJWT(null as any)).toEqual({});
    expect(decodeJWT(123 as any)).toEqual({});
  });

  it('harus mengembalikan object kosong jika format JWT salah (Edge Case)', () => {
    expect(decodeJWT('header.payload')).toEqual({});
  });

  it('harus menangani token Base64URL tanpa padding (Edge Case)', () => {
    const token = createMockJWT({ paddingCheck: 'test' }).replace(/=/g, '');
    const result = decodeJWT(token);
    expect(result.paddingCheck).toBe('test');
  });
});

describe('DecodeToken - isTokenExpired', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-25T15:36:24.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('harus return false jika token masih aktif jauh (Happy Path)', () => {
    const currentTimeInSecs = Math.floor(Date.now() / 1000);
    const token = createMockJWT({ exp: currentTimeInSecs + 3600 });
    expect(isTokenExpired(token)).toBe(false);
  });

  it('harus return true jika token masa aktifnya lewat (Unhappy Path)', () => {
    const currentTimeInSecs = Math.floor(Date.now() / 1000);
    const token = createMockJWT({ exp: currentTimeInSecs - 3600 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('harus return true saat sisa waktu token masuk Grace Period < 10 detik (Edge Case)', () => {
    const currentTimeInSecs = Math.floor(Date.now() / 1000);
    const token = createMockJWT({ exp: currentTimeInSecs + 9 }); 
    expect(isTokenExpired(token)).toBe(true);
  });

  it('harus return false saat sisa waktu token diluar Grace Period > 10 detik (Edge Case)', () => {
    const currentTimeInSecs = Math.floor(Date.now() / 1000);
    const token = createMockJWT({ exp: currentTimeInSecs + 11 }); 
    expect(isTokenExpired(token)).toBe(false);
  });

  it('harus menganggap token expired jika tidak ada field exp (Unhappy Path)', () => {
    const token = createMockJWT({ userId: 123 });
    expect(isTokenExpired(token)).toBe(true);
  });

  it('harus menganggap token expired jika token tidak valid (Unhappy Path)', () => {
    expect(isTokenExpired('token-rusak-parah')).toBe(true);
  });
});
