# Steps to run project **mls-transport**

> [!IMPORTANT]
> If you find this information useful, please leave a star in the repository.

> [!WARNING]
> Still in `Development`

## 1. Install depencies

```bash
pnpm install
```

## 2. To make conversion from file kml to file GTFS format using JavaScript

### Enter to /src/server-js folder and Install depencies to run the script

```bash
pnpm install
```

- Run file /src/server-js/main.ts

```bash
pnpm run dev
```

after this command will create a folder with the files on GTFS format example: agency.txt trips.txt routes.txt stops.txt

## 3. How up using postgis + porgrestql and also the services of TileServer GL

- Edit environment variables as needed from the .env file

  - this command will execute the docker-compose.yml file

```sh
docker compose up -d
```

## 4. login con pgadmin

Open [http://localhost:8080/](http://localhost:8080/) and put your credentials that you has created en your environment variables file -> .env

create server using the credenciales that was used in the pgconfig of docker-compose.yml

Credentials for createing a new server in pgAdmin

- Hoast name/address: postgis_db | localhost | if you has a problem see this command [See command](#commando-find-ip-address)
- port: 5432
- Maintenance database: postgis_db
- Username: postgis
- Password: 123456

> [!NOTE]
> If you dont have a problem with **Hoast name/address** skip the next command

## commando Find IP Address

example to get a host name/address with docker command

```sh
docker ps
docker inspect <postgis_container_id>
```

run bash: docker ps then inspect postgis image id for example bash: docker inspect 73485 and take IPAddress of Networks in my case is: **172.19.0.2**

## 5. install extensions for postgis

Create a new Query tools de pdadmin and install the extensions

```sh
CREATE EXTENSION postgis_raster;
CREATE EXTENSION postgis_sfcgal;
CREATE EXTENSION address_standardizer;
```

## 6. Import data gtfs to db of posgis using [gtfs-to-sql package](https://www.npmjs.com/package/gtfs-via-postgres)

```sh
npx gtfs-to-sql --require-dependencies ./src/server-js/gtfs_feed/*.txt | docker exec -i gtfs_db psql -U postgis -d postgis_db
```

## Verify in pgadmin that the import was successful

- to run a check to see if everything went well example:

```sql
select * from stops

```

## Open tileserver

[http://localhost:8080/](http://localhost:8080/)

## 7. Run app of nextjs

- Install dependencies

```sh
pnpm install
pnpm run dev
```

## **Steps if you wanna create your own .mbtiles file using OpenMapTiles**

- First it all you need dowload the OpenStreetMap data for your region in my case is [Guatemala](https://download.geofabrik.de/central-america/guatemala.html) now follow the next step

> [!NOTE]
> If you want to use one that already exists, you can use **maptiler** .mbtile file [.mbtle file of maptiler](https://www.maptiler.com/on-prem-datasets/central-america/guatemala/guatemala-city/)

### 1. Dowload or clone the project [OpenMapTiles](https://github.com/openmaptiles/openmaptiles) of GitHub

### 2. Place the .pbf file you downloaded in Geofabric in a folder called data

### 3. Edit Environment variables .env

### 4. Run these command

```bash

# 1. Limpiar archivos existentes
 make clean

# 2. Generar archivos de construcción
 make

# 3. Iniciar base de datos
 make start-db

# 4. Importar datos externos (Natural Earth, etc.)
 make import-data

# 5. Colocar tu archivo .osm.pbf en la carpeta data/
 cp tu_archivo.osm.pbf ./data/

# 6. Importar datos OSM a PostgreSQL
 make import-osm

# 7. Importar datos de Wikidata
 make import-wikidata

# 8. Importar funciones SQL
 make import-sql

# 9. Generar archivo de bbox (opcional)
 make generate-bbox-file

# 10. Generar tiles y crear .mbtiles
 make generate-tiles-pg
```
