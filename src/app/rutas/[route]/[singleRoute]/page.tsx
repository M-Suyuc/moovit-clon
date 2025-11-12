import { getStopsByRouteId } from "@/actions/getStopsByRouteId";
import Sidebar from "@/components/Sidebar";

type RoutesProps = Promise<{ route: string; singleRoute: string }>;

const SingleRoutePage = async (props: { params: RoutesProps }) => {
  const { singleRoute, route } = await props.params;

  const routes = await getStopsByRouteId(singleRoute);
  console.log("🚀 ~ SingleRoutePage ~ routes:", routes);

  return (
    <div className="container mx-auto ">
      <h2 className="text-center text-xl font-bold">
        {/* {route.toUpperCase()} - ${singleRoute} */}
      </h2>
      <div className="container mx-auto my-10 flex justify-center  gap-30 relative">
        <Sidebar routes={routes} />
        <div className="h-[500px] w-fit">
          {/* {imageUrl ? (
            <img
              src={imageUrl}
              alt="Mapa"
              className="w-full h-full object-contain"
            />
          ) : (
            <p>Cargando imagen...</p>
          )} */}
        </div>
        {/* <MapLibrary /> */}
        {/* <ImageComponent /> */}
        {/* <MapLibreRender style={styles} /> */}
      </div>
      {/* <RenderStaticMap /> */}
      <span className="block w-full my-20"></span>
    </div>
  );
};

export default SingleRoutePage;
