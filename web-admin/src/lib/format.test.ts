import { describe, it, expect } from "vitest";
import { vnd, dateKey, monthKey } from "./format";

describe("Format Utilities", () => {
  it("định dạng tiền tệ VND chính xác", () => {
    expect(vnd(15000)).toMatch(/15\.000/);
    expect(vnd(0)).toMatch(/0/);
    expect(vnd(1250000)).toMatch(/1\.250\.000/);
    expect(vnd(null)).toMatch(/0/);
  });

  it("trả về dateKey YYYY-MM-DD theo giờ Việt Nam", () => {
    const key = dateKey();
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("trả về monthKey YYYY-MM theo giờ Việt Nam", () => {
    const key = monthKey();
    expect(key).toMatch(/^\d{4}-\d{2}$/);
    expect(key.length).toBe(7);
  });
});
