import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// 앱 코드의 "@/..." 경로를 자동 점검에서도 그대로 쓰게 합니다.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
