/**
 * Non-fatal startup checks for required/optional environment variables.
 * Does not expose secret values.
 */
export type EnvValidationResult = {
  errors: string[];
  warnings: string[];
  flags: {
    database: "sqlite" | "mysql" | "unknown";
    stripePublishable: boolean;
    stripeSecret: boolean;
    stripeWebhook: boolean;
    smtp: boolean;
    appUrlHttps: boolean;
    sessionSecret: boolean;
  };
};

export function validateServerEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mysqlHost = process.env.MYSQL_HOST || process.env.CLOUD_SQL_HOST;
  const mysqlUser = process.env.MYSQL_USER || process.env.CLOUD_SQL_USER;
  const mysqlPass = process.env.MYSQL_PASSWORD || process.env.CLOUD_SQL_PASSWORD;
  const database: EnvValidationResult["flags"]["database"] =
    mysqlHost && mysqlUser && mysqlPass ? "mysql" : "sqlite";

  const sk = String(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET || "").trim();
  const pk = String(process.env.STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLIC_KEY || "").trim();
  const wh = String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();

  if (sk && pk && sk.startsWith("sk_live_") !== pk.startsWith("pk_live_")) {
    warnings.push("STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY should both be test or both live (prefix sk_/pk_).");
  }
  if (sk && !pk) warnings.push("STRIPE_PUBLISHABLE_KEY missing while STRIPE_SECRET_KEY is set — wallet UI may fail.");
  if (pk && !sk) warnings.push("STRIPE_SECRET_KEY missing while publishable key is set — payments cannot be created.");

  const appUrl = process.env.APP_URL || process.env.BASE_URL || "";
  if (appUrl && !appUrl.startsWith("https:")) {
    warnings.push("APP_URL is not https — use https in production for secure cookies.");
  }

  const smtp =
    !!(process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASS || process.env.SMTP_PASSWORD));

  const sessionSecret = String(process.env.SESSION_SECRET || process.env.COOKIE_SECRET || "").trim();
  if (sessionSecret && sessionSecret.length < 32) {
    warnings.push("SESSION_SECRET should be at least 32 characters for signed session cookies.");
  }
  if (!sessionSecret && process.env.NODE_ENV === "production") {
    errors.push("SESSION_SECRET is required in production (signed sessions; min 32 chars).");
  }
  if (!sessionSecret && process.env.NODE_ENV !== "production") {
    warnings.push("SESSION_SECRET not set — session cookies are unsigned (dev only). Set SESSION_SECRET before production.");
  }

  return {
    errors,
    warnings,
    flags: {
      database,
      stripePublishable: !!pk,
      stripeSecret: !!sk,
      stripeWebhook: !!wh,
      smtp,
      appUrlHttps: appUrl.startsWith("https:"),
      sessionSecret: sessionSecret.length >= 32,
    },
  };
}
