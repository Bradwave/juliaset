/**
 * Geometry
 * 
 * (this is kinda dumb atm, but fast... i think)
 */
let origins = [], bounds = [];
let pixelsPerUnit, unitPerPixel;

let resizeTimeout;

function setup() {
  createCanvas(windowWidth, windowHeight);

  noLoop();
  colorMode(HSB, 100);

  setOrigin();

  background(0);
  stroke("#B01A00");
  strokeWeight(4);
  drawMandelbrotSet();
  // drawGeometry();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  setOrigin();
  clear();
  background(0);
  stroke("#B01A00");
  strokeWeight(4);
  // drawGeometry();

  // Wait 100ms before drawing.
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    drawMandelbrotSet();
    // drawGeometry();
  }, 100);
}

function setOrigin() {
  const marginFactor = 0.05;
  const horizontalMode = height < width;
  const offsetFactor = 0.25 * (1 + marginFactor);

  origins = horizontalMode ? [
    { x: width * offsetFactor, y: height * 0.5 },
    { x: width * (1 - offsetFactor), y: height * 0.5 }
  ] : [
    { x: width * 0.5, y: height * (1 - offsetFactor) },
    { x: width * 0.5, y: height * offsetFactor }
  ];

  pixelsPerUnit = Math.round(0.5 * (0.5 - marginFactor) * Math.min(
    horizontalMode ? height : width,
    horizontalMode ? origins[1].x - origins[0].x : origins[0].y - origins[1].y,
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

const toCartesian = function (p, screenOrigin) {
  return {
    x: (p.x - screenOrigin.x) * unitPerPixel,
    y: (screenOrigin.y - p.y) * unitPerPixel
  };
}

const toScreenCoordinates = function (p, screenOrigin) {
  return {
    x: p.x * pixelsPerUnit + screenOrigin.x,
    y: screenOrigin.y - p.y * pixelsPerUnit
  };
}

function mousePressed() {
  const c = { x: mouseX, y: mouseY };
  if ((c.x - bounds[0].east) * (c.x - bounds[0].west) < 0
    && (c.y - bounds[0].north) * (c.y - bounds[0].south) < 0) {
    point(c.x, c.y);

    drawJuliaSet(toCartesian(c, origins[0]));
    // drawGeometry();
  }
}

function drawMandelbrotSet() {
  loadPixels();
  for (let x = bounds[0].west; x < bounds[0].east; x++) {
    for (let y = bounds[0].north; y < bounds[0].south; y++) {
      const [m, isMandelbrotSet] = fc({x: 0, y: 0}, toCartesian({ x: x, y: y }, origins[0]));
      set(x, y, color(
        0, // Hue
        0, // Saturation
        isMandelbrotSet ? 0 : m / MAX_ITERATION * 100) //Value
      );
    }
  }
  updatePixels();
}

const MAX_ITERATION = 80;

const fc = (z, c) => {
  let n = 0, d;
  do {
    z = {
      x: z.x * z.x - z.y * z.y + c.x,
      y: 2 * z.x * z.y + c.y
    };
    d = z.x * z.x + z.y * z.y;
  } while (d <= 4 && ++n < MAX_ITERATION);
  return [n, d <= 4]; 
}

function drawJuliaSet(c) {
  loadPixels();
  for (let x = bounds[1].west; x < bounds[1].east; x++) {
    for (let y = bounds[1].north; y < bounds[1].south; y++) {
      const [m, isJulia] = fc(toCartesian({ x: x, y: y }, origins[1]), c);
      set(x, y, color(
        0, // Hue
        0, // Saturation
        isJulia ? 0 : m / MAX_ITERATION * 100) //Value
      );
    }
  }
  updatePixels();
}

function drawGeometry() {
  stroke(255);
  strokeWeight(5);
  origins.forEach(o => point(o.x, o.y));

  noFill();
  strokeWeight(1);
  stroke(255);
  bounds.forEach(b => {
    line(b.west, b.north, b.west + 50, b.north);
  });

  stroke("#B01A00");
  strokeWeight(4);
}
