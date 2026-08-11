import { loadEnvFile } from "node:process";
import { existsSync } from "node:fs";

export function loadApiEnv() {
  for (const envPath of ["apps/api/.env", "apps/web/.env", ".env"]) {
    if (existsSync(envPath)) {
      try {
        loadEnvFile(envPath);
      } catch (error) {
        if (error?.code !== "ENOENT") {
          throw error;
        }
      }
    }
  }
}
