import * as fs from "fs";
import * as path from "path";

const BACKEND_URL = "http://localhost:5001/api";
const AUTH_DIR = path.join(__dirname, ".auth");

interface TestLoginResponse {
  success: boolean;
  user: { id: string; email: string; role: string };
}

function parseSetCookieHeaders(headers: Headers): Array<{ name: string; value: string; domain: string; path: string; httpOnly: boolean; secure: boolean; sameSite: "Lax" | "Strict" | "None" }> {
  const raw = headers.getSetCookie ? headers.getSetCookie() : [headers.get("set-cookie") ?? ""];
  const cookies: Array<{ name: string; value: string; domain: string; path: string; httpOnly: boolean; secure: boolean; sameSite: "Lax" | "Strict" | "None" }> = [];

  for (const header of raw) {
    if (!header) continue;
    const parts = header.split(";").map((p) => p.trim());
    const [nameValue, ...attrs] = parts;
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx === -1) continue;

    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();

    const attrMap: Record<string, string> = {};
    for (const attr of attrs) {
      const [k, v = ""] = attr.split("=").map((s) => s.trim());
      attrMap[k.toLowerCase()] = v;
    }

    cookies.push({
      name,
      value,
      domain: "localhost",
      path: attrMap["path"] ?? "/",
      httpOnly: "httponly" in attrMap,
      secure: "secure" in attrMap,
      sameSite: (attrMap["samesite"] as "Lax" | "Strict" | "None") ?? "Lax",
    });
  }

  return cookies;
}

async function createAuthState(role: "tenant" | "admin" | "fresh-tenant", outputFile: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/auth/test-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw new Error(`test-login failed for role "${role}": ${response.status} ${await response.text()}`);
  }

  const data: TestLoginResponse = await response.json();
  const cookies = parseSetCookieHeaders(response.headers);

  if (role === "tenant") {
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
    try {
      await fetch(`${BACKEND_URL}/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieHeader },
        body: JSON.stringify({}),
      });
    } catch {
      // Preferences may already exist — ignore conflict errors
    }
  }

  const storageState = { cookies, origins: [] };
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(storageState, null, 2));
  // eslint-disable-next-line no-console
  console.log(`[global-setup] Auth state saved for ${data.user.email} → ${path.basename(outputFile)}`);
}

export default async function globalSetup(): Promise<void> {
  await createAuthState("tenant", path.join(AUTH_DIR, "tenant.json"));
  await createAuthState("admin", path.join(AUTH_DIR, "admin.json"));
  await createAuthState("fresh-tenant", path.join(AUTH_DIR, "fresh-tenant.json"));
}
