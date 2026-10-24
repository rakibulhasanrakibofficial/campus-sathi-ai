require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CLOUD_KEY = (process.env.OLLAMA_API_KEY || "").trim();
const IS_CLOUD = Boolean(CLOUD_KEY);
const MODEL = process.env.OLLAMA_MODEL || (IS_CLOUD ? "gemma4:cloud" : "gemma4:e2b");
const CLOUD_URL = process.env.OLLAMA_CLOUD_URL || "https://ollama.com/api/chat";
const LOCAL_URL = process.env.OLLAMA_LOCAL_URL || "http://127.0.0.1:11434/api/chat";
const OLLAMA_URL = IS_CLOUD ? CLOUD_URL : LOCAL_URL;

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
    voiceFeatures: "Browser Web Speech API"
  });
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
        "You are CampusSathi AI, a helpful campus-life assistant powered by the Gemma open-weight model.",
        "Help university students reason through everyday campus issues such as transport, classes, notices, facilities, student clubs, accessibility, careers and wellbeing.",
        languageRules,
        headings,
        "Give a short, practical, non-judgmental plan with three prioritized actions. Use the supplied category as context, not as proof.",
        "Do not pretend to file an official report or contact the university. Never invent campus policies, office names, phone numbers, opening hours or URLs.",
        "For immediate danger or a medical emergency, advise the student to contact verified local emergency services or campus security. Do not present AI-generated advice as official university guidance.",
        "Do not ask the user to share passwords, student ID numbers, private phone numbers or other sensitive data.",
        "End with one concise verification note reminding the student to confirm important details with official campus sources."
      ].join("\n\n")
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
        options: { temperature: 0.35, num_predict: 850 }
      }),
      signal: AbortSignal.timeout(90000)
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
    console.error("AI request failed:", error.message);
    return res.status(503).json({
      error: error.name === "TimeoutError"
        ? "The AI took too long to respond. Please retry."
        : "Could not connect to the AI model. Check the API key or local Ollama service."
    });
  }
});

app.listen(PORT, () => {
  console.log("CampusSathi AI is running on port " + PORT);
  console.log("Provider: " + (IS_CLOUD ? "Ollama Cloud" : "Local Ollama") + " | Model: " + MODEL);
});