# ✳ CampusSathi AI

### Campus problems. Clear next steps.

**CampusSathi AI** is a bilingual, voice-enabled campus companion that helps university students turn everyday campus concerns into a clear, prioritized action plan. Students can describe an issue, choose a campus category, get suggestions powered by **Gemma through Ollama**, listen to the answer, copy it, or print/save it as a PDF.

<p align="center">
  <strong>বাংলা • English • Voice Input • AI Action Plans • PDF Export</strong>
</p>

> **Important:** CampusSathi provides AI-generated guidance. It does not submit an official university complaint, contact campus staff, verify university policies, or replace official university services or emergency support.

---

## 📚 Table of contents

- [Why CampusSathi?](#-why-campussathi)
- [Features](#-features)
- [Local report history](#-local-report-history)
- [How it works](#-how-it-works)
- [Technology stack](#-technology-stack)
- [Project structure](#-project-structure)
- [Run locally](#-run-locally)
- [Environment variables](#-environment-variables)
- [API reference](#-api-reference)
- [Voice and browser support](#-voice-and-browser-support)
- [Privacy, safety, and limitations](#-privacy-safety-and-limitations)
- [AI and model disclosure](#-ai-and-model-disclosure)
- [Testing checklist](#-testing-checklist)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🎯 Why CampusSathi?

University students face small but recurring problems—late buses, unclear notices, broken classroom equipment, accessibility concerns, and difficulty finding student opportunities. Knowing the next practical step is not always obvious.

CampusSathi gives students a simple place to describe a concern and receive structured suggestions in Bengali or English. The goal is to make the next step easier to understand, not to replace university staff or official reporting channels.

## ✨ Features

### 🧠 AI-powered campus action plans

- Describe a campus problem in your own words.
- Select a relevant problem category and optionally add a campus location.
- Receive an answer powered by a Gemma model through Ollama.
- The model is instructed to organize the response into a problem category, short assessment, prioritized actions, things to avoid, and guidance on when to contact the university or an appropriate local service.
- The prompt asks for **three prioritized actions** and a concise answer.
- The answer reminds users to verify important information with official sources.

### 🌐 Bengali and English

- **Interface language:** switch between Bengali and English for the app's interface.
- **Answer language:** choose Bengali, English, or match the language inferred from the issue.
- **Automatic language detection:** Bengali script and common Banglish terms are used as signals when the answer language is set to automatic.
- **Bengali-first guidance:** when Bengali is selected or detected, the model is instructed to return its headings and guidance in Bengali script.

### 🎙 Voice input

- Use **Speak instead** to dictate a campus issue instead of typing.
- Choose a microphone language: **বাংলা (বাংলাদেশ), English (US), or English (UK)**.
- Review and edit the recognized text before submitting it to the AI.
- Browser speech recognition is optional; typing always remains available.

### 🔊 Listen to the answer

- Play the generated answer using the browser/device text-to-speech engine.
- Stop playback whenever needed, then listen again.
- The playback code separates Bengali-script and English chunks to request a suitable language voice for each part.
- Speech is played at a slightly slower rate to make the answer easier to follow.
- Voice quality depends on the browser, operating system, and installed voices—especially for Bengali.

### 📄 Copy, print, and PDF

- **Copy** the generated answer to the clipboard.
- **Print / PDF** opens the browser's print dialog.
- To create a PDF, choose **Save as PDF** in the print dialog.
- The print layout hides the form and action buttons so the output focuses on the answer.

### 🧭 Campus issue categories

The form supports these categories:

- General campus issue
- Transport and buses
- Classes and academics
- Facilities and maintenance
- Notices and administration
- Clubs and campus events
- Student wellbeing
- Careers and opportunities
- Safety and accessibility

The sidebar also has clickable quick-category cards. Example prompts can fill the form and select a matching category, helping new users get started quickly.

### 📚 Saved report history

- Successfully generated reports are saved in the browser’s `localStorage` for quick access.
- When `MONGODB_URI` is configured, History is also stored in MongoDB through the backend API.
- On first connection, existing browser-local reports are migrated into MongoDB when they are not already present there.
- Open the **History** control to reopen a saved report, listen to its answer, copy it, print it, delete one item, or clear all items.
- History is limited to the **50 most recent reports per browser profile**.
- This project does not have user accounts yet. A random HttpOnly browser cookie scopes MongoDB records to that browser; clearing the cookie can disconnect you from its earlier database History. History does not automatically sync across devices.
- If MongoDB is not configured or becomes unavailable, the app keeps using browser-local History. Avoid sensitive personal information and clear History on shared devices.

### 🧩 Helpful interface details

- A responsive, custom dark interface with bright cyan, mint, violet, and pink accents.
- Mobile-friendly answer controls with clearly distinguished Listen, Stop, Copy, and Print actions.
- Character counter and a 2,500-character limit for the problem description.
- Optional campus-location field (up to 120 characters on the server).
- New Report control to clear the current draft and start another issue.
- Loading, validation, provider-error, microphone-status, and speech-playback messages.
- A privacy reminder and safety note in the interface.

---

## 🔄 How it works

1. **Describe a problem** by typing or using supported browser speech recognition.
2. **Choose a category** and optionally provide a location.
3. **Select an answer language** or leave it on automatic detection.
4. **Build an action plan.** The backend validates the input and sends it to the configured Gemma model through Ollama.
5. **Use the answer**—read it, listen, copy it, or print/save it as a PDF. Successful answers are also saved in the current browser’s History, where they can be reopened or deleted.

CampusSathi provides guidance only. It does not create a ticket, send a complaint to the university, or contact anyone on the student's behalf.

---

## 🧰 Technology stack

| Area | Technology |
| --- | --- |
| Frontend | HTML5, CSS3, vanilla JavaScript |
| Backend | Node.js and Express |
| Configuration | dotenv and environment variables |
| Database connection | MongoDB Atlas via Mongoose (connection layer; report persistence not wired yet) |
| AI model family | Gemma (open-weight) |
| AI inference | Ollama local API or Ollama Cloud API |
| Voice input | Browser Web Speech API — SpeechRecognition where supported |
| Voice output | Browser Web Speech API — speechSynthesis |
| PDF export | Browser print dialog / Save as PDF |
| License | MIT |

No frontend framework or third-party voice API key is required for the browser-based voice features.

---

## 🗂 Project structure

    campus-sathi-ai/
    ├── public/
    │   └── index.html       # UI, styles, interactions, voice, copy and print
    ├── server.js            # Express server and Ollama integration
    ├── package.json         # Scripts and dependencies
    ├── .env.example         # Safe example environment configuration
    ├── .gitignore           # Excludes secrets and generated files
    ├── LICENSE              # MIT License
    └── README.md            # Project documentation

---

## 🚀 Run locally

### Requirements

- **Node.js 20 or later**
- npm
- [Ollama](https://ollama.com/) installed and running
- A compatible Gemma model available in your Ollama installation

### 1. Clone the repository

    git clone https://github.com/rakibulhasanrakibofficial/campus-sathi-ai.git
    cd campus-sathi-ai

### 2. Install dependencies

    npm install

### 3. Download a local Gemma model

The current local default is **gemma4:e2b**. Use the model tag available in your Ollama installation.

    ollama pull gemma4:e2b
    ollama list

Make sure the Ollama service is running before starting the app.

### 4. Configure environment variables

Copy **.env.example** to **.env** and adjust values if needed. The local default expects Ollama at:

    http://127.0.0.1:11434/api/chat

To enable persistent History, set `MONGODB_URI` to your MongoDB Atlas connection string. Copy the complete URI from Atlas, replace its database username/password placeholders, and URL-encode any special characters in the username or password. In Atlas, allow your application host's IP address in Network Access and ensure the database user has appropriate read/write permissions. Do not expose this URI in the frontend or commit it.

If `MONGODB_URI` is empty, the server starts without MongoDB and History remains browser-local. When the URI is set but the database cannot be reached, startup fails instead of silently pretending the database is connected.

Never commit **.env** or paste a real API key or database connection string into frontend code, screenshots, or public issues.

### 5. Start the app

    npm start

Open **http://localhost:3000** in your browser.

Development mode with Node's watch mode:

    npm run dev

Health check:

    http://localhost:3000/api/health

---

## ⚙️ Environment variables

| Variable | Purpose | Default / behavior |
| --- | --- | --- |
| **PORT** | Port used by the Express server | **3000** |
| **MONGODB_URI** | MongoDB Atlas connection string | Empty; MongoDB connection is skipped when absent |
| **OLLAMA_API_KEY** | Enables Ollama Cloud when set | Empty; local Ollama is used when absent |
| **OLLAMA_MODEL** | Model tag sent to Ollama | **gemma4:e2b** locally; **gemma4:31b** when a Cloud key is present |
| **OLLAMA_LOCAL_URL** | Local Ollama chat endpoint override | http://127.0.0.1:11434/api/chat |
| **OLLAMA_CLOUD_URL** | Cloud chat endpoint override | https://ollama.com/api/chat |
| **AI_TIMEOUT_MS** | AI request timeout in milliseconds | **180000** (180 seconds); the server bounds this setting between 30 and 300 seconds |

For hosted deployment, set the API key in the hosting provider's **secret environment settings**. Do not add the real value to .env.example, README, browser JavaScript, screenshots, or Git history.

---

## 🔌 API reference

The backend exposes a health endpoint, the AI endpoint, and browser-scoped History endpoints.

### GET /api/health

Returns service information, including the configured inference provider, model, and MongoDB connection state. No secret values are returned.

Example response:

    {
      "ok": true,
      "service": "CampusSathi AI",
      "provider": "Local Ollama",
      "model": "gemma4:e2b",
      "database": "connected",
      "voiceFeatures": "Browser Web Speech API"
    }

The `database` field can be `connected`, `disconnected`, or `not_configured`. When `MONGODB_URI` is set, startup waits for MongoDB to connect and exits if the connection fails.

The provider and model fields change according to the server configuration.

### GET /api/history

Returns up to the 50 most recent History records for the current browser. The backend creates a random `HttpOnly; SameSite=Lax` cookie to scope records to that browser. This is browser-scoped storage, not a user account or identity system.

### POST /api/history

Creates or updates one History record. The body uses the fields `id`, `createdAt`, `problem`, `category`, `location`, `requestedLanguage`, `answerLanguage`, and `answer`. The server validates the input and retains at most 50 recent entries per browser.

### DELETE /api/history/:id

Deletes one History record owned by the current browser.

### DELETE /api/history

Clears all History records owned by the current browser.

History endpoints return **503** when MongoDB is not connected. The frontend then continues with browser-local History instead.

### POST /api/help

Generates an action plan for a campus issue.

Example request:

    {
      "problem": "আমাদের ক্যাম্পাসের বাস প্রায়ই দেরিতে আসে।",
      "category": "Transport and buses",
      "location": "Main gate",
      "language": "auto"
    }

| Field | Required? | Details |
| --- | --- | --- |
| **problem** | Yes | Non-empty string; maximum 2,500 characters |
| **category** | No | Must match a supported category; otherwise defaults to General campus issue |
| **location** | No | Optional string, trimmed and limited to 120 characters |
| **language** | No | **auto**, **bn**, or **en**; defaults to auto if missing or invalid |

In `auto` mode, Bengali script or common Banglish markers select Bengali; otherwise the app defaults to English. Explicit `bn` and `en` selections override automatic detection.

Example success response shape:

    {
      "answer": "AI-generated action plan goes here...",
      "language": "Bengali",
      "provider": "Local Ollama",
      "model": "gemma4:e2b"
    }

The answer text is generated by the configured model; it will vary by input.

Common error statuses include:

- **400** — missing or too-long problem description.
- **429** — AI provider rate limit.
- **502** — provider or authentication error.
- **503** — connection or timeout issue.

---

## 🎤 Voice and browser support

- Microphone access generally requires **HTTPS or localhost** and user permission.
- SpeechRecognition support varies by browser. Some implementations rely on an online recognition service.
- Speech playback uses voices made available by the browser or operating system.
- If no Bengali voice is installed or exposed to the browser, Bengali pronunciation may be inaccurate even when the text is correct.
- Voice input is only used to fill the problem text field. The app backend does not store voice recordings.
- Users should review the recognized transcript before submitting it.

---

## 🔐 Privacy, safety, and limitations

- **History storage:** report history is stored in browser `localStorage` and, when configured, in MongoDB (up to 50 reports per browser). MongoDB records are scoped by an HttpOnly browser cookie; this is not authentication, user identity, or cross-device sync. Clearing the browser cookie can disconnect it from earlier server-side History.
- **No official submission:** CampusSathi does not send complaints to university administration or contact campus staff.
- **AI processing:** the problem description and optional location are sent to the configured Ollama endpoint to produce the answer. When Cloud mode is enabled, the request goes to Ollama Cloud.
- **Avoid sensitive information:** do not submit passwords, student IDs, private contact details, medical details, or other sensitive personal information.
- **Verify recommendations:** AI responses can be incomplete, inaccurate, or unsuitable for your institution. Check important details with official campus sources.
- **Not an emergency service:** in immediate danger, contact verified campus security or local emergency services.
- **Voice limitations:** speech-to-text and text-to-speech performance depends on browser support, device settings, installed voices, and network conditions.

---

## 🧠 AI and model disclosure

- **Core model family:** Gemma, an open-weight model family.
- **Inference runtime:** Ollama.
- **Local default:** gemma4:e2b.
- **Cloud default:** gemma4:31b when OLLAMA_API_KEY is configured; the deployment must use a model tag supported by the service.
- **AI task:** interpret a student-described campus issue and propose concise, prioritized next steps.
- **Voice technology:** browser-provided Web Speech APIs; no separate proprietary voice model is integrated.
- **AI-assisted development:** ChatGPT assisted with implementation and documentation. The project owner should review, test, understand, and disclose AI assistance according to the event's rules.

The Gemma model and hosted services may have their own model and service terms, separate from this repository's software license.

---

## ✅ Testing checklist

Use this before presenting or submitting the project:

- [ ] Start Ollama and confirm that the selected model is available.
- [ ] Open the app and check that the page loads on desktop and mobile.
- [ ] Submit a Bengali-script campus issue.
- [ ] Submit an English campus issue.
- [ ] Try a Banglish issue with the answer language set to automatic.
- [ ] Confirm English prompts containing words like "campus", "bus", "class", or "student" still receive English answers.
- [ ] Change the interface language between Bengali and English.
- [ ] Try each category, quick-category cards, and an example prompt.
- [ ] Test a missing problem description and a description near the character limit.
- [ ] Test microphone input over HTTPS or localhost and review the recognized text.
- [ ] Test Listen, Stop, and replay with short and long answers.
- [ ] Check Bengali playback on the target device; confirm a Bengali voice is available.
- [ ] Test Copy and confirm the clipboard content.
- [ ] Test Print and choose Save as PDF in the browser dialog.
- [ ] Generate an answer, refresh the page, and confirm that it appears in History.
- [ ] Reopen a saved report and verify its original problem and answer are restored.
- [ ] Test deleting one report and clearing all History.
- [ ] Set MONGODB_URI and confirm /api/health reports "database": "connected".
- [ ] Confirm GET /api/history returns an items array when MongoDB is enabled.
- [ ] Generate a report, refresh the page, then confirm it is still visible in History.
- [ ] Delete one report and clear History; confirm both actions persist after refresh.
- [ ] Check GET /api/health in the local or deployed environment.
- [ ] Test provider failure or timeout behavior.
- [ ] Confirm secrets are stored in environment settings and are not committed.
- [ ] Add real screenshots and the actual public deployment URL after verifying them.
- [ ] Review event rules and disclose the model and AI-assisted development.

---

## ☁️ Deployment

CampusSathi can be deployed to a Node.js hosting service that supports environment variables and outbound HTTPS. For example, on a Render Web Service:

1. Connect this GitHub repository.
2. Set **Build Command** to **npm install**.
3. Set **Start Command** to **npm start**.
4. Add `MONGODB_URI` in the host's secret environment settings if you want the backend to connect to Atlas.
5. Add OLLAMA_API_KEY in the host's secret environment settings.
6. Set OLLAMA_MODEL to a model tag supported by Ollama Cloud, such as gemma4:31b if available for your account.
7. Deploy, then open the HTTPS URL from the hosting provider.
8. Verify /api/health and test a real issue end-to-end.

When OLLAMA_API_KEY is configured, the server uses Ollama Cloud. Without it, the server uses its local Ollama endpoint; a remote host cannot reach the Ollama process running on your personal computer unless you separately configure an accessible endpoint. Never expose the key in frontend code or the public repository.

**Deployment URL:** add the real public HTTPS URL here after a successful deployment and test.

---

## 📄 License

This project is released under the **MIT License**. See [LICENSE](LICENSE).

The repository license covers this project's code. The Gemma model and any hosted inference provider remain subject to their own terms.
