"use client";
import { useState } from "react";

export default function UploadImage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

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
      setStatus("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl mb-4">Subir archivo KML</h1>

      <div className="space-y-4">
        <input
          type="file"
          accept=".kml"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full"
        />

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
        >
          {loading ? "Procesando..." : "Procesar KML"}
        </button>

        {status && <div className="p-3 bg-gray-100 rounded">{status}</div>}
      </div>
    </div>
  );
}
