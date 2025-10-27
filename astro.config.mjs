import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind"; // Make sure this line exists
import react from "@astrojs/react";     // Make sure this line exists

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(), // Make sure tailwind() is here
    react()     // Make sure react() is here
  ] 
});