export function decodeJWT(token: string): Record<string, any> {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}

// Helper cek apakah token sudah expired
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJWT(token);
    if (!payload.exp) return true;
    // exp dalam detik, Date.now() dalam milidetik
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}