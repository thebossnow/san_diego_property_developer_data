# San Diego Property Developer Data

A comprehensive resource for programmatic analysis and due diligence on San Diego real estate properties. Access authoritative parcel data, zoning information, general plans, transit proximity, and housing law eligibility through integrated GIS APIs.

## What's included

- **Parcel data APIs**: 1.09M+ county-wide parcels with complete assessor information, situs addresses, and acreage
- **Zoning & General Plan layers**: Zone codes, setbacks, FAR, density, and land use designations for both unincorporated county and City of San Diego
- **Housing law screening**: SB 9, SB 35, SB 6, AB 2011, and AB 803 eligibility checks at the parcel level
- **Transit & TOD overlays**: Transit stops (GTFS), priority areas, and FAR overlays for SB 79 site screening
- **Address normalization**: Direct address-to-APN lookups and NG911-standard address point schemas
- **Geocoding services**: Both address and APN-based geocoders for coordinate-based spatial queries

All services are unauthenticated REST APIs serving GeoJSON/JSON from SANDAG's regional GIS platform and San Diego County's public assessor data.

## Documentation

See [docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md) for:
- Complete field schemas for all 373+ hosted layers
- Live curl examples for each API endpoint
- Targeted use cases (floorplan intake, feasibility screening, site search)
- Coverage notes (unincorporated vs. incorporated city)

## API endpoints referenced

All endpoints below are publicly accessible, unauthenticated Esri ArcGIS REST services maintained by San Diego County and SANDAG. No API key or login is required.

**San Diego County**
- `https://gis-public.sandiegocounty.gov/arcgis/rest/services/PPM_PublicAGO/MapServer` — Assessor parcels, General Plan, zoning, road names (unincorporated county)

**SANDAG regional GIS**
- `https://geo.sandag.org/server/rest/services/Hosted/Parcels/FeatureServer/0` — Countywide parcels with situs addresses
- `https://geo.sandag.org/server/rest/services/Hosted/Zoning_Unincorporated/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Zoning_Base_SD/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/General_Plan_Land_Use_SD/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Community_Plan_SD/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Senate_Bill_9/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Senate_Bill_35/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Senate_Bill_6/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Assembly_Bill_2011/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Assembly_Bill_803/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Housing_Laws/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Transit_Priority_Areas/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Transit_Stops_GTFS/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Sustainable_Development_Areas/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Housing_Solution_Areas/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Prime_Industrial_Lands/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Address_Points/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Hosted/Address_Points_NG911/FeatureServer/0`
- `https://geo.sandag.org/server/rest/services/Parcels_APN_Locator/GeocodeServer`
- `https://geo.sandag.org/server/rest/services/SANDAG_COMPOSITE_LOCATOR/GeocodeServer`
- `https://geo.sandag.org/portal/sharing/rest` — Portal search/catalog API

See the [reference doc](docs/San_Diego_GIS__Parcel_Data_APIs___Reference.md) for field schemas and example queries for each.

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE). The underlying GIS data is public domain, maintained by San Diego County and SANDAG; this repository's own code and documentation are covered by the MIT License.
