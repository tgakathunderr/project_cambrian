import React, { useRef, useState, useEffect, useCallback } from 'react';

interface OrganismData {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  energy: number;
  max_energy: number;
  hydration: number;
  max_hydration: number;
  age: number;
  generation: number;
  size: number;
  speed: number;
  sex: string;
  dopamine: number;
  serotonin: number;
  acetylcholine: number;
  cortisol: number;
  dominant_drive: number;
  lifecycle: string;
}

interface PredatorData {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  energy: number;
  max_energy: number;
  size: number;
}

interface ResourceData {
  x: number;
  y: number;
  amount: number;
  radius: number;
}

interface ObstacleData {
  x: number;
  y: number;
  radius: number;
}

interface RippleData {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

interface BiosphereCanvasProps {
  organisms: OrganismData[];
  predators: PredatorData[];
  food: ResourceData[];
  water: ResourceData[];
  obstacles: ObstacleData[];
  selectedId: string | null;
  onSelectOrganism: (id: string | null) => void;
  activeGodModeType: string | null;
  onSpawnElement: (x: number, y: number, type: string) => void;
  onNeedNameForSpawn?: (x: number, y: number) => void;
  terrain?: string[][];
  onPaintTerrain?: (x: number, y: number, type: string) => void;
}

// DRIVE color palette for canvas rendering
const DRIVE_COLORS: Record<number, string> = {
  0: '#8da89b',  // content — sage
  1: '#f59e0b',  // hungry — amber
  2: '#93c5fd',  // thirsty — sky blue
  3: '#f9a8d4',  // mating — pink
  4: '#ffb4ab',  // fear — terracotta
  5: '#c0c6de',  // explore — lavender
};

export const BiosphereCanvas: React.FC<BiosphereCanvasProps> = ({
  organisms, predators, food, water, obstacles,
  selectedId, onSelectOrganism, activeGodModeType, onSpawnElement,
  onNeedNameForSpawn, terrain, onPaintTerrain
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 800 });

  // Refs for render loop (avoid stale closures)
  const orgsRef = useRef(organisms);
  const predsRef = useRef(predators);
  const foodRef = useRef(food);
  const waterRef = useRef(water);
  const obstaclesRef = useRef(obstacles);
  const selectedIdRef = useRef(selectedId);
  const panRef = useRef({ x: panX, y: panY });
  const zoomRef = useRef(zoom);
  const dimsRef = useRef(dimensions);
  const terrainRef = useRef(terrain);

  useEffect(() => { orgsRef.current = organisms; }, [organisms]);
  useEffect(() => { predsRef.current = predators; }, [predators]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { waterRef.current = water; }, [water]);
  useEffect(() => { obstaclesRef.current = obstacles; }, [obstacles]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);
  useEffect(() => { panRef.current = { x: panX, y: panY }; }, [panX, panY]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { dimsRef.current = dimensions; }, [dimensions]);
  useEffect(() => { terrainRef.current = terrain; }, [terrain]);

  // Trails & VFX
  const trailsRef = useRef<Record<string, { x: number; y: number }[]>>({});
  const birthRingsRef = useRef<{ x: number; y: number; radius: number; alpha: number }[]>([]);
  const rippleRingsRef = useRef<RippleData[]>([]);
  const prevOrgIdsRef = useRef<Set<string>>(new Set());

  // Size observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleResize = () => setDimensions({ width: container.clientWidth, height: container.clientHeight });
    handleResize();
    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Update trails per frame data push
  useEffect(() => {
    const activeIds = new Set(organisms.map(o => o.id));
    const trails = trailsRef.current;
    for (const id in trails) {
      if (!activeIds.has(id)) delete trails[id];
    }
    const prevIds = prevOrgIdsRef.current;
    organisms.forEach(o => {
      if (!prevIds.has(o.id) && prevIds.size > 0 && o.generation > 1) {
        birthRingsRef.current.push({ x: o.x, y: o.y, radius: o.size, alpha: 0.9 });
      }
      if (!trails[o.id]) trails[o.id] = [];
      const t = trails[o.id];
      t.push({ x: o.x, y: o.y });
      // Trail length scaled by DNA speed
      const maxTrailLen = Math.round(8 + o.speed * 1.5);
      if (t.length > maxTrailLen) t.shift();
    });
    prevOrgIdsRef.current = activeIds;
  }, [organisms]);

  // Main render loop (requestAnimationFrame)
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimsRef.current;
    const { x: pX, y: pY } = panRef.current;
    const z = zoomRef.current;
    const time = timeRef.current;
    const orgs = orgsRef.current;
    const preds = predsRef.current;
    const foods = foodRef.current;
    const selId = selectedIdRef.current;
    const terrain = terrainRef.current;

    // Clear whole canvas screen space first to prevent trails/smearing
    ctx.fillStyle = '#000c06';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    const baseScale = Math.min(width / 1000, height / 800);
    ctx.translate(width / 2 + pX, height / 2 + pY);
    ctx.scale(baseScale * z, baseScale * z);
    ctx.translate(-500, -400);

    // 1. Draw Terrain Tile Grid inside transformed viewport coordinates
    const tileColors: Record<string, string> = {
      GRASS: '#0d2216',
      SAND: '#7a6245',
      WATER_SHALLOW: '#0c2635',
      WATER_DEEP: '#04131c',
      ROCK: '#1a1c1a'
    };

    if (terrain && terrain.length > 0) {
      for (let col = 0; col < 20; col++) {
        for (let row = 0; row < 16; row++) {
          const type = terrain[col]?.[row] || 'GRASS';
          ctx.fillStyle = tileColors[type] || tileColors.GRASS;
          ctx.fillRect(col * 50, row * 50, 50, 50);

          // Subtle grid outline
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.012)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(col * 50, row * 50, 50, 50);
        }
      }
    }

    // 2. World boundary
    ctx.strokeStyle = 'rgba(141, 168, 155, 0.15)';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(0, 0, 1000, 800);

    // 3. Draw Trees (Food)
    foods.forEach(f => {
      const pulse = 1.0 + 0.07 * Math.sin(time * 0.04 + f.x * 0.01);
      const r = f.radius * pulse;

      // Tree Trunk
      ctx.fillStyle = '#4c321c';
      ctx.fillRect(f.x - 2.5, f.y, 5, r * 1.1);

      // Shaded Leaves
      const leafGrad = ctx.createRadialGradient(f.x, f.y - r * 0.4, 1, f.x, f.y - r * 0.4, r * 1.1);
      leafGrad.addColorStop(0, '#2f8749');
      leafGrad.addColorStop(0.7, '#1e592e');
      leafGrad.addColorStop(1, '#0e2b17');

      ctx.fillStyle = leafGrad;
      ctx.beginPath();
      ctx.arc(f.x, f.y - r * 0.4, r * 1.1, 0, Math.PI * 2);
      ctx.fill();

      // Highlights
      ctx.fillStyle = '#45b869';
      ctx.beginPath();
      ctx.arc(f.x - r * 0.25, f.y - r * 0.65, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Organism trails
    for (const id in trailsRef.current) {
      const trail = trailsRef.current[id];
      if (trail.length < 2) continue;
      const org = orgs.find(o => o.id === id);
      const baseColor = org ? (DRIVE_COLORS[org.dominant_drive] || '#8da89b') : '#8da89b';
      for (let i = 1; i < trail.length; i++) {
        const alpha = (i / trail.length) * 0.12;
        ctx.strokeStyle = baseColor + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = 2.5 * (i / trail.length);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
        ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
    }

    // 7. Organisms
    orgs.forEach(o => {
      const isSelected = o.id === selId;
      const sz = o.size;
      const driveColor = DRIVE_COLORS[o.dominant_drive] || '#8da89b';

      // Breathing pulse — scaled to organism energy level
      const vitality = Math.min(1, (o.energy / o.max_energy) * 0.6 + 0.4);
      const breathe = sz * (1 + 0.08 * vitality * Math.sin(time * 0.06 + o.x * 0.05));

      // Sex tint
      const sexColor = o.sex === 'MALE' ? '#93c5fd' : '#f9a8d4';

      // Cortisol shifts color to terracotta
      let glowColor = driveColor;
      if (o.cortisol > 0.5) glowColor = '#ffb4ab';
      if (isSelected) glowColor = '#dec2a0';

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#dec2a0';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(o.x, o.y, sz + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Directional comet tail
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(o.angle);
      const tailLen = 20 + o.speed * 3;
      const tailGrad = ctx.createLinearGradient(0, 0, -tailLen, 0);
      tailGrad.addColorStop(0, glowColor + '55');
      tailGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = tailGrad;
      ctx.beginPath();
      ctx.moveTo(sz * 0.6, 0);
      ctx.lineTo(-tailLen, -sz * 0.4);
      ctx.lineTo(-tailLen, sz * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Wide radial glow aura
      const aura = ctx.createRadialGradient(o.x, o.y, sz * 0.5, o.x, o.y, sz * 3.2);
      aura.addColorStop(0, glowColor + '30');
      aura.addColorStop(0.5, glowColor + '10');
      aura.addColorStop(1, 'transparent');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(o.x, o.y, sz * 3.2, 0, Math.PI * 2);
      ctx.fill();

      // Outer breathing membrane
      ctx.strokeStyle = glowColor + 'aa';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(o.x, o.y, breathe, 0, Math.PI * 2);
      ctx.stroke();

      // Inner fill
      const innerGrad = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, sz);
      innerGrad.addColorStop(0, sexColor + '55');
      innerGrad.addColorStop(1, glowColor + '18');
      ctx.fillStyle = innerGrad;
      ctx.beginPath();
      ctx.arc(o.x, o.y, sz, 0, Math.PI * 2);
      ctx.fill();

      // Core bright dot
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(o.x, o.y, sz * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Name tag (only for selected or if very close zoom)
      if (isSelected || z > 1.5) {
        ctx.fillStyle = isSelected ? 'rgba(222,194,160,0.85)' : 'rgba(205,233,219,0.55)';
        ctx.font = `${isSelected ? 'bold ' : ''}${Math.round(9 / z)}px Outfit, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(o.name, o.x, o.y + sz + 12 / z);
      }
    });

    // 8. Predators
    preds.forEach(p => {
      const sz = p.size;
      // Pulsing threat ring
      const pulse = 1 + 0.15 * Math.sin(time * 0.1);
      const aura = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, sz * 3 * pulse);
      aura.addColorStop(0, 'rgba(255,100,80,0.25)');
      aura.addColorStop(1, 'transparent');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz * 3 * pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(93,0,10,0.8)';
      ctx.strokeStyle = '#ffb4ab';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, sz, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Direction spike
      ctx.strokeStyle = '#ffb4ab';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * (sz + 8), p.y + Math.sin(p.angle) * (sz + 8));
      ctx.stroke();
    });

    // 9. Birth rings
    const birthRings = birthRingsRef.current;
    for (let i = birthRings.length - 1; i >= 0; i--) {
      const ring = birthRings[i];
      ctx.strokeStyle = `rgba(222,194,160,${ring.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ring.radius += 1.8;
      ring.alpha -= 0.025;
      if (ring.alpha <= 0) birthRings.splice(i, 1);
    }

    // 10. Ripple rings (God Mode placement)
    const rippleRings = rippleRingsRef.current;
    for (let i = rippleRings.length - 1; i >= 0; i--) {
      const r = rippleRings[i];
      ctx.strokeStyle = r.color + Math.round(r.alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      r.radius += 2.5;
      r.alpha -= 0.035;
      if (r.alpha <= 0) rippleRings.splice(i, 1);
    }

    ctx.restore();

    timeRef.current += 1;
    animFrameRef.current = requestAnimationFrame(draw);
  }, []);

  // Start render loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Coordinate conversion
  const toSimCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { simX: 0, simY: 0 };
    const rect = canvas.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    const { width, height } = dimsRef.current;
    const baseScale = Math.min(width / 1000, height / 800);
    const z = zoomRef.current;
    const { x: pX, y: pY } = panRef.current;
    return {
      simX: (clickX - width / 2 - pX) / (baseScale * z) + 500,
      simY: (clickY - height / 2 - pY) / (baseScale * z) + 400,
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasDragged) return;
    const { simX, simY } = toSimCoords(e.clientX, e.clientY);

    if (activeGodModeType) {
      if (activeGodModeType.startsWith('PAINT_')) {
        if (onPaintTerrain) {
          const type = activeGodModeType.substring(6);
          onPaintTerrain(simX, simY, type);
        }
        return;
      }

      // Spawn ripple VFX
      const rippleColorMap: Record<string, string> = {
        PREY: '#dec2a0', WOLF: '#ffb4ab', FOOD: '#8da89b', WATER: '#93c5fd', OBSTACLE: '#ffffff'
      };
      const col = rippleColorMap[activeGodModeType] || '#ffffff';
      for (let r = 0; r < 3; r++) {
        rippleRingsRef.current.push({ x: simX, y: simY, radius: 4 + r * 8, maxRadius: 60, alpha: 0.7 - r * 0.15, color: col });
      }
      // For PREY, trigger naming modal
      if (activeGodModeType === 'PREY' && onNeedNameForSpawn) {
        onNeedNameForSpawn(simX, simY);
      } else {
        onSpawnElement(simX, simY, activeGodModeType);
      }
    } else {
      let clickedOrg: OrganismData | null = null;
      let minDist = 30.0;
      orgsRef.current.forEach(o => {
        const dist = Math.hypot(o.x - simX, o.y - simY);
        if (dist < minDist && dist < o.size + 14) {
          minDist = dist;
          clickedOrg = o;
        }
      });
      if (clickedOrg) {
        onSelectOrganism((clickedOrg as OrganismData).id);
      } else {
        onSelectOrganism(null);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasDragged(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setHasDragged(true);

    if (activeGodModeType && activeGodModeType.startsWith('PAINT_') && onPaintTerrain) {
      const { simX, simY } = toSimCoords(e.clientX, e.clientY);
      const type = activeGodModeType.substring(6);
      onPaintTerrain(simX, simY, type);
    } else {
      setPanX(prev => prev + dx);
      setPanY(prev => prev + dy);
    }
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    setZoom(prev => Math.max(0.3, Math.min(4.0, prev * factor)));
  };

  const resetViewport = () => { setPanX(0); setPanY(0); setZoom(1.0); };

  // God Mode cursor style
  const cursorStyle = activeGodModeType ? 'crosshair' : (isDragging ? 'grabbing' : 'grab');

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full w-full overflow-hidden"
      style={{ cursor: cursorStyle, background: '#00170f' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={handleCanvasClick}
        className="block"
      />

      {/* Zoom label */}
      <div className="absolute bottom-5 right-5 flex items-center gap-2 z-20">
        <button
          onClick={() => setZoom(v => Math.min(4, v * 1.2))}
          className="w-7 h-7 glass-panel rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-colors text-sm"
        >+</button>
        <span className="text-[10px] font-headline text-white/25 tabular-nums w-8 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(v => Math.max(0.3, v * 0.8))}
          className="w-7 h-7 glass-panel rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 transition-colors text-sm"
        >−</button>
        <button
          onClick={resetViewport}
          className="px-2.5 py-1.5 glass-panel rounded-lg text-[9px] font-headline text-white/25 hover:text-white/50 transition-colors uppercase tracking-wider"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
