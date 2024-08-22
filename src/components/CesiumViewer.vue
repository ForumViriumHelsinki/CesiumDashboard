<!-- Main cesium app wrapper -->
<template>
    <div id="viewer">
        <div @dblclick="sceneClickHandler" id="cesium"></div>
        <Timeline :time-start="dayjs('2021-01-01')" :time-end="dayjs()"></Timeline>
        <AttributePopover
            :feature="selectedFeature?.feature"
            :pos-x="selectedFeature?.posX"
            :pos-y="selectedFeature?.posY"
            :layer-id="selectedFeature?.layerId"
            :layer-name="selectedFeature?.layerName"
        ></AttributePopover>
    </div>
</template>

<script setup lang="ts">
import * as Cesium from "cesium";
import { StoreType, useStateStore } from "../store";
import { onMounted } from "vue";
import { getStyle } from "../layerStyle";
import { conditionLayers, getDomain, otherLayers } from "../layers";
import dayjs from "dayjs";
import Timeline from "./Timeline.vue";
import AttributePopover from "./AttributePopover.vue";
import { LayerItemProps } from "./LayerItem.vue";

const store = useStateStore();
const prod = import.meta.env.PROD;
const TILE_BASE_URL = import.meta.env.VITE_TILE_BASE_URL;
console.log(`Tile base url (prod=${prod}): ${TILE_BASE_URL}`);

onMounted(async () => {
    // @ts-ignore
    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN;
    const viewer = await initialize();
    store.setViewer(viewer);
    addBuildings(store);
    addConditionLayers(store);

    const centerlineLayer = otherLayers.find(lyr => lyr.id === "centerline");
    if (centerlineLayer) {
        addCenterlines(store, centerlineLayer);
    }

    addImageryLayers(store);
});

interface SelectedFeature {
    posX?: number;
    posY?: number;
    feature?: Cesium.Cesium3DTileFeature;
    layerId?: string;
    layerName?: string;
}

const selectedFeature = defineModel<SelectedFeature>("selectedFeature", {
    local: true,
});

const setLighting = (tileset: Cesium.Cesium3DTileset) => {
    tileset.imageBasedLighting.imageBasedLightingFactor = new Cesium.Cartesian2(1.0, 1.0);
    tileset.imageBasedLighting.luminanceAtZenith = 1;
};

const addConditionLayers = (store: StoreType) => {
    // Add the layers in reverse order (lines first, smaller polygons to larger
    // polygons) so that users can click and open attribute table even with
    // multiple layers overlaid on top of each other.
    conditionLayers.toReversed().forEach(layer => {
        if (!layer.enabled) {
            return;
        }
        Cesium.Cesium3DTileset.fromUrl(`${TILE_BASE_URL}/${layer.id}/tileset.json`, {
            debugWireframe: false,
            showOutline: true,
            enableShowOutline: true,
            shadows: Cesium.ShadowMode.DISABLED,
            outlineColor: new Cesium.Color(0, 0, 0),
        }).then(lyr => {
            if (store.layers[layer.id]) {
                return;
            }
            setLighting(lyr);
            const style = {
                attr: layer.styleAttr ?? "timestamp",
                suffix: `_${layer.aggregation}`,
                opacity: layer.opacity,
                scheme: layer.colorScheme ?? "RdYlGn",
                domain: getDomain(layer.styleAttr ?? "timestamp"),
            };
            lyr.style = getStyle(style);
            lyr.show = layer.show ?? true;
            store.viewer?.scene.primitives.add(lyr);
            store.addLayer(layer.id, lyr);
            store.setStyle(layer.id, style);
        });
    });
};

const addBuildings = (store: StoreType) => {
    Cesium.Cesium3DTileset.fromUrl(
        "https://kartta.hel.fi/3d/datasource-data/2bcc0c80-51b8-412b-af72-b3ecc7007a18/tileset.json",
        {}
    ).then(res => {
        console.log("Buildings added!");
        if (store.layers["building_helsinki"]) {
            return;
        }
        store.viewer?.scene.primitives.add(res);
        store.addLayer("building_helsinki", res);
    });
};

const addCenterlines = (store: StoreType, layer: LayerItemProps) => {
    Cesium.Cesium3DTileset.fromUrl(`${TILE_BASE_URL}/centerline/tileset.json`, {}).then(lyr => {
        if (store.layers["centerline"]) {
            return;
        }
        const style = {
            attr: layer.styleAttr ?? "timestamp",
            opacity: layer.opacity,
            scheme: layer.colorScheme ?? "Set1",
            domain: getDomain(layer.styleAttr ?? "timestamp"),
        };
        lyr.style = getStyle(style);
        lyr.show = layer.show ?? true;
        setLighting(lyr);
        store.viewer?.scene.primitives.add(lyr);
        store.addLayer("centerline", lyr);
    });
};

const addImageryLayers = (store: StoreType) => {
    const orthoProvider = new Cesium.WebMapServiceImageryProvider({
        url: "https://kartta.hel.fi/ws/geoserver/avoindata/wms",
        layers: "avoindata:Ortoilmakuva_2021_10cm",
    });
    const ortho = new Cesium.ImageryLayer(orthoProvider, {
        show: false,
    });
    store.viewer?.imageryLayers.add(ortho);
    store.addLayer("ortho_2021", ortho);
};

const sceneClickHandler = (evt: MouseEvent) => {
    const viewer = store.viewer;
    if (!viewer) {
        return;
    }
    const pos = new Cesium.Cartesian2(evt.x, evt.y);
    const picked = viewer.scene.pick(pos);
    if (picked instanceof Cesium.Cesium3DTileFeature) {
        // Determine layer id from the tileset url
        const layerId = picked.tileset.resource.url.replace("/tileset.json", "").split("/").pop();
        selectedFeature.value = {
            feature: picked,
            posX: evt.x,
            posY: evt.y,
            layerId: layerId,
            layerName:
                conditionLayers.find(lyr => lyr.id === layerId)?.layerName ??
                otherLayers.find(lyr => lyr.id === layerId)?.layerName,
        };
        store.popoverVisible = true;
    }
};

const initialize = async () => {
    const dem = Cesium.CesiumTerrainProvider.fromUrl(
        "https://kartta.hel.fi/3d/datasource-data/743103d8-25f0-4f21-9399-6e19eaf7fd77/"
    );

    const viewer = new Cesium.Viewer("cesium", {
        terrainProvider: await dem,
        animation: false,
        fullscreenButton: false,
        selectionIndicator: true,
        geocoder: false,
        shadows: false,
        navigationHelpButton: false,
        timeline: false,
        sceneModePicker: false,
        baseLayerPicker: false,
        infoBox: false,
        homeButton: false,
        requestRenderMode: true,
    });
    viewer.camera.setView({
        // Overview of Southern Helsinki including our test areas
        destination: Cesium.Cartesian3.fromRadians(0.4354962130333961, 1.049711434793112, 9546.512714645929),
        orientation: {
            heading: 6.231235078760192,
            pitch: -1.5370566515972621,
            roll: 0,
        },
    });
    return viewer;
};
</script>

<style scoped>
#viewer {
    width: 100vw;
    height: 100vw;
}
#cesium {
    width: 100vw;
    height: 100%;
}
</style>
