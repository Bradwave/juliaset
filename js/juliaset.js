/**
 * Main p5 sketch
 */
let mainSketch = new p5((sketch) => {

  /*_______________________________________
  |   General variables
  */

  /** Array of origins for the mandelbrot and julia sets plots.
   * @type {Array<{x: number, y: number}>} */
  let origins = [];

  /** Array of bounds (north, east, south, west) for the plots.
   * @type {Array<{north: number, east: number, south: number, west: number}>} */
  let bounds = [];

  /** Size of the plots.
   * @type {number} */
  let plotSize;

  /** Number of pixels per Cartesian unit.
   * @type {number} */
  let pixelsPerUnit;

  /** Number of Cartesian units per pixel.
   * @type {number} */
  let unitsPerPixel;

  // Rendering

  /** Mandelbrot image. */
  let mandelbrotImg;

  /** Julia image. */
  let juliaImgs = [];

  /*_______________________________________
  |   Resizing variables
  */

  let resizeTimeout;

  /** Number of milliseconds to wait after resizing.
   * @type {number} */
  const waitTime = 100;

  /*_______________________________________
  |   HTML elements variables
  */

  /** Loaders. */
  let plotLoaders;

  /** Plot containers.
   * @type {Array} */
  let plotContainers;

  /** Mandelbrot and Julia Cartesian coordinates.
   * @type {Array} */
  let coordinates;

  /** Selected coordinates.
   * @type {Array} */
  let selectedCoordinates = [];

  /** Point highlight. */
  let pointHighlight;
  const pointHighlightRadius = 7;

  /** Selection rectangle. */
  let selectionRectangle;

  /** Mandelbrot info container */
  let mandelbrotInfo;

  // Mandelbrot Cartesian System
  let mXAxis, mYAxis, mXArrow, mYArrow;

  /** Options panel. */
  let optionsPanel;

  /*_______________________________________
  |   Selections variables
  */

  /** Last selected point in Cartesian coordinates.
    * @type {Array.<Number>} */
  let selectedPoints = [];

  /** Selection starting point. */
  let startPoint;

  /** North-West corner of selection. */
  let selectionCartesianCorner;

  /** Origin proportions of zoomed plot. */
  let originProportions = [];

  /** Size of selection square. */
  let selectionCartesianSize;

  /** True if user is selecting an area, false otherwise */
  let isSelectingArea = false;

  /** True if user has selected an area, false otherwise. */
  let isAreaSelected = false;

  /*_______________________________________
    |   Path mode
    */

  /** True if math mode is active, false otherwise */
  let isPathModeActive = false;

  /*_______________________________________
      |   Max iteration input
      */

  let maxIterationInputBox;

  let iterationWarning;

  /*_______________________________________
  |   On open and resize
  */

  /**
   * Overwrites p5 function.
   * Gets called on load.
   */
  sketch.setup = function () {

    // Creates canvas
    sketch.createCanvas(sketch.windowWidth, sketch.windowHeight);

    // Disables the render loop.
    sketch.noLoop();

    // Sets the color mode to HSB (Hue, Saturation, Brightness).
    sketch.colorMode(sketch.HSB, 100);

    // Sets the plots positions.
    updateGeometry();

    // Sets background to black, prepares to draw red points.
    sketch.background(0);
    setPointOptions();

    // Draws the Mandelbrot set.
    drawMandelbrotSet();

    // Gets the HTML elements and updates them.
    configHtmlElements();
    updateHtmlElements();
  }

  /**
   * Overwrites p5 function.
   * Gets called when the window is resized.
   */
  sketch.windowResized = function () {

    /*_____________________________
    |   On resize
    */

    // Creates the canvas
    sketch.resizeCanvas(sketch.windowWidth, sketch.windowHeight);

    // Updates the plots positions
    updateGeometry();

    // Clears the canvas
    sketch.clear();

    // Prepares teh options for drawing red points
    setPointOptions();

    // Updates the HTML elements (plot containers and options panel)
    updateHtmlElements();

    // Displays the loaders while waiting
    plotLoaders.forEach(e => {
      e.style.visibility = "visible";
      e.style.animationPlayState = "running";
    });

    // Hides the point highlight
    pointHighlight.style('visibility', 'hidden');

    // Hides the selection area
    selectionRectangle.style('visibility', 'hidden');

    /*_____________________________
    |   After wait time elapsed
    */

    // Waits before drawing
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {

      // Hides loaders after waiting
      plotLoaders.forEach(e => {
        e.style.visibility = "hidden";
        e.style.animationPlayState = "paused";
      });

      // Shows the point highlight
      pointHighlight.style('visibility', 'visible');

      // Executes if an area is selected
      if (isAreaSelected) {

        // Draws the Mandelbrot plot and zoomed Julia plot on top
        drawMandelbrotSet();
        drawZoomedPlot();

        // Makes the selection area visible
        selectionRectangle.style('visibility', 'visible');

        // Sets the selection position and size
        const selectionPosition = toScreenCoordinates(selectionCartesianCorner, origins[1])
        selectionRectangle.position(
          selectionPosition.x - bounds[1].west,
          selectionPosition.y - bounds[1].north
        );
        selectionRectangle.size(
          selectionCartesianSize * pixelsPerUnit,
          selectionCartesianSize * pixelsPerUnit
        );
      } else {
        drawMandelbrotSet();
      }

      // If a point was selected, draws the point and the Julia set
      if (typeof selectedPoints[0] !== 'undefined') {
        if (!isAreaSelected) {
          drawLastPoint();
        }
        drawJuliaSet(selectedPoints[0], 1, 0, { x: plotSize / 2, y: plotSize / 2 });
      }
    }, waitTime);
  }

  /**
   * Updates the position and size of plots.
   */
  function updateGeometry() {

    // Stores canvas width and height
    const width = sketch.width;
    const height = 0.9 * sketch.height;

    /** True if the canvas is horizontal, false otherwise. */
    const isHorizontal = height < width;

    /**
     * If the canvas is horizontal, the plots will be displayed side by side,
     * if not, the plots will be displayed one above the other.
     * A margin is established and then plots are centered accordingly.
     * A space is left below the plots for the options panel.
     */

    const marginFactor = 0.05;
    const offsetFactor = 0.25 * (1 + marginFactor);

    origins = isHorizontal ? [
      { x: Math.round(width * offsetFactor), y: Math.round(height * 0.5) },
      { x: Math.round(width * (1 - offsetFactor)), y: Math.round(height * 0.5) }
    ] : [
      { x: Math.round(width * 0.5), y: Math.round(height * (1 - offsetFactor)) },
      { x: Math.round(width * 0.5), y: Math.round(height * offsetFactor) }
    ];

    pixelsPerUnit = Math.round(0.5 * (0.5 - marginFactor) * Math.min(
      isHorizontal ? height : width,
      isHorizontal ? origins[1].x - origins[0].x : origins[0].y - origins[1].y,
    ));

    unitsPerPixel = 1 / pixelsPerUnit;

    origins.forEach((currentOrigin, currentIndex) => {
      bounds[currentIndex] = {
        north: currentOrigin.y - pixelsPerUnit * 2,
        east: currentOrigin.x + pixelsPerUnit * 2,
        south: currentOrigin.y + pixelsPerUnit * 2,
        west: currentOrigin.x - pixelsPerUnit * 2
      };
    });

    // Sets the plot size to 4 Cartesian unit.
    plotSize = pixelsPerUnit * 4;

    mandelbrotImg = sketch.createImage(plotSize, plotSize);
    juliaImgs[0] = sketch.createImage(plotSize, plotSize);
    juliaImgs[1] = sketch.createImage(plotSize, plotSize);
  }

  /**
   * Updates the HTML elements with correct positions and sizes.
   */
  function updateHtmlElements() {

    // Plot containers
    plotContainers.forEach((c, i) => {
      c.position(bounds[i].west - 1, bounds[i].north - 1);
      c.size(plotSize - 1, plotSize - 1);
    });

    // Options panel
    optionsPanel.position(
      1 + bounds[0].west,
      bounds[0].south + 0.12 * (sketch.height - bounds[0].south)
    );
    optionsPanel.size(
      bounds[1].east - bounds[0].west,
      0.8 * (sketch.height - bounds[0].south)
    );

  }

  /*_______________________________________
  | HTML elements interactions
  */

  /**
   * Gets the necessary HTML elements and sets listeners.
   * For internal use only.
   */
  function configHtmlElements() {

    /*_____________________________
    |   HTML elements
    */

    // Loaders
    plotLoaders = [
      document.getElementById("mandelbrot-loader"),
      document.getElementById("julia-loader")
    ];

    // Plot containers
    plotContainers = [
      sketch.select('#mandelbrot'),
      sketch.select('#julia')
    ];

    // Mandelbrot and Julia Cartesian coordinates
    coordinates = [
      document.getElementById("mandelbrot-coordinates"),
      document.getElementById("julia-coordinates")
    ]

    // Selected coordinates
    selectedCoordinates = document.getElementsByClassName("selected coordinates");
    selectedCoordinates.forEach((e, i) => {
      e.style.opacity = 1 - i / selectedCoordinates.length;
    });

    // Point highlight
    pointHighlight = sketch.select('#point-highlight');
    pointHighlight.size(pointHighlightRadius * 2, pointHighlightRadius * 2);

    // Selection rectangle
    selectionRectangle = sketch.select("#selection");

    // Mandelbrot info container
    mandelbrotInfo = document.getElementById("mandelbrot-info");

    // Mandelbrot Cartesian system
    mXAxis = document.getElementById("x-axis");
    mYAxis = document.getElementById("y-axis");
    mXArrow = document.getElementById("x-arrow");
    mYArrow = document.getElementById("y-arrow");

    // Options panel
    optionsPanel = sketch.select('#options');

    // Max iteration input box
    maxIterationInputBox = document.getElementById("max-iteration-box")

    // Iteration warning
    iterationWarning = sketch.select("#iteration-warning");
    iterationWarning.style('visibility', 'hidden');

    /*_____________________________
    |   Listeners
    */

    // Toggle path mode
    document.getElementById("toggle-path").onclick = () => {
      isPathModeActive = !isPathModeActive;
      document.getElementById("toggle-path").style.backgroundColor = isPathModeActive ? "#B01A00" : "#ffffff2f";

      // Deselect an eventually selected area
      if (isAreaSelected) {
        deselect();
      }

      // When path mode is deactivated, the Mandelbrot and Julia sets plots are reset
      if (!isPathModeActive) {
        sketch.image(mandelbrotImg, bounds[0].west, bounds[1].north);
        sketch.image(juliaImgs[0], bounds[1].west, bounds[1].north);

        drawLastPoint();
      }
    }

    // Executes when the input box changes
    maxIterationInputBox.onchange = () => {

      // Sets the new max iteration value
      let newMaxIteration = parseInt(
        maxIterationInputBox.value > 0 ? maxIterationInputBox.value : 0
      );
      maxIterationInputBox.value = newMaxIteration;
      mathUtils.setMaxIteration(newMaxIteration);
      console.log(mathUtils.getMaxIteration());

      // Draws the Mandelbrot set with the updated max iteration value
      drawMandelbrotSet();

      // If a point is selected, draws the Julia set
      if (typeof selectedPoints[0] !== 'undefined') {
        drawLastPoint();
        drawJuliaSet(selectedPoints[0], 1, 0, { x: plotSize / 2, y: plotSize / 2 });

        // If an area is selected, draws the zoomed Julia set
        if (isAreaSelected) {
          drawZoomedPlot();
        }
      }
    }

    // Executes when a key is released while in the input box
    maxIterationInputBox.onkeyup = () => {

      // If the max iteration value is too high, a warning is displayed
      if (maxIterationInputBox.value > 150) {
        iterationWarning.style('visibility', 'visible');
      } else {
        iterationWarning.style('visibility', 'hidden');
      }
    }

    // Plot containers shared listeners for coordinates
    plotContainers.forEach((container, i) => {

      // Displays the coordinates of the cursor when hovering over the corresponding plot container
      container.mouseMoved(() => {

        // Gets the mouse position and converts it to Cartesian coordinates
        const c = { x: sketch.mouseX, y: sketch.mouseY };
        const p = (i == 0 && isAreaSelected) ?
          toCartesian(c, {
            x: bounds[0].west + originProportions.x * plotSize,
            y: bounds[0].north + originProportions.y * plotSize
          }, selectionCartesianSize / plotSize) :
          toCartesian(c, origins[i]);

        // Edits the displayed coordinates of the cursor
        coordinates[i].innerHTML = coordinatesToString(p, 2);
      });

      // Hides the coordinates of the cursor when the mouse pointer leaves the plot container
      container.mouseOut(() => {
        coordinates[i].innerHTML = "";
      });
    });

    // Executes when the mouse is clicked in the Mandelbrot container
    plotContainers[0].mouseClicked(() => {

      // Executes only if an area is not selected
      if (!isAreaSelected) {

        // Gets the mouse position
        const c = { x: sketch.mouseX, y: sketch.mouseY };

        // Executes if path mode is active
        if (isPathModeActive) {

          // Draws the path on the Mandelbrot set
          drawPath({ x: 0, y: 0 }, toCartesian(c, origins[0]), 0);
        }

        // Draws the corresponding point
        setPointOptions();
        sketch.point(c.x, c.y);

        // Moves the point highlight to correct position
        pointHighlight.position(
          c.x - bounds[0].west - pointHighlightRadius - 0.25,
          c.y - bounds[0].north - pointHighlightRadius
        );

        // Plays the point highlight animation
        pointHighlight.style('webkitAnimation', 'none');
        setTimeout(function () {
          pointHighlight.style('webkitAnimation', '');
        }, 10);

        // Adds the selected points at the beginning of the selected points array
        selectedPoints.unshift(toCartesian(c, origins[0]));

        // Keeps the selected points array the correct length
        selectedPoints = selectedPoints.slice(0, selectedCoordinates.length);

        // Updates the displayed coordinates of the selected points
        selectedPoints.forEach((p, i) => {
          selectedCoordinates[i].innerHTML = coordinatesToString(p, 2);
        })

        // Draws the Julia set
        drawJuliaSet(selectedPoints[0], 1, 0, { x: plotSize / 2, y: plotSize / 2 });
      }
    });

    // Executes when the mouse is pressed in the Julia container
    plotContainers[1].mousePressed(() => {

      // Saves the starting point of the selection
      startPoint = { x: sketch.mouseX, y: sketch.mouseY };

      // Executes if math mode is active, no selection is ongoing and a point is selected
      if (isPathModeActive && !isSelectingArea && typeof selectedPoints[0] !== 'undefined') {

        // Draws the path of the point on the Julia set
        drawPath(toCartesian(startPoint, origins[1]), selectedPoints[0], 1);

        // Draws the selected point
        setPointOptions();
        sketch.point(startPoint.x, startPoint.y);
      }

      // Executes if path mode is not active
      if (!isPathModeActive) {

        // Sets selected to false, selecting to true
        isSelectingArea = true;
        isAreaSelected = false;
      }
    });

    // Executes only if a mouse button is released
    plotContainers[1].mouseReleased(() => {

      if (isSelectingArea && typeof selectedPoints[0] !== 'undefined') {

        // Executes only if the mouse is moved by 1 pixel approximately
        if (Math.abs((startPoint.x - sketch.mouseX) * (startPoint.y - sketch.mouseY)) < 1) {
          deselect();
        }
      }
    });
  }

  /**
   * Overwrites p5 function.
   * Gets called when a mouse button is released.
   */
  sketch.mouseReleased = function () {

    // Executes only if the selection is ongoing and a point was selected
    if (isSelectingArea && typeof selectedPoints[0] !== 'undefined') {

      // Sets selecting to false, selected to true
      isSelectingArea = false;
      console.log(isSelectingArea);
      isAreaSelected = true;

      // Draws the zoomed Julia plot
      drawZoomedPlot();
    }
  }

  /**
   * Overwrites p5 function.
   * Gets called when a mouse button is released.
   */
  sketch.mouseDragged = function () {

    // Executes only if selection process is ongoing and a point was selected
    if (isSelectingArea && typeof selectedPoints[0] !== 'undefined') {

      // Shows the selection rectangle
      if (selectionRectangle.style('visibility') === 'hidden') {
        selectionRectangle.style('visibility', 'visible');
      }

      // Gets the mouse position
      const c = { x: sketch.mouseX, y: sketch.mouseY };

      // Calculates the size of the selection
      const selectionSize = Math.round(Math.max(
        Math.abs(c.x - startPoint.x),
        Math.abs(c.y - startPoint.y)
      ));

      // Calculates the NW corner of the selection
      const anchorPoint = {
        x: (c.x > startPoint.x ? startPoint.x : startPoint.x - selectionSize),
        y: (c.y > startPoint.y ? startPoint.y : startPoint.y - selectionSize)
      };

      // Converts the anchor points and the selection size to Cartesian
      selectionCartesianCorner = toCartesian(anchorPoint, origins[1]);
      selectionCartesianSize = selectionSize * unitsPerPixel;

      // Executes only if the selection square is inside the Julia container
      if (
        isInside(1, anchorPoint) &&
        isInside(1, { x: anchorPoint.x + selectionSize, y: anchorPoint.y + selectionSize })
      ) {
        // Sets the selection rectangle position and size
        selectionRectangle.position(
          anchorPoint.x - bounds[1].west,
          anchorPoint.y - bounds[1].north
        );
        selectionRectangle.size(selectionSize, selectionSize);
      }
    }
  }

  /**
   * Deselect selected area
   */
  function deselect() {

    // Sets both selecting and selected to false
    isSelectingArea = false;
    isAreaSelected = false;

    // Resets the Mandelbrot plot
    resetMandelbrotPlot();

    // Hides the selection square
    selectionRectangle.style('visibility', 'hidden');
  }

  /*_______________________________________
  | Geometry options
  */

  /**
   * Checks if a point is inside a plot plot container.
   * @param   {number}                   i Index of the plot container (0 for Mandelbrot, 1 for Julia).
   * @param   {{ x: number, y: number }} c Point to be checked.
   * @returns {boolean}                    True if inside the i-plot container, false otherwise.
   */
  function isInside(i, c) {
    return ((c.x - bounds[i].east) * (c.x - bounds[i].west) < 0
      && (c.y - bounds[i].north) * (c.y - bounds[i].south) < 0);
  }

  /**
   * Converts a point to a Cartesian coordinates system, given the origin and units per Pixel.
   * @param {{ x: number, y: number}}   p            Point in screen coordinates to be converted.
   * @param {{ x: number, y: number}}   screenOrigin Origin in screen coordinates.
   * @param {number}                    scaleFactor  Units per pixel (global UPP by default).
   * @returns {{ x: number, y: number}}              Point in Cartesian coordinates.
   */
  const toCartesian = function (p, screenOrigin, scaleFactor = unitsPerPixel) {
    return {
      x: (p.x - screenOrigin.x) * scaleFactor,
      y: (screenOrigin.y - p.y) * scaleFactor
    };
  }

  /**
   * Converts a point to the screen coordinates system, given the origin in screen coordinates.
   * @param {{ x: number, y: number}}   p            Point in Cartesian coordinates to be converted.
   * @param {{ x: number, y: number}}   screenOrigin Origin in screen coordinates.
   * @returns {{ x: number, y: number}}              Point in screen coordinates.
   */
  const toScreenCoordinates = function (p, screenOrigin) {
    return {
      x: p.x * pixelsPerUnit + screenOrigin.x,
      y: screenOrigin.y - p.y * pixelsPerUnit
    };
  }

  /*_______________________________________
  | Graphics
  */

  /**
   * Converts a point (a,b) into a string with complex number notation a + bi. 
   * @param   {{ x: number, y: number }} p Point to be displayed.
   * @param   {number}                   d Number of digits after the decimal point [0 - 20].
   * @returns {String}                     String with format a + bi.
   */
  function coordinatesToString(p, d) {
    return (p.x >= 0 ? "+" : "") + p.x.toFixed(d) + (p.y >= 0 ? "+" : "") + p.y.toFixed(d) + "i";
  }

  /**
   * Sets p5 options for drawing red points.
   */
  function setPointOptions() {
    sketch.stroke("#B01A00");
    sketch.strokeWeight(5);
  }

  /**
   * Draws the last selected point and the point highlight.
   */
  function drawLastPoint() {

    // Draws the last selected point
    const c = toScreenCoordinates(selectedPoints[0], origins[0]);
    sketch.point(c.x, c.y);

    // Displays the point highlight
    pointHighlight.style('visibility', 'visible');
    pointHighlight.position(
      c.x - bounds[0].west - pointHighlightRadius - .25,
      c.y - bounds[0].north - pointHighlightRadius
    );
  }

  /**
   * Draws the zoomed Julia plot.
   */
  function drawZoomedPlot() {

    let anchorPoint = toScreenCoordinates(selectionCartesianCorner, origins[1]);
    let selectionSize = selectionCartesianSize * pixelsPerUnit;

    // Calculates origin proportions
    originProportions = {
      x: (origins[1].x - anchorPoint.x) / selectionSize,
      y: (origins[1].y - anchorPoint.y) / selectionSize
    }

    // Hides the point highlight and the coordinates history
    pointHighlight.style('visibility', 'hidden');
    mandelbrotInfo.style.visibility = "hidden";

    // Makes the Mandelbrot container border red
    plotContainers[0].style('border-color', '#B01A00');
    plotContainers[0].style('border-width', '2px');
    plotContainers[0].style('transform: translate(-1px,-1px)');

    // Makes the selected coordinates visible
    selectedCoordinates[0].style.visibility = "visible";

    // Shows the x axis and arrow if they are in the container
    if (originProportions.y > 0 && originProportions.y < 1) {
      mXAxis.style.top = originProportions.y * 100 + "%";
      mXAxis.style.opacity = 1;
      mXArrow.style.top = originProportions.y * 100 - 1.5 + "%";
      mXArrow.style.opacity = 1;
    } else {
      mXAxis.style.opacity = 0;
      mXArrow.style.opacity = 0;
    }

    // Shows teh y axis and arrow if they are in the container
    if (originProportions.x > 0 && originProportions.x < 1) {
      mYAxis.style.left = originProportions.x * 100 + "%";
      mYArrow.style.opacity = 1;
      mYArrow.style.left = originProportions.x * 100 - 1.5 + "%";
      mYAxis.style.opacity = 1;
    } else {
      mYAxis.style.opacity = 0;
      mYArrow.style.opacity = 0;
    }

    // Draws the zoomed Julia plot on top of the Mandelbrot plot
    drawJuliaSet(
      selectedPoints[0], 0, 1,
      { x: plotSize * originProportions.x, y: plotSize * originProportions.y },
      selectionCartesianSize / plotSize
    );
  }

  /**
   * Resets the Mandelbrot plot and the corresponding Cartesian plane.
   */
  function resetMandelbrotPlot() {

    // Moves the Mandelbrot plot on top of the zoomed plot Julia plot
    sketch.image(mandelbrotImg, bounds[0].west, bounds[0].north, plotSize, plotSize);

    // Resets the style of the Mandelbrot container
    plotContainers[0].style('border-color', '#b4b4b4');
    plotContainers[0].style('border-width', '1px');
    plotContainers[0].style('transform: translate(0px,0px)')

    // Draws the last selected point
    drawLastPoint();

    // Makes the Mandelbrot information visible
    mandelbrotInfo.style.visibility = "visible";

    // Resets the x and y axis and arrows
    mXAxis.style.top = "50%";
    mXAxis.style.opacity = 1;
    mXArrow.style.top = "48.5%";
    mXArrow.style.opacity = 1;
    mYAxis.style.left = "50%";
    mYAxis.style.opacity = 1;
    mYArrow.style.left = "48.5%";
    mYArrow.style.opacity = 1;
  }

  /*_______________________________________
  | Mandelbrot and Julia set plotter
  */

  /**
   * Plots the path of the point use to evaluate the Mandelbrot and Julia sets.
   * @param {{x: Number, y: Number}} z         Point z in f(z) = z^2 + c.
   * @param {{x: Number, y: Number}} c         Point c in f(z) = z^2 + c.
   * @param {Number}                 plotIndex Index of the plot container.
   */
  function drawPath(z, c, plotIndex) {

    // Redraws the corresponding image
    sketch.image(
      plotIndex == 0 ? mandelbrotImg : juliaImgs[0],
      bounds[plotIndex].west, bounds[plotIndex].north
    );

    // Set drawing options
    sketch.noFill();
    sketch.strokeWeight(1);

    sketch.beginShape();

    // Sets iteration to 0
    let i = 0, newZ, oldZ, d;
    do {

      // Draws the first point in case of Julia set
      if (i == 0 && plotIndex == 1) {
        newZ = toScreenCoordinates(z, origins[plotIndex]);
        sketch.vertex(newZ.x, newZ.y);
      }

      // z^2 + 0
      z = {
        x: z.x * z.x - z.y * z.y + c.x,
        y: 2 * z.x * z.y + c.y
      };

      oldZ = newZ;
      newZ = toScreenCoordinates(z, origins[plotIndex]);
      if (isInside(plotIndex, newZ)) {
        sketch.vertex(newZ.x, newZ.y);
      } else {
        /**
         * It was at this moment that he knew... he f*cked up!
         * I should have used a completely different method
         * to draw the whole thing, but hey.
         * So... this search a point close the container border.
         */
        let j = 0, tempZ;
        do {
          tempZ = {
            x: (oldZ.x + newZ.x) / 2,
            y: (oldZ.y + newZ.y) / 2
          }
          if (isInside(plotIndex, tempZ)) {
            oldZ = tempZ;
          } else {
            newZ = tempZ;
          }
        } while (++j < 10);
        sketch.vertex(oldZ.x, oldZ.y);
      }

      // |z^2 + c|^2
      d = z.x * z.x + z.y * z.y;
    } while (d <= 4 && ++i < mathUtils.getMaxIteration());

    sketch.endShape();
  }

  /**
   * Draws the Mandelbrot set plot.
   */
  function drawMandelbrotSet() {

    // Cycles through the pixels of the image
    for (let x = 0; x < plotSize; x++) {
      for (let y = 0; y < plotSize; y++) {

        // f(z) = z^2 + c with z=0 and c given by the current pixel position
        const [m, isMandelbrot] = mathUtils.fc(
          { x: 0, y: 0 },
          toCartesian({ x: x, y: y }, { x: plotSize / 2, y: plotSize / 2 })
        );

        // The color of the pixel is given by the number of iteration
        // If the point "is Mandelbrot", the color is set to black
        mandelbrotImg.set(x, y, sketch.color(
          0, // Hue
          0, // Saturation
          isMandelbrot ? 0 : 2 + m / mathUtils.getMaxIteration() * 98) // Brightness
        );
      }
    }

    // The image is displayed in the correct position
    mandelbrotImg.updatePixels();
    sketch.image(mandelbrotImg, bounds[0].west, bounds[0].north);
  }

  /**
   * Draws the Julia set plot.
   * @param {{x: number, y: number}} c            Point c in f(z) = z^2 + c.
   * @param {number}                 plotIndex    Index of the plot container.
   * @param {number}                 imgIndex     Index of the Julia images array.
   * @param {{x: number, y: number}} screenOrigin Origin in screen coordinates
   * @param {number}                 scaleFactor  Units per pixel (global UPP by default).
   */
  function drawJuliaSet(c, plotIndex, imgIndex, screenOrigin, scaleFactor = unitsPerPixel) {

    // Cycles through the pixels of the image
    for (let x = 0; x < plotSize; x++) {
      for (let y = 0; y < plotSize; y++) {

        // f(z) = z^2 + c with z given given by the current pixel position
        // c is corresponds to the selected point
        const [i, isJulia] = mathUtils.fc(
          toCartesian({ x: x, y: y }, screenOrigin, scaleFactor),
          c
        );

        // The color of the pixel is given by the number of iterations
        // If the point is "is Julia", the color is set to black
        juliaImgs[imgIndex].set(x, y, sketch.color(
          0, // Hue
          0, // Saturation
          isJulia ? 0 : 2 + i / mathUtils.getMaxIteration() * 98) // Brightness
        );

        /**
         * NOTE:
         * The Julia set is actually the border
         * between the "is Julia" and the rest.
         */
      }
    }

    // The image is displayed in the correct position
    juliaImgs[imgIndex].updatePixels();
    sketch.image(juliaImgs[imgIndex], bounds[plotIndex].west, bounds[plotIndex].north);
  }

}, "canvas");
