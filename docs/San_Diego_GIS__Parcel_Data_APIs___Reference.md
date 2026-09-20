# GIS & Parcel Data APIs — Reference

2026-09-19 · @Someone

Every REST API and service explored across San Diego County's GIS, SANDAG's regional GIS platform, and USGS's national elevation service: full field schemas, example queries, and who each one serves.

## Overview

Three separate systems were probed. All are Esri ArcGIS REST services and unauthenticated. County and SANDAG serve vector data as JSON/GeoJSON; USGS serves raster elevation (JSON, or a binary GeoTIFF).

| System | Root | Scope |
| --- | --- | --- |
| San Diego County | `gis-public.sandiegocounty.gov/arcgis/rest/services` | Assessor parcels, county-only zoning/GP |
| SANDAG regional | `geo.sandag.org/server/rest/services` | 373 hosted layers: parcels with addresses, city + county zoning, state housing law screens, transit, geocoders |
| USGS 3DEP | `elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer` | Nationwide bare-earth elevation raster (1 m lidar-derived in San Diego): point elevation, slope, aspect, profiles, parcel terrain stats, GeoTIFF export |

SANDAG is the deeper resource. Its `Hosted/Parcels` layer alone replaces the County's Assessor layer and adds the address field the County service lacks. Use County only if you specifically need its layer numbering; otherwise SANDAG covers everything County does and more.

Jurisdiction codes used throughout: `CN` = unincorporated county, `SD` = City of San Diego, `OC`/`CV`/`CB`/`ES`/`NC`/`VS` = other cities. County and SANDAG's Zoning/General Plan layers only populate for `CN`; City of San Diego has its own separate `_SD` layers; no other city's zoning was found published here.

## San Diego County — PPM\_PublicAGO MapServer

One MapServer, three polygon layers plus a lookup table. `Query,Map,Data` capabilities, maxRecordCount 1000, native SRS EPSG:2230 (State Plane VI, feet), supports `outSR=4326` and `f=geojson`.

**Endpoint:** `gis-public.sandiegocounty.gov/arcgis/rest/services/PPM_PublicAGO/MapServer`

**Targeted user:** anyone who needs authoritative County assessor and zoning data by APN and already has the APN in hand — title/escrow, county planning staff, GIS analysts. Not useful for address lookups (see SANDAG Parcels below for that).

### Layer 0 — Assessor Parcels

| Field | Type | Notes |
| --- | --- | --- |
| APN, APN\_8 | String | parcel number, 10 and 8 digit forms |
| PARCELID | Integer | internal id |
| LEGLDESC | String(65) | legal description |
| ASR\_LAND, ASR\_IMPR, ASR\_TOTAL | Integer | assessed land / improvement / total value |
| DOCTYPE, DOCNMBR, DOCDATE | String | last recorded document type/number/date (MMDDYY) |
| ACREAGE | Double | parcel acreage |
| TAXSTAT | String(1) | tax status |
| OWNEROCC | String(1) | owner-occupied flag |
| TRANUM | String(5) | tax rate area |
| ASR\_ZONE, ASR\_LANDUSE | SmallInteger | assessor zone / land use code (uncoded) |
| UNITQTY | SmallInteger | unit count |
| SUBMAP, SUBNAME | String | subdivision map number / name |
| NUCLEUS\_ZONE\_CD, NUCLEUS\_USE\_CD | String | zone / use codes (uncoded) |
| YEAR\_EFFECTIVE | String(2) |  |
| TOTAL\_LVG\_AREA | Integer | living area sqft |
| BEDROOMS, BATHS | String(3) |  |
| ADDITION\_AREA | Integer |  |
| GARAGE\_CONVERSION, GARAGE\_STALLS, CARPORT\_STALLS | String |  |
| POOL, PAR\_VIEW | String(1) |  |
| USABLE\_SQ\_FEET, QUAL\_CLASS\_SHAPE | String |  |
| X\_COORD, Y\_COORD | Double | State Plane 2230 |
| OVERLAY\_JURIS | String(2) | CN/SD/OC/etc. |
| SUB\_TYPE | SmallInteger |  |
| MULTI | String(1) |  |
| Shape, Shape.STArea(), Shape.STLength() | Geometry/Double |  |

No situs address field — queryable only by APN or geometry.

### Layer 1 — General Plan (county only, `CN`)

OBJECTID, CPASG, SPA\_NAME, SPA\_DENSIT, SPA\_UNITS, MURES, MUNONRES, MUUNITS, MUNAME, MIXED\_USE, GPCODE95, FCI, DESCRIPTION, ADOPT\_DATE (epoch ms), CASE\_NO, CREATOR, CREATED, EDITOR, EDITED, Shape fields.

### Layer 2 — Zoning (county only, `CN`)

USEREG, ANIMALREGS, DENSITY, LOT, BUILDTYPE, MAXFLR, FLRAREARATIO, HEIGHT, COVERAGE, SETBACK, OPENSPACE, SPECIALREGS — each repeated as PUSEREG.../P2USEREG... for pending/prior zoning — plus USEREGS, ADOPTDATE, CASE\_NO, ORDINANCE\_NO, LEGEND, CHANGE, CREATOR, CREATED, EDITOR, EDITED.

### Table — SANGIS.TBL\_ROAD\_NAME

ROAD\_ID, POST\_OPERATOR\_ID, POST\_DATE, FULL\_NAME, ROAD20/30\_\* name/suffix/direction variants, RESERVE\_\* fields, ST\_PREMOD/PREDIR/PRETYP/PRESEP/NAME/POSTYP/POSDIR/POSMOD, GLOBALID, created/edited user and date. Road-name reference only, not address points.

**Example — pull a parcel by APN, WGS84 GeoJSON:**

```bash
curl -G "https://gis-public.sandiegocounty.gov/arcgis/rest/services/PPM_PublicAGO/MapServer/0/query" \
  --data-urlencode "where=APN='1263404600'" \
  --data-urlencode "outFields=*" \
  --data-urlencode "outSR=4326" \
  --data-urlencode "f=geojson"
```

## SANDAG — Hosted/Parcels

The countywide parcel master table: every field the County's Assessor layer has, plus real situs address fields. 1,089,758 records confirmed. This is the one service that solves "search by street address" without a geocoder call.

**Endpoint:** `geo.sandag.org/server/rest/services/Hosted/Parcels/FeatureServer/0`

**Targeted user:** anyone building a tool that starts from a street address rather than an APN — a floorplan/feasibility intake form, a due-diligence script, a listing-comparison tool.

### Schema (56 fields)

| Field | Type | Notes |
| --- | --- | --- |
| objectid | OID |  |
| apn, apn\_8 | String |  |
| parcelid, fractint | Integer/SmallInteger |  |
| situs\_juris | String(2) | jurisdiction of the site address |
| situs\_street, situs\_suffix, situs\_post\_dir, situs\_pre\_dir | String | street name / suffix / directionals |
| situs\_address | Integer | house number — the field County's layer lacks |
| situs\_fraction, situs\_building, situs\_suite | String |  |
| legldesc | String(65) |  |
| asr\_land, asr\_impr, asr\_total | Integer |  |
| doctype, docnmbr, docdate | String |  |
| acreage | Double |  |
| taxstat, ownerocc | String(1) |  |
| tranum | String(5) |  |
| asr\_zone, asr\_landuse, unitqty | SmallInteger |  |
| submap, subname | String |  |
| nucleus\_zone\_cd, nucleus\_use\_cd | String |  |
| situs\_community | String(28) |  |
| year\_effective | String(2) |  |
| total\_lvg\_area, addition\_area | Integer |  |
| bedrooms, baths | String(3) |  |
| garage\_conversion, garage\_stalls, carport\_stalls | String |  |
| pool, par\_view | String(1) |  |
| usable\_sq\_feet, qual\_class\_shape | String |  |
| nucleus\_situs\_from\_nbr, nucleus\_situs\_thru\_nbr, nucleus\_situs\_thru\_fractn | Integer/String |  |
| situs\_zip | String(10) |  |
| x\_coord, y\_coord | Double | State Plane 2230 |
| overlay\_juris | String(2) |  |
| sub\_type | SmallInteger |  |
| multi | String(1) |  |
| SHAPE\_\_Length, SHAPE\_\_Area | Double |  |

**Example — find the APN for a street address, no geocoder needed:**

```bash
curl -G "https://geo.sandag.org/server/rest/services/Hosted/Parcels/FeatureServer/0/query" \
  --data-urlencode "where=situs_address=1589 AND situs_street='ALDORADO'" \
  --data-urlencode "outFields=apn,situs_address,situs_street,situs_suffix,situs_zip,overlay_juris" \
  --data-urlencode "f=json"
```

Returns `apn=1263404600`, confirmed against the County record.

## SANDAG — Zoning & Land Use layers

Four separate FeatureServers. `Zoning_Unincorporated` is the SANDAG mirror of the County's own Zoning layer (identical schema); `Zoning_Base_SD` and `General_Plan_Land_Use_SD` are City of San Diego's own zoning/GP, not available from the County service. `Community_Plan_SD` gives the community plan name and a link to the City's plan document.

**Endpoints (all `.../Hosted/<name>/FeatureServer/0`):** `Zoning_Unincorporated`, `Zoning_Base_SD`, `General_Plan_Land_Use_SD`, `Community_Plan_SD`

**Targeted user:** anyone doing feasibility or zoning due diligence — GC estimating a project's allowed use, floorplan/feasibility service pulling setbacks and density, site-search tooling filtering by zone.

| Layer | Coverage | Key fields |
| --- | --- | --- |
| Zoning\_Unincorporated | `CN` only | usereg, animalregs, density, lot, buildtype, maxflr, flrarearatio, height, coverage, setback, openspace, specialregs (+ prior/pending P/P2 sets), useregs, adoptdate, case\_no, ordinance\_no, legend, change |
| Zoning\_Base\_SD | City of San Diego only | zone\_name (e.g. `RM-1-1`), imp\_date, ordnum |
| General\_Plan\_Land\_Use\_SD | City of San Diego only | plan\_desc, plan\_name, area\_name, density\_low, density\_hi, density\_bonus, gp\_lu\_desc, color, change\_type, change\_date |
| Community\_Plan\_SD | City of San Diego only | cpcode, cpname, acreage, website (link to the City's plan doc) |

**Example — zone and General Plan for a point inside City of San Diego (State Plane 2230 ft):**

```bash
curl -G "https://geo.sandag.org/server/rest/services/Hosted/Zoning_Base_SD/FeatureServer/0/query" \
  --data-urlencode "geometry=6299042.49,1852646.46" \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode "inSR=2230" \
  --data-urlencode "spatialRel=esriSpatialRelIntersects" \
  --data-urlencode "outFields=*" --data-urlencode "f=json"
```

Returns `zone_name=RM-1-1` for 3753 42nd St, San Diego.

## SANDAG — State housing law screening layers

Five per-bill eligibility layers plus one rollup. Confirmed: **all six only populate for unincorporated county (`juri=UNINC`).** Inside any incorporated city they return `N/A` on every criteria field — they don't evaluate city land at all.

**Endpoints (all `.../Hosted/<name>/FeatureServer/0`):** `Senate_Bill_9`, `Senate_Bill_35`, `Senate_Bill_6`, `Assembly_Bill_2011`, `Assembly_Bill_803`, `Housing_Laws`

**Targeted user:** someone screening unincorporated-county parcels for SB9 lot splits, SB35/AB2011 streamlining, or SB6 commercial-to-residential conversion. Not useful for in-city sites like a City Heights SB 79 target — use the Transit & TOD layers below instead.

| Layer | Fields |
| --- | --- |
| Senate\_Bill\_9 | sb9\_criteriamet, sb9\_category, urban\_areas, single\_family\_zones, fhsz\_very\_high, sb9\_enviro, fbc |
| Senate\_Bill\_35 | sb35\_criteria\_met, sb35\_category, urban\_areas, multi\_family\_zones, fhsz\_very\_high, sb35\_enviro, sb35\_multi\_family\_zoning |
| Senate\_Bill\_6 | sb6\_criteria\_met, sb6\_category, urban\_areas, fhsz\_both\_high\_and\_very\_high, commercial\_zones, sb6\_enviro, fhsz\_very\_high |
| Assembly\_Bill\_2011 | ab2011\_criteria\_met, ab2011\_category, urban\_areas, fhsz\_both\_high\_and\_very\_high, commercial\_zones, ab2011\_enviro, fhsz\_very\_high |
| Assembly\_Bill\_803 | ab803\_criteria\_met, ab803\_gp, rhna\_low\_verylow, parcel\_less\_than\_5ac, parcel\_500ft\_vr30\_vcmu, ab803\_multi\_family\_zones |
| Housing\_Laws (rollup) | sb9\_criteria\_met, sb35\_criteria\_met, sb6\_criteria\_met, ab2011\_criteria\_met, sb684\_criteria\_met, ab803\_criteria\_met, ab130\_criteria\_met, eligible\_for\_streamlining, juri (`INC`/`UNINC`) |

All layers also carry `SHAPE__Length`, `SHAPE__Area`, `objectid`.

**Example — check eligibility at a point (State Plane 2230 ft):**

```bash
curl -G "https://geo.sandag.org/server/rest/services/Hosted/Senate_Bill_9/FeatureServer/0/query" \
  --data-urlencode "geometry=6265647.29,2039379.45" \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode "inSR=2230" \
  --data-urlencode "spatialRel=esriSpatialRelIntersects" \
  --data-urlencode "outFields=*" --data-urlencode "f=json"
```

## SANDAG — Transit & transit-oriented development layers

These cover incorporated cities, unlike the housing-law layers above — confirmed hit inside City of San Diego. Most directly relevant to SB 79 site screening, though none of them is SB 79's own legal "major transit stop" determination; they're proxies to narrow a search before checking the statute.

**Endpoints (all `.../Hosted/<name>/FeatureServer/0`):**

| Layer | Geometry | Fields | Confirmed coverage |
| --- | --- | --- | --- |
| Transit\_Priority\_Areas | Polygon | name, globalid | Hit in City of San Diego (statewide TPA designation) |
| Transit\_Stops\_GTFS | Point | stop\_uid, stop\_agency, stop\_id, stop\_name, stop\_lat, stop\_lon, stop\_code, location\_type, parent\_station, wheelchair\_boarding, intersection\_code, stop\_place | Supports distance/buffer queries; 37 stops found within 0.5mi of a test City Heights parcel |
| Sustainable\_Development\_Areas | Polygon | feature\_name (10,510 features) | Hit in City of San Diego |
| Housing\_Solution\_Areas | Polygon | tier (e.g. `CHOZ`, `Tier 1`–`4`), allowance (e.g. "FAR Tier 1: No Limit on FAR") (4,180 features) | City of San Diego FAR overlay; not universal coverage |
| Prime\_Industrial\_Lands | Polygon | cpa\_name, othertype | Minor layer, spot-check only |

**Targeted user:** SB 79 / transit-oriented density site screening — exactly the workflow for evaluating something like a City Heights multifamily acquisition against transit proximity and FAR overlays.

**Example — transit stops within a half-mile buffer (State Plane 2230 ft):**

```bash
curl -G "https://geo.sandag.org/server/rest/services/Hosted/Transit_Stops_GTFS/FeatureServer/0/query" \
  --data-urlencode "geometry=6299042.49,1852646.46" \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode "inSR=2230" \
  --data-urlencode "spatialRel=esriSpatialRelIntersects" \
  --data-urlencode "distance=2640" --data-urlencode "units=esriSRUnit_Foot" \
  --data-urlencode "outFields=stop_name,stop_agency" --data-urlencode "f=json"
```

## SANDAG — Address point layers

Two point layers, both queried for schema only (not tested for a hit — arbitrary test coordinates missed the discrete points). Address\_Points is the simpler of the two and carries an `apn` field directly, so it doubles as an address→APN join without touching the Parcels polygon layer.

**Endpoints:** `Hosted/Address_Points/FeatureServer/0`, `Hosted/Address_Points_NG911/FeatureServer/0`

**Targeted user:** anyone building an address-normalization or NG911-style dispatch/addressing tool; for ordinary parcel lookups, Hosted/Parcels (above) is simpler since it already carries the same address fields plus every assessor field.

### Address\_Points (23 fields)

objectid, addrnmbr (Double), addrfrac, addrpdir, addrname, addrpostd, addrsfx, addrunit, addrjur, addrzip, roadsegid, **apn**, asource, x\_coord, y\_coord, state, placement\_location, community, address\_type, addrapnid, parcelid, usng, orig\_oid.

### Address\_Points\_NG911 (36 fields)

objectid, state, discrpagid, dateupdate, effective, expire, site\_nguid, country, county, inc\_muni, uninc\_comm, nbrhd\_comm, addnum\_pre, add\_number, addnum\_suf, unit, st\_premod, st\_predir, st\_pretyp, st\_presep, st\_name, st\_postyp, st\_posdir, st\_posmod, lst\_predir, lst\_name, lst\_type, lst\_posdir, esn, msagcomm, post\_comm, post\_code, place\_type, long, lat, addtl\_loc.

This is the NENA/NG911-standard schema (separate long-form and short-form street name fields, ESN, MSAG community) used for 911 dispatch routing — more fields than a typical GIS consumer needs.

**Example — find the address point and APN for a parcel:**

```bash
curl -G "https://geo.sandag.org/server/rest/services/Hosted/Address_Points/FeatureServer/0/query" \
  --data-urlencode "where=addrnmbr=1589 AND addrname='ALDORADO'" \
  --data-urlencode "outFields=apn,addrnmbr,addrname,addrsfx,addrzip" \
  --data-urlencode "f=json"
```

## SANDAG — Geocoding services (GeocodeServer)

Two Esri locators, both confirmed working, unauthenticated. Standard Esri `findAddressCandidates` endpoint shape, standard output schema.

**Endpoints:** `Parcels_APN_Locator/GeocodeServer`, `SANDAG_COMPOSITE_LOCATOR/GeocodeServer`

**Targeted user:** anyone whose input is a raw address string or a raw APN and needs a coordinate to feed into the spatial-query layers above, without first knowing which layer's schema to search.

| Locator | Input field | Behavior | Confirmed result |
| --- | --- | --- | --- |
| Parcels\_APN\_Locator | `SingleLine` (an APN string) | Exact-match against parcel centroids | Score 100 for `1263404600` |
| SANDAG\_COMPOSITE\_LOCATOR | `SingleLine` (a full address) | Road-interpolated address geocoding (`Loc_name: ROADS_ALL`) | Score 97.31 for "1589 Aldorado Dr, Vista, CA 92084"; location \~200ft from true parcel centroid since it interpolates along the road, not the parcel |

**Output fields (both, `candidateFields`):** Status, Score, Match\_addr, LongLabel, ShortLabel, Addr\_type, PlaceName, Place\_addr, Rank, AddNum, AddNumFrom, AddNumTo, AddRange, Side, StPreDir, StPreType, StName, StType, StDir, City, Subregion (County), Region (State), Postal (ZIP), PostalExt, Country, X, Y, DisplayX, DisplayY, Xmin/Xmax/Ymin/Ymax. Composite locator also returns `Loc_name` showing which sub-locator matched.

**Locator properties:** MinimumMatchScore 75, MinimumCandidateScore 70, MaxBatchSize 1000, LocatorVersion 11.0.

**Example — geocode a full address:**

```bash
curl -G "https://geo.sandag.org/server/rest/services/SANDAG_COMPOSITE_LOCATOR/GeocodeServer/findAddressCandidates" \
  --data-urlencode "SingleLine=1589 Aldorado Dr, Vista, CA 92084" \
  --data-urlencode "outFields=*" --data-urlencode "f=json"
```

## USGS 3DEP — Bare-earth elevation (ImageServer)

The one raster service in this reference, and the only one not hosted by SANDAG or the County. It is the USGS 3D Elevation Program (3DEP) bare-earth DEM, published as a public ArcGIS **ImageServer** — no key, no auth. Everything else here returns vector features; this returns pixel values, so the query shapes are different (`getSamples`, `identify`, `exportImage`, `computeStatisticsHistograms` rather than `query` on a layer).

**Endpoint:** `elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer`

An ArcGIS Online item titled "USGS 3D Elevation" (an Image Service, listed under NCDOT's account) also turns up in searches. It is only a pointer to this USGS service — call the USGS URL directly.

**Targeted user:** anyone who needs terrain for a specific site — a GC estimating grading and retaining walls, a developer screening hillside lots for slope, a floorplan/feasibility tool that needs pad elevation or how much a lot falls across its width. Pair it with `Hosted/Parcels` above: take a parcel's polygon from SANDAG, pass it here for elevation and slope statistics.

### Service properties

| Property | Value |
| --- | --- |
| Pixel type / bands | F32 (32-bit float), 1 band |
| Native SRS | EPSG:3857 (`wkid` 102100) |
| Vertical units / datum | Meters, NAVD 88 (from the source-tile catalog) |
| `maxImageHeight` / `maxImageWidth` | 8000 / 8000 |
| `maxRecordCount` | 2000 |
| Advertised `capabilities` | `Image,Metadata,Catalog` — `getSamples`, `identify` and `computeStatisticsHistograms` all work anyway; don't gate on this list |
| Output formats | `f=json` or `f=image` (binary GeoTIFF via `format=tiff`); no `f=geojson` |

Input geometry can be sent in any SRS by putting `spatialReference` in the geometry JSON (or `inSR`): both WGS84 (`4326`) and State Plane VI feet (`2230`, the SANDAG/County native SRS) were confirmed. **Returned elevations are always meters** even when the query geometry is in feet — multiply by 3.28084 for feet.

### Operations

| Operation | Use | Notes |
| --- | --- | --- |
| `getSamples` | Elevation at a point, or along a line | Response includes `value` (meters), `resolution` (source pixel size in meters — `1` in San Diego), and `rasterId` (the catalog footprint that supplied the value, see `query` below). A polyline with `sampleCount=5` returned 6 samples (both endpoints included). |
| `identify` | Elevation, or slope/aspect, at a point | Add `renderingRule={"rasterFunction":"Slope Degrees"}` or `"Aspect Degrees"`. Values come back as whole degrees (rounded). |
| `computeStatisticsHistograms` | min/max/mean/stdev/median over a polygon | Best call for parcel-level terrain. Also accepts `renderingRule` for slope. |
| `exportImage` | Clip the DEM to a bbox | `format=tiff&pixelType=F32&f=image` returns the GeoTIFF bytes directly; `f=json` returns an `href` instead. Cap of 8000×8000 px. |
| `query` | Which source datasets cover a point | Catalog footprints with `Name`, `Source`, `AcquisitionDate`, `VerticalDatum`, `Resolution_X`. **Pass both `inSR` and `spatialRel=esriSpatialRelIntersects`** — a first attempt without them returned unfiltered tiles from across North America. |

Rendering functions published on this service (`renderingRule`): Hillshade Gray, Hillshade Multidirectional, Hillshade Elevation Tinted, Hillshade Gray-Stretch, Slope Degrees, Slope Map, Aspect Degrees, Aspect Map, Contour 25, Contour Smoothed 25, and 2/5/10 ft preset contour intervals. Only `Slope Degrees` and `Aspect Degrees` were exercised; the rest are listed from the service metadata.

### Worked example — 1589 Aldorado Dr, Vista (APN 1263404600)

All results below were run against the live service on 2026-09-19.

| Question | Result |
| --- | --- |
| Elevation at the SANDAG `Address_Points` location | 108.78 m (356.9 ft) |
| Elevation range across the parcel | 84.6 m – 117.7 m, about 33 m (108 ft) of relief |
| Mean slope across the parcel | 14.1° (about 25% grade); max 49° |
| Source dataset at that point | `CA_SanDiegoQL2_2014`, 1 m, acquired 2015-02-17, NAVD 88 |

Independent cross-check: exporting the DEM for the parcel bbox as a GeoTIFF and averaging inside the polygon myself gave mean 104.85 m, min 84.87 m, max 117.62 m, versus the service's 104.66 m / 84.64 m / 117.67 m — within about 0.2 m.

**Point elevation, State Plane input:**

```bash
curl -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples" \
  --data-urlencode 'geometry={"x":6265639.39,"y":2039407.72,"spatialReference":{"wkid":2230}}' \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode "returnFirstValueOnly=true" \
  --data-urlencode "f=json"
```

Returns `value=108.776802063`, `resolution=1`, `rasterId=44845`.

**Slope at a point (WGS84):**

```bash
curl -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify" \
  --data-urlencode 'geometry={"x":-117.2,"y":33.2,"spatialReference":{"wkid":4326}}' \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode 'renderingRule={"rasterFunction":"Slope Degrees"}' \
  --data-urlencode "returnGeometry=false" --data-urlencode "f=json"
```

**Elevation and slope statistics over a parcel** — pass the parcel polygon from `Hosted/Parcels` (with `returnGeometry=true`, State Plane 2230) as `geometry`, with `spatialReference` set to `2230`:

```bash
curl -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/computeStatisticsHistograms" \
  --data-urlencode 'geometry={"rings":[[[6265860.74,2039179.68],[6265438.18,2039125.65],[6265439.57,2039260.65],[6265443.17,2039608.84],[6265865.09,2039604.73],[6265860.74,2039179.68]]],"spatialReference":{"wkid":2230}}' \
  --data-urlencode "geometryType=esriGeometryPolygon" \
  --data-urlencode "f=json"
```

Add `--data-urlencode 'renderingRule={"rasterFunction":"Slope Degrees"}'` for slope instead of elevation. Read `statistics[0].min`, `.max`, `.mean`, `.standardDeviation`, `.median`.

**Elevation profile along a line (6 samples):**

```bash
curl -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/getSamples" \
  --data-urlencode 'geometry={"paths":[[[-117.2,33.2],[-117.199,33.2]]],"spatialReference":{"wkid":4326}}' \
  --data-urlencode "geometryType=esriGeometryPolyline" \
  --data-urlencode "sampleCount=5" --data-urlencode "returnFirstValueOnly=true" \
  --data-urlencode "f=json"
```

**Clip the DEM to a bbox as a GeoTIFF (binary response):**

```bash
curl -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage" \
  --data-urlencode "bbox=-117.2005,33.1995,-117.1995,33.2005" \
  --data-urlencode "bboxSR=4326" --data-urlencode "imageSR=4326" \
  --data-urlencode "size=64,64" --data-urlencode "format=tiff" \
  --data-urlencode "pixelType=F32" --data-urlencode "interpolation=RSP_BilinearInterpolation" \
  --data-urlencode "f=image" -o dem.tif
```

**Which source dataset covers a point:**

```bash
curl -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/query" \
  --data-urlencode 'geometry={"x":6265639.39,"y":2039407.72,"spatialReference":{"wkid":2230}}' \
  --data-urlencode "geometryType=esriGeometryPoint" --data-urlencode "inSR=2230" \
  --data-urlencode "spatialRel=esriSpatialRelIntersects" \
  --data-urlencode "outFields=Name,Source,VerticalDatum,AcquisitionDate,Resolution_X,LowPS,HighPS" \
  --data-urlencode "returnGeometry=false" --data-urlencode "f=json"
```

Returned 19 overlapping footprints at that point: coarse national 1 and 1/3 arc-second tiles (`n34w118`, roughly 30 m and 10 m) plus the San Diego lidar collections (`CA_SanDiegoQL2_2014`, `CA_SanDiego_2015_C17_1`, `San_Diego_CA_2014_LiDAR`, `CA_SanDiegoCo_2016`). The service mosaics them; `getSamples` reports which one won via `rasterId` (matches the footprint's `OBJECTID`) and `resolution`. `AcquisitionDate` is epoch milliseconds.

### Caveats

- **Bare earth, not surface.** This is a DEM: buildings, trees and other structures are removed. It gives ground grade, not roof or canopy heights, and existing grading or fill after the acquisition date isn't reflected.
- **Mosaic of collections from different years.** Coverage at your parcel may come from a 2014–2016 lidar collection. Check `AcquisitionDate` for recent grading or new subdivisions.
- **Slope is integer degrees.** Pixel-level `identify` slope at 1 m is noisy on small features; use polygon statistics for site feasibility.
- **Ignore `count` in the statistics response as a parcel pixel count.** For the Aldorado parcel it returned 25,591, about 1.4× what a 4.4-acre parcel holds at 1 m; the mean/min/max still matched the independent check above, but don't derive area from it.
- **Rate limits and timeouts** were not characterized. Untested for batch use over many parcels.

## SANDAG — Portal sharing API

A standard Esri ArcGIS Enterprise Portal, public access, no login. Useful for discovering which of the 373 hosted layers exist and when they were last touched, rather than for pulling feature data (that's the FeatureServer endpoints above).

**Endpoint:** `geo.sandag.org/portal/sharing/rest`

**Targeted user:** whoever is maintaining a script against this catalog long-term and wants to check for new or updated layers without re-crawling the whole `/server/rest/services` tree.

**Key operations:**

| Operation | Path | Returns |
| --- | --- | --- |
| Portal identity | `/portals/self?f=json` | `name`, `isPortal`, `access` (confirmed `public`) |
| Item search | `/search?q=<query>&f=json` | `total` count, `results[]` with `title`, `type`, `modified` (epoch ms) per item |

Searching `type:"Feature Service"` returned 378 public items, matching the \~373 hosted layers plus a handful of extras.

**Example — list feature services and last-modified dates:**

```bash
curl -G "https://geo.sandag.org/portal/sharing/rest/search" \
  --data-urlencode "q=type:\"Feature Service\"" \
  --data-urlencode "num=10" --data-urlencode "f=json"
```
