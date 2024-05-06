<!-- Timeslider component, inspired by the Cesium timeline -->

<script setup lang="ts">
import dayjs, { Dayjs } from "dayjs";
import { computed } from "vue";
import { ref } from "vue";
import { useMemoize, useDebounceFn } from "@vueuse/core";
import { watch } from "vue";
import { useStateStore } from "../store";
import { onDeactivated } from "vue";
import { onMounted } from "vue";

const store = useStateStore();

export interface TimelineProps {
    timeStart: Dayjs;
    timeEnd: Dayjs;
}

const allTicScales = [
    0.001,
    0.002,
    0.005,
    0.01,
    0.02,
    0.05,
    0.1,
    0.25,
    0.5,
    1.0,
    2.0,
    5.0,
    10.0,
    15.0,
    30.0,
    60.0, // 1min
    120.0, // 2min
    300.0, // 5min
    600.0, // 10min
    900.0, // 15min
    1800.0, // 30min
    3600.0, // 1hr
    7200.0, // 2hr
    14400.0, // 4hr
    21600.0, // 6hr
    43200.0, // 12hr
    86400.0, // 24hr
    172800.0, // 2days
    345600.0, // 4days
    604800.0, // 7days
    1296000.0, // 15days
    2592000.0, // 30days
    5184000.0, // 60days
    7776000.0, // 90days
    15552000.0, // 180days
    31536000.0, // 365days
    63072000.0, // 2years
    126144000.0, // 4years
    157680000.0, // 5years
    315360000.0, // 10years
    630720000.0, // 20years
    1261440000.0, // 40years
    1576800000.0, // 50years
    3153600000.0, // 100years
    6307200000.0, // 200years
    12614400000.0, // 400years
    15768000000.0, // 500years
    31536000000.0, // 1000years
];

const htmlEle = ref<HTMLElement | null>(null);

const resizeHandler = () => {
    containerWidth.value = htmlEle.value?.clientWidth;
};

onMounted(() => {
    window.addEventListener("resize", resizeHandler);
});

onDeactivated(() => {
    window.removeEventListener("resize", resizeHandler);
});

const props = defineProps<TimelineProps>();
const selectedTime = defineModel<Dayjs>("selectedTime", {
    default: dayjs(),
    local: true,
});

const maybeSliding = defineModel<boolean>("maybeSliding", {
    default: false,
    local: true,
});

const sliding = defineModel<boolean>("sliding", {
    default: false,
    local: true,
});

const containerWidth = defineModel<number | undefined>("containerWidth", {
    local: true,
});

const handleSlideStart = useDebounceFn(
    (val: boolean) => {
        maybeSliding.value = val;
        if (!val) {
            sliding.value = false;
        }
    },
    100,
    {}
);

watch(selectedTime, () => {
    store.setMaxTime(selectedTime.value);
});

const slidePos = defineModel<number[]>("slidePos", {
    default: [0, 0],
    local: true,
});

const onSlide = (evt: MouseEvent) => {
    if (!maybeSliding.value) {
        sliding.value = false;
        return;
    }
    sliding.value = true;
    setTimelineMarker(evt.clientX, evt.clientY);
};

const setTimelineMarker = (x: number, y: number) => {
    selectedTime.value = getTimeFromTimebarPixels(x);
    slidePos.value = [x, y];
};

const getTicPos = (i: number, ticScale: number): number => {
    if (i === 0) {
        return 0;
    }
    const seconds = i * ticScale;
    const relativePos = getTimeBarPosition(seconds);
    return relativePos * timeBarWidth.value;
};

function getTimeBarPosition(time: number): number {
    return time / timeSpanSeconds.value;
}

const getTimeFromTimebarPixels = (fromLeft: number): Dayjs => {
    const duration = (fromLeft / timeBarWidth.value) * timeSpanSeconds.value;
    const epoch = startEpoch.value + duration;
    return dayjs.unix(epoch);
};

const getFriendlyStartTime = (): Dayjs => {
    const duration = timeSpanSeconds.value;
    if (duration > 315360000) {
        // 3650+ days visible, epoch is start of the first visible century.
        let dt = dayjs(props.timeStart).startOf("year");
        const centuryMod = dt.year() % 100;
        dt = dt.subtract(centuryMod, "years");
        return dt;
    } else if (duration > 31536000) {
        // 365+ days visible, epoch is start of the first visible decade.
        let dt = dayjs(props.timeStart).startOf("year");
        const centuryMod = dt.year() % 10;
        dt = dt.subtract(centuryMod, "years");
        return dt;
    } else if (duration > 86400) {
        // 1+ day(s) visible, epoch is start of the year.
        return dayjs(props.timeStart).startOf("year");
    }

    return dayjs(props.timeStart).startOf("day");
};

const timeSpanSeconds = computed(() => {
    let seconds = props.timeEnd.unix() - startEpoch.value;
    const minDuration = 1;
    const maxDuration = 60 * 60 * 24 * 365 * 100; // 100 years
    if (seconds < minDuration) {
        seconds = minDuration;
    }
    if (seconds > maxDuration) {
        seconds = maxDuration;
    }
    return seconds;
});

const timeBarWidth = computed(() => {
    let timeBarWidth = containerWidth.value ?? htmlEle.value?.clientWidth ?? 10;
    if (timeBarWidth < 10) {
        timeBarWidth = 10;
    }
    return timeBarWidth;
});

const startEpoch = computed(() => {
    const startTime = getFriendlyStartTime();
    return startTime.unix();
});

const getTickScales = useMemoize((elementWidth: number): number[] => {
    const idealTicPixels = 7.0;
    const minSizePixels = 2.0;
    const epsilon = 1e-10;

    const sampleWidth = 100;
    let idealTic = sampleWidth / elementWidth;
    if (idealTic > 1.0) {
        // Clamp to width of window, for thin windows.
        idealTic = 1.0;
    }
    const idealTicSeconds = idealTic * timeSpanSeconds.value;

    const mainTicScaleIdx = allTicScales.findIndex(duration => {
        const pixelsPerSecond = timeBarWidth.value / timeSpanSeconds.value;
        const ticPixels = duration * pixelsPerSecond;
        return ticPixels >= idealTicPixels && ticPixels > minSizePixels && duration >= idealTicSeconds;
    });
    const mainTicScale = mainTicScaleIdx !== -1 ? allTicScales[mainTicScaleIdx] : 0;
    let subTicScaleIndex = allTicScales
        .slice(0, mainTicScaleIdx)
        .findLastIndex(duration => mainTicScale % duration < epsilon);
    const subTicScale = subTicScaleIndex !== -1 ? allTicScales[subTicScaleIndex] : 0;

    let tinyTicScaleIdx = allTicScales.slice(0, subTicScaleIndex).findIndex(duration => {
        const pixelsPerSecond = timeBarWidth.value / timeSpanSeconds.value;
        const ticPixels = duration * pixelsPerSecond;
        return ticPixels >= idealTicPixels && subTicScale % duration < epsilon;
    });
    const tinyTicScale = tinyTicScaleIdx !== -1 ? allTicScales[tinyTicScaleIdx] : 0;

    return [mainTicScale, subTicScale, tinyTicScale];
});

const mainTics = computed(() => {
    // eslint seems confused from destructuring
    // eslint-disable-next-line no-unused-vars
    const [mainTicScale, _subTicScale, _tinyTicScale] = getTickScales(timeBarWidth.value);
    if (mainTicScale === 0) {
        return [];
    }
    const numMainTicks = Math.ceil(timeSpanSeconds.value / mainTicScale);
    const mainTics = Array.from({ length: numMainTicks }).map((_, i) => getTicPos(i, mainTicScale));
    if (numMainTicks > 1000) {
        return [];
    }
    return mainTics;
});

const subTics = computed(() => {
    //eslint-disable-next-line no-unused-vars
    const [_mainTicScale, subTicScale, _tinyTicScale] = getTickScales(timeBarWidth.value);
    if (subTicScale === 0) {
        return [];
    }
    const numSubTics = Math.floor(timeSpanSeconds.value / subTicScale);
    const subTics = Array.from({ length: numSubTics }).map((_, i) => getTicPos(i, subTicScale));
    if (numSubTics > 1000) {
        return [];
    }
    return subTics;
});

const tinyTics = computed(() => {
    //eslint-disable-next-line no-unused-vars
    const [_mainTicScale, _subTicScale, tinyTicScale] = getTickScales(timeBarWidth.value);
    if (tinyTicScale === 0) {
        return [];
    }
    const numTinyTics = Math.floor(timeSpanSeconds.value / tinyTicScale);
    const tinyTics = Array.from({ length: numTinyTics }).map((_, i) => getTicPos(i, tinyTicScale));
    if (numTinyTics > 1000) {
        return [];
    }
    return tinyTics;
});
</script>

<template>
    <div
        ref="htmlEle"
        class="timeline"
        @click="(evt: MouseEvent) => setTimelineMarker(evt.clientX, evt.clientY)"
        @mousemove="onSlide"
        @mousedown="() => handleSlideStart(true)"
        @mouseup="
            () => {
                // Call the debounced handler to make sure any pending true call is canceled
                handleSlideStart(false);
                // And immediately set to false as well
                maybeSliding = false;
            }
        "
        @contextmenu="evt => evt.preventDefault()"
    >
        <span
            v-for="(tic, i) of tinyTics"
            :key="i"
            class="timeline-tic-tiny"
            :style="{ left: `${tic.toFixed(0)}px` }"
        ></span>
        <span
            v-for="(tic, i) of subTics"
            :key="i"
            class="timeline-tic-sub"
            :style="{ left: `${tic.toFixed(0)}px` }"
        ></span>
        <span
            v-for="(tic, i) of mainTics"
            :key="i"
            class="timeline-tic"
            :style="{ left: `${tic.toFixed(0)}px` }"
        ></span>
        <span
            v-for="(tic, i) of mainTics"
            :key="i"
            class="timeline-tic-label"
            :style="{ left: `${(tic - 28).toFixed(0)}px` }"
        >
            {{ getTimeFromTimebarPixels(tic).format("DD.MM YYYY") }}
        </span>
        <span
            :class="`timeline-tooltip ${sliding ? 'visible' : 'hidden'}`"
            :style="{ left: `${(slidePos[0] - 48).toFixed(0)}px` }"
        >
            {{ getTimeFromTimebarPixels(slidePos[0]).format("DD.MM.YYYY HH:mm") }}
        </span>
        <div class="timeline-marker" v-show="slidePos[0] > 0" :style="{ left: `${(slidePos[0] - 4).toFixed(0)}px` }">
            X
        </div>
    </div>
</template>

<style scoped>
.timeline {
    background: linear-gradient(
        to bottom,
        rgba(116, 117, 119, 0.8) 0%,
        rgba(58, 68, 82, 0.8) 11%,
        rgba(46, 50, 56, 0.8) 46%,
        rgba(53, 53, 53, 0.8) 81%,
        rgba(53, 53, 53, 0.8) 100%
    );
    height: 3.2em;
    cursor: pointer;
    overflow: hidden;
    bottom: 0;
    left: 0;
    /* margin-bottom: 80px; */
    position: absolute;
    border-top: solid 1px #888;
    border-bottom: solid 1px #888;
    z-index: 1;
    width: calc(100vw - 256px);
    user-select: none;
}

.timeline-needle {
    position: absolute;
    left: 0;
    top: 1.7em;
    bottom: 0;
    width: 1px;
    background: #f00;
}

.timeline-tic {
    position: absolute;
    bottom: 0;
    width: 1px;
    height: 50%;
    background: #eee;
}

.timeline-tic-sub {
    position: absolute;
    bottom: 0;
    width: 1px;
    height: 33%;
    background: #aaa;
}

.timeline-tic-tiny {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 1px;
    height: 25%;
    background: #888;
}
.timeline-tic-label {
    font-family: sans-serif;
    position: absolute;
    top: 0;
    left: 0;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 500;
    color: #eee;
}

.timeline-tooltip {
    background-color: #d6604d;
    border-radius: 10px;
    padding: 1px 4px;
    font-family: sans-serif;
    position: absolute;
    bottom: 15px;
    left: 0;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 500;
    color: #eee;
}

.timeline-marker {
    width: 0;
    height: 0;
    bottom: 1px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 15px solid #d6604d;
    position: absolute;
}

.timeline-tooltip.visible {
    visibility: visible;
    opacity: 1;
    transition: opacity 0.2s linear;
}
.timeline-tooltip.hidden {
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s 2s, opacity 0.5s linear;
}
</style>
