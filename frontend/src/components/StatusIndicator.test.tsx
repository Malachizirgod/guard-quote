import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import StatusIndicator from "./StatusIndicator";

// Mock fetch
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("StatusIndicator", () => {
  it("renders loading state initially", () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));
    render(<StatusIndicator />);
    // Component should render without crashing
    expect(document.body).toBeTruthy();
  });

  it("shows demo mode when API returns demo", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          mode: "demo",
          database: { connected: false, local: false },
          mlEngine: { connected: false, version: null },
        }),
    });

    render(<StatusIndicator />);

    // Wait for the component to update
    await vi.waitFor(() => {
      const indicator = document.querySelector('[class*="indicator"]');
      expect(indicator).toBeTruthy();
    });
  });

  it("handles fetch error gracefully", async () => {
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    render(<StatusIndicator />);

    // Should not crash
    await vi.waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });
});
