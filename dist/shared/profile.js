export function createEmptyProfile() {
    return {
        name: "",
        email: "",
        phone: "",
        skills: [],
        experience: [],
        education: [],
    };
}
export function isValidProfile(profile) {
    return profile.name.length > 0 && profile.email.length > 0;
}
//# sourceMappingURL=profile.js.map