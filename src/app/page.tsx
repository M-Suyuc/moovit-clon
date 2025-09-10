// import { getStopInfo } from "@/actions/get-info";
import Link from "next/link";


export default async function Home() {
  // const data = await getStopInfo()
  // console.log("🚀 ~ Home ~ data:", data.slice(0, 4))
  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-5">
      <Link href="/map" className="bg-blue-500 text-white py-2 px-5 rounded hover:bg-white hover:text-blue-500 hover:transition-colors">Go Map Leaflet</Link>

      <Link href="/maplibregl" className="bg-blue-500 text-white py-2 px-5 rounded hover:bg-white hover:text-blue-500 hover:transition-colors">Go Map maplibregl</Link>
    </div>
  );
}
