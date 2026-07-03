export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const requiredEnv = [
      "MONGODB_URI",
      "AUTH_SECRET",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "TWILIO_ACCOUNT_SID",
      "TWILIO_AUTH_TOKEN",
      "TWILIO_VERIFY_SERVICE_SID",
      "EMAIL_SERVER_USER",
      "EMAIL_SERVER_PASSWORD",
      "EMAIL_FROM"
    ];

    const missing = requiredEnv.filter(name => !process.env[name]);
    if (missing.length > 0) {
      console.error("\x1b[31m[FIXORA BOOTSTRAP ERROR] Missing required environment variables:\x1b[0m");
      missing.forEach(name => {
        console.error(`\x1b[33m  - Missing ${name}\x1b[0m`);
      });
    } else {
      console.log("\x1b[32m[FIXORA BOOTSTRAP] All required environment variables are set.\x1b[0m");
    }
  }
}
