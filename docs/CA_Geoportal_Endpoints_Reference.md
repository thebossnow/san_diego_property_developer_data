# California State Geoportal (gis.data.ca.gov), tested 2026-09-20

Relevance to this project: this is the state's general-purpose GIS catalog,
separate from the CAL FIRE hub already documented in
[CAL_FIRE_Endpoints_Reference.md](CAL_FIRE_Endpoints_Reference.md).
It is where statewide zoning, general plan land use, and the CGS
seismic/geologic hazard zones are published. Same platform (ArcGIS Hub) as
the CAL FIRE hub, so the same search API pattern and the same caveat about
mislabeled "GeoService" links applies.

## Search API

https://gis.data.ca.gov/api/search/v1/collections/dataset/items?q=<term>&limit=<n>

OGC API Records, identical shape to the CAL FIRE hub's search API. Returns
GeoJSON features where each feature's properties include title, type
("Feature Service", "File Geodatabase", etc), url (the underlying
FeatureServer when one exists), snippet, description, created/modified
(epoch ms). No API key needed. Use this to re-find a dataset if the state
republishes it under a new item id, and to discover things not covered
below, for example q=parcels, q=building+permits.

Confirmed useful queries for this project: zoning, general plan, land use,
Alquist-Priolo fault, liquefaction, flood zone. "building permits" and
"assessor parcel" returned nothing on point (parcel-level ownership data is
not on this portal, expected, see county assessor note below).

## Verified working: Statewide Zoning

Two services split at roughly the Central Coast, both point at San Diego
County correctly under South:

South: https://services8.arcgis.com/Xr1lDrwMv89PhjD9/arcgis/rest/services/California_Statewide_Zoning_South/FeatureServer/0
North: https://services8.arcgis.com/Xr1lDrwMv89PhjD9/arcgis/rest/services/California_Statewide_Zoning_North/FeatureServer/0

Layer 0 only, polygon, maxRecordCount 2000, capabilities Query,Extract,
native SR 102100/3857.

Fields: OBJECTID, County, Jurisdiction, Code, Description, Shape__Area,
Shape__Length.

Collected from 535 of California's 539 jurisdictions, 2021-2022 with some
2023 updates, funded by DoD/OLDCC for the CaMEO CAMP project. Built by
converting each jurisdiction's own zoning map (GIS where available, else
georeferenced PDF/image maps snapped to assessor parcel geometry) into one
statewide layer. Contiguous same-code areas were dissolved within a
jurisdiction; slivers under 4 sq meters and unzoned rights-of-way were
dropped.

Point-in-polygon test at Vista (-117.2425,33.2000), South service:
returned Jurisdiction=Vista, Code=SP-DV, Description="Downtown Vista
Specific Plan". Correct and current.

Caveat stated by the publisher: informational only, not legal advice, do
not rely on it for CEQA or other statutory determinations without
independent verification. Given the source data is 2-4 years old and
hand-converted for many jurisdictions, treat a result here as a strong
lead to confirm against the jurisdiction's own current zoning map or
planning counter, not as the final word, especially for a parcel near a
zone boundary or in a jurisdiction that has since rezoned.

## Verified working: General Plan Land Use

https://services8.arcgis.com/Xr1lDrwMv89PhjD9/arcgis/rest/services/California_General_Plan_Land_Use/FeatureServer/2

Layer 2 (not 0), polygon, maxRecordCount 2000, capabilities Query only (no
Extract), native SR 102100/3857.

Fields: OBJECTID, County, jurisdiction, classkey, code, description,
ucd_number, ucd_description, Source, Date, Shape__Area, Shape__Length.
ucd_number/ucd_description look like a normalized statewide land-use
classification crosswalk sitting alongside each jurisdiction's own raw
code, useful for comparing land use across jurisdictions that use
different code schemes.

Point-in-polygon tests, both in unincorporated San Diego County:
- (-117.0,33.05): jurisdiction=Poway, code=RR-A, description="Rural
  Residential A", ucd_description="Medium density residential", Source="GIS
  Hub", Date="2022 q2"
- (-116.9,33.15): jurisdiction=SDI (County of San Diego), code="RURAL
  LANDS (RL-80)", ucd_description="Very low density residential", Date
  "2021 q4"

Note the Poway result: jurisdiction="Poway" but the coordinate is well
outside city limits, meaning this layer carries each jurisdiction's general
plan land use designation over its full planning area, not just its
incorporated boundary; check the Jurisdiction/County field, not just
whether a hit exists, when the question is "which agency's general plan
applies here." Same disclaimer as zoning: informational only, verify
against the jurisdiction's adopted general plan and any recent amendments.

## Verified working: CGS seismic and geologic hazard zones

All three are separate FeatureServers on the same host
(services2.arcgis.com/zr3KAIbsRSUyARHG), published by California Geological
Survey. Layer 0 only, polygon, maxRecordCount 2000, capabilities
Query,Extract,Sync, native SR 3310 (same as the CAL FIRE FHSZ layers, so
the same inSR=4326 point-query pattern works unmodified).

Alquist-Priolo Fault Zones (regulatory zones under the Alquist-Priolo
Earthquake Fault Zoning Act, triggers a site-specific fault investigation
before permitting most structures for human occupancy within the zone):
https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Alquist_Priolo_Fault_Zones/FeatureServer/0

Liquefaction Zones (Seismic Hazards Mapping Act):
https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Liquefaction_Zones/FeatureServer/0

Landslide Zones (Seismic Hazards Mapping Act):
https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CGS_Landslide_Zones/FeatureServer/0

A fourth, CGS_SHZ_Unevaluated_Areas, marks ground CGS has not yet mapped
for liquefaction/landslide; a zero result from the two zone layers above is
ambiguous between "evaluated, not hazardous" and "not yet evaluated" until
checked against this layer, same caveat as the CAL FIRE fire-perimeter
"absence isn't evidence" note.

Verified via statewide bbox counts rather than a single point, since these
zones are narrow/sparse and a guessed point is unlikely to land inside one:
Alquist-Priolo 1,463 features, Liquefaction 2,032, Landslide 41,769
statewide. All three respond to the standard point-in-polygon pattern
already used for FHSZ.

Duplicate item note: the geoportal search also surfaces each of these under
a second title prefixed "CGS Seismic Hazards Program: ..." at the same
host with /ArcGIS/ (capital) in the path instead of /arcgis/. Both resolve
(confirmed for Alquist-Priolo, HTTP 200), same service, just a differently
cased catalog record. Use the lowercase /arcgis/ URLs above; no need to
carry both.

## Confirmed not on this portal: FEMA flood zones, parcel ownership/APN

Searched flood zone / FEMA flood: nothing that is FEMA's National Flood
Hazard Layer. Results were Caltrans/BCDC climate-vulnerability and
coastal-inundation layers, a different question (climate projection, not
regulatory flood zone). FEMA NFHL is a federal dataset; the FEMA Map
Service Center or the national NFHL REST endpoint would need to be
evaluated separately if flood zone becomes a needed lookup for this
project.

Searched building permits / assessor parcel: nothing. Parcel-level
ownership, APN, and permit history stay with county assessor and building
department systems, not this state portal. For San Diego County, parcels and
APNs are already covered: SANDAG `Hosted/Parcels` and County
`PPM_PublicAGO/MapServer/0` in
[San_Diego_GIS__Parcel_Data_APIs___Reference.md](San_Diego_GIS__Parcel_Data_APIs___Reference.md),
and the County parcel polygon to FHSZ/FRAP chain in
[CAL_FIRE_Endpoints_Reference.md](CAL_FIRE_Endpoints_Reference.md). Owner
name and building permit history remain open.

## Adjacent, not yet used: Jurisdictions boundary layer

https://services1.arcgis.com/jUJYIo9tSA7EHvfZ/arcgis/rest/services/Jurisdictions/FeatureServer/0

Same host as the CAL FIRE FHSZ services (jUJYIo9tSA7EHvfZ), polygon,
capabilities Query only. Not yet tested with a point query or inspected
for fields, but worth keeping: a single reliable "which
city/unincorporated-county jurisdiction is this point in" lookup would be
useful glue between the zoning, general plan, and FHSZ SRA/LRA results,
which each spell out jurisdiction differently.

Inside San Diego County, the County's `sdep_warehouse/JUR_MUNICIPAL` layer
already serves this role and was used to confirm `situs_juris` codes (see
[San_Diego_County_Constraint_Layers_Reference.md](San_Diego_County_Constraint_Layers_Reference.md#jurisdiction-codes)).
This statewide layer only matters if the project extends outside the county
or needs a name that matches the statewide zoning/general plan layers.

## How this fits the San Diego County references

| Question | County/SANDAG source (other docs) | This portal |
| --- | --- | --- |
| Zoning, City of San Diego and unincorporated County | `Zoning_Base_SD`, `Zoning_Unincorporated` (authoritative, current) | Statewide Zoning South, use only as a cross-check |
| Zoning, the other 17 incorporated cities | Not published on SANDAG or County GIS | Statewide Zoning South is the only programmatic source found. Verified hit in Vista. Treat as a lead, confirm with the city. |
| General plan, other incorporated cities | Not published on SANDAG or County GIS | General Plan Land Use layer 2, same caveat |
| Active faults | County `GEOLOGY_ACTIVE_FAULTS_CN` (fault lines) | CGS Alquist-Priolo zones (the regulatory zone that triggers a fault investigation). Not the same thing, use both. |
| Liquefaction, landslide | Not documented in the County/SANDAG references | CGS zones, check `CGS_SHZ_Unevaluated_Areas` before reading a zero result |
| Flood | County `HYD_FLOODPL` | Not here. FEMA NFHL still unevaluated. |

## Still to evaluate

FEMA NFHL flood zones (separate federal source, not on this portal), and
how it compares with the County `HYD_FLOODPL` layer.
Building permit history and owner name (County parcel/APN geometry is
already covered in the other docs).
`CGS_SHZ_Unevaluated_Areas`: exact service URL and fields not yet recorded
here.
Whether the Jurisdictions layer's fields support a clean city/county
lookup, and whether it agrees with the jurisdiction names embedded in the
zoning and general plan layers above (Poway vs SDI style differences seen
already).
