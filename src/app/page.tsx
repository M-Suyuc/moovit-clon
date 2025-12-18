import { getAgencies } from "@/actions/get-agencies";
import { Agency } from "@/types";
import Link from "next/link";

export default async function Home() {
  const agencies: Agency[] | { error: string } = await getAgencies();

  return (
    <>
      {/* hero section */}
      <section className="relative h-72 w-full bg-black">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(6, 182, 212, 0.25), transparent 80%), #000000",
          }}
        />

        <div className="container max-w-4/6 mx-auto z-10 relative h-full flex flex-col items-center justify-between py-8 gap-6">
          <h1 className="text-5xl text-start text-white font-medium mt-5">
            Planificador de viajes en transporte público de Ciudad de Guatemala
          </h1>

          <form action="" className="inline-flex w-full items-end gap-4">
            <div className="relative flex-1 flex items-center bg-white">
              <label
                htmlFor="inicio"
                className="min-w-[40px] px-4 text-blue-500 "
              >
                Inicio
              </label>
              <input
                type="text"
                className="flex-1 h-9 focus:outline-none"
                id="inicio"
              />
            </div>

            <div className="relative flex-1 flex items-center bg-white">
              <label
                htmlFor="final"
                className="min-w-[40px] px-4 text-blue-500"
              >
                Final
              </label>
              <input
                type="text"
                className="flex-1 h-9 focus:outline-none"
                id="final"
              />
            </div>

            <button className="bg-blue-600 cursor-pointer hover:bg-blue-500 py-2 px-10 text-white h-9">
              Buscar
            </button>
          </form>
        </div>
      </section>

      {/* agencies section */}
      <section className="bg-neutral-200/30 relative">
        <div className="container mx-auto space-y-8 py-8">
          {agencies && "error" in agencies && agencies.error ? (
            <div className="flex flex-col gap-5 justify-center items-center">
              {agencies.error === "GTFS_NOT_IMPORTED" ? (
                <p className="text-red-500 text-xl">
                  Los datos GTFS no han sido importados aún.
                </p>
              ) : (
                <p className="text-red-500 text-xl">
                  Error de conexión a la base de datos.
                </p>
              )}
              <Link
                href="/admin/upload"
                className="bg-white text-blue-500 px-4 py-2 rounded-md z-10"
              >
                Subir KML
              </Link>
            </div>
          ) : (
            agencies && (
              <>
                <h2 className="text-2xl font-bold ">Agencias de autobús</h2>
                <ul className="flex gap-4">
                  {agencies &&
                    (agencies as Agency[]).map((agency) => (
                      <li
                        key={agency.agency_id}
                        className="bg-white border rounded-md border-neutral-200 hover:shadow-md transition-shadow"
                      >
                        <Link
                          href={`/lines/${agency.agency_id}`}
                          className="py-2 px-4 block"
                        >
                          <h3>{agency.agency_name}</h3>
                        </Link>
                      </li>
                    ))}
                </ul>
              </>
            )
          )}
        </div>
        <div>
          <Link
            href="/admin/upload"
            className="absolute top-4 right-8 bg-white outline text-blue-500 px-4 py-2 rounded-md z-10"
          >
            Subir KML
          </Link>
        </div>
      </section>
    </>
  );
}
