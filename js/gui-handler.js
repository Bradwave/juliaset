/**
 * GUI handler.
 *
 * @namespace guiHandler
 * @memberof  global
 * 
 */
let guiHandler = new function () {

    /** True if the axes are visible, false otherwise */
    let showAxes = true;

    /** True if the coordinates are visible, false otherwise */
    let showCoordinates = true;

    /**
     * Returns the axes visibility flag.
     * @returns {boolean} True if the axes are visible, false otherwise
     */
    this.getShowAxes = () => {
        return showAxes;
    }

    // Removes the loader and shows the main content after loading
    window.onload = () => {
        document.getElementById("loading-container").remove();
        document.getElementById("general-container").style.visibility = "visible";
    }

    // Toggle the axes visibility
    document.getElementById("toggle-axes").onclick = () => {
        showAxes = !showAxes;
        document.getElementById("toggle-axes").style.backgroundColor = showAxes ? "#B01A00" : "#ffffff2f";
        document.getElementsByClassName("cartesian-plane").forEach(e => {
            e.style.visibility = showAxes ? "visible" : "hidden";
            e.children.forEach(c => {
                c.style.visibility = showAxes ? "visible" : "hidden";
            })
        })
    };

    // Toggle the coordinates visibility
    document.getElementById("toggle-coordinates").onclick = () => {
        showCoordinates = !showCoordinates;
        document.getElementById("toggle-coordinates").style.backgroundColor = showCoordinates ? "#B01A00" : "#ffffff2f";
        document.getElementsByClassName("coordinates").forEach(e => {
            e.style.visibility = showCoordinates ? "visible" : "hidden";
        })
    }
}