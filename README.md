# ✳ CampusSathi AI
### Campus problems. Clear next steps.

CampusSathi AI is a bilingual, voice-enabled campus companion that helps university students turn everyday campus issues into a practical, prioritized action plan. It is designed around real student-life topics: transport, classes, facilities, notices, clubs, accessibility, careers and wellbeing.

> **Important:** CampusSathi gives AI-generated suggestions. It does not file official university complaints, verify campus rules, or replace official university services or emergency support.

## ✨ What it does

- **Campus action plans:** describe a problem and get a structured assessment, prioritized next steps, what to avoid, and when to contact an appropriate campus or local service.
- **Bengali and English:** choose Bengali, English, or let the app infer the response language. Banglish input may be recognized as Bengali based on common words.
- **Voice-to-text:** speak a campus issue into the text box using browser speech-recognition support.
- **Text-to-voice:** listen to the AI response using browser/device speech synthesis. No ElevenLabs key is needed.
- **Campus categories:** transport, academics, facilities, notices/admin, clubs/events, wellbeing, careers, safety/accessibility and general issues.
- **Responsive design:** custom dark-violet interface with cyan, mint and pink accents for desktop and mobile.
- **Privacy-aware by default:** this server does not store reports in a database. Avoid entering passwords, student identifiers or sensitive personal information.

## 🧱 Technology

| Area | Technology |
|---|---|
| Frontend | HTML, CSS and browser JavaScript |
| Backend | Node.js 20+, Express |
| AI model | Gemma via Ollama (open-weight model family) |
| Local inference | Ollama at http://127.0.0.1:11434/api/chat |
| Hosted inference | Ollama Cloud chat API |
| Voice input | Browser Web Speech API (SpeechRecognition where supported) |
| Voice output | Browser Web Speech API (speechSynthesis) |
| Deployment | Node.js host with environment variables and outbound HTTPS |

## 🚀 Run locally

### 1. Requirements

- Node.js 20 or later
- npm
- Ollama installed and running with a compatible Gemma model available

### 2. Install

    git clone https://github.com/rakibulhasanrakibofficial/campus-sathi-ai.git
    cd campus-sathi-ai
    npm install

### 3. Start the local model

Make sure Ollama is running, then install the model if it is available in your local Ollama setup:

    ollama pull gemma4:e2b
    ollama list

### 4. Configure the environment

Copy .env.example to .env. The local default uses gemma4:e2b. Never commit .env or put API keys in frontend files. If your installed model uses another tag, set OLLAMA_MODEL in .env to that exact tag.

### 5. Run

    npm start

Open http://localhost:3000. The status endpoint is at http://localhost:3000/api/health.

## ☁️ Deploy

The app can be deployed on a Node.js host such as Render.

1. Create a Web Service from this GitHub repository.
2. Set the build command to: npm install
3. Set the start command to: npm start
4. In the host's environment settings, set OLLAMA_API_KEY to your own Ollama Cloud API key.
5. Set OLLAMA_MODEL to gemma4:31b.
6. Deploy and open the HTTPS URL provided by the host.

When OLLAMA_API_KEY is present, the backend calls the direct Ollama Cloud API. Use a model tag accepted by the API; this example uses gemma4:31b. Without a key, it uses the local Ollama endpoint; a hosted server cannot access the Ollama process on your personal computer. Never commit the real key. You can optionally override OLLAMA_CLOUD_URL or OLLAMA_LOCAL_URL.

## 🔌 API

### GET /api/health

Returns service status, configured provider, model name and voice implementation. It never returns the API key.

### POST /api/help

Example JSON request:

    {
      "problem": "আমাদের ক্যাম্পাসের বাস প্রায়ই দেরিতে আসে।",
      "category": "Transport and buses",
      "location": "Main gate",
      "language": "auto"
    }

Supported language values: auto, bn, en. The API returns JSON containing answer, language, provider and model.

## 🎙 Voice notes and browser support

- Voice input is optional; users can always type.
- Microphone input generally requires HTTPS or localhost and explicit browser permission.
- Speech-recognition availability differs by browser. Some browsers use an online recognition service.
- Speech playback uses voices installed or made available by the browser/operating system. Bengali speech output depends on Bengali voice availability on the user's device.
- This app's backend does not save voice recordings.

## 🧠 Model and AI disclosure

- **Core model family:** Gemma, an open-weight model family. The configured tag is shown by /api/health.
- **Inference:** local Ollama by default; Ollama Cloud when OLLAMA_API_KEY is configured.
- **Task:** understand a student-described campus issue and propose categorized, prioritized next steps.
- **Proprietary voice model:** none. Text-to-voice uses browser speech synthesis; voice-to-text uses browser speech recognition where supported.
- **AI-assisted development:** ChatGPT assisted with implementation and documentation during the hackathon. The participant should review, test and understand the code and disclose AI assistance as required by the organizers' rules.

AI output can be incomplete, inaccurate, biased or inappropriate for a particular institution. Verify important recommendations with official campus sources. Never rely on the app as an emergency service.

## 🧪 Before submission

- [ ] Test an English issue and confirm the response language.
- [ ] Test a Bengali-script issue and confirm Bengali headings and guidance.
- [ ] Try microphone input in a supported browser over HTTPS.
- [ ] Try Listen and Stop on short and long responses.
- [ ] Check /api/health on the deployed HTTPS URL.
- [ ] Confirm the host environment contains OLLAMA_API_KEY and OLLAMA_MODEL=gemma4:31b (do not expose the key).
- [ ] Add genuine screenshots and the real deployment URL after testing.
- [ ] Read the event rules and disclose AI-assisted development and model details.

## 📄 License

MIT License. See LICENSE. The Gemma model and related services remain subject to their publisher's model terms and service terms.