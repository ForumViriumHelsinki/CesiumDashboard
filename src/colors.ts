// Layer colorization utilities

import * as Cesium from "cesium";
import chroma from "chroma-js";
import { ValueRange, ValueUniverse } from "./layerStyle";

// Colorbrewer schemes
export type ColorScheme =
    | "RdYlGn"
    | "BrBg"
    | "PiYg"
    | "PuOr"
    | "RdBu"
    | "Blues"
    | "Greens"
    | "YlOrRd"
    | "Greys"
    | "Accent"
    | "Dark2"
    | "Set1"
    | "Pastel";

export const COLORSCHEMES: Record<ColorScheme, number[][]> = {
    RdYlGn: [
        [215, 25, 28],
        [253, 174, 97],
        [255, 255, 191],
        [166, 217, 106],
        [26, 150, 65],
    ],
    PiYg: [
        [208, 28, 139],
        [241, 182, 218],
        [247, 247, 247],
        [184, 225, 134],
        [77, 172, 38],
    ],
    BrBg: [
        [166, 97, 26],
        [223, 194, 125],
        [245, 245, 245],
        [128, 205, 193],
        [1, 133, 113],
    ],
    PuOr: [
        [230, 97, 1],
        [253, 184, 99],
        [247, 247, 247],
        [178, 171, 210],
        [94, 60, 153],
    ],
    RdBu: [
        [202, 0, 32],
        [244, 165, 130],
        [247, 247, 247],
        [146, 197, 222],
        [5, 113, 176],
    ],
    Blues: [
        [239, 243, 255],
        [189, 215, 231],
        [107, 174, 214],
        [49, 130, 189],
        [8, 81, 156],
    ],
    Greens: [
        [237, 248, 233],
        [186, 228, 179],
        [116, 196, 118],
        [49, 163, 84],
        [0, 109, 44],
    ],
    YlOrRd: [
        [255, 255, 178],
        [254, 204, 92],
        [253, 141, 60],
        [240, 59, 32],
        [189, 0, 38],
    ],
    Greys: [
        [247, 247, 247],
        [204, 204, 204],
        [150, 150, 150],
        [99, 99, 99],
        [37, 37, 37],
    ],
    Accent: [
        [127, 201, 127],
        [190, 174, 212],
        [253, 192, 134],
        [255, 255, 153],
        [56, 108, 176],
    ],
    Dark2: [
        [27, 158, 119],
        [217, 95, 2],
        [117, 112, 179],
        [231, 41, 138],
        [102, 166, 30],
    ],
    Set1: [
        [228, 26, 28],
        [55, 126, 184],
        [77, 175, 74],
        [152, 78, 163],
        [255, 127, 0],
    ],
    Pastel: [
        [251, 180, 174],
        [179, 205, 227],
        [204, 235, 197],
        [222, 203, 228],
        [254, 217, 166],
    ],
};

export const getColorScheme = (scheme: ColorScheme) => COLORSCHEMES[scheme];

const cesiumColorToChroma = (color: Cesium.Color): chroma.Color => {
    return chroma.rgb(color.red * 255, color.green * 255, color.blue * 255, color.alpha);
};

// Generates color scheme with (at least) the desired number of distinct colors in ValueRange
export const generateColorSchemeByRange = (domain: ValueRange, colors: Cesium.Color[]): Cesium.Color[] => {
    if (domain.range[0] == 1 && domain.range[1] == 5) {
        return colors;
    } else {
        if (!domain.distinctColors || domain.distinctColors <= 5) {
            return colors;
        }
        const results: chroma.Color[] = [];
        const steps = Math.ceil(domain.distinctColors ?? 5 / colors.length);
        for (let i = 0; i < colors.length - 1; i++) {
            const startColor = cesiumColorToChroma(colors[i]);
            const endColor = cesiumColorToChroma(colors[i + 1]);
            for (let j = 0; j < steps; j++) {
                results.push(chroma.mix(startColor, endColor, j / steps, "lab"));
            }
        }
        return results.map(clr => new Cesium.Color(...clr.rgb().map(c => c / 255.0), clr.alpha()));
    }
};

// Generates color scheme with at least the number of colors as number of classes in the universe.
export const generateColorSchemeByUniverse = (domain: ValueUniverse, colors: Cesium.Color[]): Cesium.Color[] => {
    if (domain.universe.length <= colors.length) {
        return colors;
    } else {
        const results: chroma.Color[] = [];
        const steps = Math.ceil(domain.universe.length / (colors.length - 1));
        for (let i = 0; i < colors.length - 1; i++) {
            const startColor = cesiumColorToChroma(colors[i]);
            const endColor = cesiumColorToChroma(colors[i + 1]);
            for (let j = 0; j < steps; j++) {
                results.push(chroma.mix(startColor, endColor, j / steps, "lab"));
            }
        }
        return results.map(clr => new Cesium.Color(...clr.rgb().map(c => c / 255.0), clr.alpha()));
    }
};
