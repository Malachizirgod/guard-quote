import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Loading from "./Loading";

describe("Loading", () => {
  it("renders loader element", () => {
    render(<Loading />);
    const loader = document.querySelector('[class*="loader"]');
    expect(loader).toBeTruthy();
  });

  it("renders analyzing message", () => {
    const { container } = render(<Loading />);
    expect(container.textContent).toMatch(/analyzing/i);
  });
});
