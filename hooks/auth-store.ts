const PENDING_EMAIL_KEY = "rideshare_pending_email";
const VERIFIED_KEY = "rideshare_verified";

export const authStore = {
  getPendingEmail() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(PENDING_EMAIL_KEY);
  },

  setPendingEmail(email: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PENDING_EMAIL_KEY, email);
  },

  isPending() {
    return Boolean(this.getPendingEmail());
  },

  isVerified() {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(VERIFIED_KEY) === "true";
  },

  setVerified() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VERIFIED_KEY, "true");
    window.localStorage.removeItem(PENDING_EMAIL_KEY);
  },

  clear() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(PENDING_EMAIL_KEY);
    window.localStorage.removeItem(VERIFIED_KEY);
  },
};
