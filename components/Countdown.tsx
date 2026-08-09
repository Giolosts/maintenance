"use client";

import { useEffect, useState } from "react";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function remainingFrom(target: Date): Remaining {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const totalSec = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    done: false,
  };
}

export default function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt);
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    setRemaining(remainingFrom(target));
    const id = setInterval(() => setRemaining(remainingFrom(target)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!remaining) {
    // Render a placeholder to avoid hydration mismatch.
    return <div style={{ height: "6rem" }} aria-hidden />;
  }

  if (remaining.done) {
    return (
      <div style={{ fontSize: "1.5rem", color: "#9aa0a6" }}>
        Bringing systems back online&hellip;
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(4rem, 6rem))",
        gap: "1rem",
      }}
      aria-label="Time until maintenance completes"
    >
      <Cell value={remaining.days} label="days" />
      <Cell value={remaining.hours} label="hours" />
      <Cell value={remaining.minutes} label="minutes" />
      <Cell value={remaining.seconds} label="seconds" />
    </div>
  );
}

function Cell({ value, label }: { value: number; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1rem 0.5rem",
        background: "#161a1f",
        border: "1px solid #262b31",
        borderRadius: "0.5rem",
      }}
    >
      <div
        style={{
          fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {String(value).padStart(2, "0")}
      </div>
      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.7rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#9aa0a6",
        }}
      >
        {label}
      </div>
    </div>
  );
}
