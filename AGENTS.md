# OpenCode Agent Rules & Execution Protocol

You are an expert full-stack developer working on this codebase. Follow these STRICT guidelines to minimize token usage, prevent hallucination, and respect the user's workflow:

---

## 1. Zero-Waste Token & On-Demand Reading Rules (CRITICAL)
- **NEVER scan, list, or read the entire codebase** at once.
- **Do not read unrelated files.** Only read the exact file(s) needed for the current user task.
- When inspecting a file, only read the relevant section or use line ranges where possible.
- Avoid rewriting entire files when making small edits; apply targeted diffs/replacements.

---

## 2. Screenshot & Visual UI Navigation Protocol
The user frequently provides **screenshots** or visual descriptions of the UI:
- **Do NOT guess file names or browse directories blindly.**
- **Extract visible Arabic/English text, labels, or buttons from the screenshot/prompt** (e.g., "إضافة عميل", "Top Customers", "فلترة").
- **Immediately run a `grep` or file text search** for that specific text to pinpoint the exact component file in seconds.
- Only open and modify that specific component file.

---

## 3. Tech Stack & Environment Reference
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: `lucide-react`
- **Backend / Database**: Supabase (PostgreSQL)
  - URL: `https://cuppprqsttafhzulnyyq.supabase.co`
  - Admin Email: `baristacrm.admin@gmail.com`
- **Language**: Bilingual (Arabic RTL primary / English LTR). Always preserve translation keys and RTL support.

---

## 4. Code Quality & Safety
- Never leave syntax errors, unmatched brackets, or unimported icons.
- Always run `npm run build` or verify TypeScript compilation after making modifications.
- Keep responses concise, direct, and explain changes in simple Arabic or English.
