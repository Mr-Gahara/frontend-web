import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAuthGuard } from '@/app/hooks/useAuthGuard'; 
import { useRouter } from 'next/navigation';
import { decodeJWT } from '@/lib/decodeToken';

// 1. Memalsukan (Mocking) Router Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// 2. Memalsukan fungsi dekode agar kita bisa memanipulasi payload sesuka hati
vi.mock('@/lib/decodeToken', () => ({
  decodeJWT: vi.fn(),
}));

describe('Hooks - useAuthGuard', () => {
  const mockReplace = vi.fn();

  beforeEach(() => {
    // Bersihkan semua jejak sebelum setiap test dimulai
    vi.clearAllMocks();
    sessionStorage.clear();
    // Beritahu mock useRouter untuk mereturn fungsi replace palsu kita
    (useRouter as any).mockReturnValue({ replace: mockReplace });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('harus redirect ke /login jika accessToken tidak ada di sessionStorage', () => {
    renderHook(() => useAuthGuard());
    
    // Ekspektasi: Karena session kosong, router.replace harus dipanggil dengan "/login"
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('harus redirect ke /login jika payload token tidak valid (tidak ada id)', () => {
    sessionStorage.setItem('accessToken', 'token-palsu');
    (decodeJWT as any).mockReturnValue({}); // Simulasi payload kosong
    
    renderHook(() => useAuthGuard());
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('harus membersihkan sesi dan redirect ke /login jika tidak memiliki tenantID (belum setup toko)', () => {
    sessionStorage.setItem('accessToken', 'token-palsu');
    (decodeJWT as any).mockReturnValue({ id: 'user-123' }); // Ada ID, tapi tidak ada tenantID
    
    renderHook(() => useAuthGuard());
    
    // Memastikan sessionStorage.clear() benar-benar dieksekusi
    expect(sessionStorage.getItem('accessToken')).toBeNull(); 
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });

  it('harus redirect ke /login/pengguna jika penggunaToken tidak ada atau invalid', () => {
    sessionStorage.setItem('accessToken', 'token-palsu');
    (decodeJWT as any).mockReturnValue({ id: 'user-123', tenantID: 'toko-abc' }); 
    // Kita sengaja tidak set penggunaToken
    
    renderHook(() => useAuthGuard());
    expect(mockReplace).toHaveBeenCalledWith('/login/pengguna');
  });

  it('harus mengizinkan akses (tidak melakukan redirect) jika semua token dan payload valid', () => {
    sessionStorage.setItem('accessToken', 'token-palsu');
    sessionStorage.setItem('penggunaToken', 'token-karyawan-palsu');
    (decodeJWT as any).mockReturnValue({ id: 'user-123', tenantID: 'toko-abc' });
    
    renderHook(() => useAuthGuard());
    
    // Ekspektasi: Fungsi replace tidak pernah dipanggil sama sekali
    expect(mockReplace).not.toHaveBeenCalled();
  });
});