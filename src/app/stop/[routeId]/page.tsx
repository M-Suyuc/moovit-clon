import { getShapeById } from "@/actions/get-shape-by-id";
import { getStopsByRouteId } from "@/actions/getStopsByRouteId";
import SidebarStops from "@/components/SidebarStops";
import { generateRouteImageUrl } from "@/lib/generate_sector_image";
import { Suspense } from "react";

type RoutesProps = Promise<{ routeId: string }>;

const SingleRoutePage = async (props: { params: RoutesProps }) => {
  const { routeId } = await props.params;

  const stops = await getStopsByRouteId(routeId);
  const routeName = stops[0]?.route_short_name || "Ruta sin nombre";

  const infoShapes = await getShapeById({ routeId });
  const coordinates = infoShapes
    .map(({ longitude, latitude }) => [longitude, latitude])
    .join("|");

  const markes = stops
    .map(
      ({ longitude, latitude }) =>
        `&marker=${longitude},${latitude}|marker.png|scale:0.3`
    )
    .join("");
  const imageUrl = generateRouteImageUrl({ coordinates, markes });
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error("Error al cargar la imagen");

  return (
    <div className="container mx-auto">
      <h2 className="text-center text-2xl font-semibold">{routeName}</h2>
      <div className="mx-auto w-fit my-10 flex justify-between gap-10 relative">
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarStops data={stops} />
        </Suspense>

        <Suspense fallback={<ImageSkeleton />}>
          <div className="w-[550px] h-[540px] border border-gray-300 rounded drop-shadow-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={`Mapa ${routeName}`}
              className="w-full h-full"
            />
          </div>
        </Suspense>
      </div>
    </div>
  );
};

export default SingleRoutePage;

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
