import { defineConfig } from 'vite';

// The Rozenite Vite plugin uses ESM-only Tailwind tooling.
export default defineConfig(async () => {
  const { rozenitePlugin } = await import('@rozenite/vite-plugin');

  return {
    root: __dirname,
    plugins: [rozenitePlugin()],
    base: './',
    build: {
      outDir: './dist',
      emptyOutDir: false,
      reportCompressedSize: false,
      minify: true,
      sourcemap: false,
    },
  };
});
