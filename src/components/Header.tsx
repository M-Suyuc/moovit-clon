import Link from "next/link";

export const Header = () => {
  return (
    <div className="container mx-auto h-16 border-b border-gray-300  flex flex-row justify-between items-center">
      <Link href="/" className="text-2xl font-bold text-center md:text-3xl">
        <span className="text-sm md:text-lg">MLS</span>Transport
      </Link>
      <p className="text-center text-gray-400">
        Public Transit Routes and Stops
      </p>
    </div>
  );
};
