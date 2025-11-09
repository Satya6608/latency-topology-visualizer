"use client";

import dynamic from "next/dynamic";
import { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "./Providers";
import * as THREE from "three";
import earthBG from "@/app/Assets/earthbg.png";
import { ArcDatum, StreamData } from "../types/types";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

export default function GlobeLatency() {
  const globeRef = useRef<any>(null);
  const [arcs, setArcs] = useState<ArcDatum[]>([]);
  const [hoverArc, setHoverArc] = useState<ArcDatum | null>(null);
  const [hoverPoint, setHoverPoint] = useState(null);
  const { theme } = useContext(ThemeContext);

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

      console.log(newArcs);

      setArcs((prevArcs) => {
        const updated = [...prevArcs];

        newArcs.forEach((arc) => {
          const idx = updated.findIndex((a) => a.id === arc.id);

          if (idx !== -1) {
            // only update the changing fields
            updated[idx].latency = arc.latency;
            updated[idx].color = arc.color;
          } else {
            // add if it’s a new connection
            updated.push(arc);
          }
        });

        return updated;
      });
    };

    es.addEventListener("end", () => {
      console.log("✅ Stream complete");
      es.close();
    });

    return es;
  };

  useEffect(() => {
    const es = connectToStream();

    // Refresh every 5 seconds
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
        arcsData={arcs}
        arcColor={(d: ArcDatum) => d.color}
        arcDashLength={1.25}
        arcDashGap={0.1}
        arcDashAnimateTime={5000}
        arcStroke={0.5}
        arcsTransitionDuration={2000}
        onArcHover={setHoverArc}
        arcAltitudeAutoScale={0.4}
        arcLabel={(d: ArcDatum) =>
          `<b>${d.source} → ${d.target}</b><br/>Latency: ${d.latency.toFixed(
            1
          )} ms<br/><i>Server: ${d.targetProvider}</i> <br/>Distance: ${
            d.distance
          } km`
        }
        pointsData={arcs.flatMap((a) => [
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
          if (!d.provider) return "#aaaaaa";

          const provider = d.provider.toUpperCase();

          if (provider.includes("AWS")) return "#FF9900";
          if (provider.includes("AZURE")) return "#0078D4";
          if (provider.includes("GCP") || provider.includes("GOOGLE"))
            return "#34A853";

          return "#aaaaaa";
        }}
        pointAltitude={0.002}
        pointRadius={0.75}
        autoRotate
        autoRotateSpeed={0.75}
        pointLabel={(d) => {
          console.log(d);
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
            <b style="color:#bdb2ff;">${d.name} ${
            d.type ? `(${d.type})` : ""
          }</b><br/>
            ${d.name ? `${d.name}<br/>` : ""}
            <span style="color:#76a9fa;">Provider: ${d.provider}</span>
          </div>
        `;
        }}
      />
      <Tooltip />
    </div>
  );
}
