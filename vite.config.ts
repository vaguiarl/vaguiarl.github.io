import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    target: "es2022",
    cssMinify: true,
    rolldownOptions: {
      input: ["index.html", "conscious-life/index.html", "moral-life/index.html"],
    },
  },
});
