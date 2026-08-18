import { useEffect, useState } from "react";

const colorFor = (verdict) => {
    switch (verdict) {
        case "Ultra":
            return "#00FF66";
        case "High":
            return "#33FF85";
        case "Medium":
            return "#EAB308";
        case "Low":
            return "#FF9800";
        default:
            return "#FF007F";
    }
};

export const CompatibilityGauge = ({ score = 0, verdict = "" }) => {
    const [animated, setAnimated] = useState(0);
    const color = colorFor(verdict);
    const R = 88;
    const C = 2 * Math.PI * R;
    const offset = C - (animated / 100) * C;

    useEffect(() => {
        const t = setTimeout(() => setAnimated(score), 80);
        return () => clearTimeout(t);
    }, [score]);

    return (
        <div
            className="relative w-60 h-60 flex items-center justify-center"
            data-testid="compatibility-gauge"
        >
            <svg width="240" height="240" viewBox="0 0 240 240" className="absolute inset-0">
                <circle
                    cx="120"
                    cy="120"
                    r={R}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="10"
                />
                <circle
                    cx="120"
                    cy="120"
                    r={R}
                    fill="none"
                    stroke={color}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={offset}
                    transform="rotate(-90 120 120)"
                    style={{
                        transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1), stroke 300ms",
                        filter: `drop-shadow(0 0 10px ${color})`,
                    }}
                />
            </svg>
            <div className="text-center">
                <div
                    className="font-display font-black text-5xl tracking-tighter"
                    style={{ color }}
                    data-testid="compatibility-score"
                >
                    {animated}
                </div>
                <div className="gs-overline mt-1" style={{ color }}>
                    {verdict || "—"}
                </div>
            </div>
        </div>
    );
};

export default CompatibilityGauge;
