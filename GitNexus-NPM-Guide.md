# GitNexus: Native NPM + Docker UI Guide

Because the native Windows duckdb dependency occasionally causes file lock issues when run via `npx`, installing the engine globally via `npm` is the most stable way to run the backend natively on Windows, while still leveraging Docker solely for the Web UI.

This guide explains how to achieve this **Hybrid Setup**.

---

## 🛠️ Step 1: Install GitNexus Natively

Install the core GitNexus engine globally on your Windows machine:
```bash
npm install -g gitnexus
```
*This installs the CLI, API Server, and MCP tools directly to your system, bypassing the npx cache.*

---

## 📊 Step 2: Analyze Your Project

Navigate to your project root folder (`C:\Users\LOQ\Desktop\CLI\emirates mostafa\NEW CV JOBS\PROJECT`) and run the native command.

**Basic analysis:**
```bash
gitnexus analyze
```

**Full analysis with embeddings (for semantic search):**
```bash
gitnexus analyze --embeddings
```
*(Because this runs directly on Windows, you no longer need the `docker exec -u node` prefix!)*

---

## 🌐 Step 3: Start the Backend API Server

For the Web UI to function, it needs an API to talk to. Leave this command running in a separate terminal tab:
```bash
gitnexus serve
```
*This starts the API on `http://localhost:4747` directly on your Windows machine.*

---

## 👁️ Step 4: Run the Web UI via Docker

The GitNexus frontend is packaged separately. You can use your existing `docker-compose.yml` but we only want to spin up the `web` container, completely ignoring the dockerized `server`!

1. Open a new terminal in your project root.
2. Spin up *only* the web interface:
   ```bash
   docker compose up -d web
   ```
3. Open your web browser and go to **[http://localhost:4173](http://localhost:4173)**.

> **Why this works:** The browser loads the frontend from the Docker container, but when the React app makes API requests, it calls `http://localhost:4747`. Since that is running natively on your Windows host from Step 3, the frontend connects seamlessly!

---

## 🧠 Step 5: Connecting to Your IDE

Since the engine is now installed natively on your machine, you can connect your AI IDE to the GitNexus MCP server. There are two ways to do this: **STDIO** (Command line) and **SSE** (HTTP over Server-Sent Events).

### Option A: SSE (Recommended to Avoid Database Locks)
When you run `gitnexus serve` (or use the web UI), the background API server acquires a "lock" on the DuckDB database. If your IDE tries to run the standard command-line MCP (`stdio`), it will crash because the database is already locked by the server!

To avoid this, connect your IDE via SSE. This routes all AI requests through your running `gitnexus serve` API, allowing both the Web UI and the AI to use the database simultaneously.

**For Antigravity (`~/.gemini/antigravity/mcp_config.json`):**
```json
{
  "mcpServers": {
    "gitnexus-sse": {
      "serverUrl": "http://127.0.0.1:4747/api/mcp"
    }
  }
}
```

**For Windsurf / Cursor (`mcp_config.json`):**
```json
{
  "mcpServers": {
    "gitnexus-sse": {
      "type": "sse",
      "url": "http://localhost:4747/api/mcp"
    }
  }
}
```
*(Note: You must have `gitnexus serve` running in the background for this to work!)*

### Option B: STDIO (For Headless / Standalone Use)
If you are **not** using the Web UI and do **not** have `gitnexus serve` running, you can let your IDE spin up the MCP server directly. This is simpler but will lock the database, preventing you from opening the web dashboard at the same time.

**For All IDEs (Antigravity / Windsurf / Cursor):**
```json
{
  "mcpServers": {
    "gitnexus-stdio": {
      "command": "gitnexus",
      "args": ["mcp"]
    }
  }
}
```

---

## 📚 Native Command Quick Reference

You can now use all commands natively in any project folder:

*   **`gitnexus status`** - Check if the current folder is indexed.
*   **`gitnexus query "authentication"`** - Search the graph manually.
*   **`gitnexus impact loginUser`** - Check blast radius manually.
*   **`gitnexus wiki .`** - Auto-generate documentation. 
    *(To use Ollama locally: `gitnexus wiki . --base-url http://localhost:11434/v1 --model llama3 --api-key ollama --provider openai`)*
*   **`gitnexus clean`** - Wipe the index if you ever need to reset.


---

## Wiki Generation Commands

### Using OpenRouter (paid model — recommended, ~$0.05)
```bash
npx gitnexus wiki --base-url https://openrouter.ai/api/v1 --api-key YOUR_OPENROUTER_KEY --model google/gemini-2.5-flash
```

### Using OpenRouter (free model — needs timeout fix below)
```bash
npx gitnexus wiki --base-url https://openrouter.ai/api/v1 --api-key YOUR_OPENROUTER_KEY --model nvidia/nemotron-3-super-120b-a12b:free --concurrency 1
```
> ⚠️ Free models are slow (15-60s per call). Use `--concurrency 1` to avoid rate limits.

### Using Ollama (local, free, no timeout issues)
```bash
npx gitnexus wiki --base-url http://localhost:11434/v1 --api-key ollama --model gemma4:31b-cloud
```

### Using Google AI Studio (free tier, faster than OpenRouter free)
```bash
npx gitnexus wiki --base-url https://generativelanguage.googleapis.com/v1beta/openai --api-key YOUR_GOOGLE_KEY --model gemini-2.5-flash
```

---

## ⚠️ Fixing Timeout for Slow/Free Models

GitNexus has a **hardcoded 60-second timeout** per LLM call. Free models on OpenRouter often exceed this. To increase it:

### File to edit:
```
C:\Users\LOQ\AppData\Roaming\npm\node_modules\gitnexus\dist\core\wiki\llm-client.js
```

### Find (line ~174):
```js
signal: AbortSignal.timeout(60_000),
```

### Replace with (5 minutes):
```js
signal: AbortSignal.timeout(300_000),
```

> **Note:** This change is inside `node_modules` — it resets if you reinstall/update gitnexus. Re-apply after any `npm install -g gitnexus` or `npm update -g gitnexus`.

---

## Wiki Command Flags Reference

| Flag | Example | Purpose |
|------|---------|---------|
| `--base-url` | `https://openrouter.ai/api/v1` | LLM API endpoint |
| `--api-key` | `sk-or-v1-xxx` | API key (saved to `~/.gitnexus/config.json`) |
| `--model` | `google/gemini-2.5-flash` | Model name |
| `--concurrency` | `1` | Parallel LLM calls (default: 3, use 1 for free models) |
| `--force` | | Regenerate even if wiki exists |
| `--gist` | | Publish as GitHub Gist |
| `--review` | | Stop after grouping to review modules before generating |
| `--verbose` | | Show LLM commands and responses |
| `--reasoning-model` | | For o1/o3/o4-mini models (strips temperature) |
