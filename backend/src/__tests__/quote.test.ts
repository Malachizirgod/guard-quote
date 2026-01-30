import { describe, test, expect } from "bun:test";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

describe("Quote Endpoints", () => {
  test("POST /api/quote-requests creates a quote request", async () => {
    const res = await fetch(`${BASE_URL}/api/quote-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        email: `test${Date.now()}@example.com`,
        quoteData: {
          hasAntivirus: true,
          hasVpn: false,
          deviceCount: 3,
          worksFromHome: true,
        },
      }),
    });

    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty("quoteRequestId");
    expect(data).toHaveProperty("userId");
  });

  test("POST /api/quote-requests requires email", async () => {
    const res = await fetch(`${BASE_URL}/api/quote-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Test",
        lastName: "User",
        quoteData: {},
      }),
    });

    expect(res.ok).toBe(false);
  });
});
