# Property Development Research: Public GIS & Elevation API Reference

**Scope:** San Diego County, CA. Focused on SB 79 / density bonus multifamily site screening.
**Status of findings:** All endpoints below were called live and verified on 2026-09-19. Response values quoted are actual returns, not documentation claims.
**Auth:** Every endpoint in this document is public. No API key, no token, no login. Exceptions are noted explicitly.

---

## Table of Contents

1. [Quick Reference Table](#1-quick-reference-table)
2. [USGS 3DEP Elevation (ArcGIS ImageServer)](#2-usgs-3dep-elevation-arcgis-imageserver)
3. [The National Map Access API](#3-the-national-map-access-api)
4. [Data Vintage Problem](#4-data-vintage-problem)
5. [SanGIS / San Diego County ArcGIS Server](#5-sangis--san-diego-county-arcgis-server)
6. [ArcGIS REST Patterns You Will Reuse](#6-arcgis-rest-patterns-you-will-reuse)
7. [Known Gaps and Next Steps](#7-known-gaps-and-next-steps)
8. [Appendix: How to Inspect Any ArcGIS Online Item](#8-appendix-how-to-inspect-any-arcgis-online-item)

---

## 1. Quick Reference Table

| Purpose | Endpoint | Auth | Verified |
|---|---|---|---|
| Point elevation, slope, contours, hillshade | `elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer` | none | yes |
| Newest raw DEM / lidar downloads | `tnmaccess.nationalmap.gov/api/v1/products` | none | yes |
| Lidar coverage + vintage footprints | `index.nationalmap.gov/arcgis/rest/services/3DEPElevationIndex/MapServer` | none | 200 OK |
| Parcels, zoning, constraints, housing law flags | `gis-public.sandiegocounty.gov/arcgis/rest/services` | none | yes |
| Point clouds, server side DEM derivation | `portal.opentopography.org` | free key | 200 OK |

---

## 2. USGS 3DEP Elevation (ArcGIS ImageServer)

### Origin

Found via ArcGIS Online item `3a3f15b04b6e4cf085e0128a01e114af`, titled "USGS 3D Elevation". That item page is owned by the `NCDOT.GOV` account but is only a pointer. The real service is hosted by USGS.

```
https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer
```

### Service properties (verified)

| Property | Value |
|---|---|
| currentVersion | 11.3 |
| capabilities | Image, Metadata, Catalog |
| bandCount | 1 |
| pixelType | F32 |
| Native pixel size | 1 m where 1 m lidar exists |
| maxImageWidth / Height | 8000 x 8000 |
| maxRecordCount (catalog query) | 2000 |
| allowRasterFunction | true |
| Service spatial reference | 3857 (Web Mercator) |
| Vertical datum | NAVD 88 |

### Server side raster functions

Pass any of these as `renderingRule={"rasterFunction":"<name>"}`:

```
Hillshade Gray
Hillshade Gray-Stretch
Hillshade Multidirectional
Hillshade Elevation Tinted
Slope Map
Slope Degrees
Aspect Degrees
Aspect Map
Contour 25
Contour Smoothed 25
Preset 2ft Contour Interval
Preset 5ft Contour Interval
Preset 10ft Contour Interval
None
```

`Slope Degrees` and `Preset 2ft Contour Interval` are the two that matter most for site feasibility.

### Operation: point elevation (`/identify`)

```bash
curl -s -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify" \
  --data-urlencode 'geometry={"x":-117.2425,"y":33.2000,"spatialReference":{"wkid":4326}}' \
  --data-urlencode "geometryType=esriGeometryPoint" \
  --data-urlencode "returnGeometry=false" \
  --data-urlencode "f=json"
```

Returns the elevation in meters, plus a `catalogItems` block listing every source DEM covering that point with its acquisition dates and a direct S3 download URL for the source tile. That catalog block is the fastest way to learn the lidar vintage under a given parcel.

Verified return for Vista, CA: `101.121` m, sourced from `CA_SanDiegoQL2_2014`.

### Operation: area statistics (`/computeStatisticsHistograms`)

Best single call for parcel screening. Give it the parcel envelope, get min/max/mean/median elevation back in one shot.

```bash
curl -s -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/computeStatisticsHistograms" \
  --data-urlencode 'geometry={"xmin":-117.245,"ymin":33.198,"xmax":-117.240,"ymax":33.202,"spatialReference":{"wkid":4326}}' \
  --data-urlencode "geometryType=esriGeometryEnvelope" \
  --data-urlencode "f=json"
```

Verified return: min 93.39, max 126.57, mean 102.08, median 101.07, stdev 4.80, count 296,324 pixels.

Max minus min over a parcel is a crude but fast grading-cost proxy. Combine with `Slope Degrees` for anything serious.

### Operation: raster export (`/exportImage`)

```bash
curl -o parcel.tif -G "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/exportImage" \
  --data-urlencode "bbox=-117.245,33.198,-117.240,33.202" \
  --data-urlencode "bboxSR=4326" \
  --data-urlencode "size=400,400" \
  --data-urlencode "format=tiff" \
  --data-urlencode "pixelType=F32" \
  --data-urlencode "f=image"
```

Verified: HTTP 200, 1,049,850 bytes, `image/tiff`.

### Operation: catalog query (`/query`)

Queries the mosaic dataset footprints, not pixels. Use it to find which lidar projects exist.

```bash
curl -s -G ".../3DEPElevation/ImageServer/query" \
  --data-urlencode "where=Name LIKE '%SanDiegoCo%'" \
  --data-urlencode "outFields=Name,LowPS,StartDate,EndDate,URL" \
  --data-urlencode "returnGeometry=false" \
  --data-urlencode "f=json"
```

**Gotcha:** combining a `geometry` filter with a `where` clause did not reliably restrict results in testing. It returned nationwide footprints. Prefer `/identify` when you want "what covers this exact point", and use `/query` only for name or date filtering.

### OGC interfaces

Both return GetCapabilities successfully:

```
https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WMSServer
https://elevation.nationalmap.gov/arcgis/services/3DEPElevation/ImageServer/WCSServer
```

Useful for dropping into QGIS directly.

---

## 3. The National Map Access API

```
https://tnmaccess.nationalmap.gov/api/v1/products
```

No key. This is where the **newest** data lives, ahead of the dynamic ImageServer mosaic.

### Example: newest 1 m DEM tiles over a bbox

```bash
curl -s -G "https://tnmaccess.nationalmap.gov/api/v1/products" \
  --data-urlencode "datasets=Digital Elevation Model (DEM) 1 meter" \
  --data-urlencode "bbox=-117.30,33.15,-117.15,33.25" \
  --data-urlencode "max=10"
```

Useful `datasets` values:

- `Digital Elevation Model (DEM) 1 meter`
- `Lidar Point Cloud (LPC)`
- `National Elevation Dataset (NED) 1/3 arc-second`

Each item returns `title`, `publicationDate`, `dateCreated`, `format`, `sizeInBytes`, and `downloadURL` pointing at `prd-tnm.s3.amazonaws.com`.

---

## 4. Data Vintage Problem

This is the single most important operational finding in this session.

**The dynamic 3DEP ImageServer lags staged products by months to years.**

Verified for the Vista / North County San Diego area:

| Dataset | Collected | Published | In dynamic ImageServer? |
|---|---|---|---|
| `CA_SanDiegoQL2_2014` | Oct 2014 to Feb 2015 | 2020-03-30 | yes, this is what `/identify` returns |
| `San_Diego_CA_2014_LiDAR` | Oct 2014 to Feb 2015 | 2024-04-25 | yes |
| `CA_SanDiegoCo_2016` | Oct 2015 to Nov 2016 | 2020-03-30 | yes |
| `CA_CaliforniaGaps_B23` | Sep to Dec 2023 | 2025-08-20 | yes, but does not cover Vista |
| **`CA_SanDiegoCo_D24`** | 2024 | **2026-09-14** | **NO** |

Confirmation that the newest project is absent from the live service:

```bash
curl -s -G ".../3DEPElevation/ImageServer/query" \
  --data-urlencode "where=Name LIKE '%SanDiegoCo_D24%'" \
  --data-urlencode "returnCountOnly=true" --data-urlencode "f=json"
# -> {"count":0}
```

Direct download of the current-generation tile covering Vista:

```
https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1m/Projects/CA_SanDiegoCo_D24/TIFF/USGS_1M_11_x47y368_CA_SanDiegoCo_D24.tif
```

382 MB per 10,000 x 10,000 px tile.

### Decision rule

| Situation | Use |
|---|---|
| Screening many candidate parcels fast | ImageServer `/computeStatisticsHistograms`. 2014 data is fine, terrain has not moved. |
| Underwriting a specific site | Pull the `CA_SanDiegoCo_D24` GeoTIFF and compute slope locally. |
| Site had grading or demolition after 2014 | Must use D24. The 2014 surface is wrong. |

**Always check `catalogItems` in an `/identify` response before trusting the ImageServer number.** It tells you exactly which vintage produced the value.

---

## 5. SanGIS / San Diego County ArcGIS Server

```
https://gis-public.sandiegocounty.gov/arcgis/rest/services
```

Public, no auth. 26 folders, roughly 150 services. Most useful content is in `sdep_warehouse` and `cosd_warehouse`.

### Folder index

```
APCD, ARCC, AWM, BCMS, cosd_warehouse, crisistrack, DEH, DEH042021,
devtracker, DPR, DPW, HCD, HHSA, Hosted, LAFCO, OES, PDS, rov,
SDCFA, sdep2_workspace, sdep_warehouse, SDSO, Tools, Utilities, WWM
```

### High-value services

| Service path | Contents |
|---|---|
| `cosd_warehouse/parcels_all_for_public_use/MapServer/0` | Assessor parcels, countywide, redacted |
| `sdep_warehouse/HOUSING_LAWS/FeatureServer/0` | State housing law eligibility flags |
| `sdep_warehouse/ZONING_CN` | Zoning, unincorporated county only |
| `sdep_warehouse/BUILDING_OUTLINES` | Building footprints (SANDAG SPACECORE) |
| `sdep_warehouse/CMTY_GP_HOUSING_ELEM_INV_EXST` | Housing element site inventory |
| `sdep_warehouse/CMTY_GENERAL_PLAN_CN` | General plan land use |
| `sdep_warehouse/CMTY_PLAN_CN` | Community plan areas |
| `sdep_warehouse/VMT_INFILL_CN` | VMT infill areas |
| `sdep_warehouse/VMT_EFFICIENT_CN` / `_RES_CN` / `_EMP_CN` / `_SP_CN` | VMT efficiency screening |
| `sdep_warehouse/HYD_FLOODPL` | Floodplain |
| `sdep_warehouse/HYD_BLUE_LINE_STRM_BUFFERS` | Stream buffers |
| `sdep_warehouse/HYD_WETLANDS` | Wetlands |
| `sdep_warehouse/HYD_85TH_PERCENT_ISOPLUVIALS` | Storm design rainfall, relevant to drainage sizing |
| `sdep_warehouse/GEOLOGY_ACTIVE_FAULTS_CN` | Active faults |
| `sdep_warehouse/ECO_MSCP_CN` | Multiple Species Conservation Program |
| `sdep_warehouse/ECO_CONSERVED_LANDS` | Conserved lands |
| `sdep_warehouse/ECO_VEGETATION_CN` | Vegetation communities |
| `sdep_warehouse/ESMT_OPEN_SPACE` | Open space easements |
| `sdep_warehouse/WW_SEPTIC_SEWER_PUBLIC` | Sewer vs septic service |
| `sdep_warehouse/COASTAL_OVERLAY_ZONE_CN` | Coastal Commission jurisdiction |
| `sdep_warehouse/AG_FMMP` | Farmland Mapping and Monitoring Program |
| `sdep_warehouse/JUR_MUNICIPAL` | City boundaries |
| `sdep_warehouse/ROADS_ALL`, `ROAD_SEGMENTS` | Road network |
| `sdep_warehouse/PUBSAFETY_EVAC_ZONES` | Evacuation zones |
| `sdep_warehouse/CENSUS_TRACT_TIGER2020` | Census tracts |
| `sdep_warehouse/HLTH_HPI_3_0` | Healthy Places Index |
| Root: `ADDRAPN` GeocodeServer | Address to APN geocoding |
| Root: `SB9_CRITERIA_MET_01072024` | Standalone SB 9 map service |
| Root: `parcels` via `PDS/ISRP_PARCELS` | Initial Study Research Packet parcels |
| Root: `InitialResearchPacketV2` GPServer | Geoprocessing service that builds a county research packet |

### `parcels_all_for_public_use` layer 0 schema

```
OBJECTID, APN, APN_8, SITUS_JURIS, SITUS_STREET, SITUS_SUFFIX,
SITUS_POST_DIR, SITUS_PRE_DIR, SITUS_ADDRESS, SITUS_FRACTION,
SITUS_BUILDING, SITUS_SUITE, ACREAGE, QUAL_CLASS_SHAPE, SITUS_ZIP, Shape
```

- `maxRecordCount`: 1000
- Geometry: polygon
- Description states it is "redacted for public use". **No owner name, no assessed value, no land use code.**

`SITUS_JURIS` codes observed:

```
CB Carlsbad      CN Coronado      CO County/unincorporated   CV Chula Vista
DM Del Mar       EC El Cajon      EN Encinitas               ES Escondido
IB Imperial Beach LG Lemon Grove  LM La Mesa                 NC National City
OC Oceanside     PW Poway         SD San Diego               SM San Marcos
SO Solana Beach  ST Santee        VS Vista                   None
```

Verified: `SITUS_JURIS='VS'` returns 24,959 parcels.

### `HOUSING_LAWS` layer 0 schema

```
OBJECTID, SB9_CRITERIA_MET, SB35_CRITERIA_MET, SB6_CRITERIA_MET,
AB2011_CRITERIA_MET, SB684_CRITERIA_MET, AB803_CRITERIA_MET,
AB130_CRITERIA_MET, Eligible_For_Streamlining, JURI, Shape
```

- 8,968 features total
- `JURI` values: `INC`, `UNINC`. Both incorporated cities and unincorporated county are covered.
- `maxRecordCount`: 2000

Example:

```bash
curl -s -G "https://gis-public.sandiegocounty.gov/arcgis/rest/services/sdep_warehouse/HOUSING_LAWS/FeatureServer/0/query" \
  --data-urlencode "where=Eligible_For_Streamlining IS NOT NULL" \
  --data-urlencode "outFields=*" \
  --data-urlencode "outSR=4326" \
  --data-urlencode "f=json"
```

### SanGIS gotchas

1. **No SB 79 layer exists.** HOUSING_LAWS stops at AB 130. Transit-proximity tiering has to be built from SANDAG transit stops plus your own buffers.
2. **`ZONING_CN` is unincorporated only.** Service description states it regulates "the unincorporated (non-city) portions of the County". Vista, Carlsbad, Oceanside, Escondido, San Marcos zoning is NOT here. Each city runs its own GIS. This is the biggest gap for SB 79 work, since most SB 79 sites sit inside city limits.
3. **MapServer vs FeatureServer.** Several MapServer endpoints reject `/query` with `"The requested capability is not supported"`. `HOUSING_LAWS/MapServer` is one of them. Always try the FeatureServer variant.
4. **Native spatial reference is 2230** (NAD83 California State Plane Zone 6, US survey feet). Pass `outSR=4326` if you want lat/lon back.
5. **Paginate.** Parcels cap at 1000 per request, most others at 2000. Use `resultOffset` and `resultRecordCount`.
6. **`returnDistinctValues=true` still respects maxRecordCount**, so a distinct query on a large layer can be incomplete. Verify with `returnCountOnly` first.

---

## 6. ArcGIS REST Patterns You Will Reuse

These apply to any ArcGIS Server, not just the ones above.

### Discover a server

```bash
curl -s "https://<host>/arcgis/rest/services?f=json"              # folders + root services
curl -s "https://<host>/arcgis/rest/services/<folder>?f=json"     # services in a folder
curl -s "https://<host>/arcgis/rest/services/<folder>/<svc>/FeatureServer?f=json"   # layers
curl -s "https://<host>/arcgis/rest/services/<folder>/<svc>/FeatureServer/0?f=json" # fields, maxRecordCount
```

### Count before you pull

```
?where=1=1&returnCountOnly=true&f=json
```

### Spatial filter by parcel polygon

```
?geometry={"rings":[[[x1,y1],[x2,y2],...]],"spatialReference":{"wkid":4326}}
&geometryType=esriGeometryPolygon
&inSR=4326
&spatialRel=esriSpatialRelIntersects
&outFields=*
&outSR=4326
&f=json
```

`inSR` matters. Omitting it on a server whose native SR is 2230 will silently give you wrong or empty results.

### Pagination

```
&resultOffset=0&resultRecordCount=1000
&orderByFields=OBJECTID
```

Always set `orderByFields` when paginating or ordering is not guaranteed stable.

### Useful spatial relations

```
esriSpatialRelIntersects   most common
esriSpatialRelContains
esriSpatialRelWithin
esriSpatialRelEnvelopeIntersects   fastest, least precise
```

---

## 7. Known Gaps and Next Steps

Ordered by impact on SB 79 site screening.

1. **City-level zoning.** Not on the county server. Need per-city ArcGIS endpoints for Vista, Carlsbad, Oceanside, Escondido, San Marcos, and San Diego. Not yet enumerated.
2. **Transit stops and frequency.** SB 79 tiers key off proximity to major transit stops and high-quality transit corridors. SANDAG runs a regional open data portal. Not yet verified.
3. **Ownership and assessed value.** County public parcels layer is redacted. Still requires Realist, CRMLS, or the ARCC side.
4. **SB 79 tier geometry.** Has to be constructed. Nothing publishes it as a layer yet.
5. **Fire hazard severity zones (CAL FIRE FHSZ).** Not located on the county server in this pass. State endpoint likely exists.
6. **Slope-based constrained-area deductions.** Several jurisdictions deduct steep slope from developable area in density calcs. Compute from the D24 DEM.

### Candidate pipeline once gaps are closed

```
1. Pull candidate parcels          -> parcels_all_for_public_use, filter SITUS_JURIS + ACREAGE
2. Filter to transit tier          -> SANDAG stops + buffer (TO BUILD)
3. Check zoning / base density     -> city GIS (TO FIND) or ZONING_CN if unincorporated
4. Screen hard constraints         -> HYD_FLOODPL, ECO_MSCP_CN, GEOLOGY_ACTIVE_FAULTS_CN,
                                      ESMT_OPEN_SPACE, COASTAL_OVERLAY_ZONE_CN, AG_FMMP
5. Check streamlining eligibility   -> HOUSING_LAWS (SB35, AB2011, SB684, AB130)
6. Check utilities                  -> WW_SEPTIC_SEWER_PUBLIC
7. Terrain / grading cost           -> 3DEP computeStatisticsHistograms, then D24 DEM for finalists
8. Existing improvements            -> BUILDING_OUTLINES
```

---

## 8. Appendix: How to Inspect Any ArcGIS Online Item

ArcGIS Online item pages (`arcgis.com/home/item.html?id=<id>`) are JavaScript-rendered and return nothing useful to a plain fetch. Hit the sharing REST API instead.

```bash
ID=3a3f15b04b6e4cf085e0128a01e114af
curl -s "https://www.arcgis.com/sharing/rest/content/items/$ID?f=json"
```

The `url` field in the response is the actual service endpoint. The `type` field tells you what you are dealing with:

- `Image Service` -> ImageServer, raster ops
- `Feature Service` -> FeatureServer, vector query
- `Map Service` -> MapServer, may or may not support query
- `Web Map` -> a container; fetch `/data` to get the list of layers inside

```bash
curl -s "https://www.arcgis.com/sharing/rest/content/items/$ID/data?f=json"   # for Web Maps
```

Also check `access` (`public` vs `org`) and `licenseInfo` before relying on anything for a client deliverable.

---

## Changelog

| Date | Change |
|---|---|
| 2026-09-19 | Initial. 3DEP ImageServer, TNM Access API, SanGIS enumeration, vintage analysis. |

---

## Caveats

- Everything here was verified on 2026-09-19. Government GIS endpoints get reorganized. Re-verify before depending on a path.
- None of this is a substitute for a title report, a survey, or a jurisdiction pre-application meeting. It narrows the funnel, it does not confirm entitlement.
- Lidar-derived slope is bare earth. It will not reflect post-collection grading, retaining walls, or fill.
