import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js', 'resources/js/dashboard.js'],
            refresh: true,
            fonts: [
                bunny('Instrument Sans', {
                    weights: [400, 500, 600],
                    optimizedFallbacks: false,
                }),
            ],
        }),
        tailwindcss(),
    ],
    server: {
        host: 'localhost',
        port: 5173,
        strictPort: true,
        proxy: {
            '^/(?:$|\\?|api(?:/|$)|build(?:/|$)|_boost(?:/|$)|up(?:/|$)|favicon\\.ico$|robots\\.txt$)': {
                target: 'http://127.0.0.1:8000',
            },
        },
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
