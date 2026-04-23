import { Page } from "@playwright/test";

export async function getSessionItem(page: Page, key: string) {
  return page.evaluate((k) => sessionStorage.getItem(k), key);
}

export async function getLocalItem(page: Page, key: string) {
  return page.evaluate((k) => localStorage.getItem(k), key);
}

export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
}

export function decodeJWT(token: string): Record<string, any> {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch {
    return {};
  }
}

// export function decodeJWTNode(token: string): Record<string, any> {
//   try {
//     return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
//   } catch {
//     return {};
//   }
// }
