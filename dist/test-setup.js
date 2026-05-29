"use strict";
// CSS.escape polyfill for environments that lack it (e.g. happy-dom)
// Spec: https://drafts.csswg.org/cssom/#the-css.escape()-method
if (typeof CSS !== "undefined" && !CSS.escape) {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    CSS.escape = function escape(value) {
        const s = String(value);
        const length = s.length;
        if (length === 0)
            return "";
        let result = "";
        for (let i = 0; i < length; i++) {
            const ch = s.charAt(i);
            const code = s.charCodeAt(i);
            // NULL
            if (code === 0x0) {
                result += "\uFFFD";
                continue;
            }
            // Control characters (0x01–0x1F, 0x7F)
            if ((code >= 0x01 && code <= 0x1f) || code === 0x7f) {
                result += "\\" + code.toString(16) + " ";
                continue;
            }
            // ASCII alphanumeric
            if ((code >= 0x30 && code <= 0x39) ||
                (code >= 0x41 && code <= 0x5a) ||
                (code >= 0x61 && code <= 0x7a)) {
                result += ch;
                continue;
            }
            // Underscore, hyphen (non-first position)
            if (code === 0x5f) {
                // _
                result += ch;
                continue;
            }
            if (code === 0x2d) {
                // -
                result += ch;
                continue;
            }
            // Non-ASCII or any other character — escape
            result += "\\" + ch;
        }
        return result;
    };
}
//# sourceMappingURL=test-setup.js.map