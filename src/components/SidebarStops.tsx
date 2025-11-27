import Link from "next/link";

export interface Route {
  stop_id: string;
  stop_name: string;
  route_short_name: string;
}

interface SidebarProps {
  data: Array<Route>;
  // type?: "routes" | "stops";
}

const SidebarStops = async ({ data }: SidebarProps) => {
  if (!data || data.length === 0) {
    return <p className="mt-4 text-gray-400">No data available.</p>;
  }

  return (
    <div
      className="w-[500px] h-fit max-h-[550px] overflow-y-auto bg-white"
      role="dialog"
      aria-label="Sidebar"
    >
      <div className="relative flex flex-col h-full max-h-full ">
        {/* Header */}
        <header className=" p-4 flex justify-between items-center gap-x-2 bg-slate-900 text-white">
          <h3 className="font-medium">{data.length} - paradas</h3>

          <div className="lg:hidden -me-2">
            <button
              type="button"
              className="flex justify-center items-center gap-x-3 size-6 bg-white border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 rounded-full disabled:opacity-50 disabled:pointer-events-none focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
              data-hs-overlay="#hs-sidebar-basic-usage"
            >
              <svg
                className="shrink-0 size-4"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Close</span>
            </button>
          </div>
        </header>
        {/* End Header */}

        {/* Body */}
        <nav className="h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300">
          <div className="pb-0 w-full flex flex-col flex-wrap">
            <ul className="space-y-1">
              {data.map((r) => (
                <li key={r.stop_id} className="group">
                  <Link
                    href={`/stop/${r.stop_name}?id=${r.stop_id}`}
                    className="flex items-center gap-x-3.5 py-2 px-4 border-b border-neutral-300 text-gray-800 hover:bg-gray-100/40 after:content-['>'] after:ml-auto after:text-blue-600 after:font-medium after:inline-block after:transition-all after:duration-200 group-hover:after:translate-x-1.5"
                  >
                    <svg
                      className="size-4"
                      fill="#000000"
                      viewBox="0 0 50 50"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                      <path d="M12 0C5.4375 0 3 2.167969 3 8L3 41C3 42.359375 3.398438 43.339844 4 44.0625L4 47C4 48.652344 5.347656 50 7 50L11 50C12.652344 50 14 48.652344 14 47L14 46L36 46L36 47C36 48.652344 37.347656 50 39 50L43 50C44.652344 50 46 48.652344 46 47L46 44.0625C46.601563 43.339844 47 42.359375 47 41L47 9C47 4.644531 46.460938 0 40 0 Z M 15 4L36 4C36.554688 4 37 4.449219 37 5L37 7C37 7.550781 36.554688 8 36 8L15 8C14.449219 8 14 7.550781 14 7L14 5C14 4.449219 14.449219 4 15 4 Z M 11 11L39 11C41 11 42 12 42 14L42 26C42 28 40.046875 28.9375 39 28.9375L11 29C9 29 8 28 8 26L8 14C8 12 9 11 11 11 Z M 2 12C0.898438 12 0 12.898438 0 14L0 22C0 23.101563 0.898438 24 2 24 Z M 48 12L48 24C49.105469 24 50 23.101563 50 22L50 14C50 12.898438 49.105469 12 48 12 Z M 11.5 34C13.433594 34 15 35.566406 15 37.5C15 39.433594 13.433594 41 11.5 41C9.566406 41 8 39.433594 8 37.5C8 35.566406 9.566406 34 11.5 34 Z M 38.5 34C40.433594 34 42 35.566406 42 37.5C42 39.433594 40.433594 41 38.5 41C36.566406 41 35 39.433594 35 37.5C35 35.566406 36.566406 34 38.5 34Z" />
                    </svg>
                    {r.stop_name ?? ""}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
        {/* End Body */}
      </div>
    </div>
  );
};

export default SidebarStops;
