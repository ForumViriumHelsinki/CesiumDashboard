import { defineStore } from "pinia";
import * as Cesium from "cesium";
import { StyleOpts, getStyle } from "./layerStyle";
import dayjs, { Dayjs } from "dayjs";

export const useStateStore = defineStore("global", {
    state: () => ({
        viewer: undefined as undefined | Cesium.Viewer,
        layers: {} as Record<string, Cesium.Cesium3DTileset | Cesium.ImageryLayer>,
        selected: {
            feature: undefined as undefined | Cesium.Entity,
        },
        styles: {} as Record<string, StyleOpts>,
        maxTime: dayjs(),
        popoverVisible: false,
        blackWhiteBackground: false,
    }),
    getters: {},
    actions: {
        setViewer(viewer: Cesium.Viewer) {
            this.viewer = viewer;
        },
        addLayer(id: string, layer: Cesium.Cesium3DTileset | Cesium.ImageryLayer) {
            if (!this.layers[id]) {
                this.layers[id] = layer;
            }
        },
        setSelected(fea: Cesium.Entity) {
            this.selected.feature = fea;
        },
        setMaxTime(time: Dayjs) {
            this.maxTime = time;
        },
        setStyle(layerId: string, style: StyleOpts) {
            const lyr = this.layers[layerId];
            if (lyr && lyr instanceof Cesium.Cesium3DTileset) {
                lyr.style = getStyle(style);
                this.styles[layerId] = style;
            }
        },
        toggleLayer(layerId: string, show: boolean) {
            const lyr = this.layers[layerId];
            if (lyr) {
                lyr.show = show;
            }
            this.viewer?.scene.requestRender();
        },
        toggleBlackWhiteBackground() {
            this.blackWhiteBackground = !this.blackWhiteBackground;
            const saturation = this.blackWhiteBackground ? 0.0 : 1.0;
            const brightness = this.blackWhiteBackground ? 0.75 : 1.0;
            const imgLayers = this.viewer?.imageryLayers ?? null;
            const imgLayersCnt = imgLayers?.length ?? 0;
            for (let i = 0; i < imgLayersCnt; i++) {
                if (imgLayers) {
                    const lyr = imgLayers.get(i);
                    lyr.saturation = saturation;
                    lyr.brightness = brightness;
                }
            }
            this.viewer?.scene.requestRender();
        },
    },
});

export type StoreType = ReturnType<typeof useStateStore>;
