# 🎨 01 Frontend Specification: BDB OS Remote Manual (Bilingual UI)

**Author:** `Godmode_UI_UX`  
**Status:** Approved & Implemented  
**Design Tokens & Principles:** Anti-Slop, DTCG Tokens, Zero External Dependencies, Standalone HTML5

---

## 💎 Design Tokens & Theme System

```css
:root {
  --bg-primary: #0b0f17;
  --bg-secondary: #111827;
  --bg-card: rgba(17, 24, 39, 0.85);
  --bg-card-hover: rgba(31, 41, 55, 0.7);
  --border-subtle: #1f2937;
  --border-focus: #6366f1;
  --text-primary: #f9fafb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  --accent-primary: #6366f1;
  --accent-secondary: #06b6d4;
  --accent-glow: rgba(99, 102, 241, 0.25);
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}

[data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: rgba(255, 255, 255, 0.9);
  --bg-card-hover: #f1f5f9;
  --border-subtle: #e2e8f0;
  --border-focus: #4f46e5;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --accent-primary: #4f46e5;
  --accent-secondary: #0284c7;
  --accent-glow: rgba(79, 70, 229, 0.15);
}
```

---

## 🧩 UI Components Hierarchy

1. **Top Navigation Bar:**
   - Brand Logo & Version Pill (`v1.1.0`)
   - Instant Search Bar with shortcut hint (`/` or `Cmd+K`)
   - Bilingual Segmented Toggle Switch (`🇩🇪 Deutsch` / `🇬🇧 English`)
   - Theme Toggle Button (`Dark` / `Light`)
   - Reading Progress Meter (0-100% viewport tracking)

2. **Sidebar Navigation (Sticky Desktop / Flyout Mobile):**
   - Active scrollspy tracking with pulse indicator
   - 11 Chapters list with icons
   - Quick jump anchors with smooth scrolling

3. **Hero Header:**
   - Visual gradient title
   - Subtitle: "Work from anywhere as if you were sitting right at your home computer"
   - Quick stats badges: Zero Port Forwarding, Tailscale Encrypted, Token Optimized, 100% Offline-Capable.

4. **Interactive SVG Visualizations:**
   - Architecture Diagram (Laptop ➔ Tailscale ➔ Home PC)
   - Terminal Installer Menu
   - Terminal Laptop Success Banner
   - Claude Desktop Chat Mockup
   - Offline Mode Download Progress
   - Status & Diagnostic Terminal

5. **Interactive Pre-Flight Checklist:**
   - Clickable items with persistent state & animated progress ring

6. **Copyable Command Blocks:**
   - macOS Terminal look with colored dot controls
   - Single-click clipboard copying with visual confirmation ("Copied! ✓")

7. **Troubleshooting Diagnostics:**
   - Accordion cards with status indicators (Red problem / Green remedy)

8. **Filterable Glossary:**
   - Real-time search filter and definition cards
