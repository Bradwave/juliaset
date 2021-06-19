let mainSketch = new p5((sketch) => {

  let origins = [], bounds = [], containerSize;
  let pixelsPerUnit, unitPerPixel;

  let resizeTimeout;

  sketch.setup = function () {
    sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);

    sketch.noLoop();
    sketch.colorMode(sketch.HSB, 100);

    setOrigin();

    sketch.background(0);
    sketch.stroke("#B01A00");
    sketch.strokeWeight(4);
    drawMandelbrotSet();
    updateContainers();
  }

  sketch.windowResized = function () {
    sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);

    setOrigin();
    sketch.clear();
    sketch.background(0);
    sketch.stroke("#B01A00");
    sketch.strokeWeight(4);
    updateContainers();

    // Wait 100ms before drawing.
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      drawMandelbrotSet();
      updateContainers();
    }, 100);
  }

  function setOrigin() {
    const width = sketch.width;
    const height = sketch.height;

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

    containerSize = pixelsPerUnit * 4;
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

  sketch.mousePressed = function () {
    const c = { x: sketch.mouseX, y: sketch.mouseY };
    if ((c.x - bounds[0].east) * (c.x - bounds[0].west) < 0
      && (c.y - bounds[0].north) * (c.y - bounds[0].south) < 0) {
      sketch.point(c.x, c.y);

      drawJuliaSet(toCartesian(c, origins[0]));
    }
  }

  function drawMandelbrotSet() {
    sketch.loadPixels();
    for (let x = bounds[0].west; x < bounds[0].east; x++) {
      for (let y = bounds[0].north; y < bounds[0].south; y++) {
        const [m, isMandelbrotSet] = fc({ x: 0, y: 0 }, toCartesian({ x: x, y: y }, origins[0]));
        sketch.set(x, y, sketch.color(
          0, // Hue
          0, // Saturation
          isMandelbrotSet ? 0 : m / MAX_ITERATION * 100) //Value
        );
      }
    }
    sketch.updatePixels();
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
    sketch.loadPixels();
    for (let x = bounds[1].west; x < bounds[1].east; x++) {
      for (let y = bounds[1].north; y < bounds[1].south; y++) {
        const [m, isJulia] = fc(toCartesian({ x: x, y: y }, origins[1]), c);
        sketch.set(x, y, sketch.color(
          0, // Hue
          0, // Saturation
          isJulia ? 0 : m / MAX_ITERATION * 100) //Value
        );
      }
    }
    sketch.updatePixels();
  }

  function updateContainers() {
    let containers = [sketch.select('#mandelbrot'), sketch.select('#juliaset')];

    containers.forEach((c, i) => {
      c.size(containerSize, containerSize);
      c.position(bounds[i].west, bounds[i].north);
    });
  }

});