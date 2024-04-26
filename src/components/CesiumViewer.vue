<template>
    <div id="cesium"></div>
</template>

<script setup lang="ts">
import * as Cesium from "cesium";
import { StoreType, useStateStore } from "../store";
import { onMounted } from "vue";

const store = useStateStore();

onMounted(async () => {
    // @ts-ignore
    // Cesium.Ion.defaultAccessToken = null;
    const viewer = await initialize();
    store.setViewer(viewer);
    addBuildings(store);
});

const addBuildings = (store: StoreType) => {
    Cesium.Cesium3DTileset.fromUrl(
        "https://kartta.hel.fi/3d/datasource-data/2bcc0c80-51b8-412b-af72-b3ecc7007a18/tileset.json",
        {}
    ).then(res => {
        store.viewer?.scene.primitives.add(res);
        store.addTileset("building_helsinki", res);
    });

    Cesium.Cesium3DTileset.fromUrl("https://kartta.vantaa.fi/3d/rakennukset/data/tileset.json", {}).then(res => {
        store.viewer?.scene.primitives.add(res);
        store.addTileset("building_vantaa", res);
    });
};

const initialize = async () => {
    const dem = Cesium.CesiumTerrainProvider.fromUrl(
        "https://kartta.hel.fi/3d/datasource-data/743103d8-25f0-4f21-9399-6e19eaf7fd77/"
    );

    // Cesium.WebMapTileServiceImageryProvider

    const viewer = new Cesium.Viewer("cesium", {
        terrainProvider: await dem,
        animation: false,
        fullscreenButton: false,
        geocoder: false,
        shadows: false,
        navigationHelpButton: false,
        timeline: false,
        sceneModePicker: false,
        baseLayerPicker: true,
        infoBox: false,
        homeButton: false,
    });
    viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(24.99, 60.15, 1000),
        orientation: {
            heading: -1,
            pitch: 5.8,
        },
    });
    return viewer;
};
</script>

<style scoped>
#cesium {
    width: 100%;
    height: 100%;
}
</style>
