# Project Rules & Guidelines

## 📜 Mandatory Standards (AUTO-REFERENCE)

The AI model **MUST** automatically reference and adhere to the following rule files for every prompt, code update, or implementation plan:

1.  **Universal Code Style**: [.trae/universal_code_style.md](file:///Users/ignata/Desktop/Self%20Project/Project-Javascript/bun-hono-kafkajs-boilerplate/.trae/universal_code_style.md)
    - _Enforces_: Formatting, naming conventions, file organization, TypeScript specifics.
2.  **Backend Best Practices**: [.trae/backend_best_practices.md](file:///Users/ignata/Desktop/Self%20Project/Project-Javascript/bun-hono-kafkajs-boilerplate/.trae/backend_best_practices.md)
    - _Enforces_: Drizzle ORM usage, query performance (N+1 prevention), impact analysis, comment quality.

**Compliance Checklist:**

- [ ] Have you followed the Universal Code Style?
- [ ] Have you verified Backend Best Practices (ORM, Performance, Comments)?

## 🤖 Model Selection Strategy

- **Daily Driver & Coding**: Use **GPT-5.2-Codex** (Best for SQL/NoSQL query optimization & backend logic) or **GLM-4.7** (Current active model).
- **Deep Architecture & Large Context Scans**: Switch to **Gemini-3-Pro-Preview (200k)**. Use this when analyzing multiple files, refactoring large modules, or searching for cross-service dependencies.
- **Vision & UI/UX**: Switch to **Gemini-3-Pro-Preview**. Mandatory for analyzing images, screenshots, or visual designs.

### 🔄 Context Switching Protocol

- If the user asks for a "Deep Scan" or "Full Project Review" -> Request switch to **Gemini-3-Pro-Preview (200k)**.
- If the user provides an image/screenshot -> Request switch to **Gemini-3-Pro-Preview**.
- For standard coding tasks -> Stick to **GPT-5.2-Codex** or **GLM-4.7**.

## 🛠️ Project Architecture

- **Tech Stack**: Bun, Hono, KafkaJS, Drizzle ORM.
- **Structure**: Monorepo with `apps/` (microservices) and `packages/` (shared libs).
- **Config**: Hybrid approach using `config/*.json` for structure and `.env` for secrets.

## 🔒 Security

- Never output secrets or API keys in chat.
- Ensure `.env` files are gitignored.
- Use `show_diff` for all file edits.
