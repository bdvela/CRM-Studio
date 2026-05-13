# CRM Studio — Promo Video

A 10-second promotional teaser for **CRM Studio**, a beauty studio management app.
Built with HyperFrames (pure HTML/CSS/JS + GSAP, no React).

---

## 🎬 Video Structure

| Scene | Timing | Content |
|-------|--------|---------|
| **1 — Title** | 0–2s | "CRM Studio" wordmark fades in on white |
| **2 — Modules** | 2–6s | Three animated cards: Clientes, Citas, Pagos |
| **3 — Graphic** | 6–9s | Calendar icon + staff avatars + live badge |
| **4 — Logo** | 9–10s | Full logo + tagline, fades to white |

## 🎨 Design

- **Background**: Pure white `#FFFFFF`
- **Accent**: Pink `#E91E8C`
- **Typography**: Inter (compiler-embedded)
- **Motion**: Blur crossfade transitions, staggered card entrances, elastic avatar pops

---

## 🛠️ Setup

```bash
# Install dependencies
pnpm install
```

---

## ▶️ Preview (Development)

```bash
pnpm run preview
```

Opens the composition in your browser at `http://localhost:3000` (or next available port) with the HyperFrames player controls.

---

## 🎞️ Render (Export Video)

```bash
pnpm run render
```

Exports `crm-studio-promo.mp4` (H.264, 1920×1080) to the project root.

### Render with variable overrides

```bash
npx hyperframes render --variables '{"title":"CRM Studio"}' --output crm-studio-promo.mp4
```

---

## 🔍 Inspect (Layout QA)

```bash
pnpm run inspect
```

Runs the composition through a headless Chrome timeline check, reporting any text overflow, clipping, or layout issues with timestamps and fix hints.

---

## 📁 Project Structure

```
crm-dashboard-video/
├── index.html        # Standalone composition (no React)
├── design.md         # Design tokens & scene spec
├── package.json      # pnpm scripts
└── README.md         # This file
```

---

## 🎬 HyperFrames CLI Reference

```bash
# Lint
npx hyperframes lint

# Validate
npx hyperframes validate

# Preview
npx hyperframes preview

# Render
npx hyperframes render --output output.mp4

# Inspect
npx hyperframes inspect
```

> **Note**: Run all commands from the `crm-dashboard-video/` directory.