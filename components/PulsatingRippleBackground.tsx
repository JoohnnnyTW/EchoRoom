
import React, { useRef, useEffect, useCallback } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  radius: number;
  opacity: number;
  lineWidth: number;
  maxRadius: number;
  speed: number;
  createdAt: number;
  initialDynamicOpacity: number; 
}

const RIPPLE_COLOR_BASE = [200, 200, 200]; 

const SPEED_MODES = [
  { name: 'slow', minInterval: 5000, maxInterval: 7000, duration: 10000 },
  { name: 'medium', minInterval: 3500, maxInterval: 4800, duration: 7000 },
  { name: 'fast', minInterval: 2500, maxInterval: 3200, duration: 5000 },
];

const BURST_CHANCE_SLOW_MODE = 0.05;
const BURST_CHANCE_MEDIUM_MODE = 0.1;
const BURST_CHANCE_FAST_MODE = 0.2;
const QUICK_BURST_RIPPLE_MIN_INTERVAL_MS = 60; 
const QUICK_BURST_RIPPLE_MAX_INTERVAL_MS = 150;

const MIN_RIPPLE_SPEED = 0.1;
const MAX_RIPPLE_SPEED = 0.4;
const INITIAL_RIPPLE_RADIUS = 5;
const MAX_RIPPLE_RADIUS_FACTOR = 0.7;
// INITIAL_RIPPLE_OPACITY constant removed
const INITIAL_RIPPLE_LINE_WIDTH = 1.5;

const GRID_SPACING = 60;
const GRID_LINE_COLOR = 'rgba(220, 220, 220, 0.5)';

let rippleIdCounter = 0;

export const PulsatingRippleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastRippleCreationTimeRef = useRef<number>(0);
  const nextRippleIntervalRef = useRef<number>(0);

  const currentSpeedModeIndexRef = useRef<number>(0);
  const modeStartTimeRef = useRef<number>(Date.now());

  const isInBurstRef = useRef<boolean>(false);
  const ripplesInCurrentBurstRef = useRef<number>(0);
  const ripplesGeneratedInBurstRef = useRef<number>(0);
  const burstOriginXRef = useRef<number | null>(null);
  const burstOriginYRef = useRef<number | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    }
  }, []);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_LINE_COLOR;
    ctx.lineWidth = 0.5;

    for (let x = GRID_SPACING; x < width; x += GRID_SPACING) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = GRID_SPACING; y < height; y += GRID_SPACING) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  }, []);

  const createRipple = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const unscaledWidth = parseInt(canvas.style.width || String(canvas.width / window.devicePixelRatio), 10);
    const unscaledHeight = parseInt(canvas.style.height || String(canvas.height / window.devicePixelRatio), 10);
    
    let xPos: number;
    let yPos: number;

    if (isInBurstRef.current && burstOriginXRef.current !== null && burstOriginYRef.current !== null) {
        xPos = burstOriginXRef.current;
        yPos = burstOriginYRef.current;
    } else {
        xPos = Math.random() * unscaledWidth;
        yPos = Math.random() * unscaledHeight;
        if (isInBurstRef.current && (burstOriginXRef.current === null || burstOriginYRef.current === null)) {
            burstOriginXRef.current = xPos;
            burstOriginYRef.current = yPos;
        }
    }
    
    const maxDim = Math.min(unscaledWidth, unscaledHeight);
    
    let chosenOpacity: number;
    const rand = Math.random();
    if (rand < 0.15) { // 15% chance for 0.6 opacity
      chosenOpacity = 0.6;
    } else if (rand < 0.15 + 0.35) { // 35% chance for 0.4 opacity (15% + 35% = 50% cumulative)
      chosenOpacity = 0.4;
    } else { // 50% chance for 0.2 opacity
      chosenOpacity = 0.2;
    }

    ripplesRef.current.push({
      id: rippleIdCounter++,
      x: xPos,
      y: yPos,
      radius: INITIAL_RIPPLE_RADIUS,
      opacity: chosenOpacity,
      initialDynamicOpacity: chosenOpacity,
      lineWidth: INITIAL_RIPPLE_LINE_WIDTH,
      maxRadius: maxDim * MAX_RIPPLE_RADIUS_FACTOR,
      speed: MIN_RIPPLE_SPEED + Math.random() * (MAX_RIPPLE_SPEED - MIN_RIPPLE_SPEED),
      createdAt: Date.now(),
    });
    if (ripplesRef.current.length > 20) {
      ripplesRef.current.shift();
    }
  }, [isInBurstRef, burstOriginXRef, burstOriginYRef]); 

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const now = Date.now();
    const unscaledWidth = parseInt(canvas.style.width || String(canvas.width / window.devicePixelRatio), 10);
    const unscaledHeight = parseInt(canvas.style.height || String(canvas.height / window.devicePixelRatio), 10);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, unscaledWidth, unscaledHeight);
    drawGrid(ctx, unscaledWidth, unscaledHeight);

    const currentModeInfo = SPEED_MODES[currentSpeedModeIndexRef.current];
    if (now - modeStartTimeRef.current > currentModeInfo.duration && !isInBurstRef.current) {
      currentSpeedModeIndexRef.current = (currentSpeedModeIndexRef.current + 1) % SPEED_MODES.length;
      modeStartTimeRef.current = now;
      const newMode = SPEED_MODES[currentSpeedModeIndexRef.current];
      nextRippleIntervalRef.current = newMode.minInterval + Math.random() * (newMode.maxInterval - newMode.minInterval);
    }

    if (now - lastRippleCreationTimeRef.current > nextRippleIntervalRef.current) {
      if (!isInBurstRef.current) {
        const currentModeForBurstChance = SPEED_MODES[currentSpeedModeIndexRef.current];
        let burstChance = 0;
        if (currentModeForBurstChance.name === 'fast') burstChance = BURST_CHANCE_FAST_MODE;
        else if (currentModeForBurstChance.name === 'medium') burstChance = BURST_CHANCE_MEDIUM_MODE;
        else burstChance = BURST_CHANCE_SLOW_MODE;

        if (Math.random() < burstChance) {
          isInBurstRef.current = true;
          ripplesInCurrentBurstRef.current = Math.random() < 0.6 ? 2 : 3; 
          ripplesGeneratedInBurstRef.current = 0; 
          burstOriginXRef.current = null; 
          burstOriginYRef.current = null; 
        }
      }
      
      createRipple(); 
      lastRippleCreationTimeRef.current = now;

      if (isInBurstRef.current) {
        ripplesGeneratedInBurstRef.current++;
        if (ripplesGeneratedInBurstRef.current >= ripplesInCurrentBurstRef.current) {
          isInBurstRef.current = false;
          ripplesGeneratedInBurstRef.current = 0;
          burstOriginXRef.current = null;
          burstOriginYRef.current = null;
          const modeForNextInterval = SPEED_MODES[currentSpeedModeIndexRef.current];
          nextRippleIntervalRef.current = modeForNextInterval.minInterval + Math.random() * (modeForNextInterval.maxInterval - modeForNextInterval.minInterval);
        } else {
          nextRippleIntervalRef.current = QUICK_BURST_RIPPLE_MIN_INTERVAL_MS + Math.random() * (QUICK_BURST_RIPPLE_MAX_INTERVAL_MS - QUICK_BURST_RIPPLE_MIN_INTERVAL_MS);
        }
      } else {
        const modeForNextInterval = SPEED_MODES[currentSpeedModeIndexRef.current];
        nextRippleIntervalRef.current = modeForNextInterval.minInterval + Math.random() * (modeForNextInterval.maxInterval - modeForNextInterval.minInterval);
      }
    }

    ripplesRef.current = ripplesRef.current.filter(ripple => {
      ripple.radius += ripple.speed;
      const progress = ripple.radius / ripple.maxRadius;
      ripple.opacity = Math.max(0, ripple.initialDynamicOpacity * (1 - Math.pow(progress, 2)));
      ripple.lineWidth = Math.max(0.1, INITIAL_RIPPLE_LINE_WIDTH * (1 - Math.pow(progress, 1.5)));

      if (ripple.opacity <= 0.005 || ripple.radius >= ripple.maxRadius || ripple.lineWidth <= 0.05) {
        return false;
      }
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2, false);
      ctx.strokeStyle = `rgba(${RIPPLE_COLOR_BASE.join(',')}, ${ripple.opacity})`;
      ctx.lineWidth = ripple.lineWidth;
      ctx.stroke();
      return true;
    });

    animationFrameIdRef.current = requestAnimationFrame(draw);
  }, [createRipple, drawGrid]); 

  useEffect(() => {
    resizeCanvas();
    modeStartTimeRef.current = Date.now();
    const initialMode = SPEED_MODES[currentSpeedModeIndexRef.current];
    nextRippleIntervalRef.current = initialMode.minInterval + Math.random() * (initialMode.maxInterval - initialMode.minInterval);
    lastRippleCreationTimeRef.current = Date.now() - nextRippleIntervalRef.current; 

    animationFrameIdRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resizeCanvas);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas, draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 -z-10 w-full h-full" />;
};
