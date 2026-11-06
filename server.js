"use strict";

const http = require("node:http");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 256 * 1024;

const startTime = Date.now();

const metrics = {
  requests: 0,
  analyses: 0,
  simulations: 0,
  agents: 0
};

function response(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });

  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", chunk => {
      size += chunk.length;

      if (size > MAX_BODY) {
        const error = new Error("Request too large");
        error.status = 413;
        reject(error);
        req.destroy();
        return;
      }

      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        const error = new Error("Invalid JSON");
        error.status = 400;
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

// NOVA Intelligence Engine
function intelligenceEngine(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw Object.assign(
      new Error("Text input is required"),
      { status: 400 }
    );
  }

  if (input.length > 20000) {
    throw Object.assign(
      new Error("Maximum text length is 20000 characters"),
      { status: 400 }
    );
  }

  const text = input.trim();

  const words = text.match(/[\p{L}\p{N}]+/gu) || [];

  const sentences = text
    .split(/[.!?]+/)
    .filter(sentence => sentence.trim());

  const frequency = {};

  for (const word of words) {
    const key = word.toLowerCase();

    if (key.length >= 4) {
      frequency[key] = (frequency[key] || 0) + 1;
    }
  }

  const keywords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({
      word,
      frequency: count
    }));

  return {
    id: crypto.randomUUID(),
    summary: `Analyzed ${words.length} words and ${sentences.length} sentences.`,
    statistics: {
      characters: text.length,
      words: words.length,
      sentences: sentences.length,
      uniqueKeywords: keywords.length
    },
    keywords,
    engine: "NOVA Intelligence Engine 1.0",
    analysisType: "Statistical text analysis",
    generatedAt: new Date().toISOString()
  };
}

// Agent orchestration
async function agentEngine(task, input) {
  if (typeof task !== "string" || !task.trim()) {
    throw Object.assign(
      new Error("Agent task is required"),
      { status: 400 }
    );
  }

  const analysis = intelligenceEngine(input);

  return {
    agentId: "NOVA-RESEARCH-001",
    task,
    status: "completed",
    output: analysis
  };
}

// Mathematical simulation
function simulationEngine(data) {
  const { name, baseline, changePercent } = data;

  if (
    typeof name !== "string" ||
    typeof baseline !== "number" ||
    !Number.isFinite(baseline) ||
    typeof changePercent !== "number" ||
    !Number.isFinite(changePercent) ||
    changePercent < -100 ||
    changePercent > 100
  ) {
    throw Object.assign(
      new Error("Invalid simulation parameters"),
      { status: 400 }
    );
  }

  return {
    scenario: name,
    baseline,
    changePercent,
    projectedValue: Number(
      (baseline * (1 + changePercent / 100)).toFixed(4)
    ),
    disclaimer: "Mathematical scenario, not a real-world prediction."
  };
}

// Main API
const server = http.createServer(async (req, res) => {
  metrics.requests++;

  const url = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  try {

    if (req.method === "GET" && url.pathname === "/") {
      return response(res, 200, {
        name: "NOVA OMNIVERSE AI",
        version: "1.0.0",
        status: "operational",
        description: "Modular intelligence and simulation platform",
        endpoints: [
          "/api/v1/health",
          "/api/v1/analyze",
          "/api/v1/agents/research",
          "/api/v1/simulate",
          "/api/v1/metrics"
        ]
      });
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/v1/health"
    ) {
      return response(res, 200, {
        status: "healthy",
        service: "NOVA OMNIVERSE AI",
        uptimeSeconds: Math.floor(
          (Date.now() - startTime) / 1000
        ),
        timestamp: new Date().toISOString()
      });
    }

    if (
      req.method === "GET" &&
      url.pathname === "/api/v1/metrics"
    ) {
      return response(res, 200, {
        ...metrics,
        uptimeSeconds: Math.floor(
          (Date.now() - startTime) / 1000
        )
      });
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/v1/analyze"
    ) {
      const body = await readBody(req);

      const result = intelligenceEngine(body.text);

      metrics.analyses++;

      return response(res, 200, {
        success: true,
        result
      });
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/v1/agents/research"
    ) {
      const body = await readBody(req);

      const result = await agentEngine(
        body.task,
        body.input
      );

      metrics.agents++;

      return response(res, 200, {
        success: true,
        result
      });
    }

    if (
      req.method === "POST" &&
      url.pathname === "/api/v1/simulate"
    ) {
      const body = await readBody(req);

      const result = simulationEngine(body);

      metrics.simulations++;

      return response(res, 200, {
        success: true,
        result
      });
    }

    return response(res, 404, {
      success: false,
      error: "Endpoint not found"
    });

  } catch (error) {

    return response(res, error.status || 500, {
      success: false,
      error: error.status ? error.message : "Internal server error"
    });

  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------");
  console.log("NOVA OMNIVERSE AI");
  console.log("Version: 1.0.0");
  console.log(`Port: ${PORT}`);
  console.log("Status: Operational");
  console.log("--------------------------------");
});
