require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGODB_URI = (process.env.MONGODB_URI || "").trim();
const CLOUD_KEY = (process.env.OLLAMA_API_KEY || "").trim();
const IS_CLOUD = Boolean(CLOUD_KEY);
const MODEL = process.env.OLLAMA_MODEL || (IS_CLOUD ? "gemma4:31b" : "gemma4:e2b");
const CLOUD_URL = process.env.OLLAMA_CLOUD_URL || "https://ollama.com/api/chat";
const LOCAL_URL = process.env.OLLAMA_LOCAL_URL || "http://127.0.0.1:11434/api/chat";
const OLLAMA_URL = IS_CLOUD ? CLOUD_URL : LOCAL_URL;
const AI_TIMEOUT_MS = Math.max(30000, Math.min(Number(process.env.AI_TIMEOUT_MS) || 180000, 300000));

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const ALLOWED_CATEGORIES = new Set([
  "General campus issue",
  "Transport and buses",
  "Classes and academics",
  "Facilities and maintenance",
  "Notices and administration",
  "Clubs and campus events",
  "Student wellbeing",
  "Careers and opportunities",
  "Safety and accessibility"
]);


const historySchema = new mongoose.Schema({
  browserIdHash: { type: String, required: true, index: true },
  clientRecordId: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  problem: { type: String, required: true, maxlength: 2500 },
  category: { type: String, required: true, maxlength: 100 },
  location: { type: String, default: "", maxlength: 120 },
  requestedLanguage: { type: String, enum: ["auto", "bn", "en"], default: "auto" },
  answerLanguage: { type: String, enum: ["Bengali", "English"], default: "English" },
  answer: { type: String, required: true, maxlength: 12000 }
}, { versionKey: false });

historySchema.index({ browserIdHash: 1, clientRecordId: 1 }, { unique: true });
const HistoryRecord = mongoose.models.CampusSathiHistory ||
  mongoose.model("CampusSathiHistory", historySchema);

function getHistoryOwnerHash(req, res) {
  const cookieName = "campus_sathi_history";
  const cookiePrefix = cookieName + "=";
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(cookiePrefix));
  let token = cookie ? cookie.slice(cookiePrefix.length) : "";

  if (!/^[a-f0-9]{64}$/.test(token)) {
    token = crypto.randomBytes(32).toString("hex");
    const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
    const secure = process.env.NODE_ENV === "production" || req.secure || forwardedProto === "https" ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      cookieName + "=" + token + "; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax" + secure
    );
  }

  return crypto.createHash("sha256").update(token).digest("hex");
}

function historyIsConnected(res) {
  if (mongoose.connection.readyState === 1) return true;
  res.setHeader("Cache-Control", "no-store");
  res.status(503).json({ error: "MongoDB History is unavailable. Check MONGODB_URI and the database connection." });
  return false;
}

function toPublicHistoryRecord(record) {
  return {
    id: record.clientRecordId,
    createdAt: new Date(record.createdAt).toISOString(),
    problem: record.problem,
    category: record.category,
    location: record.location || "",
    requestedLanguage: record.requestedLanguage || "auto",
    answerLanguage: record.answerLanguage || "English",
    answer: record.answer
  };
}

function hasBengaliScript(value) {
  return Array.from(value).some(char => {
    const codePoint = char.codePointAt(0);
    return codePoint >= 0x0980 && codePoint <= 0x09FF;
  });
}

function looksLikeBanglish(value) {
  return /\b(ami|amra|amar|amader|apni|tumi|tomar|ki|kivabe|keno|kemon|ache|nai|hobe|korbo|korte|lagbe|hochhe|hocche|varsity|class|exam|bus|notice|teacher|student|campus)\b/i.test(value);
}

function resolveLanguage(problem, requested) {
  if (requested === "bn") return "Bengali";
  if (requested === "en") return "English";
  if (hasBengaliScript(problem) || looksLikeBanglish(problem)) return "Bengali";
  return "English";
}

app.get("/api/health", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json({
    ok: true,
    service: "CampusSathi AI",
    provider: IS_CLOUD ? "Ollama Cloud" : "Local Ollama",
    model: MODEL,
    database: mongoose.connection.readyState === 1 ? "connected" : (MONGODB_URI ? "disconnected" : "not_configured"),
    voiceFeatures: "Browser Web Speech API"
  });
});


app.get("/api/history", async (req, res) => {
  if (!historyIsConnected(res)) return;
  try {
    const browserIdHash = getHistoryOwnerHash(req, res);
    const records = await HistoryRecord.find({ browserIdHash })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.setHeader("Cache-Control", "no-store");
    return res.json({ items: records.map(toPublicHistoryRecord) });
  } catch (error) {
    console.error("History read failed:", error.message);
    return res.status(500).json({ error: "Could not load saved History." });
  }
});

app.post("/api/history", async (req, res) => {
  if (!historyIsConnected(res)) return;
  const body = req.body || {};
  const id = typeof body.id === "string" ? body.id.trim() : "";
  const problem = typeof body.problem === "string" ? body.problem.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";

  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
    return res.status(400).json({ error: "A valid History record ID is required." });
  }
  if (!problem || problem.length > 2500) {
    return res.status(400).json({ error: "Problem must contain 1 to 2500 characters." });
  }
  if (!answer || answer.length > 12000) {
    return res.status(400).json({ error: "Answer must contain 1 to 12000 characters." });
  }

  const requestedLanguage = ["auto", "bn", "en"].includes(body.requestedLanguage)
    ? body.requestedLanguage
    : "auto";
  const category = typeof body.category === "string" && ALLOWED_CATEGORIES.has(body.category)
    ? body.category
    : "General campus issue";
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 120) : "";
  const answerLanguage = body.answerLanguage === "Bengali" ? "Bengali" : "English";
  const parsedDate = new Date(body.createdAt || Date.now());
  const createdAt = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  try {
    const browserIdHash = getHistoryOwnerHash(req, res);
    const record = await HistoryRecord.findOneAndUpdate(
      { browserIdHash, clientRecordId: id },
      {
        $set: { problem, category, location, requestedLanguage, answerLanguage, answer },
        $setOnInsert: { browserIdHash, clientRecordId: id, createdAt }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    const overflow = await HistoryRecord.find({ browserIdHash })
      .sort({ createdAt: -1 })
      .skip(50)
      .select("_id")
      .lean();
    if (overflow.length) {
      await HistoryRecord.deleteMany({
        browserIdHash,
        _id: { $in: overflow.map(item => item._id) }
      });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ item: toPublicHistoryRecord(record) });
  } catch (error) {
    console.error("History save failed:", error.message);
    return res.status(500).json({ error: "Could not save this History record." });
  }
});

app.delete("/api/history/:id", async (req, res) => {
  if (!historyIsConnected(res)) return;
  const id = typeof req.params.id === "string" ? req.params.id : "";
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) {
    return res.status(400).json({ error: "A valid History record ID is required." });
  }
  try {
    const browserIdHash = getHistoryOwnerHash(req, res);
    const result = await HistoryRecord.deleteOne({ browserIdHash, clientRecordId: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "History record not found." });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.json({ deleted: true });
  } catch (error) {
    console.error("History delete failed:", error.message);
    return res.status(500).json({ error: "Could not delete this History record." });
  }
});

app.delete("/api/history", async (req, res) => {
  if (!historyIsConnected(res)) return;
  try {
    const browserIdHash = getHistoryOwnerHash(req, res);
    await HistoryRecord.deleteMany({ browserIdHash });
    res.setHeader("Cache-Control", "no-store");
    return res.json({ cleared: true });
  } catch (error) {
    console.error("History clear failed:", error.message);
    return res.status(500).json({ error: "Could not clear saved History." });
  }
});

app.post("/api/help", async (req, res) => {
  const body = req.body || {};
  const problem = body.problem;
  const category = typeof body.category === "string" && ALLOWED_CATEGORIES.has(body.category)
    ? body.category
    : "General campus issue";
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 120) : "";
  const requestedLanguage = ["auto", "bn", "en"].includes(body.language) ? body.language : "auto";

  if (typeof problem !== "string" || !problem.trim()) {
    return res.status(400).json({ error: "Please describe a campus problem first." });
  }
  if (problem.length > 2500) {
    return res.status(400).json({ error: "Keep the description under 2500 characters." });
  }

  const answerLanguage = resolveLanguage(problem, requestedLanguage);
  const languageRules = answerLanguage === "Bengali"
    ? "Write the complete response in natural Bengali using বাংলা script. All headings, category names, explanations, suggested steps and warnings must be in Bengali. Do not respond in English unless a proper name or technical term needs to remain."
    : "Write the complete response in clear, plain English.";

  const headings = answerLanguage === "Bengali"
    ? "Use these bold headings, each on its own line and in this order:\n**সমস্যার ধরন**\n**সংক্ষিপ্ত মূল্যায়ন**\n**অগ্রাধিকারভিত্তিক করণীয়**\n**যা এড়িয়ে চলবেন**\n**কখন বিশ্ববিদ্যালয় কর্তৃপক্ষ বা উপযুক্ত স্থানীয় সেবার সঙ্গে যোগাযোগ করবেন**"
    : "Use these bold headings, each on its own line and in this order:\n**Problem category**\n**Short assessment**\n**Prioritized action steps**\n**What to avoid**\n**When to contact the university or an appropriate local service**";

  const messages = [
    {
      role: "system",
      content: [
        "You are CampusSathi AI, a concise and practical university-life assistant powered by Gemma.",
        languageRules,
        headings,
        "Write at most 220 words. Give exactly three prioritized actions. Use the selected category and location only as user-provided context.",
        "Never claim to submit reports, contact university staff, or know unverified campus policies, contacts, hours, or URLs.",
        "For immediate danger, tell the user to contact verified campus security or local emergency services. Do not request passwords, student IDs, or private personal data.",
        "End with one short reminder to verify important details with official campus sources."
      ].join("\n")
    },
    {
      role: "user",
      content: [
        "Problem area: " + category,
        location ? "Campus location (provided by user): " + location : "",
        "Student's description:\n" + problem.trim()
      ].filter(Boolean).join("\n\n")
    }
  ];

  try {
    const headers = { "Content-Type": "application/json" };
    if (IS_CLOUD) headers.Authorization = "Bearer " + CLOUD_KEY;

    const response = await fetch(OLLAMA_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        think: false,
        options: { temperature: 0.25, num_predict: 450 }
      }),
      signal: AbortSignal.timeout(AI_TIMEOUT_MS)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("AI provider error:", response.status, JSON.stringify(data));
      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({
          error: "AI authentication failed. Check the server's OLLAMA_API_KEY environment variable."
        });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: "AI rate limit reached. Please wait a moment and retry." });
      }
      return res.status(502).json({ error: "AI provider request failed. Check the server logs and model configuration." });
    }

    const answer = data.message && typeof data.message.content === "string"
      ? data.message.content.trim()
      : "";
    if (!answer) {
      console.error("AI provider returned an empty answer.");
      return res.status(502).json({ error: "The AI returned an empty answer. Please try again." });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.json({
      answer,
      language: answerLanguage,
      provider: IS_CLOUD ? "Ollama Cloud" : "Local Ollama",
      model: MODEL
    });
  } catch (error) {
    console.error("AI request failed:", error.name, error.message);
    return res.status(503).json({
      error: error.name === "TimeoutError" || error.name === "AbortError"
        ? "The AI provider did not respond in time. Please retry. If this keeps happening, check the server logs and AI provider configuration."
        : "Could not connect to the AI model. Check the API key, network, or local Ollama service."
    });
  }
});

async function startServer() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000
      });
      console.log("MongoDB connected successfully.");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
      process.exit(1);
    }
  } else {
    console.warn("MONGODB_URI is not set. Starting without MongoDB; saved History is still browser-local.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log("CampusSathi AI is running on port " + PORT);
    console.log("Provider: " + (IS_CLOUD ? "Ollama Cloud" : "Local Ollama") + " | Model: " + MODEL);
    console.log("Database: " + (mongoose.connection.readyState === 1 ? "MongoDB connected" : "not configured"));
  });
}

startServer();