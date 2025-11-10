import React from "react";

const Legend = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: "70px",
        left: "10px",
        background: "rgba(0,0,0,0.7)",
        padding: "12px 16px",
        borderRadius: "10px",
        color: "#fff",
        fontSize: "13px",
        fontFamily: "monospace",
        lineHeight: "1.4",
        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        zIndex: 10,
        width: "180px",
      }}
    >
      {/* Latency Section */}
      <div
        style={{ marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}
      >
        Latency
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            backgroundColor: "#00FF99",
            borderRadius: "3px",
          }}
        ></span>
        <span>&lt; 30 ms (Low)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            backgroundColor: "#FFB020",
            borderRadius: "3px",
          }}
        ></span>
        <span>30–50 ms (Medium)</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            backgroundColor: "#FF4040",
            borderRadius: "3px",
          }}
        ></span>
        <span>&gt; 50 ms (High)</span>
      </div>

      <hr
        style={{
          margin: "10px 0",
          border: "none",
          borderTop: "1px solid rgba(255,255,255,0.2)",
        }}
      />

      {/* Server Section */}
      <div
        style={{ marginBottom: "6px", fontWeight: "bold", fontSize: "14px" }}
      >
        Probe Servers (Cloud Regions)
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "#FF9900",
            borderRadius: "50%",
            border: "1px solid #ff9900",
          }}
        ></span>
        <span>AWS</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "#0078D4",
            borderRadius: "50%",
            border: "1px solid #0078D4",
          }}
        ></span>
        <span>Azure</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "#34A853",
            borderRadius: "50%",
            border: "1px solid #34A853",
          }}
        ></span>
        <span>GCP</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span
          style={{
            width: "14px",
            height: "14px",
            backgroundColor: "#aaaaaa",
            borderRadius: "50%",
            border: "1px solid #aaa",
          }}
        ></span>
        <span>Equinix</span>
      </div>
    </div>
  );
};

export default Legend;
