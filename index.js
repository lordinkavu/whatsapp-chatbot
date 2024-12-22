import "./helpers/initEnv.js";
import "./helpers/initDb.js";

import express from "express";

import router from "./routes/index.js";
import cors from "cors";
import cron from "node-cron";
import { processCheckIns } from "./utilities/processMessage.js";

const app = express();

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.use(express.urlencoded({ extended: true }));

// Add CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        /^https?:\/\/([\w-]+\.)*whatsmemo\.com$/,
        /^http?:\/\/([\w-]+\.)*localhost:5173$/,
      ];

      if (!origin || allowedOrigins.some((regex) => regex.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(router);

app.get("/", async (req, res) => {
  res.send("Hello World");
});

const port = process.env.PORT || 3000;

cron.schedule("* * * * *", () => {
  processCheckIns();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
