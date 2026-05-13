# CRM Studio — Promo Video Design

## Overview
10-second promotional teaser for CRM Studio, a beauty studio management app.
Clean, elegant, professional. Light background with pink accents.
No React. Pure HTML/CSS/JS with GSAP animations.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#FFFFFF` | Page background |
| `surface` | `#FFF5F8` | Card backgrounds, subtle fills |
| `accent` | `#E91E8C` | Primary pink accent |
| `accent-light` | `#FAD9E8` | Light pink for borders, icons |
| `text-primary` | `#1A1A2E` | Headlines |
| `text-secondary` | `#6B6B80` | Body, labels |
| `divider` | `#F0E4E8` | Subtle dividers |

## Typography

- **Headlines**: Inter, 700 weight, `#1A1A2E`
- **Body / Labels**: Inter, 400 weight, `#6B6B80`
- **Module titles**: Inter, 600 weight
- **Scale**:
  - Hero title: 72px
  - Module title: 22px
  - Module body: 14px
  - Label: 13px

## Motion

| Type | Easing | Duration |
|------|--------|---------|
| Entrance | `power3.out` | 0.6s |
| Stagger | 0.15s between cards | — |
| Transition | Blur crossfade, `power2.inOut` | 0.5s |
| Exit (final scene) | Fade to white | 0.6s |

## Scene Structure

| Scene | Timing | Content |
|-------|--------|---------|
| 1 — Title | 0–2s | "CRM Studio" wordmark fades in on white |
| 2 — Modules | 2–6s | Three cards slide in: Clientes, Citas, Pagos |
| 3 — Graphic | 6–9s | Calendar icon + staff avatar, appointment summary |
| 4 — Logo | 9–10s | Full logo + tagline on white |

## Transitions

- Scene 1 → 2: Blur crossfade (opacity + blur, 0.5s)
- Scene 2 → 3: Blur crossfade (opacity + blur, 0.5s)
- Scene 3 → 4: Fade to white (final scene exit)

## Components

### Module Card
- White background, `border-radius: 16px`, `box-shadow: 0 4px 24px rgba(233,30,140,0.08)`
- Icon: 48px, pink circle background
- Title: 22px Inter 600
- Body: 14px Inter 400 in `#6B6B80`
- Subtle pink border `1px solid #FAD9E8`

### Scene Content Layout
All scenes use flexbox centering. Content container fills 100% width/height with inner padding. No absolute positioning on content containers.

## Technical

- Resolution: 1920×1080
- No React
- GSAP 3 via CDN
- Fonts: Inter (compiler-embedded)
- File: `index.html` (standalone, no `<template>`)