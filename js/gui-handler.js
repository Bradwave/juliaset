let guiHandler = new function () {

    /**  */
    let showAxes = true;
    let showCoordinates = true;

    this.getShowAxes = () => {
        return showAxes;
    }

    window.onload = () => {
        document.getElementById("loading-container").remove();
        document.getElementById("general-container").style.visibility = "visible";
    }

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

    document.getElementById("toggle-coordinates").onclick = () => {
        showCoordinates = !showCoordinates;
        document.getElementById("toggle-coordinates").style.backgroundColor = showCoordinates ? "#B01A00" : "#ffffff2f";
        document.getElementsByClassName("coordinates").forEach(e => {
            e.style.visibility = showCoordinates ? "visible" : "hidden";
        })
    }
}