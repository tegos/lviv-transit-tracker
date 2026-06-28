import { defineConfig } from 'vite';

// Bundles src/main.js into a single self-contained ES module served as a
// static asset from public/dist by Express.
export default defineConfig({
    // Express serves the public/ dir directly; Vite only emits the bundle.
    publicDir: false,
    build: {
        outDir: 'public/dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'src/main.js',
            output: {
                entryFileNames: 'app.js',
                assetFileNames: 'app.[ext]',
            },
        },
    },
});
