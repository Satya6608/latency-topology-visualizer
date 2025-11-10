"use client";
import { useEffect, useState } from "react";

export default function ServersPage() {
  const [data, setData] = useState<{ probes: any[]; exchanges: any[] } | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/regions");
      const json = await res.json();
      setData(json);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-lg font-medium">
        Loading server data...
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ==== Probe Servers ==== */}
      <section>
        <h1 className="text-2xl font-bold mb-4">Probe Servers</h1>

        {/* Responsive container for table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full text-sm sm:text-base">
            <thead className="bg-gray-100 text-gray-700 sticky top-0">
              <tr>
                <th className="p-3 text-left whitespace-nowrap">Probe Name</th>
                <th className="p-3 text-left whitespace-nowrap">Country</th>
                <th className="p-3 text-left whitespace-nowrap">IPv4</th>
                <th className="p-3 text-left whitespace-nowrap">IPv6</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.probes.map((probe, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition-colors text-gray-800"
                >
                  <td className="p-3 font-medium">{probe.name}</td>
                  <td className="p-3">{probe.country}</td>
                  <td className="p-3 text-gray-600">{probe.ipv4 ?? "—"}</td>
                  <td className="p-3 text-gray-600">{probe.ipv6 ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ==== Exchange Servers ==== */}
      <section>
        <h1 className="text-2xl font-bold mt-10 mb-4">Exchange Servers</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.exchanges.map((ex) => (
            <div
              key={ex.id}
              className="p-4 border rounded-xl shadow-sm hover:shadow-md transition bg-white"
            >
              <h2 className="font-semibold text-lg">{ex.name}</h2>
              <p className="text-sm text-gray-600">Provider: {ex.provider}</p>
              <p className="text-sm text-gray-600">Region: {ex.region}</p>
              <p className="text-xs text-gray-500 italic mt-1">{ex.notes}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
