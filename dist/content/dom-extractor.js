const FORM_FIELD_TAGS = new Set(["input", "textarea", "select"]);
const SKIP_INPUT_TYPES = new Set([
    "hidden",
    "submit",
    "reset",
    "button",
    "image",
]);
const GENERATED_ID_RE = /^(\d+|(input|field|form|ext-gen|ember|ng|_)-?\d+|[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})$/i;
/* ------------------------------------------------------------------ */
/*  Visibility                                                         */
/* ------------------------------------------------------------------ */
function isVisible(el) {
    if (el instanceof HTMLInputElement && el.type === "hidden")
        return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden")
        return false;
    // No getBoundingClientRect dimension check: it returns zeros in headless
    // environments, and the checks above cover real-world hidden-field cases.
    return true;
}
/* ------------------------------------------------------------------ */
/*  Label resolution — ordered by reliability                          */
/* ------------------------------------------------------------------ */
function resolveLabel(el) {
    const input = el;
    // 1. aria-label
    {
        const a = input.getAttribute("aria-label");
        if (a)
            return a;
    }
    // 2. aria-labelledby
    {
        const ids = input.getAttribute("aria-labelledby");
        if (ids) {
            const texts = [];
            for (const id of ids.split(/\s+/)) {
                const ref = document.getElementById(id);
                if (ref)
                    texts.push(ref.textContent?.trim() ?? "");
            }
            const joined = texts.filter(Boolean).join(" ");
            if (joined)
                return joined;
        }
    }
    // 3. <label for="id">
    if (el.id) {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) {
            const t = label.textContent?.trim();
            if (t)
                return t;
        }
    }
    // 4. input wrapped in <label>
    {
        let parent = el.parentElement;
        while (parent) {
            if (parent.tagName === "LABEL") {
                const clone = parent.cloneNode(true);
                clone.querySelector("input, textarea, select")?.remove();
                const t = clone.textContent?.trim();
                if (t)
                    return t;
                break;
            }
            parent = parent.parentElement;
        }
    }
    // 5. preceding element sibling (often a label, span, or div)
    {
        const prev = el.previousElementSibling;
        if (prev) {
            const t = prev.textContent?.trim();
            if (t && t.length < 120 && !/^\s*$/.test(t))
                return t;
        }
    }
    // 6. placeholder
    {
        const p = input.getAttribute("placeholder");
        if (p)
            return p;
    }
    // 7. title
    {
        const t = input.getAttribute("title");
        if (t)
            return t;
    }
    // 8. name → human-friendly
    {
        const n = input.getAttribute("name");
        if (n)
            return humanize(n);
    }
    return "";
}
function humanize(s) {
    return s
        .replace(/[-_]/g, " ")
        .replace(/([A-Z])/g, " $1")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
/* ------------------------------------------------------------------ */
/*  Type detection                                                      */
/* ------------------------------------------------------------------ */
function detectType(el) {
    if (el.tagName === "TEXTAREA")
        return "textarea";
    if (el.tagName === "SELECT")
        return "select";
    const t = el.type?.toLowerCase() || "text";
    switch (t) {
        case "email":
        case "tel":
        case "url":
        case "number":
        case "date":
        case "checkbox":
        case "radio":
        case "file":
        case "password":
            return t;
        default:
            return "text";
    }
}
/* ------------------------------------------------------------------ */
/*  CSS selector generation (stable, prefers unique attributes)        */
/* ------------------------------------------------------------------ */
function looksGenerated(id) {
    return GENERATED_ID_RE.test(id);
}
function nthChild(el) {
    let n = 1;
    let sib = el.previousElementSibling;
    while (sib) {
        n++;
        sib = sib.previousElementSibling;
    }
    return n;
}
function generateSelector(el) {
    // 1. clean id
    if (el.id && !looksGenerated(el.id)) {
        return `#${CSS.escape(el.id)}`;
    }
    const tag = el.tagName.toLowerCase();
    // 2. unique name attribute
    const name = el.getAttribute("name");
    if (name) {
        const all = document.querySelectorAll(`${tag}[name="${CSS.escape(name)}"]`);
        if (all.length === 1) {
            return `${tag}[name="${CSS.escape(name)}"]`;
        }
        // still the best we have
        return `${tag}[name="${CSS.escape(name)}"]`;
    }
    // 3. data-testid / data-qa / data-test
    for (const attr of ["data-testid", "data-qa", "data-test"]) {
        const v = el.getAttribute(attr);
        if (v)
            return `[${attr}="${CSS.escape(v)}"]`;
    }
    // 4. positional path (stop at form boundary)
    const parts = [];
    let current = el;
    while (current && current.tagName !== "BODY" && current.tagName !== "HTML") {
        const t = current.tagName.toLowerCase();
        const nth = nthChild(current);
        parts.unshift(`${t}:nth-child(${nth})`);
        current = current.parentElement;
        if (current?.tagName === "FORM") {
            parts.unshift("form");
            break;
        }
    }
    return parts.join(" > ");
}
/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */
export function extractFormFields() {
    const fields = [];
    const seen = new Set();
    const all = document.querySelectorAll("input, textarea, select");
    for (const el of all) {
        if (el.tagName === "INPUT") {
            const t = el.type?.toLowerCase();
            if (!t || SKIP_INPUT_TYPES.has(t))
                continue;
        }
        if (!isVisible(el))
            continue;
        const selector = generateSelector(el);
        if (seen.has(selector))
            continue;
        seen.add(selector);
        fields.push({
            label: resolveLabel(el),
            placeholder: el.getAttribute("placeholder") ?? null,
            type: detectType(el),
            selector,
            required: el.hasAttribute("required") ||
                el.getAttribute("aria-required") === "true",
        });
    }
    return fields;
}
//# sourceMappingURL=dom-extractor.js.map