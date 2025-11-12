# Pasos para correr la app **mls-transport**

> [!WARNING]
> Still in `Se VE diferente solo para ejemplo` Development

## hacer la convesion de archivo kml a archivos gtfs usando javascript

correr el archivo /home/marlon/Dev/mls-transport/src/server-js/main.ts
pnpm run dev

## como levatar la db usando postgis + porgres y ademas los servicios de TileServer GL

- Editar las variable de entorno a tu conveniencia de env.example

```sh
docker compose up -d
// esto leera el docker-compose.yml de la app y levantara las imagenes
```

## login con pgadmin

abre [http://localhost:8080/](http://localhost:8080/) y pon tus credenciales que creaste en el tus variables de entorno de l archivo .env.

create server ussing the credenciales usandas en el pgconfig del docker-compose.yml
en el port nose porqeu ami cada vez qeu booro he inico otra vez me sale un nuevo perto y no localhost por defecto entonces ## haz clic aquí: [ver comando](#comando-docker)

Credentials for createing a new server in pgAdmin

- Hoast name/address: postgis_db | localhost |run bash: docker ps then inspect postgis image id for example bash: docker inspect 73485 y toma el IPAddress of Networks en mi caso es 172.19.0.2
- port: 5432
- Maintenance database: postgis_db
- Username: postgis
- Password: 123456

example to get a host name/address

## comando docker

```sh
docker ps
docker inspect <postgis_container_id>
```

## install extensions for postgis

crea una Qrery tools de pdadmin e instala las extensiones

```sh
CREATE EXTENSION postgis_raster;
CREATE EXTENSION postgis_sfcgal;
CREATE EXTENSION address_standardizer;
```

## como importar la data gtfs a la db de posgis usando gtfs-to-sql

```sh
npx gtfs-to-sql --require-dependencies ./src/server-js/gtfs_feed/*.txt | docker exec -i gtfs_db psql -U postgis -d postgis_db
```

## verificar en pgadmin que la importacion due exitosa

- hacer consultar para ver si todod fue bien example:

```sql
select * from stops

```

## Abrir tileserver

[http://localhost:8080/](http://localhost:8080/)

## corre la app de nextjs

- instalar las depencecias

```sh
pnpm install
pnpm run dev
```
