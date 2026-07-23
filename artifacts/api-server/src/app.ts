import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
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

// Global JSON error handler — must come after all routes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error({ err: error }, "Unhandled route error");

  // Translate common Postgres constraint violations into readable messages
  const msg = error.message ?? "";
  if (msg.includes("duplicate key") || msg.includes("unique constraint")) {
    if (msg.includes("asset_code")) {
      res.status(409).json({ error: "Asset Code already exists. Please use a unique code." });
      return;
    }
    if (msg.includes("site_code")) {
      res.status(409).json({ error: "Site Code already exists. Please use a unique code." });
      return;
    }
    if (msg.includes("project_code")) {
      res.status(409).json({ error: "Project Code already exists. Please use a unique code." });
      return;
    }
    res.status(409).json({ error: "A record with that value already exists." });
    return;
  }

  res.status(500).json({ error: error.message || "Internal server error." });
});

export default app;
