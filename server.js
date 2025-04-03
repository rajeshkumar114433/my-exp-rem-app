import { createRequestHandler } from "@remix-run/express";
import compression from "compression";
import express from "express";
import morgan from "morgan";

const viteDevServer =
  process.env.NODE_ENV === "production"
    ? undefined
    : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

const remixHandler = createRequestHandler({
  build: viteDevServer
    ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
    : await import("./build/server/index.js"),
});

const app = express();

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// handle asset requests
if (viteDevServer) {
  app.use(viteDevServer.middlewares);
} else {
  // Vite fingerprints its assets so we can cache forever.
  app.use(
    "/assets",
    express.static("build/client/assets", { immutable: true, maxAge: "1y" })
  );
}

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("build/client", { maxAge: "1h" }));

app.use(morgan("tiny"));

// API Routes
app.get("/api/users", (req, res) => {
    const users = [
        { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
        { id: 2, name: "Bob Smith", email: "bob@example.com", role: "User" },
        { id: 3, name: "Carol Davis", email: "carol@example.com", role: "Editor" },
        { id: 4, name: "David Wilson", email: "david@example.com", role: "User" },
        { id: 5, name: "Eva Brown", email: "eva@example.com", role: "Moderator" }
    ];

    res.json({
        success: true,
        timestamp: new Date().toISOString(),
        count: users.length,
        data: users
    });
});

app.get("/api/status", (req, res) => {
    res.json({
        status: "online",
        version: "1.0.0",
        serverTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// handle SSR requests
app.all("*", remixHandler);

const port = process.env.PORT || 3000;
app.listen(port, () =>
  console.log(`Express server listening at http://localhost:${port}`)
);
