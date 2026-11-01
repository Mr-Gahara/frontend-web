/**
 * Tanda Tachyon POS: kotak karamel berhuruf T navy. Dipakai halaman login
 * akun, login pengguna, dan daftar.
 */
export function TandaTachyon({ ukuran = 36 }: { ukuran?: number }) {
  return (
    <svg width={ukuran} height={ukuran} viewBox="0 0 36 36" aria-hidden="true" className="shrink-0">
      <rect width="36" height="36" rx="9" className="fill-karamel" />
      <path
        d="M10 12h16M18 12v14"
        className="stroke-navy"
        strokeWidth={3.2}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}