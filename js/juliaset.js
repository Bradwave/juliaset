let mathUtils = new function () {
  const MAX_ITERATION = 80;

  this.getMaxIteration = () => {
    return MAX_ITERATION;
  }

  this.fc = (z, c) => {
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
}

let mainSketch = new p5((sketch) => {

  let origins = [], bounds = [], containerSize;
  let pixelsPerUnit, unitPerPixel;

  let resizeTimeout;
  const waitTime = 100;

  let lastPressed;

  sketch.setup = function () {
    sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);

    sketch.noLoop();
    sketch.colorMode(sketch.HSB, 100);

    updateGeometry();

    sketch.background(0);
    setPointOptions();
    drawMandelbrotSet();

    updateContainers();
  }

  sketch.windowResized = function () {
    sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);

    updateGeometry();

    sketch.clear();
    setPointOptions();

    updateContainers();

    document.getElementsByClassName("loader").forEach(e => {
      e.style.visibility = "visible";
    });

    // Wait 100ms before drawing.
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      document.getElementsByClassName("loader").forEach(e => {
        e.style.visibility = "hidden";
      });

      drawMandelbrotSet();
      if (typeof lastPressed !== 'undefined') {
        drawJuliaSet(lastPressed);
        const c = toScreenCoordinates(lastPressed, origins[0]);
        sketch.point(c.x, c.y);
      }
    }, waitTime);
  }

  function setPointOptions() {
    sketch.stroke("#B01A00");
    sketch.strokeWeight(5);
  }

  function updateGeometry() {
    const width = sketch.width;
    const height = 0.9 * sketch.height;

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

  function updateContainers() {
    let containers = [sketch.select('#mandelbrot'), sketch.select('#julia')];

    containers.forEach((c, i) => {
      c.position(bounds[i].west, bounds[i].north);
      c.size(containerSize, containerSize);
    });

    let optionsPanel = sketch.select('#options');
    optionsPanel.position(1 + bounds[0].west, bounds[0].south + 0.12 * (sketch.height - bounds[0].south));
    optionsPanel.size(bounds[1].east - bounds[0].west, 0.8 * (sketch.height - bounds[0].south));
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

  function isInside(i, c) {
    return ((c.x - bounds[i].east) * (c.x - bounds[i].west) < 0
      && (c.y - bounds[i].north) * (c.y - bounds[i].south) < 0);
  }

  sketch.mousePressed = function () {
    const c = { x: sketch.mouseX, y: sketch.mouseY };
    if (isInside(0, c)) {
      sketch.point(c.x, c.y);
      lastPressed = toCartesian(c, origins[0]);
      drawJuliaSet(lastPressed);
    }
  }

  sketch.mouseMoved = function () {
    try {
      let c = { x: sketch.mouseX, y: sketch.mouseY };
      if (isInside(0, c)) {
        c = toCartesian(c, origins[0]);
        document.getElementById("mandelbrot-coordinates").innerHTML = "$" + c.x.toFixed(2) + "+" + c.y.toFixed(2) + "i $";
        document.getElementById("julia-coordinates").innerHTML = "$\\,$";

      } else if (isInside(1, c)) {
        c = toCartesian(c, origins[1]);
        document.getElementById("mandelbrot-coordinates").innerHTML = "$\\,$";
        document.getElementById("julia-coordinates").innerHTML = "$" + c.x.toFixed(2) + "+" + c.y.toFixed(2) + "i $";
      } else {
        document.getElementById("mandelbrot-coordinates").innerHTML = "$\\,$";
        document.getElementById("julia-coordinates").innerHTML = "$\\,$";
      }
      MathJax.typeset();
    } catch (error) {
      console.log(error);
    }
  }

  function drawMandelbrotSet() {
    sketch.loadPixels();
    for (let x = bounds[0].west; x < bounds[0].east; x++) {
      for (let y = bounds[0].north; y < bounds[0].south; y++) {
        const [m, isMandelbrotSet] = mathUtils.fc({ x: 0, y: 0 }, toCartesian({ x: x, y: y }, origins[0]));
        sketch.set(x, y, sketch.color(
          0, // Hue
          0, // Saturation
          isMandelbrotSet ? 0 : m / mathUtils.getMaxIteration() * 100) //Value
        );
      }
    }
    sketch.updatePixels();
  }

  function drawJuliaSet(c) {
    sketch.loadPixels();
    for (let x = bounds[1].west; x < bounds[1].east; x++) {
      for (let y = bounds[1].north; y < bounds[1].south; y++) {
        const [m, isJulia] = mathUtils.fc(toCartesian({ x: x, y: y }, origins[1]), c);
        sketch.set(x, y, sketch.color(
          0, // Hue
          0, // Saturation
          isJulia ? 0 : m / mathUtils.getMaxIteration() * 100) //Value
        );
      }
    }
    sketch.updatePixels();
  }

});