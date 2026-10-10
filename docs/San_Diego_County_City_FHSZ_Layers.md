# San Diego County city fire hazard layers, tested 2026-09-19

Companion to [CAL_FIRE_Endpoints_Reference.md](CAL_FIRE_Endpoints_Reference.md).
Question: inside an incorporated city, does the state 2025 LRA layer give
the right answer, or has the city adopted something different?

Under Gov Code 51179 each city adopts its Fire Hazard Severity Zones by
ordinance within 120 days of the State Fire Marshal's 2025-03-24 release. A
city can add to the state map but cannot lower it, and CAL FIRE keeps no
list of who adopted what.

## Bottom line

- Only the City of San Diego is confirmed to go beyond the state map (see
  the CAL FIRE doc: about half of its Very High polygon is Very High in the
  state layer). For a City of San Diego parcel, query the City layer too.
- Six other cities publish a queryable layer that matches the state 2025 LRA
  layer at 96 to 99% of sampled points: Encinitas, Carlsbad, Chula Vista,
  La Mesa, Poway and Santee. Nothing in those layers adds area beyond the
  state map. That covers the layers, not the ordinance text.
- Three more cities (Del Mar, Solana Beach, Oceanside) are reported to have
  adopted the state map as-is, but publish no queryable layer that I found.
- The rest were not confirmed. For them the state layer is the best
  available proxy, not a verified answer.

## How the comparison was done

For each city polygon layer: pulled the polygons (`outSR=4326`,
`maxAllowableOffset=0.0002`, about 20 m), drew 120 random points inside them,
and asked the state LRA layer (then SRA if LRA returned nothing) what class
it gives at each point. A match means the city layer's class equals the
state class at the same point. This tests the city layer against the state
layer. It cannot detect an area the city added that is missing from its own
layer, and the few mismatches per layer are probably edge effects from the
20 m simplification.

## Layers by city

Service roots below. "Match" is out of 120 sampled points.

| City | Layer | Match | Notes |
| --- | --- | --- | --- |
| San Diego | `webmaps.sandiego.gov/arcgis/rest/services/SDFR/Fire_Public/MapServer/0` | 52% Very High in state | Larger than state, see CAL FIRE doc |
| San Diego (copy) | `geo.sandag.org/server/rest/services/Hosted/Fire_Hazard_Severity_Zones_SD/FeatureServer/0` | identical to SDFR | Query,Extract. Fields `lra`, `fhsz_description`. Last edit 2026-06-09. Agreed with the SDFR polygon on all 2,221 cells of a 0.005 degree grid. Same host as the other SANDAG services in this repo. |
| Encinitas | `coemapservices.encinitasca.gov/hypegis/rest/services/PublicServices/Very_High_Fire_Hazard_Severity_Zone/FeatureServer/0` | 119 | 26 polygons. Despite the name it holds all three classes (12 Very High, 9 High, 5 Moderate). Fields SRA, FHSZ, FHSZ_Description. |
| Carlsbad | `utility.arcgis.com/usrsvcs/servers/d6cb3d92bd9149aa87df8c5735ed6297/rest/services/SecuredAGOL/FireSeverityZone/FeatureServer/6` | 117 | "CalFire Hazard Zones 2025", 240 polygons. |
| Carlsbad (old) | same service, layer 5 | 56% Very High in state | "Very High Fire Hazard Zones - 2007", 105 polygons, all Very High. Superseded, do not use. |
| Chula Vista | `services2.arcgis.com/2nV1ORz8qFa0iiF2/arcgis/rest/services/publicfire_data/FeatureServer/0` | 119 | 42 polygons, only High and Very High present. Layer 4 in the same service is "Fire Canyon Area". |
| La Mesa | `services3.arcgis.com/iYP51zxNr6TITn6r/arcgis/rest/services/FireHazardSeverityZones_group/FeatureServer/7` | 116 | City boundary clip, 4 polygons (Moderate and High, no Very High). Layer 6 is a 2-mile buffer. |
| La Mesa (parcels) | `services3.arcgis.com/iYP51zxNr6TITn6r/arcgis/rest/services/FHSZ_Parcels/FeatureServer/14` | not sampled | 588 parcels with APN, APN_8, SitusAddress, SITUS_ZIP, ACREAGE, FHSZ, SRA. Title says "Parcels Affected", so probably only parcels touching a zone. Layer 15 is the 2-mile square (3,959 parcels). |
| Santee | `services8.arcgis.com/J9lw6cHYdxcsRYgI/arcgis/rest/services/FHSZ_LRA_2025/FeatureServer/0` | 116 | 5,695 polygons, above the 2,000 record limit, so page with `resultOffset`. `FHSZ` is numeric (1 = Moderate, -3 = NonWildland). |
| Santee (parcels) | `services8.arcgis.com/J9lw6cHYdxcsRYgI/arcgis/rest/services/Santee_Parcels_by_FHSZ_Designation/FeatureServer/0` | not sampled | Fields apn, formattedapn, full_addr, FHSZ ("Most Severe"). |
| Poway | `powaygis.poway.org/powaygis/rest/services/Public/PowHUB_Planning_Survey_Street_Transportation_Layers/MapServer/18` | 116 | 12 polygons. A public copy is `services5.arcgis.com/CjWCkQzgTTO1K3C3/arcgis/rest/services/FHSZ_2025_Poway_Clip/FeatureServer` (Query,Extract). |
| Poway (extra) | same MapServer, layer 5 | 115 of 120 in state Very High | One polygon, "VHFHZ Parcel: within Very High Fire Hazard Zone Area", `RestrictionType` = WARNING. The other 5 points fall in High or Moderate. Could be a parcel-level flag (whole parcels that touch the zone), not confirmed. |

Notes on specific services:

- Carlsbad's URL is a `utility.arcgis.com/usrsvcs` proxy of a service named
  `SecuredAGOL`. It answered unauthenticated queries today, but a proxy to a
  secured service could be locked down without notice. Check it before
  wiring it into anything.
- Poway layer 19 is named "Hazardous Fire Areas" in the service and
  "Wildland Urban Interface Areas" in Poway's web map, and it exposes no
  attribute fields. Not evaluated.
- Poway and Santee also publish viewers. Poway lookup app:
  https://poway.maps.arcgis.com/apps/instant/lookup/index.html?appid=1a35dbdee2204c539cb5cef43d254fb7

## Not usable

| Service | Why |
| --- | --- |
| Escondido `services2.arcgis.com/eJcVbjTyyZIzZ5Ye/arcgis/rest/services/Fire_Severity_Zone_COE/FeatureServer/0` | 102 polygons with `SEV_ZONE` codes Z-1 to Z-8, and most values are null or blank. These are not FHSZ classes. Last edited 2025-07-18. No Escondido layer of the 2025 zones was found. |
| San Marcos-area `services1.arcgis.com/e7Mp0AHrN8K5Kx6X/arcgis/rest/services/FireHazardSeverity_20200916/FeatureServer` | Describes itself as SRA plus DRAFT Very High zones in LRA, dated 2020-09-16. Stale. Owner is not clearly the City. |
| County OES `.../hosted/OES_KnowYourHazards_Wildfire_1/FeatureServer` | Interim mix of 2007 to 2011 LRA maps. Predates the 2025 map. |
| Other AGOL hits (San Diego student projects, `HL Planning` Encinitas 2023 service) | Old or not city-published. The HL Planning service exposed no layers. |

## Cities with no layer found

Adoption status below comes from city pages or news coverage, not from
ordinance text. Where a page returned 403 to the fetcher I say so.

| City | What I found |
| --- | --- |
| Del Mar | Council adopted the state map "as-is" on 2025-06-16 (City page). Public viewer at https://delmar.geoviewer.io/, no REST layer identified. |
| Solana Beach | Adopted 2025-06-18, effective 2025-07-18, as-is (City page). Links to the state's LRA viewer, no city layer. |
| Oceanside | Council approved the state map "as-is" on 2025-06-04 (Coast News). City site returned 403. No layer found. |
| El Cajon | City page returned 403. A search snippet shows a hearing on 2025-04-22 and a scheduled second reading and adoption on 2025-05-13. Not confirmed. |
| Vista | City page returned 403. A search snippet says comments closed 2025-06-01 and the City was working on adoption. Status unknown. |
| Imperial Beach | Page describes the state process and links the state comparison tool. Adoption not stated. |
| Lemon Grove, National City, Coronado | Not confirmed. A search snippet says La Mesa and Lemon Grove have no Very High land in the state map. |
| Escondido | Said it would adopt by ordinance within 120 days of 2025-03-24. No adopted-zone layer found (see above). |

## Practical rule for a lookup tool

1. Query the state SRA and LRA layers for every parcel.
2. For a City of San Diego parcel, also query the City layer. A hit means
   Very High under the City's ordinance even if the state layer says
   otherwise.
3. For other cities, treat the state layer as a proxy and label the result
   "state recommendation, local adoption not verified". Where the city
   publishes a layer in the table above, use it to confirm.
4. For a written deliverable, confirm against the city's adopted ordinance.
   The layers here are working data, not the legal instrument.

## Still to evaluate

- Ordinance text for Encinitas, Carlsbad, Chula Vista, La Mesa, Poway and
  Santee, to confirm they adopted as-is.
- El Cajon, Vista, Lemon Grove, National City, Coronado, Imperial Beach and
  San Marcos adoption status. Use a browser for the sites that block the
  fetcher.
- The unincorporated County: which LRA areas the County adopted and where
  that map lives.
- Whether the reverse also holds: state Very High inside a city boundary
  but missing from the city layer.
