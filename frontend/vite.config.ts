import path from "path"
import fs from "fs"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react-swc"
import {defineConfig} from "vite"
import process from "process"

// Load TCB (Tencent CloudBase) credentials at build time.
// Priority:
//   1. process.env (VITE_* or CLOUDBASE_*) — used by Docker build-args / CI
//   2. frontend/.env (written by ensure-cloudbase-env.sh)
//   3. /workspace/.env.tcb (absolute path in all Genie sandboxes)
const fileEnv: Record<string, string> = {}
for (const envPath of [path.resolve(__dirname, "./.env"), "/workspace/.env.tcb"]) {
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf-8").split("\n").forEach(line => {
      const idx = line.indexOf("=")
      if (idx > 0) fileEnv[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
    })
  }
}

// Resolve a config value: environment variable wins over file value.
const pick = (envKey: string, fileKey: string, fallback = ""): string =>
  process.env[envKey] || fileEnv[envKey] || process.env[fileKey] || fileEnv[fileKey] || fallback

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_CLOUDBASE_ENV_ID": JSON.stringify(
      pick("VITE_CLOUDBASE_ENV_ID", "CLOUDBASE_ENV_ID")
    ),
    "import.meta.env.VITE_CLOUDBASE_REGION": JSON.stringify(
      pick("VITE_CLOUDBASE_REGION", "CLOUDBASE_REGION", "ap-shanghai")
    ),
    "import.meta.env.VITE_CLOUDBASE_PUBLISH_KEY": JSON.stringify(
      pick("VITE_CLOUDBASE_PUBLISH_KEY", "CLOUDBASE_PUBLISH_KEY")
    ),
    "import.meta.env.VITE_OAUTH_RELAY_URL": JSON.stringify(
      pick("VITE_OAUTH_RELAY_URL", "VITE_OAUTH_RELAY_URL") ||
        fileEnv.OAUTH_RELAY_URL ||
        ""
    ),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '::',
    port: 5173,
    allowedHosts: true,
    cors: true,
    hmr: {
        protocol: 'wss',
        host: `5173-${process.env.X_IDE_SPACE_KEY}.e2b.${process.env.X_IDE_SPACE_REGION}.${process.env.X_IDE_SPACE_HOST}`
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      },
    },
  },
})
