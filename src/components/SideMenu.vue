<script setup lang="ts">
import { conditionLayers, otherLayers } from "../layers";
import LayerItem from "./LayerItem.vue";
import { useStateStore } from "../store";
import { storeToRefs } from "pinia";
import * as Cesium from "cesium";

const store = useStateStore();
const { blackWhiteBackground } = storeToRefs(store);
const showHelp = defineModel<boolean>("showHelp", { local: true, default: false });

const flyToArea1 = () => {
    // Fly camera to Lönnrotinkatu
    store.viewer?.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(0.434983244, 1.049980849, 378.541476),
        orientation: {
            heading: 0.822,
            pitch: -0.814,
        },
    });
};

const flyToArea2 = () => {
    // Fly camera to the intersection of Teollisuuskatu-Mäkelänkatu
    store.viewer?.camera.flyTo({
        destination: Cesium.Cartesian3.fromRadians(0.43568338718940447, 1.0504395493469776, 274.7023807957504),
        orientation: {
            heading: 5.958,
            pitch: -0.664,
        },
    });
};
</script>
<template>
    <div>
        <v-dialog :model-value="showHelp" width="800px">
            <v-card title="Help">
                <v-card-text>Content here</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text="Close" @click="showHelp = false"></v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-navigation-drawer location="right" permanent expand-on-hover>
            <!-- TODO: Enable to show help button -->
            <!-- <div class="help-container">
                    <span>Road condition</span>
                    <v-btn
                        @click="() => (showHelp = true)"
                        class="mx-3 ml-auto"
                        size="x-small"
                        icon="mdi-help"
                        title="Help"
                    ></v-btn>
                </div> -->
            <v-divider></v-divider>
            <h4>Select test area</h4>
            <div style="margin-top: 10px">
                <v-btn
                    @click="flyToArea1"
                    class="mx-3"
                    size="small"
                    icon="mdi-numeric-1-circle"
                    title="Lönnrotinkatu"
                ></v-btn>
                <v-btn
                    @click="flyToArea2"
                    class="mx-3"
                    size="small"
                    title="Mäkelänkatu, Teollisuuskatu, Sturenkatu"
                    icon="mdi-numeric-2-circle"
                ></v-btn>
            </div>
            <button
                @click="
                    () => {
                        const cam = store.viewer?.scene.camera;
                        console.log(store.viewer?.scene.camera);
                        const pos = [
                            cam?.positionCartographic.longitude,
                            cam?.positionCartographic.latitude,
                            cam?.positionCartographic.height,
                        ];
                        const orientation = { heading: cam?.heading, pitch: cam?.pitch, roll: cam?.roll };
                        console.log(pos);
                        console.log(orientation);
                    }
                "
            ></button>
            <v-divider></v-divider>
            <h4>Condition layers</h4>
            <v-list nav density="compact">
                <LayerItem v-for="(_, i) in conditionLayers" :key="i" v-model="conditionLayers[i]"></LayerItem>
            </v-list>
            <v-divider></v-divider>
            <h4>Other layers</h4>
            <v-list nav density="compact">
                <LayerItem v-for="(_, i) in otherLayers" :key="i" v-model="otherLayers[i]"></LayerItem>
            </v-list>
            <v-divider></v-divider>
            <h4>Options</h4>
            <div>
                <v-list nav>
                    <div
                        style="
                             {
                                margin-left: 15px;
                            }
                        "
                    >
                        <v-switch
                            prepend-icon="mdi-invert-colors"
                            v-model="blackWhiteBackground"
                            @click="
                                () => {
                                    store.toggleBlackWhiteBackground();
                                }
                            "
                            label="Black & white"
                            density="compact"
                            color="primary"
                        >
                        </v-switch>
                    </div>
                </v-list>
            </div>
        </v-navigation-drawer>
    </div>
</template>

<style scoped>
.help-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    padding: 0px 5px 5px 5px;
    font-size: 14px;
    font-family: sans-serif;
    text-transform: uppercase;
    font-weight: 800;
    margin-bottom: 10px;
    letter-spacing: 0.1em;
}
.help-container > span {
    margin-top: 6px;
}
.help-container > .right {
    margin-left: auto;
}
</style>
