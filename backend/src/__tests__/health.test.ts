import { describe, test, expect } from "bun:test";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

describe("Health Endpoints", () => {
  test("GET /health returns healthy status", async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data.status).toBe("healthy");
  });

  test("GET /api/status returns system status", async () => {
    const res = await fetch(`${BASE_URL}/api/status`);
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(data).toHaveProperty("mode");
    expect(data).toHaveProperty("database");
    expect(data).toHaveProperty("mlEngine");
    expect(["demo", "development", "production"]).toContain(data.mode);
  });
});
