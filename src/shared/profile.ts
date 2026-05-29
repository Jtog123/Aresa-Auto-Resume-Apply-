import type { ResumeProfile } from "./types";

export function createEmptyProfile(): ResumeProfile {
  return {
    name: "",
    email: "",
    phone: "",
    skills: [],
    experience: [],
    education: [],
  };
}

export function isValidProfile(profile: ResumeProfile): boolean {
  return profile.name.length > 0 && profile.email.length > 0;
}
