# 🌐 Project Connections & Configuration

This document serves as the single source of truth for all external services connected to the **PROPERTY-lite** project. 

## 🏗️ 1. Vercel (Hosting & Deployment)
*   **Active Project Name:** `property-lite`
*   **Live Dashboard URL:** [Vercel Dashboard](https://vercel.com/ec1978s-projects/property-lite)
*   **Live Production Domain:** [property-lite-mocha.vercel.app](https://property-lite-mocha.vercel.app)
*   **Deployment Flow:** Every `git push` to the `main` branch of the GitHub repository below automatically triggers a live deployment.

## 🐙 2. GitHub (Source Code)
*   **Active Repository:** [EC1978/PROPERTY-lite](https://github.com/EC1978/PROPERTY-lite)
*   **Main Branch:** `main`
*   **Remote URL:** `https://github.com/EC1978/PROPERTY-lite.git`

## ⚡ 3. Supabase (Database & Auth)
*   **Project URL:** `https://pvseyvtbchrspqadgxck.supabase.co`
*   **API Settings:** Found in Supabase Dashboard under `Settings -> API`.

---

## 🛠️ Checklist for Smooth Operations

To ensure everything runs smoothly when making changes, please check these points:

1.  **Environment Variables in Vercel:**
    Whenever you start a new Vercel project or change Supabase/OpenAI keys, ensure these are added in **Vercel -> Settings -> Environment Variables**:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `OPENAI_API_KEY`
    - `NEXT_PUBLIC_GOOGLE_API_KEY`

2.  **Git Branching:**
    - Always stay on the `main` branch unless we are working on a massive experimental feature.
    - Run `git pull` before starting new work to ensure you have the latest version.

3.  **Supabase RLS (Row Level Security):**
    - If a feature works locally but not live (like the QR scans), check if the public access policies in Supabase are enabled.

---
*Last updated: February 23, 2026*
