<!-- Popover component for displaying the attributes of a single feature -->
<script setup lang="ts">
import { Cesium3DTileFeature } from "cesium";
import { computed } from "vue";
import { useStateStore } from "../store";
import dayjs from "dayjs";
import { storeToRefs } from "pinia";

const NODATA = import.meta.env.VITE_NODATA;

const store = useStateStore();

const { popoverVisible } = storeToRefs(store);

const popoverWidth = 500;
const popoverHeight = 300;
const sideBarWidth = 256;

const timeCol = "timestamp";

const dragging = defineModel<boolean>("dragging", {
    local: true,
    default: false,
});

interface visibleAttr {
    timestamp: number;
    attribute: string;
}

const visible = defineModel<visibleAttr>("visible", {
    local: true,
});

export interface AttributePopoverProps {
    posX?: number;
    posY?: number;
    feature?: Cesium3DTileFeature;
    layerId?: string;
    layerName?: string;
}

interface TimeDataMatrix {
    rows: number;
    columns: string[];
    timestamps: number[];
    values: Record<string, number[]>;
}

interface AttrNameValue {
    key: string;
    val: string;
}

// Compute the time-independent base attributes
const attributes = computed(() => {
    if (!props.feature) {
        return;
    }
    const feaProps = props.feature.getPropertyIds().sort();
    const attrs = feaProps.reduce((acc, key) => {
        if (key === "data") {
            return acc;
        }
        let val = props.feature?.getProperty(key);
        if (typeof val === "number") {
            if (key.endsWith("_pvm")) {
                val = dayjs(val.toString()).format("DD.MM.YYYY");
            } else {
                val = val.toFixed(0);
            }
        }
        acc.push({ key: key, val: val });
        return acc;
    }, [] as AttrNameValue[]);
    return attrs;
});

// Compute the time matrix for time-dependent measurement data
const data = computed(() => {
    if (!popoverVisible || !props.feature || !style.value) {
        return;
    }
    const fea = props.feature;
    const suffix = style.value.suffix;
    const feaData = fea.getProperty("data") as Record<string, number[]> | undefined;
    if (!feaData) {
        return;
    }
    const timeVals = feaData[timeCol];

    const attrCol = `${style.value.attr ?? timeCol}${style.value.suffix ?? ""}`;
    const attrVals = feaData[attrCol];
    const visibleTime = attrVals
        ? timeVals.find(
              (ts, i) =>
                  ts >= (style.value?.minDate ?? 0) &&
                  ts < (style.value?.maxDate ?? Number.MAX_VALUE) &&
                  attrVals[i] > NODATA
          )
        : undefined;

    // eslint-disable-next-line vue/no-side-effects-in-computed-properties
    visible.value = {
        timestamp: visibleTime ?? -1,
        attribute: style.value.attr,
    };

    const vals = Object.keys(feaData).reduce((acc, cur) => {
        if (((suffix && cur.endsWith(suffix)) || !suffix) && cur !== timeCol) {
            const colVals = feaData[cur];
            const colName = suffix ? cur.replace(`${suffix}`, "") : cur;
            acc[colName] = colVals;
        }
        return acc;
    }, {} as Record<string, number[]>);

    const timeMatrix = {
        rows: timeVals.length,
        columns: Object.keys(vals),
        timestamps: timeVals,
        values: vals,
    } as TimeDataMatrix;
    return timeMatrix;
});

const style = computed(() => {
    if (props.layerId) {
        const style = store.styles[props.layerId];
        return style;
    }
    return undefined;
});

const position = computed(() => {
    const maxX = window.innerWidth - popoverWidth;
    const maxY = window.innerHeight - popoverHeight;
    const [userX, userY] = userPosition.value ?? [undefined, undefined];
    let [x, y] = [userX ?? props.posX ?? 0, userY ?? props.posY ?? 0];

    // Flip X around to other other side of cursor
    if (!userX && !userY) {
        if (x > maxX - sideBarWidth) {
            x = x - popoverWidth;
        } else {
            x += 5;
        }
        y -= 100;
    }

    // Clamp y to window bounds
    if (y > maxY) {
        y = maxY;
    }
    return [x, y];
});

const dragStartPosition = defineModel<number[]>("dragStartPosition", { local: true });
const userPosition = defineModel<number[]>("userPosition", { local: true });

const props = defineProps<AttributePopoverProps>();

const formatMeasurement = (val: number | undefined): string => {
    if (val && Number.isFinite(val) && val > NODATA) {
        if (style.value?.suffix === "_delta" && val >= 0) {
            // Prepend `+` to emphasize delta values being different from absolute values
            return `+${val.toFixed(2)}`;
        }
        return val.toFixed(2);
    }
    return "-";
};
</script>

<template>
    <div
        :class="dragging ? 'dragging' : ''"
        @mousedown="(evt: MouseEvent) => {
            dragging = true;
            dragStartPosition = [evt.clientX, evt.clientY];
            userPosition = [position[0] ?? evt.clientX, position[1] ?? evt.clientY]
        }"
        @mousemove="(evt: MouseEvent) => {
            if (dragging && dragStartPosition && userPosition) {
                //@ts-ignore
                const bounds = evt.target.getBoundingClientRect()
                const diff = [evt.clientX - dragStartPosition[0], evt.clientY - dragStartPosition[1]]
                userPosition = [userPosition[0] + diff[0], userPosition[1] + diff[1]]
                dragStartPosition = [evt.clientX, evt.clientY]
            }
        }"
        @mouseup="() => (dragging = false)"
        @mouseleave="() => (dragging = false)"
        v-show="feature && popoverVisible"
        :style="{
            width: `${popoverWidth}px`,
            height: `${popoverHeight}px`,
            left: `${position[0]}px`,
            top: `${position[1]}px`,
        }"
        class="attribute-popover"
    >
        <div class="sticky-header">
            <span>{{ layerName ?? "" }} Attributes</span>
            <a
                @click="
                    () => {
                        popoverVisible = false;
                        userPosition = undefined;
                    }
                "
                class="close-btn right"
            >
                <v-icon color="rgb(103,80,164)" icon="mdi-close-circle"> </v-icon>
            </a>
        </div>

        <div class="content"></div>
        <table>
            <thead>
                <tr class="attr-header">
                    <td v-for="kvp in attributes" :key="kvp.key">
                        {{ kvp.key }}
                    </td>
                </tr>
            </thead>
            <tbody>
                <tr class="striped">
                    <td v-for="kvp in attributes" :key="kvp.key">
                        <span v-if="kvp.val && kvp.val.startsWith('http')">
                            <a :href="kvp.val" target="_blank">link</a>
                        </span>
                        <span v-else>{{ kvp.val }}</span>
                    </td>
                </tr>
            </tbody>
        </table>
        <br />
        <div v-show="data && data.timestamps.length > 0">
            <span class="section-header">Measurements</span>
            <table>
                <thead>
                    <tr class="data-header">
                        <td>timestamp</td>
                        <td
                            :class="col === visible?.attribute ? 'active-col' : ''"
                            v-for="col in data?.columns"
                            :key="col"
                        >
                            {{ col }}
                        </td>
                    </tr>
                </thead>
                <tbody>
                    <tr :class="i % 2 === 0 ? 'striped' : ''" v-for="(ts, i) in data?.timestamps" :key="ts">
                        <td :class="ts === visible?.timestamp ? 'active-row' : ''">
                            {{ dayjs(ts.toString()).format("DD.MM.YYYY") }}
                        </td>
                        <td v-for="(vals, j) in data?.values" :key="j">
                            {{ vals ? formatMeasurement(vals[i]) : "-" }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.attribute-popover {
    cursor: grab;
    font-family: sans-serif;
    padding: 0px 5px 5px 5px;
    position: absolute;
    border-radius: 5px;
    background: white;
    z-index: 5;
    box-shadow: outset 5px 5px 5px black;
    overflow-y: auto;
    user-select: none;
    display: flex;
    flex-direction: column;
}
.attribute-popover.dragging {
    cursor: grabbing;
}

.content {
    margin-top: 15px;
}
.close-btn {
    margin-right: 5px;
    cursor: pointer;
}

.sticky-header {
    padding-bottom: 2px;
    color: black;
    background-color: white;
    display: flex;
    position: sticky;
    top: 0px;
    z-index: 5;
    width: 100%;
    border-bottom: 1px outset rgba(0, 0, 0, 0.2);
}
.sticky-header > span {
    font-size: 16px;
    padding-top: 5px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-left: 5px;
}
.sticky-header > .right {
    margin-left: auto;
}
.section-header {
    display: block;
    margin-left: 5px;
    width: 100%;
    text-align: left;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: black;
}

table {
    border-color: rgba(0, 0, 0, 0.25);
    border-style: solid;
    border-width: 1px;
    font-size: 12px;
    margin-top: 10px;
}

tr.attr-header > td {
    font-family: sans-serif;
    letter-spacing: 0;
    font-weight: 600;
}
tr.data-header > td {
    font-family: sans-serif;
    letter-spacing: 0;
    font-weight: 600;
}

td {
    padding: 3px;
    background-color: rgb(225, 225, 225);
    font-family: sans-serif;
    letter-spacing: 0;
    color: black;
}
td.active-row {
    text-decoration: underline;
}
td.active-row::after {
    content: "";
    position: absolute;
    transform: translate(100%, 0%);
    border-bottom: 10px solid transparent;
    border-left: 5px solid #d6604d;
    border-top: 10px solid transparent;
}

td.active-col {
    text-decoration: underline;
}
tr.striped > td {
    background-color: rgb(245, 245, 245);
}
</style>
