import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { expectNoA11yViolations } from "./a11y";

// Guards the helper itself: it must fail on a real violation.
test("expectNoA11yViolations fails on an image without alt text", async () => {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  const { container } = render(<img src="/x.png" />);
  await expect(expectNoA11yViolations(container)).rejects.toThrow(/image-alt/);
});

test("expectNoA11yViolations passes on accessible markup", async () => {
  const { container } = render(
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/x.png" alt="A band on stage" />,
  );
  await expectNoA11yViolations(container);
});
