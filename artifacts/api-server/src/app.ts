import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Walk the error + cause chain collecting all text we can inspect
function collectErrorText(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  const seen = new WeakSet();
  while (current && typeof current === "object") {
    if (seen.has(current as object)) break;
    seen.add(current as object);
    const e = current as Record<string, unknown>;
    if (typeof e["message"] === "string") parts.push(e["message"]);
    current = e["cause"];
  }
  return parts.join(" ");
}

// Walk the cause chain looking for a node-postgres error (has a 5-digit code)
function findPgError(err: unknown): Record<string, unknown> | null {
  let current: unknown = err;
  const seen = new WeakSet();
  while (current && typeof current === "object") {
    if (seen.has(current as object)) break;
    seen.add(current as object);
    const e = current as Record<string, unknown>;
    if (typeof e["code"] === "string" && /^\d{5}$/.test(e["code"] as string)) {
      return e;
    }
    current = e["cause"];
  }
  return null;
}

// Global JSON error handler — must come after all routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error({ err: error }, "Unhandled route error");

  // First try walking to a node-postgres error object (has numeric code + constraint)
  const pg = findPgError(err);
  const pgCode = pg ? (pg["code"] as string) : null;
  const constraint = pg ? ((pg["constraint"] as string | undefined) ?? "") : "";
  const pgDetail = pg ? ((pg["detail"] as string | undefined) ?? "") : "";

  // Collect all error text (Drizzle appends PG message to its own message after a colon)
  const allText = collectErrorText(err).toLowerCase();

  const isDuplicateKey =
    pgCode === "23505" ||
    allText.includes("duplicate key") ||
    allText.includes("unique constraint");

  if (isDuplicateKey) {
    // Determine which field is the duplicate
    const constraintText = constraint || allText;
    if (constraintText.includes("asset_code")) {
      res.status(409).json({ error: "Asset Code already exists. Please use a different code." });
      return;
    }
    if (constraintText.includes("site_code")) {
      res.status(409).json({ error: "Site Code already exists. Please use a different code." });
      return;
    }
    if (constraintText.includes("project_code")) {
      res.status(409).json({ error: "Project Code already exists. Please use a different code." });
      return;
    }
    if (constraintText.includes("unit_number")) {
      res.status(409).json({ error: "Unit Number already exists in this project." });
      return;
    }
    res.status(409).json({ error: pgDetail || "A record with that value already exists." });
    return;
  }

  if (pgCode === "23503" || allText.includes("foreign key")) {
    res.status(400).json({ error: "Referenced record not found." });
    return;
  }

  if (pgCode === "23502" || allText.includes("not-null constraint")) {
    res.status(400).json({ error: "A required field is missing." });
    return;
  }

  // Fall back to a clean 500 without leaking query internals
  res.status(500).json({ error: "Internal server error. Please try again." });
});

export default app;
