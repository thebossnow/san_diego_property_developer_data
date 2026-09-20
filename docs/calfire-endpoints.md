# CAL FIRE endpoints, tested 2026-09-19

Relevance to this project: fire hazard classification drives building code
(CBC Chapter 7A / WUI construction), defensible space under PRC 4291, and
Natural Hazard Disclosure at sale. Active incident feeds do not affect what
can be built and are not useful here.

## Verified working: Fire Hazard Severity Zones

State Responsibility Area (adopted 2024-01-31, effective 2024-04-01):
https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSZSRA_23_3/FeatureServer/0

Local Responsibility Area (2025-03-24, all rollout phases):
https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/FHSALRA25_v1_All/FeatureServer/0

Both: polygon layer 0, capabilities Query (LRA adds Extract),
maxRecordCount 2000, native SR 3310.

Fields: OBJECTID, SRA, FHSZ, FHSZ_Description, Shape__Area, Shape__Length
FHSZ codes seen: -3 = NonWildland, 1 = Moderate. Higher codes are
High / Very High. SRA field carries "SRA" or "LRA".

Point-in-polygon pattern (the core call for a parcel lookup):

/query?geometry=LON,LAT&geometryType=esriGeometryPoint&inSR=4326
&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=pjson

Tested at -117.2425,33.2000 (Vista) against LRA, returned SRA=LRA,
FHSZ=-3, NonWildland. Query both services and take whichever returns a
feature, since a parcel is in one jurisdiction or the other.

Cartographic alternative, statewide combined, EPSG 3857, supports
Identify and Find:
https://services.gis.ca.gov/arcgis/rest/services/Environment/Fire_Severity_Zones/MapServer

## Verified working: Fire Perimeters (FRAP)

https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/California_Historic_Fire_Perimeters/FeatureServer

Layer 0  California Fire Perimeters (all), 1878 to present
Layer 1  Recent Large Fire Perimeters, greater than 5000 acres
Layer 2  California Fire Perimeters (1950+)

Capabilities Query,Extract. Service maxRecordCount 1000, layer 0 reports
2000. Use 1000 and page with resultOffset. SR 102100 / 3857.
Version 12, released April 2026, includes the 2025 season (516 fires added).
Updated annually in spring. Creative Commons Attribution, open data.
Portal page last refreshed 2026-09-14.

Fields: OBJECTID, YEAR_, STATE, AGENCY, UNIT_ID, FIRE_NAME, INC_NUM,
IRWINID, ALARM_DATE, CONT_DATE, CAUSE, C_METHOD, OBJECTIVE, GIS_ACRES,
COMMENTS, COMPLEX_NAME, COMPLEX_ID, FIRE_NUM, GlobalID, DECADES,
Shape__Area, Shape__Length

CAUSE, C_METHOD and OBJECTIVE are coded small integers. The coded value
domains are in the layer metadata (FeatureServer/0?f=pjson), do not guess
them. Note the trailing underscore on YEAR_.

Burn history for a parcel, same point-in-polygon pattern as FHSZ:

/0/query?geometry=LON,LAT&geometryType=esriGeometryPoint&inSR=4326
&outFields=*&returnGeometry=false&f=json

Verified 2026-09-19:
- Paradise (-121.6175,39.7596) returned 1 feature, CAMP, 2018,
  153,335.6 acres, CDF, alarm 2018-11-07.
- where=FIRE_NAME='CEDAR' returned 14 features including CEDAR 2003 at
  270,686 acres and a CEDAR 2025 at 91 acres, confirming 2025 data.
- Ramona (-116.868,33.042) returned 0 features.

IMPORTANT caveat for due diligence: a zero result is not proof the parcel
never burned. CAL FIRE documents missing perimeters from lost records,
fires below the minimum size threshold, duplicates, and over-generalized
boundaries. Treat the layer as evidence of burn, never as evidence of
no burn. Cross-check adjacent parcels and the 1950+ layer before making a
claim in writing.

Current-season perimeters (FRAP lags a full year). WFIGS interagency,
refreshes every 5 minutes:
https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_YearToDate/FeatureServer

CAL FIRE also hosts the original at
https://egis.fire.ca.gov/arcgis/rest/services/FRAP/FirePerimeters_FS/FeatureServer
but egis.fire.ca.gov robots.txt blocks automated fetching, so the
ArcGIS Online mirror above is the practical endpoint.

Why this matters beyond disclosure: burn history drives insurance
availability and FAIR Plan placement, which can decide whether a
project pencils, and some jurisdictions attach rebuild conditions in
previously burned areas.

## Evaluated, no new API surface: FHSZ Viewer

https://data.cnra.ca.gov/dataset/fire-hazard-severity-zone-viewer

This is a catalog record for an application, not a dataset. Publisher
CAL FIRE, CC-BY. Its two resources are:
- ArcGIS Hub Dataset (HTML) https://gis.data.cnra.ca.gov/apps/CALFIRE-Forestry::fire-hazard-severity-zone-viewer  (returns 403 to automated fetch)
- Labelled "ArcGIS GeoService" but the URL is an Experience Builder app,
  https://experience.arcgis.com/experience/03beab8511814e79a0e4eabf0d3e7247
  Not a REST endpoint. The label on the portal is wrong.

Its stated vintage (SRA effective 2024-04-01, LRA recommended 2025-03-24)
matches FHSZSRA_23_3 and FHSALRA25_v1_All exactly, so it is a front end
over the services already documented above. Adds nothing programmatically.
Keep it as the human-facing viewer for spot-checking query results and for
showing a client or plan checker something official.

Lesson for this project: on data.ca.gov and data.cnra.ca.gov, a resource
tagged "ArcGIS GeoService" is not reliably a REST endpoint. Open it before
wiring anything to it.

## Adjacent find worth pursuing: AB 38 real estate inspections

CAL FIRE StoryMap, "Real Estate Inspections (AB-38)":
https://storymaps.arcgis.com/stories/b2fc79e82aec4ecab4250987db7312cb
(content is JS-rendered, not machine readable, open in a browser)

AB 38 (Wood, 2019) added Civil Code 1102.6f and 1102.19, Government Code
8654.2 to 8654.10, and PRC 4123.7. Confirmed against the bill text at
leginfo. This is the direct legal consequence of a High or Very High FHSZ
result, so it is the natural output of an FHSZ lookup tool.

From Civil Code 1102.6f as currently published: applies to property in a
High or Very High FHSZ constructed before 2010-01-01. Seller delivers a
disclosure notice covering the pre-WUI-code statement, six named
vulnerability features (eave vents, wood roof, combustible landscaping
within five feet, single pane windows, missing flashing, unprotected
gutters), and since 2025-07-01 the State Fire Marshal low cost retrofit
list under Gov Code 51189 with which retrofits the seller completed.
If the seller has a final inspection report under Gov Code 51182, that
goes to the buyer too.

Separately, effective 2021-07-01, AB 38 requires documentation of
compliance with defensible space / vegetation management at transfer, or
a written agreement that the buyer obtains it within one year. Section to
cite is 1102.19. VERIFY current text before relying on this in a
transaction, statute has been amended repeatedly.

Not legal advice. Confirm against current code and the local fire
authority, requirements vary by jurisdiction.

## CAL FIRE Hub search API

https://hub-calfire-forestry.hub.arcgis.com/api/search/v1
OGC API Records. Collections: dataset, document, appAndMap, all.
Working calls:
/collections/dataset/items?q=fire+hazard+severity+zone&limit=10
/collections/appAndMap/items?q=fire+hazard+severity+zone&limit=10
Returns item id, title, description, and the underlying FeatureServer URL.
Use it as a discovery layer to find current service URLs when CAL FIRE
republishes a dataset under a new name. Not a data API itself.
Confirmed useful: it located FHSZ, the perimeters services, and the AB 38
StoryMap. Search appAndMap as well as dataset, the two return different
things.

## Incident feeds (low value for this project)

https://www.fire.ca.gov/umbraco/api/IncidentApi/GeoJsonList?inactive=false
https://www.fire.ca.gov/umbraco/api/IncidentApi/GetIncidents

Undocumented Umbraco endpoints, no stability guarantee. Could not verify
from this session because fire.ca.gov robots.txt blocks the fetcher.
These return active and historical incident points, not land constraints.
Superseded for this project by Fire Perimeters above.

## Still to evaluate

Whether county assessors expose parcel geometry that can be fed directly
into the FHSZ and perimeter point queries.
FEMA flood, and whether county building permit/APN systems are reachable
programmatically. Local jurisdiction VHFHSZ adoption: cities may adopt
zones more restrictive than the CAL FIRE LRA recommendation, so the state
layer may understate.

Statewide zoning, general plan land use, and the CGS Alquist-Priolo /
liquefaction / landslide hazard zones are now covered in
geoportal-endpoints.md (California State Geoportal, a different
ArcGIS Hub site from this one). FEMA flood zones and county parcel/APN
systems are confirmed absent from that portal too and remain open.
