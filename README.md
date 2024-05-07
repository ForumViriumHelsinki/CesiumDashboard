# Helsinki Road Condition Dashboard

Visualize road condition data at Helsinki in a Cesium 3D-viewer using the YLRE-registry and road condition measurement samples.

This application includes data from two test areas: Lönnrotinkatu and Mäkelänkatu-Teollisuuskatu-Sturenkatu triangle.

## Development

If using experimental local 3dtiles, serve through caddy fileserver by saying `docker run -p 8080:80 -v $PWD/caddy/Caddyfile:/etc/caddy/Caddyfile -v /my_local/3dtile_path:/3dtiles caddy:latest`

Start the dev server with hot reloading `npm run dev`.

### pre-commit hooks

1. Install `pre-commit` and `detect-secrets` to you development environment using a Python package manager, e.g. `pip install pre-commit detect-secrets`
2. Set up the hooks by saying `pre-commit install`

To run all checks for all files say `pre-commit run --all`.

## Data

This app visualizes road condition data by displaying measurement data and aggregated data within areal units based on YLRE-registry polygons.

Source data for road condition:

-   PTM measurements from 2021 to 2024
-   Vaisala RoadAI meassurements from 2021 to 2024

Source areal unit data for spatial aggregation:

-   YLRE polygons that represent the areal units for streets and other common areas
-   Subdivisions of YLRE polygons roughly following the [CityGML Transportation Module](https://tum-gis.github.io/road2citygml3/) areal `way` representation
-   [H3](https://h3geo.org/) hexagonal grid derived from the YLRE polygons

Supplemental data:

-   Road centerlines
-   Orthoimagery from City of Helsinki WMS source
-   3D buildings from City of Helsinki 3dtiles source

### Aggregating measurement data on areal units

The measurement data is aggregated on any spatially intersecting areal units. In addition, measurement data is grouped by time interval defined in the data preprocessing step. The interval used in the initial implementation is one week.

This means that any intersecting measurements of a same interval are aggregated together, while measurements not within the same interval are treated as non-related and thus not aggregated, but instead stored in a list. This list of measurement history can be inspected in the application by using the time controls or by viewing the measurement list.

The following attributes are derived from aggregated measurements: `mean`, `min`, `max`. Additionally `delta` is computed between the means of subsequent time intervals.

## User guide

Test area can be selected by clicking on the buttons under _"Select test area"_

1. is Lönnrotinkatu and parts of the intersecting streets.
2. is Triangle of Mäkelänkatu-Teollisuuskatu-Sturenkatu and the streets within.

### Layers

The app includes the following layers:

-   `YLRE` - original YLRE polygons
-   `YLRE-split` - subdivisions of the YLRE polygons
-   `Hexgrid` - H3 hexagonal grid derived from YLRE
-   `PTM-lines` - lines representing pairs of subsequent PTM measurements
-   `RoadAI-lines` - lines representing pairs of subsequent RoadAI measurements

Layer configuration can be expanded by clicking on the caret on the right hand side of the layer title.

The configuration includes:

-   The attribute to be stylized
-   Color scheme selection, including divergent, sequential and qualitative schemes
-   Aggregation selection (if applicable for the layer)
-   Opacity slider to control the transparency/opacity of the layer

#### Available road condition attributes

-   `kokonais_luokka`, `iri_luokka` and `ura_luokka` are attributes derived from the PTM-measurements and are available for `YLRE`, `YLRE-split`, `Hexgrid`, `PTM-lines`
-   `kuntoarvo` is an attribute derived from the RoadAI-measurements and is available for `YLRE`, `YLRE-split`, `Hexgrid`, `RoadAI-lines`

Attribute aggregation selection is available for the layers where multiple measurements are potentially grouped together. It is available for the `YLRE`, `Hexgrid` layers and includes the following options:

-   `Mean`: The average of the measurement values
-   `Mean delta`: The change in mean attribute between subsequent measurement times
-   `Max`: The maximum value
-   `Min` The minimum value

#### Other attributes

The following qualitative and time attributes are extracted from the YLRE-data:

-   `materiaali_id`, `laatutaso_id`, `puhtaanapito_vyohyke`, `paivitetty_pvm`

They can be used for visualizing `YLRE` and the derivative layers.

Tip: using the qualitative color schemes (last four schemes) for these attributes works the best.

### Time selection

The time slider at the bottom of the view can be used for setting a maximum time filter for the measurements data.

The slider can be clicked to select a specific time. In order to pinpoint a specific date, dragging the mouse cursor along the slider additionally displays the to-be-selected time.

### Feature specific attributes

Attributes of a specific feature on any of the condition layers can be viewed by **double clicking** on a feature visible on the map.

This will open an attribute popover that displays the basic YLRE-attributes as well as measurements data history.
