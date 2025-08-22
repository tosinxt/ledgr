import React from 'react';
import DottedMap from 'dotted-map';

const map = new DottedMap({ height: 55, grid: 'diagonal' });

type DotPoint = { x: number; y: number };
const points = map.getPoints() as DotPoint[];

const svgOptions = {
  backgroundColor: 'var(--color-background)',
  color: 'currentColor',
  radius: 0.15,
};

const MapWorld: React.FC = () => {
  const viewBox = `0 0 120 60`;
  return (
    <svg viewBox={viewBox} style={{ background: svgOptions.backgroundColor }}>
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={svgOptions.radius} fill={svgOptions.color} />
      ))}
    </svg>
  );
};

export default MapWorld;
