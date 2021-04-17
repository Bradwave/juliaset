/**
 * Geometry
 */
let origins = [], bounds = [];
let marginFactor = 0.05;
let pixelsPerUnit, unitPerPixel;

let resizeTimeout;

let c;

function setup() {
  createCanvas(windowWidth, windowHeight);

  noLoop();
  colorMode(HSB, 100);

  setOrigin();

  background(0);
  drawMandelbrotSet();
  drawGeometry();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  setOrigin();
  clear();
  background(0)
  drawGeometry();

  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    clear();
    background(0);
    drawMandelbrotSet();
    drawGeometry();
  }, 100);
}

function resetView() {
  setOrigin();

  clear();
  background(0);
  drawMandelbrotSet();
  drawGeometry();
}

function setOrigin() {
  const horizontalMode = height < width;
  const offsetFactor = 0.25 * (1 + marginFactor);

  origins = horizontalMode ? [
    { x: width * offsetFactor, y: height * 0.5 },
    { x: width * (1 - offsetFactor), y: height * 0.5 }
  ] : [
    { x: width * 0.5, y: height * offsetFactor },
    { x: width * 0.5, y: height * (1 - offsetFactor) }
  ];

  pixelsPerUnit = Math.round(0.5 * (0.5 - marginFactor) * Math.min(
    horizontalMode ? height : width,
    horizontalMode ? origins[1].x - origins[0].x : origins[1].y - origins[0].y,
  ));

  unitPerPixel = 1 / pixelsPerUnit;

  origins.forEach((currentOrigin, currentIndex) => {
    bounds[currentIndex] = {
      north: currentOrigin.y - pixelsPerUnit * 2,
      east: currentOrigin.x + pixelsPerUnit * 2,
      south: currentOrigin.y + pixelsPerUnit * 2,
      west: currentOrigin.x - pixelsPerUnit * 2
    };
  });
}

const toCartesian = function (p, originIdex) {
  return {
    x: (p.x - origins[originIdex].x) * unitPerPixel,
    y: (origins[originIdex].y - p.y) * unitPerPixel
  };
}

const toScreenCoordinates = function (p, originIdex) {
  return {
    x: p.x * pixelsPerUnit + origins[originIdex].x,
    y: origins[originIdex].y - p.y * pixelsPerUnit
  };
}

function mousePressed() {
  const x = mouseX;
  const y = mouseY;
  if ((x - bounds[0].east) * (x - bounds[0].west) < 0
    && (y - bounds[0].north) * (y - bounds[0].south) < 0) {
    point(x, y);

    // drawJuliaSet(mandelbrot(toCartesian));
  }
}

function drawMandelbrotSet() {
  loadPixels();
  for (let x = bounds[0].west; x < bounds[0].east; x++) {
    for (let y = bounds[0].north; y < bounds[0].south; y++) {
      const [m, isMandelbrotSet] = mandelbrot(toCartesian({ x: x, y: y }, 0));
      set(x, y, color(
        0,
        0,
        isMandelbrotSet ? 0 : 5 + m / MAX_ITERATION * 95));
    }
  }
  updatePixels();
}

const MAX_ITERATION = 80;

const mandelbrot = (c) => {
  let z = { x: 0, y: 0 }, n = 0, p, d;
  do {
    p = {
      x: z.x * z.x - z.y * z.y,
      y: 2 * z.x * z.y
    };
    z = {
      x: p.x + c.x,
      y: p.y + c.y
    };
    d = z.x * z.x + z.y * z.y;
  } while (d <= 4 && ++n < MAX_ITERATION);
  return [n, d <= 4];
}

function drawJuliaSet(stuff) {

}

function drawGeometry() {
  stroke(255);
  strokeWeight(5);
  origins.forEach(o => point(o.x, o.y));
  noFill();
  strokeWeight(1);
  bounds.forEach(b => {
    rect(b.west, b.north, pixelsPerUnit * 4)
  });
  strokeWeight(3);
}