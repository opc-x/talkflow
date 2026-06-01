import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // 让通过的测试也打印 console.log（默认只打失败的，看不到验了啥）
    disableConsoleIntercept: true,
  },
  resolve: {
    // shared/ 下 .ts 与旧 .js 编译产物并存 —— 强制优先 .ts，别解析到陈旧 .js
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "@shared": fileURLToPath(new URL("./shared", import.meta.url)),
    },
  },
})
