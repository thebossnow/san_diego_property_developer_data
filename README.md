# San Diego Property Developer Data

A comprehensive resource for programmatic analysis and due diligence on San Diego real estate properties. Access authoritative parcel data, zoning information, general plans, transit proximity, and housing law eligibility through integrated GIS APIs.

## What's included

- **Parcel data APIs**: 1.09M+ county-wide parcels with complete assessor information, situs addresses, and acreage
- **Zoning & General Plan layers**: Zone codes, setbacks, FAR, density, and land use designations for both unincorporated county and City of San Diego
- **Housing law screening**: SB 9, SB 35, SB 6, AB 2011, and AB 803 eligibility checks at the parcel level
- **Transit & TOD overlays**: Transit stops (GTFS), priority areas, and FAR overlays for SB 79 site screening
- **Address normalization**: Direct address-to-APN lookups and NG911-standard address point schemas
- **Geocoding services**: Both address and APN-based geocoders for coordinate-based spatial queries
- **Terrain & elevation**: USGS 3DEP bare-earth DEM (1 m lidar-derived in San Diego) — point elevation, slope, aspect, elevation profiles, parcel-level slope statistics, and GeoTIFF clips

All services are unauthenticated REST APIs. The parcel, zoning, housing-law, transit and geocoding services serve GeoJSON/JSON from SANDAG's regional GIS platform and San Diego County's public assessor data; elevation is a raster service from USGS (JSON, or binary GeoTIFF — no GeoJSON).

## Documentation

See [docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md) for:
- Field schemas for the ~20 services explored so far (of 373+ SANDAG hosts alone; most of that catalog is still unexplored)
- Live curl examples for each API endpoint
- Targeted use cases (floorplan intake, feasibility screening, site search)
- Coverage notes (unincorporated vs. incorporated city)

See [docs/Public_GIS_Elevation_API_Reference.md](docs/Public_GIS_Elevation_API_Reference.md) for:
- USGS 3DEP elevation API (point elevation, slope, contours, raster export)
- Lidar data vintage gaps relevant to grading/slope screening
- County-hosted environmental, hazard, and infrastructure overlays (floodplain, faults, conservation, easements, utilities) not covered by the parcel data reference above

## API endpoints referenced

All endpoints below are publicly accessible, unauthenticated Esri ArcGIS REST services maintained by San Diego County, SANDAG, and USGS. No API key or login is required.

### San Diego County — not just one API

`gis-public.sandiegocounty.gov` hosts roughly 150 services across 26 folders, not just one MapServer. The parcel data reference below documents the assessor/zoning MapServer; the elevation/GIS reference documents ~20 additional County-hosted layers (floodplain, active faults, MSCP habitat, wetlands, sewer vs. septic, Coastal Commission jurisdiction, farmland mapping, VMT screening, building footprints) that have no SANDAG equivalent and are load-bearing for development feasibility screening — a parcel that clears zoning can still die on one of these.

- `https://gis-public.sandiegocounty.gov/arcgis/rest/services/PPM_PublicAGO/MapServer`
  - Layer 0 — Assessor parcels (values, acreage, building details, zone/use codes)
  - Layer 1 — General Plan (unincorporated county)
  - Layer 2 — Zoning (unincorporated county)
  - Table — Road name reference

See [docs/Public_GIS_Elevation_API_Reference.md](docs/Public_GIS_Elevation_API_Reference.md), Section 5, for the constraint layers, plus five County services confirmed to overlap SANDAG's data (two are byte-identical duplicates, one is a real data conflict, two turned out not to be duplicates at all).

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

Accepts WGS84 or State Plane (EPSG:2230) input, so SANDAG parcel geometry can be passed straight in. An ArcGIS Online item called "USGS 3D Elevation" (listed under NCDOT) only points to this service. See the [reference doc](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md#usgs-3dep--bare-earth-elevation-imageserver) for verified examples and caveats.

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE). The underlying GIS data is public domain, maintained by San Diego County, SANDAG, and USGS; this repository's own code and documentation are covered by the MIT License.
