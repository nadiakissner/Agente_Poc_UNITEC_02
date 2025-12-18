# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/51c0987d-b218-4d56-8189-699dc263c1c9

# Agente_Poc — build & deploy notes

This file documents the exact steps to build the React prototype and deploy it so the WordPress plugin (`agente-retencion.php`) will serve the Agente_Poc UI while keeping the plugin's original flow and database interactions.

Overview
- The WordPress plugin exposes REST endpoints under `/wp-json/gero/v1` (validar-matricula, chat-openai-agente, guardar-hipotesis-agente, etc.).
- The React frontend (Agente_Poc) is designed to call those endpoints. The plugin's shortcode now prefers to serve a build placed at `agente-prototype/dist/assets/*` when present.

What we will do (A, B and C)
- A: Ensure the frontend prefers the localized REST base (`window.GERO_CONFIG.rest_base`) when the plugin enqueues the bundle. (Done: `SRC/Lib/backendAdapter.ts` was updated.)
- B: Build the frontend and copy the produced `dist/` into a new `agente-prototype/dist/` folder at the repo root so the plugin can find and enqueue it.
- C: Document the build and deployment steps below.

1) Build the prototype (local)

Run these commands from the `Agente_Poc` folder (Windows bash):

```bash
cd /c/Users/nadia/OneDrive/Escritorio/Gero/Agente_Poc
npm install        # if you haven't already
npm run build
```

After a successful build you should have `Agente_Poc/dist/assets/index.js` and `Agente_Poc/dist/assets/index.css`.

2) Copy the build into the plugin area the shortcode expects

The plugin will serve the UI if a build exists under `agente-prototype/dist/assets/` relative to the plugin file. To prepare that locally in this repo:

```bash
# from the Agente_Poc folder (after npm run build)
mkdir -p /c/Users/nadia/OneDrive/Escritorio/Gero/agente-prototype/dist
cp -r dist/* /c/Users/nadia/OneDrive/Escritorio/Gero/agente-prototype/dist/
```

This copies the `dist/assets/*` files into `agente-prototype/dist/assets/*` so the plugin will detect and enqueue them.

3) Deploy to SiteGround (production)

Copy the plugin folder (the original `agente-retencion.php` and any other plugin files) into `wp-content/plugins/<your-plugin-folder>/` on SiteGround. Place the `agente-prototype/dist/` folder inside that plugin folder as well.

Then activate the plugin and add the `[agente-retencion]` shortcode to a WordPress page — when the build is present the React UI (Agente_Poc look & feel) will be used, and the plugin endpoints will remain the same.

Important notes
- The plugin will write/read to custom DB tables (e.g., `byw_agente_retencion`, `byw_coach_interacciones`). The plugin does not create tables automatically — ensure those tables exist.
- The plugin proxies to OpenAI and requires the API key present on the server (e.g., `OPENAI_API_KEY` in `wp-config.php` or server env).
- If you host the frontend on a separate origin, the adapter now prefers `window.GERO_CONFIG.rest_base` when the plugin enqueues the bundle and localizes that value; otherwise it falls back to same-origin `/wp-json/gero/v1`.

If you'd like, I can run the build and copy steps now and place the result into `agente-prototype/dist/` inside the repo.

