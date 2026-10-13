// Approved case hero: original artwork at rest, one smooth interactive layer on hover.
async function initWave() {
  const hero = document.querySelector(".cs-hero");
  const image = hero.querySelector("img.cs-hero-art");
  // Keep the original image if the optional interactive asset cannot load.
  let source;
  try {
    const response = await fetch(image.src);
    if (!response.ok) return;
    source = await response.text();
  } catch {
    return;
  }
  const svg = new DOMParser().parseFromString(
    source,
    "image/svg+xml",
  ).documentElement;
  svg.setAttribute("class", "cs-hero-art");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svg.setAttribute("aria-hidden", "true");
  svg.id = "interactive-wave";
  svg.style.maxWidth = "100%";
  svg.style.display = "block";
  svg.style.visibility = "hidden";
  hero.insertBefore(svg, image.nextSibling);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const samples = 80;
  const cubic = (a, b, c, d, t) =>
    (1 - t) ** 3 * a +
    3 * (1 - t) ** 2 * t * b +
    3 * (1 - t) * t * t * c +
    t ** 3 * d;
  const paths = Array.from(svg.querySelectorAll("path"));
  // intent.svg contains an absolute M, cubic C and reflected cubic S per line.
  // Sample that source directly so the still and interactive curves cannot drift.
  const lines = paths.map((path) => {
    const p = path
      .getAttribute("d")
      .match(/-?\d+(?:\.\d+)?/g)
      .map(Number);
    const segments = [
      p.slice(0, 8),
      [p[6], p[7], 2 * p[6] - p[4], 2 * p[7] - p[5], p[8], p[9], p[10], p[11]],
    ];
    const points = segments.flatMap((s, segment) =>
      Array.from({ length: samples + (segment ? 0 : 1) }, (_, i) => {
        const t = (i + (segment ? 1 : 0)) / samples;
        return {
          x: cubic(s[0], s[2], s[4], s[6], t),
          y: cubic(s[1], s[3], s[5], s[7], t),
          dx: 0,
          dy: 0,
          vx: 0,
          vy: 0,
        };
      }),
    );
    return { points, path, original: path.getAttribute("d") };
  });
  let scale,
    offsetX,
    offsetY,
    animation = 0,
    lastTime = 0;
  const pointer = { x: 0, y: 0, active: false };
  const n = (value) => value.toFixed(3);
  function draw() {
    for (const line of lines) {
      const points = line.points,
        last = points.length - 1;
      let d = `M${n(points[0].x + points[0].dx)} ${n(points[0].y + points[0].dy)}`;
      for (let i = 0; i < last; i++) {
        const previous = points[Math.max(0, i - 1)],
          start = points[i],
          end = points[i + 1],
          following = points[Math.min(last, i + 2)];
        const x1 = start.x + start.dx,
          y1 = start.y + start.dy,
          x2 = end.x + end.dx,
          y2 = end.y + end.dy;
        d += `C${n(x1 + (x2 - previous.x - previous.dx) / 6)} ${n(y1 + (y2 - previous.y - previous.dy) / 6)} ${n(x2 - (following.x + following.dx - x1) / 6)} ${n(y2 - (following.y + following.dy - y1) / 6)} ${n(x2)} ${n(y2)}`;
      }
      line.path.setAttribute("d", d);
    }
    // Only one layer is visible. Rest uses the unchanged production image.
    image.style.visibility = "hidden";
    svg.style.visibility = "visible";
  }
  function frame(time) {
    const step = Math.min((time - lastTime) / 16.667, 2);
    lastTime = time;
    const radius = 160 / scale,
      amplitude = 15 / scale,
      strength = (amplitude * Math.sqrt(2 * Math.E)) / radius;
    let energy = 0;
    for (const line of lines)
      for (const p of line.points) {
        const x = p.x - pointer.x,
          y = p.y - pointer.y;
        const weight = pointer.active
          ? Math.exp(-(x * x + y * y) / (radius * radius))
          : 0;
        const tx = x * strength * weight,
          ty = y * strength * weight;
        p.vx = (p.vx + (tx - p.dx) * 0.085 * step) * Math.pow(0.79, step);
        p.vy = (p.vy + (ty - p.dy) * 0.085 * step) * Math.pow(0.79, step);
        p.dx += p.vx * step;
        p.dy += p.vy * step;
        energy +=
          Math.abs(p.vx) +
          Math.abs(p.vy) +
          Math.abs(tx - p.dx) +
          Math.abs(ty - p.dy);
      }
    draw();
    if (energy > 0.12) animation = requestAnimationFrame(frame);
    else {
      animation = 0;
      if (!pointer.active) reset();
    }
  }
  function wake() {
    if (!animation && !reduced.matches && finePointer.matches) {
      lastTime = performance.now();
      animation = requestAnimationFrame(frame);
    }
  }
  function reset() {
    cancelAnimationFrame(animation);
    animation = 0;
    pointer.active = false;
    lines.forEach((line) => {
      line.points.forEach((p) => {
        p.dx = p.dy = p.vx = p.vy = 0;
      });
      line.path.setAttribute("d", line.original);
    });
    svg.style.visibility = "hidden";
    image.style.visibility = "";
  }
  function resize() {
    const box = image.getBoundingClientRect();
    scale = Math.max(box.width / 1200, box.height / 600);
    offsetX = (box.width - 1200 * scale) / 2;
    offsetY = (box.height - 600 * scale) / 2;
    reset();
  }
  hero.addEventListener("pointermove", (event) => {
    if (
      event.pointerType === "touch" ||
      reduced.matches ||
      !finePointer.matches
    )
      return;
    const box = image.getBoundingClientRect();
    pointer.x = (event.clientX - box.left - offsetX) / scale;
    pointer.y = (event.clientY - box.top - offsetY) / scale;
    pointer.active = true;
    wake();
  });
  hero.addEventListener("pointerleave", () => {
    pointer.active = false;
    wake();
  });
  window.addEventListener("blur", () => {
    pointer.active = false;
    wake();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  reduced.addEventListener("change", reset);
  finePointer.addEventListener("change", reset);
  new ResizeObserver(resize).observe(image);
  hero.dataset.waveReady = "true";
}

initWave();
