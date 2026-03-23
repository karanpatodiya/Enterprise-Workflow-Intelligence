import { useMemo } from 'react';

interface SkillGraphProps {
  skills: { label: string; value: number }[]; // value from 0 to 100
  size?: number;
}

export function SkillGraph({ skills, size = 300 }: SkillGraphProps) {
  const center = size / 2;
  const radius = center - 40; // leave room for labels
  const numSides = skills.length;

  // Calculate polygon points based on values
  const points = useMemo(() => {
    return skills.map((skill, i) => {
      const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2; // start at top
      const distance = radius * (skill.value / 100);
      return {
        x: center + distance * Math.cos(angle),
        y: center + distance * Math.sin(angle),
        labelX: center + (radius + 20) * Math.cos(angle),
        labelY: center + (radius + 20) * Math.sin(angle),
        label: skill.label,
        val: skill.value,
      };
    });
  }, [skills, center, radius, numSides]);

  // Background web rings
  const webRings = useMemo(() => {
    const rings = [];
    for (let level = 1; level <= 5; level++) {
      const ringPoints = skills.map((_, i) => {
        const angle = (Math.PI * 2 * i) / numSides - Math.PI / 2;
        const distance = radius * (level / 5);
        return `${center + distance * Math.cos(angle)},${center + distance * Math.sin(angle)}`;
      });
      rings.push(ringPoints.join(' '));
    }
    return rings;
  }, [skills, center, radius, numSides]);

  const valuePolygon = points.map(p => `${p.x},${p.y}`).join(' ');

  if (skills.length < 3) return null;

  return (
    <div className="relative group w-full flex items-center justify-center p-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible filter drop-shadow-[0_0_15px_rgba(217,70,239,0.3)]">
        <defs>
          <linearGradient id="polyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(217,70,239,0.6)" />
            <stop offset="100%" stopColor="rgba(139,92,246,0.6)" />
          </linearGradient>
        </defs>

        {/* Web Rings */}
        {webRings.map((points, i) => (
          <polygon
            key={`ring-${i}`}
            points={points}
            fill="transparent"
            stroke="rgba(148,163,184,0.1)"
            strokeWidth={1}
            className="transition-all duration-700"
          />
        ))}

        {/* Spokes */}
        {points.map((_, i) => (
          <line
            key={`spoke-${i}`}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos((Math.PI * 2 * i) / numSides - Math.PI / 2)}
            y2={center + radius * Math.sin((Math.PI * 2 * i) / numSides - Math.PI / 2)}
            stroke="rgba(148,163,184,0.15)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}

        {/* Value Polygon */}
        <polygon
          points={valuePolygon}
          fill="url(#polyGradient)"
          stroke="rgba(217,70,239,1)"
          strokeWidth={2}
          strokeLinejoin="round"
          className="transition-all duration-1000 ease-out hover:fill-opacity-80"
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />

        {/* Data Points */}
        {points.map((p, i) => (
          <circle
            key={`point-${i}`}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#d946ef"
            stroke="#1e293b"
            strokeWidth={1.5}
            className="transition-all duration-300 group-hover:r-5 group-hover:fill-fuchsia-300"
          >
            <title>{p.label}: {p.val}%</title>
          </circle>
        ))}

        {/* Labels */}
        {points.map((p, i) => {
          let textAnchor: "start" | "middle" | "end" = 'middle';
          if (p.labelX > center + 10) textAnchor = 'start';
          if (p.labelX < center - 10) textAnchor = 'end';
          
          return (
            <text
              key={`label-${i}`}
              x={p.labelX}
              y={p.labelY}
              fill="#94a3b8"
              fontSize="12"
              fontWeight="600"
              textAnchor={textAnchor}
              alignmentBaseline="middle"
              className="pointer-events-none select-none drop-shadow-md"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
