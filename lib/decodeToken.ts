export function decodeJWT(token: string): Record<string, any> {
  try {
    if (!token || typeof token !== "string") return {};

    const parts = token.split(".");
    if (parts.length !== 3) return {};

    const base64Url = parts[1];
    
    // 1. Konversi format Base64URL menjadi Base64 standar
    let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    // 2. Tambahkan padding "=" yang sering hilang pada JWT agar atob() tidak error
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) throw new Error("InvalidLengthError: Format Base64 tidak valid");
      base64 += new Array(5 - pad).join("=");
    }

    // 3. Decode dengan aman menggunakan trik pemetaan Unicode (URL Encoding)
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Gagal mengekstrak token JWT:", error);
    return {};
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJWT(token);
    if (!payload.exp) return true;

    // Tambahkan Grace Period (Waktu Toleransi) sebesar 10 detik.
    // Jika sisa umur token kurang dari 10 detik, anggap saja sudah kedaluwarsa
    // agar sistem punya waktu memanggil fungsi refreshToken sebelum benar-benar mati.
    const expirationTimeInMs = payload.exp * 1000;
    const currentTimeInMs = Date.now();
    const GRACE_PERIOD_MS = 10000; 

    return (expirationTimeInMs - GRACE_PERIOD_MS) < currentTimeInMs;
  } catch {
    return true;
  }
}