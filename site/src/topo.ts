/**
 * Project Prism: Deep Web Topographic 3D Wireframe Mesh (Z-0)
 *
 * Implements the SSOT specified in DESIGN.md:
 * - 3D terrain wireframe with perspective/isometric projection
 * - Interconnected data nodes (cyan #00E5FF, blue #0055FF)
 * - Anomalous data nodes marked in vivid red (#FF1744)
 * - Parallax integration and subtle mouse-tracking physics
 * - High-performance canvas rendering with zero frame allocations
 */

const GRID_COLS = 36;
const GRID_ROWS = 28;
const ANOMALY_RATE = 0.05; // 5% of nodes are anomalous data points

interface Node3D {
  gx: number;
  gz: number;
  x: number;
  y: number;
  z: number;
  isAnomaly: boolean;
  pulsePhase: number;
}

function darkMode(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.getAttribute("data-theme") !== "light";
}

export function startTopo(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => undefined;

  let raf = 0;
  let running = true;
  let width = 0;
  let height = 0;
  let dpr = 1;

  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;
  let scrollY = 0;

  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Initialize node matrix
  const nodes: Node3D[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const isAnomaly = Math.random() < ANOMALY_RATE;
      nodes.push({
        gx: (c / (GRID_COLS - 1) - 0.5) * 2, // -1 to 1
        gz: (r / (GRID_ROWS - 1) - 0.5) * 2, // -1 to 1
        x: 0,
        y: 0,
        z: 0,
        isAnomaly,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
  }

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width * dpr));
    height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = width;
    canvas.height = height;
  };
  resize();
  window.addEventListener("resize", resize);

  const onMouseMove = (e: MouseEvent) => {
    const rx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ry = (e.clientY / window.innerHeight - 0.5) * 2;
    targetMouseX = rx;
    targetMouseY = ry;
  };
  window.addEventListener("mousemove", onMouseMove);

  const onScroll = () => {
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  // 3D camera & projection constants
  const cameraFov = 380;
  const cameraY = -220;
  const cameraZ = -440;
  const pitch = 0.55; // downward angle

  const draw = (time: number) => {
    ctx.clearRect(0, 0, width, height);
    const dark = darkMode();

    // Lerp mouse
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Background gradient aura for Z-0
    const cx = width / 2;
    const cy = height * 0.45;

    const bgGlow = ctx.createRadialGradient(
      cx + mouseX * 60 * dpr,
      cy + mouseY * 40 * dpr,
      10,
      cx,
      cy,
      Math.max(width, height) * 0.7
    );
    if (dark) {
      bgGlow.addColorStop(0, "rgba(0, 85, 255, 0.08)");
      bgGlow.addColorStop(0.4, "rgba(74, 0, 224, 0.04)");
      bgGlow.addColorStop(1, "rgba(3, 3, 5, 0)");
    } else {
      bgGlow.addColorStop(0, "rgba(0, 120, 255, 0.05)");
      bgGlow.addColorStop(1, "rgba(244, 248, 255, 0)");
    }
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, width, height);

    // Transform and project nodes
    const cosP = Math.cos(pitch + mouseY * 0.08);
    const sinP = Math.sin(pitch + mouseY * 0.08);
    const cosY = Math.cos(mouseX * 0.12);
    const sinY = Math.sin(mouseX * 0.12);

    const terrainScaleX = width * 0.72;
    const terrainScaleZ = height * 0.95;
    const scrollParallax = (scrollY * 0.1 * dpr) % 100;

    // Update coordinates
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // Wave function for terrain topology
      const d = Math.sqrt(node.gx * node.gx + node.gz * node.gz);
      const wave1 = Math.sin(node.gx * 4.2 + time * 0.8 + node.gz * 2.1) * 38;
      const wave2 = Math.cos(node.gz * 5.5 - time * 0.6) * 22;
      const wave3 = Math.sin(d * 6.0 - time * 1.2) * 26;

      // Shark silhouette resonance profile
      const sharkDorsal = Math.exp(-Math.pow((node.gz + 0.15) / 0.25, 2)) * Math.exp(-Math.pow(node.gx / 0.35, 2)) * 60;
      const rawY = (wave1 + wave2 + wave3 + sharkDorsal) * dpr;

      // World positions
      const wx = node.gx * terrainScaleX;
      const wy = rawY;
      const wz = node.gz * terrainScaleZ + 200 * dpr + scrollParallax;

      // Rotate around Y
      const rx = wx * cosY - wz * sinY;
      const rz = wx * sinY + wz * cosY;

      // Rotate around X (pitch)
      const py = (wy - cameraY) * cosP - (rz - cameraZ) * sinP;
      const pz = (wy - cameraY) * sinP + (rz - cameraZ) * cosP;

      if (pz <= 10) {
        node.x = -9999;
        node.y = -9999;
        node.z = pz;
        continue;
      }

      const proj = (cameraFov * dpr) / pz;
      node.x = cx + rx * proj;
      node.y = cy + py * proj;
      node.z = pz;
    }

    // Render wireframe mesh lines (rows & columns)
    const baseLineWidth = Math.max(1, 0.75 * dpr);
    ctx.lineWidth = baseLineWidth;

    // Draw horizontal rows
    for (let r = 0; r < GRID_ROWS; r++) {
      ctx.beginPath();
      let started = false;
      const rowAlpha = Math.max(0.04, Math.min(0.24, 0.28 - (r / GRID_ROWS) * 0.18));
      ctx.strokeStyle = dark
        ? `rgba(0, 229, 255, ${rowAlpha.toFixed(3)})`
        : `rgba(0, 85, 255, ${(rowAlpha * 0.9).toFixed(3)})`;

      for (let c = 0; c < GRID_COLS; c++) {
        const idx = r * GRID_COLS + c;
        const node = nodes[idx];
        if (node.x === -9999) continue;
        if (!started) {
          ctx.moveTo(node.x, node.y);
          started = true;
        } else {
          ctx.lineTo(node.x, node.y);
        }
      }
      ctx.stroke();
    }

    // Draw vertical columns
    for (let c = 0; c < GRID_COLS; c++) {
      ctx.beginPath();
      let started = false;
      const colAlpha = 0.12;
      ctx.strokeStyle = dark
        ? `rgba(255, 255, 255, ${colAlpha.toFixed(3)})`
        : `rgba(11, 98, 196, ${(colAlpha * 0.8).toFixed(3)})`;

      for (let r = 0; r < GRID_ROWS; r++) {
        const idx = r * GRID_COLS + c;
        const node = nodes[idx];
        if (node.x === -9999) continue;
        if (!started) {
          ctx.moveTo(node.x, node.y);
          started = true;
        } else {
          ctx.lineTo(node.x, node.y);
        }
      }
      ctx.stroke();
    }

    // Draw interconnected data nodes & anomaly points
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.x <= 0 || node.x >= width || node.y <= 0 || node.y >= height) continue;

      if (node.isAnomaly) {
        // Red anomaly node (#FF1744) as per DESIGN.md
        const pulse = 1 + Math.sin(time * 3 + node.pulsePhase) * 0.45;
        const rad = 2.4 * dpr * pulse;

        // Outer glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, rad * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 23, 68, 0.25)";
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = "#FF1744";
        ctx.fill();
      } else if (i % 5 === 0) {
        // Cyan / Blue data vertex (#00E5FF / #0055FF)
        const rad = 1.4 * dpr;
        ctx.beginPath();
        ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = dark ? "rgba(0, 229, 255, 0.7)" : "rgba(0, 85, 255, 0.6)";
        ctx.fill();
      }
    }
  };

  if (reduced) {
    draw(0);
    const onTheme = () => draw(0);
    document.documentElement.addEventListener("ohms:theme", onTheme);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("ohms:theme", onTheme);
    };
  }

  let start: number | null = null;
  let last = 0;
  const frame = (now: number) => {
    if (!running) return;
    if (start === null) start = now;
    // ~30-40fps throttle for buttery smoothness with low CPU usage
    if (now - last > 28) {
      last = now;
      draw((now - start) / 1000);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("scroll", onScroll);
  };
}
