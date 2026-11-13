import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("react testing library renders in jsdom", () => {
  render(<p>Hello</p>);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
