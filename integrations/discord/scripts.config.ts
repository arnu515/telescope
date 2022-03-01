import { DenonConfig } from "https://deno.land/x/denon@2.5.0/mod.ts";
import { config as env } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";

const config: DenonConfig = {
  scripts: {
    // same as json configuration
    dev: {
      cmd: "src/index.ts",
      desc: "Run server",
      allow: "all",
      env: env(),
      watch: true,
    },
    start: {
      cmd: "src/index.ts",
      desc: "Run server on port 8000",
      allow: "all",
    },
    slash: {
      cmd: "scripts/slash.ts",
      desc: "Create slash commands",
      allow: "all",
      env: env(),
    },
  },
};

export default config;
