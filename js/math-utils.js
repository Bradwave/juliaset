/**
 * Mathematical utilities.
 *
 * @namespace mathUtils
 * @memberof  global
 * 
 */
let mathUtils = new function () {

    /** Maximum numbers of iterations for f(z) = z^2 + c.
     * @type {number} */
    let maxIteration = 80;

    /**
     * Gets the maximum number of iterations.
     * @returns {number} Maximum number of iteration.
     */
    this.getMaxIteration = () => {
        return maxIteration;
    }

    /**
     * Sets the maximum number of iterations.
     * @param {number} maxIteration Maximum number of iteration.
     */
    this.setMaxIteration = (maxIteration) => {
        this.maxIteration = maxIteration;
    }

    /**
     * Implementation of f(z) = z^2 + c, calculates the iterations needed to escape the radius 2.
     * Returns the number of iterations and if escaped or not.
     * @param {number} z -  Value of z in f(z) = z^2 + c.
     * @param {number} c - Value of c in f(z) = z^2 + c.
     * @returns {[number,boolean]} Array with the number of iterations and if escaped.
     */
    this.fc = (z, c) => {
        // Sets iteration to 0
        let i = 0, d;
        do {
            // z^2 + c
            z = {
                x: z.x * z.x - z.y * z.y + c.x,
                y: 2 * z.x * z.y + c.y
            };
            // |z^2 + c|^2
            d = z.x * z.x + z.y * z.y;
        } while (d <= 4 && ++i < maxIteration);
        return [i, d <= 4];
    }
}
