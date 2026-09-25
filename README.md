# San Diego Property Developer Data

A comprehensive resource for programmatic analysis and due diligence on San Diego real estate properties. Access authoritative parcel data, zoning information, general plans, transit proximity, and housing law eligibility through integrated GIS APIs.

## What's included

- **Parcel data APIs**: 1.09M+ county-wide parcels with complete assessor information, situs addresses, and acreage
- **Zoning & General Plan layers**: Zone codes, setbacks, FAR, density, and land use designations for both unincorporated county and City of San Diego
- **Housing law screening**: SB 9, SB 35, SB 6, AB 2011, and AB 803 eligibility checks at the parcel level
- **Transit & TOD overlays**: Transit stops (GTFS), priority areas, and FAR overlays for SB 79 site screening
- **Address normalization**: Direct address-to-APN lookups and NG911-standard address point schemas
- **Geocoding services**: Both address and APN-based geocoders for coordinate-based spatial queries
- **Fire hazard & burn history**: CAL FIRE state fire hazard severity zones, the City of San Diego's adopted Very High zone, and historic fire perimeters
- **Seismic & geologic hazards**: CGS Alquist-Priolo fault, liquefaction, and landslide zones
- **Statewide zoning & general plan**: a lead source for incorporated cities not published on SANDAG or County GIS
- **Terrain & elevation**: USGS 3DEP bare-earth DEM (1 m lidar-derived in San Diego) — point elevation, slope, aspect, elevation profiles, parcel-level slope statistics, and GeoTIFF clips

All services are unauthenticated REST APIs. The parcel, zoning, housing-law, transit and geocoding services serve GeoJSON/JSON from SANDAG's regional GIS platform and San Diego County's public assessor data; elevation is a raster service from USGS (JSON, or binary GeoTIFF — no GeoJSON).

## Documentation

See [docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md) for:
- Field schemas for the ~20 services explored so far (of 373+ SANDAG hosts alone; most of that catalog is still unexplored)
- Live curl examples for each API endpoint
- Targeted use cases (floorplan intake, feasibility screening, site search)
- Coverage notes (unincorporated vs. incorporated city)

See [docs/San_Diego_County_Constraint_Layers_Reference.md](docs/San_Diego_County_Constraint_Layers_Reference.md) for:
- County-hosted environmental, hazard, and infrastructure overlays (floodplain, faults, conservation, easements, utilities) not covered by the parcel data reference above
- Results of testing five County services against their apparent SANDAG counterparts — two confirmed byte-identical duplicates, one confirmed data conflict, two confirmed *not* duplicates despite similar names

(USGS 3DEP elevation, the National Map Access API, and the lidar data-vintage gap are documented in the parcel data reference above, not here.)

See [docs/CAL_FIRE_Endpoints_Reference.md](docs/CAL_FIRE_Endpoints_Reference.md) for:
- State fire hazard severity zones (SRA 2024, LRA 2025) and the City of San Diego's larger adopted 2025 Very High zone
- Historic fire perimeters (burn history) and the parcel polygon to FHSZ/FRAP query chain
- AB 38 disclosure and defensible space requirements that follow from a High or Very High result

See [docs/CA_Geoportal_Endpoints_Reference.md](docs/CA_Geoportal_Endpoints_Reference.md) for:
- Statewide zoning and general plan land use layers, the only programmatic zoning source found so far for incorporated cities other than San Diego (use as a lead, confirm with the city)
- CGS Alquist-Priolo fault, liquefaction, and landslide zones
- The State Geoportal search API for rediscovering republished datasets

## API endpoints referenced

All endpoints below are publicly accessible, unauthenticated Esri ArcGIS REST services maintained by San Diego County, SANDAG, and USGS. No API key or login is required.

### San Diego County — not just one API

`gis-public.sandiegocounty.gov` hosts roughly 150 services across 26 folders, not just one MapServer. The parcel data reference below documents the assessor/zoning MapServer; the constraint layers reference documents ~20 additional County-hosted layers (floodplain, active faults, MSCP habitat, wetlands, sewer vs. septic, Coastal Commission jurisdiction, farmland mapping, VMT screening, building footprints) that have no SANDAG equivalent and are load-bearing for development feasibility screening — a parcel that clears zoning can still die on one of these.

- `https://gis-public.sandiegocounty.gov/arcgis/rest/services/PPM_PublicAGO/MapServer`
  - Layer 0 — Assessor parcels (values, acreage, building details, zone/use codes)
  - Layer 1 — General Plan (unincorporated county)
  - Layer 2 — Zoning (unincorporated county)
  - Table — Road name reference

See [docs/San_Diego_County_Constraint_Layers_Reference.md](docs/San_Diego_County_Constraint_Layers_Reference.md) for the constraint layers, plus five County services confirmed to overlap SANDAG's data (two are byte-identical duplicates, one is a real data conflict, two turned out not to be duplicates at all).

See [docs/CAL_FIRE_Endpoints_Reference.md](docs/CAL_FIRE_Endpoints_Reference.md) for statewide fire hazard severity zones (SRA/LRA), historic fire perimeters (burn history), and the AB 38 disclosure requirements that follow from a High/Very High result. These are statewide services, so they apply to any parcel in the county.

### California State Geoportal and CGS

- `https://services8.arcgis.com/Xr1lDrwMv89PhjD9/arcgis/rest/services/California_Statewide_Zoning_South/FeatureServer/0` (statewide zoning, covers San Diego County)
- `https://services8.arcgis.com/Xr1lDrwMv89PhjD9/arcgis/rest/services/California_General_Plan_Land_Use/FeatureServer/2` (general plan land use, layer 2)
- `https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Alquist_Priolo_Fault_Zones/FeatureServer/0`
- `https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Liquefaction_Zones/FeatureServer/0`
- `https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Landslide_Zones/FeatureServer/0`

See [docs/CA_Geoportal_Endpoints_Reference.md](docs/CA_Geoportal_Endpoints_Reference.md) for fields, verified test points, and how these relate to the County and SANDAG layers.

### SANDAG regional GIS — one host, three service types, hundreds of services

Everything lives on the same ArcGIS Server/Portal instance (`geo.sandag.org`), but unlike the county it is not one API with a few layers. It's one host publishing **373 hosted FeatureServer items** individually, plus two other API types entirely. We've only explored a fraction of the 373 so far — there's likely a lot more useful data in there we haven't looked at yet.

**1. FeatureServer services** (each its own service, not a layer of a shared one) — `.../server/rest/services/Hosted/<name>/FeatureServer/0`. Explored so far:
- `Parcels` — countywide parcels with situs addresses
- `Zoning_Unincorporated`, `Zoning_Base_SD`, `General_Plan_Land_Use_SD`, `Community_Plan_SD` — zoning and general plan
- `Senate_Bill_9`, `Senate_Bill_35`, `Senate_Bill_6`, `Assembly_Bill_2011`, `Assembly_Bill_803`, `Housing_Laws` — state housing law screening
- `Transit_Priority_Areas`, `Transit_Stops_GTFS`, `Sustainable_Development_Areas`, `Housing_Solution_Areas`, `Prime_Industrial_Lands` — transit/TOD overlays
- `Address_Points`, `Address_Points_NG911` — address point data

**2. GeocodeServer services** — a different API shape (address/APN in, coordinates out):
- `Parcels_APN_Locator/GeocodeServer`
- `SANDAG_COMPOSITE_LOCATOR/GeocodeServer`

**3. Portal sharing REST API** — catalog/search, not a data layer:
- `https://geo.sandag.org/portal/sharing/rest`

See the [reference doc](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md) for field schemas and example queries for each.

### USGS 3DEP — bare-earth elevation

A public ArcGIS **ImageServer** (raster, not vector features), nationwide, hosted by USGS rather than SANDAG or the County:

- `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer`
  - `getSamples` — elevation at a point or along a line (meters, NAVD 88)
  - `identify` — elevation, or slope/aspect via `renderingRule`, at a point
  - `computeStatisticsHistograms` — min/max/mean elevation or slope over a parcel polygon
  - `exportImage` — clip the DEM to a bbox as a GeoTIFF
  - `query` — which source lidar collections cover a point

Accepts WGS84 or State Plane (EPSG:2230) input, so SANDAG parcel geometry can be passed straight in. An ArcGIS Online item called "USGS 3D Elevation" (listed under NCDOT) only points to this service. **The ImageServer lags newest data by months to years** — confirmed a 2024 lidar collection (`CA_SanDiegoCo_D24`) published to USGS's staged products but absent from this service entirely; the [National Map Access API](https://tnmaccess.nationalmap.gov/api/v1/products) is the path to it. See the [reference doc](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md#usgs-3dep--bare-earth-elevation-imageserver) for verified examples, the vintage gap, and caveats.

## Additional resources tested but not relevant

Endpoints and sources that were evaluated and set aside for now. Kept here so they are not re-tested from scratch. Details and test dates are in the linked docs.

| Resource | Why it was set aside | Use instead | Source doc |
| --- | --- | --- | --- |
| CAL FIRE incident feeds (`fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList`, `.../GetIncidents`) | Active and historical incident points, not land constraints. Undocumented, no stability guarantee. Not verified (fire.ca.gov robots.txt blocked the fetcher). | FRAP fire perimeters | [CAL FIRE](docs/CAL_FIRE_Endpoints_Reference.md) |
| CAL FIRE original FRAP service (`egis.fire.ca.gov/.../FRAP/FirePerimeters_FS`) | robots.txt blocks automated fetching | ArcGIS Online mirror `California_Historic_Fire_Perimeters` | [CAL FIRE](docs/CAL_FIRE_Endpoints_Reference.md) |
| FHSZ Viewer (`data.cnra.ca.gov/dataset/fire-hazard-severity-zone-viewer`) | A viewer app, not a dataset. Its "ArcGIS GeoService" link is an Experience Builder app, not a REST endpoint. No new API surface. Still fine as a human spot-check viewer. | `FHSZSRA_23_3`, `FHSALRA25_v1_All` | [CAL FIRE](docs/CAL_FIRE_Endpoints_Reference.md) |
| City of San Diego `DSD/Fire/MapServer/6` | 2009 VHFHSZ, superseded 2025-08-30 | `SDFR/Fire_Public/MapServer/0` | [CAL FIRE](docs/CAL_FIRE_Endpoints_Reference.md) |
| City of San Diego `Hosted/COSD_FHSZ_LRA/FeatureServer/21` | Labelled "Proposed", no class field, not compared against the current layer | `SDFR/Fire_Public/MapServer/0` | [CAL FIRE](docs/CAL_FIRE_Endpoints_Reference.md) |
| County OES `OES_KnowYourHazards_Wildfire_1` | Interim mix of 2024 SRA and 2007 to 2011 LRA recommendations, predates the 2025 LRA map | `FHSALRA25_v1_All` plus local adoption layers | [CAL FIRE](docs/CAL_FIRE_Endpoints_Reference.md) |
| SANDAG `Fire_Hazard_Severity_Zones_SD` | Single polygon, City of San Diego LRA only, not countywide | CAL FIRE SRA/LRA and City `SDFR/Fire_Public` | [Constraint layers](docs/San_Diego_County_Constraint_Layers_Reference.md) |
| County `SB9_CRITERIA_MET_01072024` | 2024-01-07 snapshot that conflicts with SANDAG (5.8% disagree on eligibility, 25.1% on `fhsz_very_high`) | SANDAG `Senate_Bill_9` (recency call only, verify FHSZ against CAL FIRE) | [Constraint layers](docs/San_Diego_County_Constraint_Layers_Reference.md) |
| County `sdep_warehouse/HOUSING_LAWS` | Byte-identical duplicate of SANDAG `Housing_Laws`. Its MapServer variant also rejects `/query`. | SANDAG `Housing_Laws` | [Constraint layers](docs/San_Diego_County_Constraint_Layers_Reference.md) |
| County `sdep_warehouse/ZONING_CN` | Byte-identical duplicate of SANDAG `Zoning_Unincorporated` | Either one, no separate integration | [Constraint layers](docs/San_Diego_County_Constraint_Layers_Reference.md) |
| County `cosd_warehouse/parcels_all_for_public_use` | Has situs address but no assessed values, so it needs an APN join to `PPM_PublicAGO` | SANDAG `Hosted/Parcels` (both in one layer) | [Constraint layers](docs/San_Diego_County_Constraint_Layers_Reference.md) |
| SANDAG/County housing law layers for incorporated cities | Return `N/A` on every criteria field for all city parcels | None found yet | [Constraint layers](docs/San_Diego_County_Constraint_Layers_Reference.md) |
| CGS "Seismic Hazards Program: ..." duplicate catalog records (`/ArcGIS/` path) | Same services as the lowercase `/arcgis/` URLs | Lowercase `/arcgis/` URLs | [Geoportal](docs/CA_Geoportal_Endpoints_Reference.md) |
| State Geoportal "flood zone" results (Caltrans/BCDC climate and coastal inundation layers) | Climate projection, not the regulatory FEMA flood zone | County `HYD_FLOODPL`; FEMA NFHL still unevaluated | [Geoportal](docs/CA_Geoportal_Endpoints_Reference.md) |
| State Geoportal searches for building permits and assessor parcels | Returned nothing relevant | SANDAG `Hosted/Parcels`, County `PPM_PublicAGO` | [Geoportal](docs/CA_Geoportal_Endpoints_Reference.md) |
| ArcGIS Online "USGS 3D Elevation" item (NCDOT account) | Only a pointer to the USGS service | USGS `3DEPElevation/ImageServer` | [Parcel data](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md) |

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE). The underlying GIS data is published by San Diego County, SANDAG, USGS, the City of San Diego, and California state agencies (CAL FIRE, CGS, State Geoportal) under each publisher's own terms; for example, CAL FIRE fire perimeters are Creative Commons Attribution. This repository's own code and documentation are covered by the MIT License.
