import { defineStore } from "pinia";
import * as Cesium from "cesium";

export const useStateStore = defineStore("global", {
    state: () => ({
        viewer: undefined as undefined | Cesium.Viewer,
        tile3dlayers: {} as Record<string, Cesium.Cesium3DTileset>,
    }),
    getters: {},
    actions: {
        setViewer(viewer: Cesium.Viewer) {
            this.viewer = viewer;
        },
        addTileset(id: string, tileset: Cesium.Cesium3DTileset) {
            if (!this.tile3dlayers[id]) {
                this.tile3dlayers[id] = tileset;
            }
        },
        toggleVisibility(id: string) {
            const lyr = this.tile3dlayers[id];
            if (lyr) {
                lyr.show = !!lyr.show;
            }
        },
    },
});

export type StoreType = ReturnType<typeof useStateStore>;
