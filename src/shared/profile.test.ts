import { describe, it, expect } from "vitest";
import { createEmptyProfile, isValidProfile } from "./profile";

describe("createEmptyProfile", () => {
  it("returns a profile with empty string fields and empty arrays", () => {
    const p = createEmptyProfile();
    expect(p).toEqual({
      name: "",
      email: "",
      phone: "",
      skills: [],
      experience: [],
      education: [],
    });
  });
});

describe("isValidProfile", () => {
  it("returns false for an empty profile", () => {
    expect(isValidProfile(createEmptyProfile())).toBe(false);
  });

  it("returns false when only name is set", () => {
    expect(isValidProfile({ ...createEmptyProfile(), name: "Alice" })).toBe(
      false,
    );
  });

  it("returns false when only email is set", () => {
    expect(isValidProfile({ ...createEmptyProfile(), email: "a@b.com" })).toBe(
      false,
    );
  });

  it("returns true when both name and email are set", () => {
    expect(
      isValidProfile({ ...createEmptyProfile(), name: "Alice", email: "a@b.com" }),
    ).toBe(true);
  });
});
