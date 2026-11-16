import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RadioGroup, RadioGroupItem } from "./radio-group";

const OPTIONS = ["Новий", "Як новий", "Відмінний"];

function renderGroup(onValueChange = vi.fn()) {
  render(
    <RadioGroup defaultValue="Новий" aria-label="Стан" onValueChange={onValueChange}>
      {OPTIONS.map((option) => (
        <label key={option}>
          <RadioGroupItem value={option} />
          {option}
        </label>
      ))}
    </RadioGroup>,
  );
  return onValueChange;
}

describe("RadioGroup", () => {
  it("стрілка переводить фокус і вибирає пункт, навіть коли клавішу відпущено одразу", async () => {
    const onValueChange = renderGroup();
    const user = userEvent.setup();

    screen.getByRole("radio", { name: "Новий" }).focus();
    // user-event надсилає keydown і keyup поспіль, раніше за перехід фокуса в Radix.
    await user.keyboard("{ArrowDown}");

    const next = screen.getByRole("radio", { name: "Як новий" });
    await waitFor(() => expect(next).toHaveFocus());
    await waitFor(() => expect(next).toBeChecked());
    expect(onValueChange).toHaveBeenCalledWith("Як новий");
    expect(screen.getByRole("radio", { name: "Новий" })).not.toBeChecked();
  });

  it("фокус клавішею Tab нічого не перемикає", async () => {
    const onValueChange = renderGroup();
    const user = userEvent.setup();

    await user.tab();

    expect(screen.getByRole("radio", { name: "Новий" })).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
