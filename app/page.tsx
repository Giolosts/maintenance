import Countdown from "@/components/Countdown";

const MAINTENANCE_HOURS = 24;

function computeEndTime(): string {
  const fromEnv = process.env.NEXT_PUBLIC_MAINTENANCE_END;
  if (fromEnv) return fromEnv;
  return new Date(Date.now() + MAINTENANCE_HOURS * 3600 * 1000).toISOString();
}

export default function Page() {
  const endsAt = computeEndTime();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/giolosts_logo.png"
        alt="giolosts"
        style={{
          height: "clamp(5rem, 12vw, 8rem)",
          width: "auto",
          marginBottom: "2rem",
        }}
      />

      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 600,
          marginBottom: "1rem",
          letterSpacing: "-0.02em",
        }}
      >
        We&rsquo;ll be back shortly.
      </h1>

      <p
        style={{
          fontSize: "1.1rem",
          color: "#9aa0a6",
          maxWidth: "36rem",
          marginBottom: "3rem",
          lineHeight: 1.6,
        }}
      >
        Scheduled maintenance is in progress. Thanks for your patience.
      </p>

      <Countdown endsAt={endsAt} />
    </main>
  );
}
