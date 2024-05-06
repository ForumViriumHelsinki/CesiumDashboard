import * as Cesium from "cesium";
import { ColorScheme, generateColorSchemeByRange, generateColorSchemeByUniverse, getColorScheme } from "./colors";

// Range of values - should be min/max
export type ValueRange = { range: number[]; distinctColors?: number };
// Exhaustive list of all possible values
export type ValueUniverse = { universe: any[] };

const NODATA = import.meta.env.VITE_NODATA;

export interface StyleOpts {
    attr: string;
    opacity: number;
    suffix?: string;
    defaultColor?: string;
    maxDate?: number;
    minDate?: number;
    scheme: ColorScheme;
    domain: ValueRange | ValueUniverse;
}

const BASE_ATTRS = [
    "laatutaso_id",
    "materiaali_id",
    "puhtaanapito_vyohyke",
    "paivitetty_pvm",
    "paatyyppi",
    "alatyyppi",
];

const interpolateRange = (val: number, domain: ValueRange, colors: Cesium.Color[]): Cesium.Color => {
    const offset = domain.range[1] - (domain.range[1] - domain.range[0]);
    const ratio = (val - offset) / (domain.range[1] - offset);
    const idx = Math.round(ratio * (colors.length - 1));
    return colors[idx];
};

const interpolateUniverse = (val: any, domain: ValueUniverse, colors: Cesium.Color[]): Cesium.Color | null => {
    const attrIdx = domain.universe.findIndex(cnd => cnd === val);
    if (attrIdx === -1) {
        return null;
    }
    const ratio = attrIdx / (colors.length - 1);
    const colorIdx = Math.round(ratio * (colors.length - 1));
    const color = colors[colorIdx];
    return color;
};

export const getStyle = (opts: StyleOpts): Cesium.Cesium3DTileStyle => {
    let suffix = opts.suffix ?? "";

    const isBaseAttribute = BASE_ATTRS.includes(opts.attr);

    if (isBaseAttribute) {
        // Base attributes are never aggregated so we can drop the suffix.
        suffix = "";
    }

    if (suffix.length > 0 && !suffix.startsWith("_")) {
        suffix = `_${suffix}`;
    }
    const attr = `${opts.attr}${suffix}`;
    const style = new Cesium.Cesium3DTileStyle();

    let domain = opts.domain;

    const defaultColor = new Cesium.Color(0.5, 0.5, 0.5, opts.opacity);
    const interpolator = "range" in domain ? interpolateRange : interpolateUniverse;
    const colorGenerator = "range" in domain ? generateColorSchemeByRange : generateColorSchemeByUniverse;

    // If we are displaying deltas, switch range from absolute value limits to -diff to +diff
    if (opts.suffix === "_delta" && "range" in domain) {
        const diff = domain.range[1] - domain.range[0];
        domain = {
            ...domain,
            range: [-diff, diff],
        };
    }

    const originalColors = getColorScheme(opts.scheme).map(
        rgb => new Cesium.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, opts.opacity)
    );
    // Interpolate the correct scheme here
    //@ts-ignore // We already checked the type of domain implicitly when defining interpolator
    const cesiumColors = colorGenerator(domain, originalColors);

    if (isBaseAttribute) {
        //@ts-ignore
        style.color = {
            evaluateColor: (fea: Cesium.Cesium3DTileFeature, result: Cesium.Color): Cesium.Color => {
                // Find next index from the time index where selected attribute value is set
                const attrVal = fea.getProperty(attr);
                if (!attrVal) {
                    console.error(`Unable to find attribute ${attr}`);
                    return Cesium.Color.clone(defaultColor, result);
                }
                //@ts-ignore // We already checked the type of domain in the outer closure
                const color = interpolator(attrVal, domain, cesiumColors);
                return Cesium.Color.clone(color ?? defaultColor, result);
            },
        };
    } else {
        //@ts-ignore
        style.color = {
            evaluateColor: (fea: Cesium.Cesium3DTileFeature, result: Cesium.Color): Cesium.Color => {
                const data = fea.getProperty("data");
                if (!data) {
                    return Cesium.Color.clone(defaultColor, result);
                }
                const timeProp = data.timestamp as number[] | undefined;
                if (!timeProp) {
                    return Cesium.Color.clone(defaultColor, result);
                }

                const idx = timeProp.findIndex(
                    val => val >= (opts.minDate ?? 0) && val < (opts.maxDate ?? Number.MAX_VALUE)
                );

                // Find next index from the time index where selected attribute value is set
                const attrProp = data[attr] as number[];
                if (!attrProp) {
                    console.error(`Unable to find attribute ${attr}`);
                    return Cesium.Color.clone(defaultColor, result);
                }
                const attrIdx = attrProp.findIndex((val, i) => i >= idx && val > NODATA);
                if (idx === -1 || attrIdx === -1) {
                    return Cesium.Color.clone(defaultColor, result);
                }
                const attrVal = attrProp[attrIdx];
                if (attrVal !== undefined) {
                    //@ts-ignore // We already checked the type of domain in the outer closure
                    const color = interpolator(attrVal, domain, cesiumColors);
                    return Cesium.Color.clone(color ?? defaultColor, result);
                }
                return Cesium.Color.clone(defaultColor, result);
            },
        };
    }

    return style;
};
