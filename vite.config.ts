import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import cesium from "vite-plugin-cesium";

export default defineConfig({
		server: {
			proxy: {
				"/tiles": {
					target: "https://dl2sa.blob.core.windows.net/public3d/katukuntotieto",
					changeOrigin: true,
					secure: false,
					rewrite: (p) => p.replace(/^\/tiles/, ""),
				},
			},
			cors: false,
		},
		preview: {
			proxy: {
				"/tiles": {
					target: "https://dl2sa.blob.core.windows.net/public3d/katukuntotieto",
					changeOrigin: true,
					secure: false,
					rewrite: (p) => p.replace(/^\/tiles/, ""),
				},
			},
			cors: false,
		},
    plugins: [
        vue({
            script: {
                defineModel: true,
            },
        }),
        cesium(),
    ],
});
