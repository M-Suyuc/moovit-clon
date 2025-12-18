"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (
    event: React.FormEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();
    if (!file) return;
    console.log("🚀 ~ handleUpload ~ file:", file);

    setLoading(true);
    setStatus("Procesando KML...");

    const formData = new FormData();
    formData.append("kml", file);

    try {
      const response = await fetch("/api/process-kml", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      setStatus(result.message);
    } catch (error) {
      console.log("🚀 ~ handleUpload ~ error:", error);
      setStatus(
        "Error upload page: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-3xl font-semibold mb-4">Subir archivo KML</h1>

      <div className="space-y-4">
        <form>
          <input
            type="file"
            accept=".kml"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="border border-gray-300 rounded-md p-2 cursor-pointer"
          />

          <button
            onClick={(event) => handleUpload(event)}
            disabled={!file || loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
          >
            {loading ? "Procesando..." : "Procesar KML"}
          </button>
        </form>

        {status && <div className="p-3 bg-gray-100 rounded">{status}</div>}
      </div>
    </div>
  );
}
