"use client";

import dynamic from "next/dynamic";
import { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "./Providers";
import * as THREE from "three";
import { ArcDatum, StreamData } from "../types/types";
import { useArcStore } from "../store/useArcStore";
import Legend from "./legend";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

interface PointData {
  lat: number;
  lng: number;
  name: string;
  location: string;
  provider: string;
  type: string;
}
const allProviders = ["AWS", "Azure", "GCP", "Equinix"];
export default function GlobeLatency() {
  const globeRef = useRef<any>(null);
  const [hoverArc, setHoverArc] = useState<ArcDatum | null>(null);
  const { theme } = useContext(ThemeContext);
  const {
    filteredArcs,
    addOrUpdateArcs,
    setMinMaxLatencyVisibility,
    setFilters,
    setAllProviders,
    allRegions,
  } = useArcStore();

  const getLatencyColor = (latency: number) => {
    if (latency < 30) return "#00FF99";
    if (latency < 50) return "#FFB020";
    return "#FF4040";
  };

  const connectToStream = () => {
    const es = new EventSource("/api/latency-stream");

    es.onmessage = (e) => {
      const chunk: StreamData = JSON.parse(e.data);
      const distances = chunk.exchanges.map((ex) => ex.distanceKm);
      const minDist = Math.min(...distances);
      const maxDist = Math.max(...distances);
      const range = maxDist - minDist;
      const newArcs = chunk.exchanges.map((ex) => {
        const normDist = (ex.distanceKm - minDist) / (range || 1);
        let latencyValue;
        if (normDist < 0.33) latencyValue = chunk.latency.p25;
        else if (normDist < 0.66) latencyValue = chunk.latency.p50;
        else latencyValue = chunk.latency.p75;

        return {
          id: `${chunk.country}-${ex.name}`,
          startLat: chunk.lat,
          startLng: chunk.lng,
          endLat: ex.lat,
          endLng: ex.lng,
          latency: latencyValue,
          source: chunk.country,
          target: ex.name,
          targetProvider: ex.provider,
          distance: ex.distanceKm,
          color: getLatencyColor(latencyValue),
          targetType: "Exchange Server",
          targetLocation: `${ex.provider} - ${ex.name}`,
          sourceType: "Probe Server",
          sourceLocation: chunk.location,
        };
      });
      addOrUpdateArcs(newArcs);
    };

    es.addEventListener("end", () => {
      es.close();
    });

    return es;
  };

  useEffect(() => {
    const es = connectToStream();
    setFilters({
      providers: allProviders,
      region: allRegions.map((r) => r.value),
      minLatency: null,
      maxLatency: null,
    });
    setAllProviders(allProviders);
    setMinMaxLatencyVisibility(true);
    const interval = setInterval(() => {
      connectToStream();
    }, 5000);
    return () => {
      es.close();
      clearInterval(interval);
    };
  }, []);

  const globeImage =
    theme === "dark"
      ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
      : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  const backgroundImage = theme === "dark" ? "black" : "white";

  const Tooltip = () => {
    if (!hoverArc) return null;
    const { source, target, latency, targetProvider } = hoverArc;

    return (
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "5%",
          background: "rgba(0,0,0,0.8)",
          padding: "10px 14px",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "14px",
          fontFamily: "monospace",
          pointerEvents: "none",
        }}
      >
        <strong>
          {source} → {target}
        </strong>
        <div style={{ color: getLatencyColor(latency) }}>
          Latency: {latency.toFixed(2)} ms
        </div>
        <div style={{ fontSize: "12px", color: "#aaa" }}>
          Server: {targetProvider}
        </div>
        <div style={{ fontSize: "12px", color: "#aaa" }}>
          Distance: {hoverArc.distance} km
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      <Globe
        ref={globeRef}
        globeImageUrl={globeImage}
        backgroundColor={backgroundImage || undefined}
        arcsData={filteredArcs}
        arcColor={(d: any) => (d as ArcDatum).color as any}
        arcDashLength={1.25}
        arcDashGap={0.1}
        arcDashAnimateTime={5000}
        arcStroke={0.5}
        arcsTransitionDuration={2000}
        onArcHover={(arc, prevArc) => setHoverArc(arc as ArcDatum | null)} // ✅ manual wrapper
        arcAltitudeAutoScale={0.4}
        arcLabel={(d) =>
          `<b>${(d as ArcDatum).source} → ${
            (d as ArcDatum).target
          }</b><br/>Latency: ${(d as ArcDatum).latency.toFixed(
            1
          )} ms<br/><i>Server: ${
            (d as ArcDatum).targetProvider
          }</i> <br/>Distance: ${(d as ArcDatum).distance} km`
        }
        pointsData={filteredArcs.flatMap((a) => [
          {
            lat: a.startLat,
            lng: a.startLng,
            name: a.source,
            location: a.sourceLocation,
            provider: a.targetProvider,
            type: a.sourceType,
          },
          {
            lat: a.endLat,
            lng: a.endLng,
            name: a.target,
            location: a.targetLocation,
            provider: a.targetProvider,
            type: a.targetType,
          },
        ])}
        pointColor={(d) => {
          const data = d as PointData;
          if (!data.provider) return "#aaaaaa";

          const provider = data.provider.toUpperCase();

          if (provider.includes("AWS")) return "#FF9900";
          if (provider.includes("AZURE")) return "#0078D4";
          if (provider.includes("GCP") || provider.includes("GOOGLE"))
            return "#34A853";

          return "#aaaaaa";
        }}
        pointAltitude={0.002}
        pointRadius={0.75}
        pointLabel={(d) => {
          const data = d as PointData;
          return `
      <div style="
        background: rgba(10, 15, 35, 0.9);
        color: white;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 13px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      ">
        <b style="color:#bdb2ff;">${data.name} ${
            data.type ? `(${data.type})` : ""
          }</b><br/>
        ${data.name ? `${data.name}<br/>` : ""}
        <span style="color:#76a9fa;">Provider: ${data.provider}</span>
      </div>
    `;
        }}
      />
      <Tooltip />
      <Legend />
    </div>
  );
}
