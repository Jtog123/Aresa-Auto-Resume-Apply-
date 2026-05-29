import { extractFormFields } from "./dom-extractor";

console.log("content script loaded");

const fields = extractFormFields();
console.log("Resume Agent — detected fields:", JSON.stringify(fields, null, 2));
