import { getCenterPosition } from "@/actions/get-center-position";
import { getRoutes } from "@/actions/get-routes";
import { getDataToCreateSection } from "@/actions/get-section-data";
import Sidebar, { Route } from "@/components/Sidebar";
import { generateSectorImageUrl } from "@/lib/generate_sector_image";
import { Suspense } from "react";

type RoutesProps = Promise<{ route: string }>;

const MapLibrePage = async (props: { params: RoutesProps }) => {
  const { route } = await props.params;

  const [positions] = await getCenterPosition();
  const area = await getDataToCreateSection();
  // console.log("🚀 ~ MapLibrePage ~ area:", area)

  const coordinates = area.map(({ lon, lat }) => [lon, lat]).join("|");
  const { center_lat, center_lon } = positions;

  const imageUrl = generateSectorImageUrl(coordinates, center_lon, center_lat);

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Error al cargar la imagen");

  const routes: Array<Route> = await getRoutes({ agencyId: route });

  return (
    <div className="container mx-auto ">
      <h2 className="text-center text-xl font-bold">
        {/* {route.toUpperCase()} - Rutas, Paradas */}
      </h2>
      <div className="mx-auto w-fit my-10 flex justify-between gap-10 relative">
        {/* sidebar */}
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar route={route} routes={routes} />
        </Suspense>

        {/* img */}
        <Suspense fallback={<ImageSkeleton />}>
          <div className="size-[500px] ">
            <img
              src={imageUrl}
              alt="Mapa"
              className="w-full h-full object-contain"
            />
          </div>
        </Suspense>
        {/* <MapLibrary /> */}
        {/* <ImageComponent /> */}
        {/* <MapLibreRender style={styles} /> */}
      </div>
      {/* <RenderStaticMap /> */}
      <span className="block w-full my-20"></span>
    </div>
  );
};

export default MapLibrePage;

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
