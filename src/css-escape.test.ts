import { describe, it, expect } from "vitest";

/**
 * CSS.escape real-world selector tests.
 *
 * Each case validates that CSS.escape produces a string that resolves
 * the correct element via querySelector. For edge cases that happy-dom's
 * selector parser doesn't support (spaces, leading digits, backslash),
 * we validate the escaped string directly — these are correct per the
 * CSSOM spec and work in all real browsers.
 */

describe("CSS.escape — DOM resolution", () => {
  function withElement(id: string, fn: (el: Element) => void): void {
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
    try {
      fn(el);
    } finally {
      el.remove();
    }
  }

  it("handles @ symbol (email attribute values)", () => {
    withElement("email-field", (el) => {
      el.setAttribute("data-email", "user@example.com");
      const escaped = CSS.escape("user@example.com");
      const sel = `[data-email="${escaped}"]`;
      expect(document.querySelector(sel)).toBe(el);
    });
  });

  it("handles dots in values (class-like strings)", () => {
    withElement("my.value", (el) => {
      const sel = `#${CSS.escape("my.value")}`;
      expect(document.querySelector(sel)).toBe(el);
    });
  });

  it("handles hash symbols in values", () => {
    withElement("test#1", (el) => {
      const sel = `#${CSS.escape("test#1")}`;
      expect(document.querySelector(sel)).toBe(el);
    });
  });

  it("handles leading hyphen", () => {
    withElement("-test", (el) => {
      const sel = `#${CSS.escape("-test")}`;
      expect(document.querySelector(sel)).toBe(el);
    });
  });

  it("handles colon (CMS-generated ids like item:1)", () => {
    withElement("item:1", (el) => {
      const sel = `#${CSS.escape("item:1")}`;
      expect(document.querySelector(sel)).toBe(el);
    });
  });

  it("handles mixed special characters", () => {
    withElement("hello.world#test@domain", (el) => {
      const sel = `#${CSS.escape("hello.world#test@domain")}`;
      expect(document.querySelector(sel)).toBe(el);
    });
  });
});

describe("CSS.escape — value correctness", () => {
  it("escapes spaces with backslash", () => {
    const result = CSS.escape("first name");
    expect(result).toMatch(/^first\s*\\\s*name$/);
    expect(result).toBe("first\\ name");
  });

  it("escapes leading digits with hex escape", () => {
    const result = CSS.escape("123field");
    expect(result).toBe("\\31 23field");
  });

  it("escapes backslash with double backslash", () => {
    const result = CSS.escape("path\\value");
    expect(result).toBe("path\\\\value");
  });

  it("returns empty string for empty input", () => {
    expect(CSS.escape("")).toBe("");
  });
});
