import { describe, it, expect, beforeEach } from "vitest";
import { extractFormFields } from "./dom-extractor";

beforeEach(() => {
  document.body.innerHTML = "";
});

function setBody(html: string): void {
  document.body.innerHTML = html;
}

describe("extractFormFields", () => {
  it("returns empty array when page has no form fields", () => {
    setBody("<p>No forms here</p>");
    expect(extractFormFields()).toEqual([]);
  });

  it("skips hidden, submit, reset, button, and image inputs", () => {
    setBody(`
      <input type="hidden" name="csrf" value="abc">
      <input type="submit" value="Go">
      <input type="reset" value="Reset">
      <input type="button" value="Click">
      <input type="image" src="btn.png">
    `);
    expect(extractFormFields()).toEqual([]);
  });

  describe("label resolution", () => {
    it("resolves label via <label for='id'>", () => {
      setBody(`
        <label for="fname">First Name</label>
        <input id="fname" name="firstName">
      `);
      const fields = extractFormFields();
      expect(fields).toHaveLength(1);
      expect(fields[0].label).toBe("First Name");
    });

    it("resolves label via parent <label> wrapping the input", () => {
      setBody(`
        <label>Email Address
          <input name="email" type="email">
        </label>
      `);
      const fields = extractFormFields();
      expect(fields).toHaveLength(1);
      expect(fields[0].label).toBe("Email Address");
    });

    it("resolves label via aria-label", () => {
      setBody(`<input aria-label="Phone Number" name="phone" type="tel">`);
      const fields = extractFormFields();
      expect(fields[0].label).toBe("Phone Number");
    });

    it("resolves label via aria-labelledby", () => {
      setBody(`
        <div id="lbl1">LinkedIn Profile</div>
        <input aria-labelledby="lbl1" name="linkedin" type="url">
      `);
      const fields = extractFormFields();
      expect(fields[0].label).toBe("LinkedIn Profile");
    });

    it("falls back to placeholder when no label is found", () => {
      setBody(`<input placeholder="Full Name" name="fullName">`);
      const fields = extractFormFields();
      expect(fields[0].label).toBe("Full Name");
    });

    it("falls back to humanized name attribute as last resort", () => {
      setBody(`<input name="years_of_experience">`);
      const fields = extractFormFields();
      expect(fields[0].label).toBe("Years Of Experience");
    });

    it("uses preceding sibling text as label", () => {
      setBody(`
        <div class="label">Work Authorization</div>
        <select name="workAuth">
          <option>US Citizen</option>
          <option>H1-B</option>
        </select>
      `);
      const fields = extractFormFields();
      expect(fields[0].label).toBe("Work Authorization");
    });
  });

  describe("type detection", () => {
    it("detects text inputs", () => {
      setBody(`<input name="firstName">`);
      expect(extractFormFields()[0].type).toBe("text");
    });

    it("detects email inputs", () => {
      setBody(`<input type="email" name="email">`);
      expect(extractFormFields()[0].type).toBe("email");
    });

    it("detects tel inputs", () => {
      setBody(`<input type="tel" name="phone">`);
      expect(extractFormFields()[0].type).toBe("tel");
    });

    it("detects textarea", () => {
      setBody(`<textarea name="bio"></textarea>`);
      expect(extractFormFields()[0].type).toBe("textarea");
    });

    it("detects select dropdowns", () => {
      setBody(`<select name="country"><option>US</option></select>`);
      expect(extractFormFields()[0].type).toBe("select");
    });

    it("detects checkboxes", () => {
      setBody(`<input type="checkbox" name="agree">`);
      expect(extractFormFields()[0].type).toBe("checkbox");
    });

    it("detects radio buttons", () => {
      setBody(`<input type="radio" name="gender" value="M">`);
      expect(extractFormFields()[0].type).toBe("radio");
    });

    it("detects file inputs", () => {
      setBody(`<input type="file" name="resume">`);
      expect(extractFormFields()[0].type).toBe("file");
    });
  });

  describe("required detection", () => {
    it("detects required attribute", () => {
      setBody(`<input name="email" type="email" required>`);
      expect(extractFormFields()[0].required).toBe(true);
    });

    it("detects aria-required='true'", () => {
      setBody(`<input name="name" aria-required="true">`);
      expect(extractFormFields()[0].required).toBe(true);
    });

    it("marks fields without required as not required", () => {
      setBody(`<input name="optionalField">`);
      expect(extractFormFields()[0].required).toBe(false);
    });
  });

  describe("selector generation", () => {
    it("prefers a stable id over attributes", () => {
      setBody(`<input id="firstName" name="firstName">`);
      expect(extractFormFields()[0].selector).toBe("#firstName");
    });

    it("rejects auto-generated ids and falls back to name selector", () => {
      // IDs matching auto-generated patterns (numeric, input-N) should not be used
      setBody(`<input id="input-7" name="email" type="email">`);
      const sel = extractFormFields()[0].selector;
      expect(sel).toContain('[name="email"]');
    });

    it("rejects UUID-like ids", () => {
      setBody(
        `<input id="550e8400-e29b-41d4-a716-446655440000" name="phone" type="tel">`,
      );
      const sel = extractFormFields()[0].selector;
      expect(sel).toContain('[name="phone"]');
    });

    it("uses data-testid when name is absent", () => {
      setBody(`<input data-testid="email-input">`);
      expect(extractFormFields()[0].selector).toBe('[data-testid="email-input"]');
    });
  });

  describe("placeholder capture", () => {
    it("captures placeholder text", () => {
      setBody(`<input placeholder="your@email.com" name="email">`);
      expect(extractFormFields()[0].placeholder).toBe("your@email.com");
    });

    it("returns null when no placeholder", () => {
      setBody(`<input name="name">`);
      expect(extractFormFields()[0].placeholder).toBeNull();
    });
  });

  it("handles a realistic form with mixed field types", () => {
    setBody(`
      <form id="job-app">
        <label for="first">First Name <span class="req">*</span></label>
        <input id="first" name="firstName" required>

        <label for="last">Last Name <span class="req">*</span></label>
        <input id="last" name="lastName" required>

        <label for="email">Email</label>
        <input id="email" name="email" type="email" required>

        <label for="phone">Phone</label>
        <input id="phone" name="phone" type="tel">

        <label for="linkedin">LinkedIn URL</label>
        <input id="linkedin" name="linkedin" type="url">

        <label for="grad">Graduation Year</label>
        <select id="grad" name="gradYear">
          <option>2024</option>
          <option>2025</option>
        </select>

        <label for="resume">Upload Resume</label>
        <input id="resume" name="resume" type="file">

        <label>
          <input type="checkbox" name="agreeTerms"> I agree
        </label>
      </form>
    `);

    const fields = extractFormFields();
    expect(fields).toHaveLength(8);

    const firstName = fields.find((f) => f.label === "First Name *");
    expect(firstName).toBeDefined();
    expect(firstName!.type).toBe("text");
    expect(firstName!.required).toBe(true);
    expect(firstName!.selector).toBe("#first");

    const email = fields.find((f) => f.label === "Email");
    expect(email).toBeDefined();
    expect(email!.type).toBe("email");
    expect(email!.required).toBe(true);

    const phone = fields.find((f) => f.label === "Phone");
    expect(phone).toBeDefined();
    expect(phone!.type).toBe("tel");
    expect(phone!.required).toBe(false);

    const grad = fields.find((f) => f.label === "Graduation Year");
    expect(grad).toBeDefined();
    expect(grad!.type).toBe("select");

    const resume = fields.find((f) => f.label === "Upload Resume");
    expect(resume).toBeDefined();
    expect(resume!.type).toBe("file");

    const agree = fields.find((f) => f.label === "I agree");
    expect(agree).toBeDefined();
    expect(agree!.type).toBe("checkbox");
  });

  it("only returns visible fields", () => {
    setBody(`
      <input id="visible" name="visibleField">
      <input id="invisible" name="hiddenField" style="display:none">
      <input id="invisible2" name="hiddenField2" style="visibility:hidden">
    `);
    const fields = extractFormFields();
    expect(fields).toHaveLength(1);
    expect(fields[0].selector).toBe("#visible");
  });

  it("deduplicates fields with the same selector", () => {
    // Two identical selectors (e.g., same name) — should only appear once
    setBody(`
      <input name="duplicated">
      <input name="duplicated">
    `);
    const fields = extractFormFields();
    expect(fields).toHaveLength(1);
  });
});
