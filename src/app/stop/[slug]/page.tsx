type RoutesProps = Promise<{ slug: string }>;
type SearchParams = Promise<{ id?: string }>;

const SingleStopPage = async (props: {
  params: RoutesProps;
  searchParams: SearchParams;
}) => {
  const { slug } = await props.params;
  const { id } = await props.searchParams;

  console.log("🚀 ~ SingleStopPage ~ slug:", slug);
  console.log("🚀 ~ SingleStopPage ~ stopId:", id);

  const stopName = decodeURIComponent(slug);

  // const infoShapes = await getShapeById({ routeId });
  // const coordinates = infoShapes
  //   .map(({ longitude, latitude }) => [longitude, latitude])
  //   .join("|");

  // const markes = stops
  //   .map(
  //     ({ longitude, latitude }) =>
  //       `&marker=${longitude},${latitude}|marker.png|scale:0.3`
  //   )
  //   .join("");
  // const imageUrl = generateRouteImageUrl({ coordinates, markes });
  // const response = await fetch(imageUrl);
  // if (!response.ok) throw new Error("Error al cargar la imagen");

  return (
    <div className="container mx-auto">
      <h2 className="text-center text-2xl font-semibold">{stopName}</h2>
      <p className="text-center text-gray-600">Stop ID: {id}</p>
      <div className="mx-auto w-fit my-10 flex justify-between gap-10 relative">
        {/* <Suspense fallback={<SidebarSkeleton />}>
          <SidebarStops data={stops} />
        </Suspense> */}
        {/* 
        <Suspense fallback={<ImageSkeleton />}>
          <div className="w-[550px] h-[540px] border border-gray-300 rounded drop-shadow-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={`Mapa ${routeName}`}
              className="w-full h-full"
            />
          </div>
        </Suspense> */}
      </div>
    </div>
  );
};

export default SingleStopPage;
