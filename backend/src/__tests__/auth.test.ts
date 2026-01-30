import { describe, test, expect } from "bun:test";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

describe("Auth Endpoints", () => {
  test("POST /api/auth/login with valid credentials returns tokens", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@guardquote.com",
        password: "admin123",
      }),
    });

    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty("accessToken");
    expect(data).toHaveProperty("refreshToken");
    expect(data).toHaveProperty("user");
    expect(data.user.email).toBe("admin@guardquote.com");
  });

  test("POST /api/auth/login with invalid credentials returns error", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "wrong@email.com",
        password: "wrongpassword",
      }),
    });

    expect(res.ok).toBe(false);
  });

  test("GET /api/auth/me without token returns 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`);
    expect(res.status).toBe(401);
  });
});
