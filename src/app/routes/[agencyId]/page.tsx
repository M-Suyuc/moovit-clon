import { getAgencieById } from "@/actions/get-agencies-by-id";
import { getCenterPosition } from "@/actions/get-center-position";
import { getRoutesByAgencyId } from "@/actions/get-routes-by-agency-id";
import { getDataToCreateSection } from "@/actions/get-section-data";
import Sidebar, { Route } from "@/components/Sidebar";
import { generateSectorImageUrl } from "@/lib/generate_sector_image";
import { Suspense } from "react";

type RoutesProps = Promise<{ agencyId: string }>;

const Page = async (props: { params: RoutesProps }) => {
  const { agencyId } = await props.params;

  const [agency] = await getAgencieById(agencyId);
  const routes: Array<Route> = await getRoutesByAgencyId({
    agencyId: agencyId,
  });

  const nameAgency = agency?.agency_name ?? "Agencia sin nombre";

  const [positions] = await getCenterPosition();
  const area = await getDataToCreateSection();
  // console.log("🚀 ~ Page ~ area:", area)
  const coordinates = area.map(({ lon, lat }) => [lon, lat]).join("|");
  const { center_lat, center_lon } = positions;

  const imageUrl = generateSectorImageUrl({
    coordinates,
    centerLon: center_lon,
    centerLat: center_lat,
  });
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Error al cargar la imagen");

  return (
    <div className="container mx-auto">
      <h2 className="text-center text-xl font-bold">{nameAgency}</h2>
      <div className="mx-auto w-fit my-10 flex justify-between gap-10 relative">
        {/* sidebar */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar data={routes} />
        </Suspense>

        {/* img */}
        <Suspense fallback={<ImageSkeleton />}>
          <div className="border border-gray-300 rounded drop-shadow-lg overflow-hidden">
            <img src={imageUrl} alt={`Mapa ${nameAgency}`} />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default Page;

function ImageSkeleton() {
  return <div className="w-full h-full bg-gray-200 animate-pulse"></div>;
}

function SidebarSkeleton() {
  return (
    <div
      className="w-[500px] h-fit bg-white"
      role="dialog"
      aria-label="Sidebar"
    >
      <div className="relative flex flex-col h-full max-h-full ">
        {/* Header */}
        <header className=" p-4 flex justify-between items-center gap-x-2">
          <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>

          <div className="lg:hidden -me-2">
            <div className="h-6 w-6 bg-gray-200 animate-pulse rounded-full"></div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {[...Array(10)].map((_, index) => (
            <div
              key={index}
              className="h-6 w-full bg-gray-200 animate-pulse rounded"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
