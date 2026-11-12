// The street behind every screen: two rows of flat townhouse silhouettes with a
// few lit windows. All colour comes from the active theme's CSS variables.

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface House { x: number; w: number; h: number; roof: number }

function street(seed: number, minH: number, maxH: number): House[] {
  const r = rand(seed);
  const out: House[] = [];
  let x = -20;
  while (x < 1440) {
    const w = 70 + Math.round(r() * 90);
    out.push({ x, w, h: minH + Math.round(r() * (maxH - minH)), roof: Math.floor(r() * 3) });
    x += w + (r() > 0.8 ? 14 : 0);
  }
  return out;
}

function housePath({ x, w, h, roof }: House, base: number) {
  const top = base - h;
  if (roof === 0) return `M${x} ${base}V${top}H${x + w}V${base}Z`;
  if (roof === 1) return `M${x} ${base}V${top}L${x + w / 2} ${top - w * 0.32}L${x + w} ${top}V${base}Z`;
  return `M${x} ${base}V${top}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${top}V${base}Z`;
}

function windows(houses: House[], base: number, seed: number) {
  const r = rand(seed);
  const out: { x: number; y: number; lit: boolean }[] = [];
  for (const h of houses) {
    const cols = Math.max(1, Math.floor((h.w - 24) / 30));
    const rows = Math.max(1, Math.floor((h.h - 30) / 46));
    const gap = (h.w - cols * 14) / (cols + 1);
    for (let row = 0; row < rows; row++) {
      for (let c = 0; c < cols; c++) {
        out.push({ x: h.x + gap + c * (14 + gap), y: base - h.h + 22 + row * 46, lit: r() > 0.58 });
      }
    }
  }
  return out;
}

const FAR = street(11, 150, 300);
const NEAR = street(29, 70, 190);
const NEAR_WINDOWS = windows(NEAR, 320, 7);

export default function Scene() {
  return (
    <>
      <div className="sky" aria-hidden="true" />
      <div className="moon" aria-hidden="true" />
      <div className="scene" aria-hidden="true">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice">
          {FAR.map((h, i) => <path key={`f${i}`} className="far" d={housePath(h, 320)} />)}
          {NEAR.map((h, i) => <path key={`n${i}`} className="near" d={housePath(h, 320)} />)}
          {NEAR_WINDOWS.map((w, i) => (
            <rect key={`w${i}`} className={w.lit ? 'lit' : 'dark'} x={w.x} y={w.y} width={14} height={24} rx={7} />
          ))}
        </svg>
      </div>
      <div className="ground" aria-hidden="true">
        <i className="ground-m" />
        <i className="ground-l" />
        <i className="ground-r" />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  );
}
