# Pasos para correr la app **mls-transport**

> [!WARNING]
> Still in Development

## hacer la convesion de archivo kml a gtfs usando python no nativamente si no levatando un entorno virtual

- Crear entorno virtual

```sh
python -m venv venv
```

- Activar entorno virtual

```sh
source venv/bin/activate # Linux/Mac
venv\Scripts\activate # Windows
```

- Instalar dependencias

```sh
pip install -r requirements.txt
```

- Desactivar cuando termines
  deactivate

## como levatar la db usando postgis + porgres y ademas los servicios de TileServer GL

- Editar las variable de entorno a tu conveniencia de env.example

```sh
docker compose up -d
esto leera el docker-compose.yml de la app y levantara las imagenes
```

## login con pgadmin

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

## como importar la data gtfs a la db de posgis usando gtfs-to-sql

```sh
npx gtfs-to-sql --require-dependencies ./gtfs_feed/*.txt | docker exec -i gtfs_db psql -U postgis -d postgis_db
```

## entrar a ve en pgadmin y logearte con las credencia les creadas en el fil docker-compose.yml en el apartado de **pgadmin**

- hacer consultar para ver si todod fue bien example:

```sql
select * from stops

```

## corre la app de nextjs

- instalar las depencecias

```sh
pnpm install
pnpm run dev
```
