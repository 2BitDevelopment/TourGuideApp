import React, { useRef, useState } from "react";

type Landmark = {
  id: number;
  name: string;
  image?: string;
  description: string;
  historicalSignificance: string;
  construction: string;
};

const landmarks: Landmark[] = [
  {
    id: 1,
    name: "Pulpit",
    image: "",
    description:
      "The ornate wooden pulpit is where sermons are delivered during services. Crafted from rich mahogany, the pulpit features intricate carvings depicting biblical scenes and symbols.",
    historicalSignificance:
      "From this pulpit, Archbishop Desmond Tutu and other religious leaders spoke out against apartheid. Many famous sermons advocating for justice and reconciliation were delivered here during South Africa's struggle for democracy.",
    construction:
      "The pulpit was constructed in 1901 and is one of the original features of the cathedral.",
  },
  // Add more landmarks as needed
];

export default function LandmarkInformation() {
  const [current, setCurrent] = React.useState(0);
  const [speaking, setSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  const landmark = landmarks[current];

  // Play/pause logic for text-to-speech
  const handleSpeak = () => {
    if (speaking) {
      synthRef.current.pause();
      setSpeaking(false);
    } else {
      if (synthRef.current.paused) {
        synthRef.current.resume();
        setSpeaking(true);
        return;
      }
      synthRef.current.cancel();
      const utter = new SpeechSynthesisUtterance(
        `${landmark.name}. ${landmark.description} Historical Significance: ${landmark.historicalSignificance} Construction: ${landmark.construction}`
      );
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      utterRef.current = utter;
      synthRef.current.speak(utter);
      setSpeaking(true);
    }
  };

  // Stop speech when changing landmark
  React.useEffect(() => {
    synthRef.current.cancel();
    setSpeaking(false);
  }, [current]);

  const handlePrev = () => {
    setCurrent((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev < landmarks.length - 1 ? prev + 1 : prev));
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "#eee",
            padding: "32px 0",
            textAlign: "center",
            minHeight: 160,
          }}
        >
          {landmark.image ? (
            <img
              src={landmark.image}
              alt={`Image of ${landmark.name}`}
              style={{ maxWidth: "80%", borderRadius: 8 }}
            />
          ) : (
            <div style={{ color: "#888" }}>
              <span
                style={{
                  fontSize: 48,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                <svg
                  width="48"
                  height="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="4"
                    fill="#ddd"
                  />
                  <circle cx="12" cy="10" r="3" fill="#bbb" />
                  <path
                    d="M3 17l5-5a2 2 0 0 1 2.8 0l5.2 5"
                    stroke="#bbb"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <div>Image of {landmark.name}</div>
            </div>
          )}
        </div>
        <div style={{
          padding: "24px 20px 0 20px",
          flex: 1,
          minWidth: 0,
          width: "100%",
          boxSizing: "border-box"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
            <div
              style={{
                background: "#b71c1c",
                color: "#fff",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                fontSize: 20,
                marginRight: 12,
                flexShrink: 0,
              }}
            >
              {landmark.name[0]}
            </div>
            <h2 style={{ margin: 0, fontSize: 24 }}>{landmark.name}</h2>
          </div>
          <p style={{ fontSize: 16, color: "#222", marginBottom: 20 }}>
            {landmark.description}
          </p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: "#b71c1c", fontWeight: "bold", marginBottom: 4 }}>
              Historical Significance
            </div>
            <div style={{ color: "#222", fontSize: 15 }}>
              {landmark.historicalSignificance}
            </div>
          </div>
          <div style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
            <div style={{ color: "#b71c1c", fontWeight: "bold", marginBottom: 4 }}>
              Construction
            </div>
            <div style={{ color: "#222", fontSize: 15 }}>
              {landmark.construction}
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px",
          gap: 12,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          onClick={handlePrev}
          disabled={current === 0}
          style={{
            background: "#fff",
            color: "#b71c1c",
            border: "1px solid #b71c1c",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: "bold",
            fontSize: 16,
            cursor: current === 0 ? "not-allowed" : "pointer",
            opacity: current === 0 ? 0.5 : 1,
            minWidth: 100,
          }}
        >
          &#8592; Previous
        </button>
        <button
          onClick={handleSpeak}
          style={{
            background: "#b71c1c",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 24px",
            fontWeight: "bold",
            fontSize: 18,
            cursor: "pointer",
            flex: 1,
            margin: "0 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            minWidth: 180,
            transition: "background 0.2s",
            boxShadow: speaking ? "0 0 0 2px #b71c1c55" : undefined,
          }}
        >
          <span role="img" aria-label="audio">
            {speaking ? "⏸️" : "🎙️"}
          </span>
          {speaking ? "Pause Audio Guide" : "Play Audio Guide"}
        </button>
        <button
          onClick={handleNext}
          disabled={current === landmarks.length - 1}
          style={{
            background: "#fff",
            color: "#b71c1c",
            border: "1px solid #b71c1c",
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: "bold",
            fontSize: 16,
            cursor:
              current === landmarks.length - 1 ? "not-allowed" : "pointer",
            opacity: current === landmarks.length - 1 ? 0.5 : 1,
            minWidth: 100,
          }}
        >
          Next &#8594;
        </button>
      </div>
    </div>
  );
}