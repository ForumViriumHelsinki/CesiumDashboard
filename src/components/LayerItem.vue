<!-- LayerItem represents a toggleable and configurable layer in the side bar -->
<script setup lang="ts">
import { watch } from "vue";
import { useStateStore } from "../store";
import { StyleOpts } from "../layerStyle";
import { COLORSCHEMES, ColorScheme, getColorScheme } from "../colors";
import { storeToRefs } from "pinia";
import { getDomain } from "../layers";

const store = useStateStore();

const { maxTime } = storeToRefs(store);

export interface LayerItemProps {
    attributes?: string[];
    isAggregated?: boolean;
    layerName: string;
    layerIcon: string;
    id: string;
    opacity: number;
    styleAttr?: string;
    aggregation?: string;
    colorScheme?: ColorScheme;
    hasConfig?: boolean;
    expanded?: boolean;
    show?: boolean;
    enabled: boolean;
}

const props = defineModel<LayerItemProps>({
    default: {
        expanded: false,
        hasConfig: false,
        opacity: 0.5,
        isAggregated: false,
        colorScheme: "RdYlGn",
        attributes: [],
    },
    local: true,
});

const toggleExpandConfig = () => {
    props.value.expanded = !props.value.expanded;
};

watch([props.value, maxTime], () => {
    if (!props.value.colorScheme) {
        return;
    }
    if (!props.value.aggregation && props.value.isAggregated) {
        props.value.aggregation = "mean";
    }
    const style: StyleOpts = {
        opacity: props.value.opacity ?? 0.5,
        attr: props.value.styleAttr ?? "timestamp",
        scheme: props.value.colorScheme ?? "RdYlGn",
        suffix: props.value.aggregation ? `_${props.value.aggregation}` : "",
        domain: getDomain(props.value.styleAttr ?? "timestamp"),
        maxDate: parseInt(maxTime.value.format("YYYYMMDDHHmmss")),
    };
    console.log(`Setting ${props.value.id} style to`, style);
    store.setStyle(props.value.id, style);
    store.viewer?.scene.requestRender();
});

watch(props.value, () => {
    if (props.value.show !== undefined) {
        store.toggleLayer(props.value.id, props.value.show);
    }
});

const getGradientStyle = (colors: number[][]): any => {
    const gradient = colors.map(color => `rgb(${color[0]}, ${color[1]}, ${color[2]})`).join(", ");
    return `linear-gradient(to right, ${gradient})`;
};
</script>

<template>
    <div>
        <v-switch
            :disabled="!props.enabled"
            v-model="props.show"
            :on-click:append="toggleExpandConfig"
            :label="props.layerName"
            density="compact"
            color="primary"
            :prepend-icon="props.layerIcon"
            :append-icon="props.hasConfig ? 'mdi-chevron-down-circle' : ''"
        >
        </v-switch>
        <v-card v-if="props.expanded" flat density="compact">
            <v-card-item density="compact" subtitle="Style">
                <v-divider></v-divider>
                <v-select
                    v-model="props.styleAttr"
                    variant="solo"
                    flat
                    density="compact"
                    single-line
                    :items="props.attributes"
                ></v-select>
                <v-select
                    v-model="props.colorScheme"
                    :menu-props="{ closeOnContentClick: true }"
                    :items="
                        Object.entries(COLORSCHEMES).map(entry => {
                            const [key, val] = entry;
                            return { scheme: key, colors: val };
                        })
                    "
                    variant="solo"
                    flat
                    density="compact"
                    single-line
                >
                    <template #selection="data">
                        <div
                            class="color-select"
                            :style="{ background: getGradientStyle(getColorScheme(data.item.value)) }"
                        ></div>
                    </template>
                    <template #item="data">
                        <div
                            class="color-select option"
                            @click="
                                () => {
                                    const val = data.item.value['scheme'] as ColorScheme;
                                    props.colorScheme = val;
                                }
                            "
                            :style="{ background: getGradientStyle(data.item.value['colors']) }"
                        ></div>
                    </template>
                </v-select>
                <v-radio-group v-if="props.isAggregated" v-model="props.aggregation" density="compact">
                    <v-radio label="Mean" value="mean"></v-radio>
                    <v-radio label="Mean delta" value="delta"></v-radio>
                    <v-radio label="Max" value="max"></v-radio>
                    <v-radio label="Min" value="min"></v-radio>
                </v-radio-group>
            </v-card-item>
            <v-card-item subtitle="Opacity">
                <v-divider></v-divider>
                <v-slider
                    v-model="props.opacity"
                    append-icon="mdi-circle-opacity"
                    :ripple="false"
                    step="0.05"
                    :min="0"
                    :max="0.95"
                ></v-slider>
            </v-card-item>
            <v-divider></v-divider>
        </v-card>
    </div>
</template>

<style scoped>
.v-card-item {
    text-align: left;
}
div.v-card-title {
    font-size: 10px;
    text-transform: capitalize;
}
div.color-select {
    min-width: 100%;
    width: 500px;
    cursor: pointer;
    height: 15px;
    margin-bottom: 15px;
}
div.color-select.option {
    width: 100%;
    padding-right: 20px;
    padding-left: 20px;
}
div.color-select.option:hover {
    width: 100%;
    border: 2px groove gray;
    transform: scale(1, 1.25);
}
</style>
