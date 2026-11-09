# Local LLM Chat // Agentic Coding Interface

[![GitHub](https://img.shields.io/badge/GitHub-sus4400%2Flocal--llm--chat--coding--interface-blue?style=flat-square)](https://github.com/sus4400/local-llm-chat-coding-interface)

A calm, high-ergonomics, utilitarian LLM workspace and autonomous agentic coding environment built for developers, architects, and researchers. Connect any API provider (Ollama, Cloudflare tunnels, OpenAI, Gemini, Anthropic, OpenRouter, DeepSeek), dynamically browse and filter models by **Free vs. Paid**, manage deep context windows without context loss on 50+ file codebases, build large-scale multi-file applications with an integrated workspace filesystem and terminal execution engine, and create custom agents.

Strictly non-shiny, matte design with **zero emojis** and pure geometric SVG icons.

---

## Core Agentic Coding Architecture

### 1. Real Workspace Filesystem & Terminal Execution (`workspace/`)
Unlike superficial chat interfaces that merely dump code blocks into messages, this interface includes a native workspace filesystem backend and execution server:
- **Disk-Backed Workspace Root (`/workspace`)**: All created files are persisted directly to disk inside `workspace/`.
- **Workspace Tree Navigator**: Real-time explorer in the side drawer with file sizes, line counts, and instant tab preview.
- **`write_file` Tool Call Protocol**: Agents output `<tool_call name="write_file" path="src/server.js">...</tool_call>` which can be automatically or manually executed to write files directly to disk.
- **`edit_file` Surgical Search-and-Replace**: Allows modifying specific sections of existing files without rewriting entire multi-thousand-line documents:
  ```xml
  <tool_call name="edit_file" path="src/server.js">
  <target>
  // code to replace
  </target>
  <replacement>
  // updated code
  </replacement>
  </tool_call>
  ```
- **`execute_cmd` Terminal Execution**: Runs commands (`node`, `npm`, `git`, `python`, etc.) directly inside `workspace/` and captures stdout and stderr.
- **Interactive Action Badges**: Tool call blocks in chat feature instant "Execute / Apply to Workspace" action buttons with live status notifications.

---

### 2. Zero-Context-Loss Codebase Mapping
When working on large-scale applications (50+ files), dumping the entire codebase into LLM prompt history quickly exhausts context windows and causes hallucinations.

This environment solves context degradation using a dual-tier strategy:
1. **Dynamic Repository Structure Map (`<current_workspace_map>`)**:
   - The server dynamically extracts every relative file path and all exported class, function, and module signatures in ~300-800 tokens via `/api/workspace/repoprompt`.
   - This compact structural outline is prepended to the agent's context payload on every turn.
   - The agent retains an exact mental index of the entire repository structure regardless of session length.
2. **On-Demand Targeted File Retrieval**:
   - The agent inspects or edits specific target files without needing every other file's implementation loaded into memory.
3. **Context Pinning & Token Metrics**:
   - Inspect active token usage broken down by System, Workspace Map, History, Documents, and Attached Code Files via the top-bar context meter and `Ctrl+K`.

---

### 3. Custom Agent Studio (`[Agent Studio]`)
Create, customize, test, and manage purpose-built autonomous agents:
- **Configurable Agent Parameters**:
  - Name, Role, Description, and System Instructions.
  - Model override (assign specific models to specific roles).
  - Temperature slider (0.00 to 2.00).
  - SVG Glyph selector (14 geometric icons, zero emojis).
- **Capability Flags**:
  - `fs_read`: Read workspace files.
  - `fs_write`: Create new files on disk.
  - `fs_edit`: Surgical search-and-replace edits.
  - `fs_exec`: Run terminal commands in workspace.
  - `plan`: Generate multi-step plans with `<plan>` tags.
  - `repomap`: Auto-inject codebase repository map.
- **Built-in Agents**:
  - **Autonomous App Builder**: End-to-end multi-file architecture, planning, and execution.
  - **Autonomous Coder**: High-precision code generation and error handling.
  - **Systems Architect**: High-level systems design and interface contracts.
  - **Root-Cause Debugger**: Surgical defect diagnosis and regression-free patches.
  - **Security & Performance Auditor**: Static analysis for OWASP Top 10 and performance bottlenecks.
  - **Refactoring Specialist**: Modernization, DRY abstraction, and unified diffs.
- **Portability**: Export any custom agent to a JSON file or import existing agents with one click.

---

### 4. Split-Pane Code Workspace & Artifact Viewer
- **Multi-Tab Code Editor**: Open, view, edit, copy, and download workspace files in a side-by-side drawer.
- **Live HTML/SVG Preview**: Test frontend components or web applications in an isolated sandboxed iframe.
- **Interactive Checklists**: LLM-generated task lists (`- [ ]`, `- [x]`) are fully interactive; toggle them directly in chat and persist state.
- **Collapsible `<think>` Reasoning**: Automatically folds deep reasoning traces into clean expandable accordions.

---

### 5. Universal Model Discovery & API Support
- **Self-Hosted Ollama / Cloudflare Tunnels**:
  - Direct integration with local endpoints (e.g. `https://shape-utilization-seal-feature.trycloudflare.com/v1`).
  - Pre-configured for `agentic-uncensored-coder:latest`, `qwen2.5-coder:7b`, etc.
  - Zero-auth local execution with 100% Free / Local classification.
- **Google AI Studio (Gemini 2.0 / Experimental)**:
  - Connect with Gemini API keys to access `gemini-2.0-flash-exp`, `gemini-2.0-flash-thinking-exp-1219`, and `gemini-exp-1206` with up to 2M token context.
- **OpenRouter & Frontier Models**:
  - Dynamic discovery and automated Free vs. Paid filtering for Llama 3.3, DeepSeek R1, Qwen 2.5 Coder, Claude 3.5 Sonnet, GPT-4o.
- **Direct Providers**:
  - DeepSeek Direct, xAI Grok, Cerebras, Groq, OpenAI, Anthropic, Ollama Local.

---

## Quick Start

### 1. Start Server & Workspace Backend

Using Node:
```powershell
node server.js
```
Or with Antigravity's bundled Node runtime:
```powershell
& "C:\Users\Something\AppData\Roaming\Antigravity\bin\agy-node.cmd" server.js
```
Or double-click:
```
start.bat
```

### 2. Open the Interface
Open your browser to:
```
http://localhost:3000
```

---

## File Structure

```
d:\Test\chat-interface\
├── workspace/        # Real disk workspace where files are created, edited, and executed
├── index.html        # Main interface with split workspace, agent studio, and modals
├── style.css         # Matte, non-shiny utilitarian design system (dark & light themes, zero emojis)
├── app.js            # Workspace manager, agent studio, file drag & drop, SSE stream reader
├── markdown.js       # Fast zero-dependency renderer with tool call cards, diffs, think folding
├── server.js         # Node.js static server, streaming CORS proxy, workspace FS & exec API
├── start.bat         # One-click Windows launcher
└── README.md         # Documentation
```

---

## Repository

Public GitHub Repository:
[https://github.com/sus4400/local-llm-chat-coding-interface](https://github.com/sus4400/local-llm-chat-coding-interface)
