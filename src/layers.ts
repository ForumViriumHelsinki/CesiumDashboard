// Layer definitions
import dayjs from "dayjs";
import { LayerItemProps } from "./components/LayerItem.vue";
import { ValueRange, ValueUniverse } from "./layerStyle";

const defaultDateRange = [
    parseInt(dayjs().subtract(10, "years").format("YYYYMMDDHHmmss")),
    parseInt(dayjs().format("YYYYMMDDHHmmss")),
];

const attrDomains: Record<string, ValueRange | ValueUniverse> = {
    kokonais_luokka: { range: [1.0, 5.0] },
    iri_luokka: { range: [1.0, 5.0] },
    ura_luokka: { range: [1.0, 5.0] },
    kuntoarvo: { range: [0.3, 1.0] },
    materiaali_id: {
        universe: [
            501, 512, 1837, 573, 523, 511, 82, 521, 516, 81, 514, 522, 121, 524, 541, 83, 1619, 971, 2857, 810, 2477,
            1618, 61, 2440, 7216, 7018, 3097, 261, 515, 3080, 181, 4477, 7876, 3177, 5017, 1561, 7017, 7016, 2917, 102,
            6418, 799, 618, 817, 301, 531, 6976, 572, 2798, 2797, 571, 1937, 1737, 658, 1677, 1612, 3657, 141, 7019,
            3837, 3840, 865, 281, 1581, 804,
        ],
    },
    laatutaso_id: { universe: [1, 2, 3, 52, 70, 71, 73, 75, 76] },
    puhtaanapito_vyohyke: { universe: [3, 2, 1, -1] },
    paatyyppi: { universe: ["Kevyt liikenne", "Katu", "Muu väylä"] },
    alatyyppi: {
        universe: [
            "Yhdistetty jalkakäytävä ja pyörätie",
            "Tonttikatu",
            "Jalkakäytävä ja pyörätie samassa tasossa",
            "Jalkakäytävä",
            "Alueellinen kokoojakatu",
            "Jalkakäytävän tasossa oleva pyörätie",
            "Suojatie",
            "Kulkuväylä aukiolla",
            "Väylälinkki",
            "Välikaistalla erotellut jalkakäytävä ja pyörätie",
            "Päätie",
            "Porras/portaat",
            "Pyöräkaista",
            "Puistotie- tai väylä",
            "Asuntokatu",
            "Paikallinen kokoojakatu",
            "Huoltotie",
            "Välikaistalla eroteltu pyörätie",
            "Pyöräliikenteen ylityspaikka",
            "Tasoeroteltu pyörätie",
            "Piha- ja/tai kävelykatu",
            "Muu polku",
            "Pyöräkatu",
            "Moottoriväylä",
        ],
    },
    paivitetty_pvm: { range: defaultDateRange, distinctColors: 50 },
    timestamp: { range: defaultDateRange, distinctColors: 50 },
};

export const getDomain = (attr: string): ValueRange | ValueUniverse => {
    return attrDomains[attr];
};

export const conditionLayers: LayerItemProps[] = [
    {
        attributes: [
            "kokonais_luokka",
            "iri_luokka",
            "ura_luokka",
            "kuntoarvo",
            "materiaali_id",
            "laatutaso_id",
            "puhtaanapito_vyohyke",
            "paivitetty_pvm",
        ],
        isAggregated: true,
        layerName: "YLRE",
        id: "ylre",
        layerIcon: "mdi-alpha-y-box",
        styleAttr: "materiaali_id",
        aggregation: "mean",
        colorScheme: "Dark2",
        hasConfig: true,
        opacity: 0.4,
        show: true,
        enabled: true,
    },
    {
        attributes: [
            "kokonais_luokka",
            "iri_luokka",
            "ura_luokka",
            "kuntoarvo",
            "materiaali_id",
            "laatutaso_id",
            "puhtaanapito_vyohyke",
            "paivitetty_pvm",
        ],
        isAggregated: true,
        layerName: "YLRE-split",
        id: "ylre_way",
        layerIcon: "mdi-alpha-y-box-outline",
        styleAttr: "kokonais_luokka",
        aggregation: "mean",
        colorScheme: "RdBu",
        hasConfig: true,
        opacity: 0.4,
        show: false,
        enabled: true,
    },
    {
        attributes: ["kokonais_luokka", "iri_luokka", "ura_luokka", "kuntoarvo"],
        isAggregated: true,
        layerName: "Hexgrid",
        id: "condition_h3",
        layerIcon: "mdi-hexagon-multiple",
        styleAttr: "kokonais_luokka",
        aggregation: "mean",
        colorScheme: "RdBu",
        hasConfig: true,
        opacity: 0.4,
        show: false,
        enabled: true,
    },
    {
        attributes: ["kokonais_luokka", "iri_luokka", "ura_luokka"],
        isAggregated: false,
        styleAttr: "kokonais_luokka",
        layerName: "PTM-lines",
        layerIcon: "mdi-vector-line",
        id: "ptm",
        colorScheme: "RdYlGn",
        hasConfig: true,
        opacity: 0.95,
        show: false,
        enabled: true,
    },
    {
        attributes: ["kuntoarvo"],
        isAggregated: false,
        styleAttr: "kuntoarvo",
        layerName: "RoadAI-lines",
        layerIcon: "mdi-vector-line",
        id: "roadai",
        colorScheme: "PiYg",
        hasConfig: true,
        opacity: 0.95,
        show: false,
        enabled: true,
    },
];

export const otherLayers: LayerItemProps[] = [
    {
        layerName: "Orthoimagery 2021",
        layerIcon: "mdi-earth-box",
        id: "ortho_2021",
        opacity: 1.0,
        show: false,
        enabled: true,
    },
    {
        layerName: "Buildings",
        layerIcon: "mdi-domain",
        id: "building_helsinki",
        opacity: 1.0,
        show: true,
        enabled: true,
    },                 
    {
        attributes: ["paatyyppi", "alatyyppi"],
        layerName: "Road lines",
        layerIcon: "mdi-road",
        styleAttr: "paatyyppi",
        colorScheme: "Pastel",
        id: "centerline",
        opacity: 0.75,
        show: false,
        enabled: true,
        hasConfig: true,
    },
];
