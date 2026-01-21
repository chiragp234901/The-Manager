import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Enables JSX
import tailwindcss from "@tailwindcss/postcss";

export default defineConfig({
  plugins: [react()], // Registers React plugin
  css: {
    postcss: {
      plugins: [tailwindcss()], // Registers Tailwindcss plugin
    },
  },
});
