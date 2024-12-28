function makeRandomMatrix() {
    const rows = [];
    for (let i = 0; i < m; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(Math.random() * 2 - 1);
        }
        rows.push(row);
    }
    return rows;
}

//don't save in game ojbect, just plain consts
const dt = 0.02;
let canvas = null;
let ctx = null;
/** @type {WebGL2RenderingContext} */
let gl = null;
const n = 2500;
let m = 8;
let matrix;
const radius = 1;
let rMax = 0.3;
const frictionHalfLife = 0.04;
const friction = Math.pow(0.5, dt / frictionHalfLife);
let forceFactor = 0.005;
const colors = new Int32Array(n);
const zDepth = 1;
const zDepthHalf = zDepth / 2;
const positionsX = new Float32Array(n);
const positionsY = new Float32Array(n);
const positionsZ = new Float32Array(n);
const velocitiesX = new Float32Array(n);
const velocitiesY = new Float32Array(n);
const velocitiesZ = new Float32Array(n);

let gridFactor = 0.5;
let gridMax = 1 / gridFactor;
const grid = new Map();
let useGridPartitioning = true;

let infoCanvas;
let ictx;

//matrix with all paths of the particle matrixes (access them onmouse event isPointinPath)
let matrixPaths;
let selectedMatrixPath = [null, null];

function force(r, a) {
    const beta = 0.3;
    if (r < beta) {
        return r / beta - 1;
    } else if (beta < r && r < 1) {
        return a * (1 - Math.abs(2 * r - 1 - beta) / (1 - beta));
    } else {
        return 0;
    }
}

function renderInfo() {
    infoCanvas = infoCanvas ?? document.getElementById("info");
    ictx = ictx ?? infoCanvas.getContext("2d");

    //clear canvas
    ictx.fillStyle = "black";
    ictx.fillRect(0, 0, infoCanvas.width, infoCanvas.height);

    const xStart = 10;
    const yStart = 20;
    const ySpacing = 15;
    ictx.fillStyle = "white";
    ictx.font = "13px Arial";
    //n
    ictx.fillText("n: " + n, xStart, yStart);
    //rMax
    ictx.fillText("rMax: " + rMax, xStart, yStart + ySpacing);
    //gridFactor
    ictx.fillText("gridFactor: " + gridFactor, xStart, yStart + 2 * ySpacing);
    //friction
    ictx.fillText("friction: " + friction, xStart, yStart + 3 * ySpacing);
    //forceFactor
    ictx.fillText("forceFactor: " + forceFactor, xStart, yStart + 4 * ySpacing);
    //zDepth
    ictx.fillText("zDepth: " + zDepth, xStart, yStart + 5 * ySpacing);

    ictx.fillText(
        `Grid partitioning: ${useGridPartitioning}`,
        xStart,
        yStart + 6 * ySpacing
    );
    //draw a matrix
    //canvas width is the limiting space here so divide it by m
    const reserveSpace = 100;
    const cellSize = (infoCanvas.width - reserveSpace) / m;

    const matrixXStart = reserveSpace;
    const matrixYStart = yStart + 7 * ySpacing + 100;

    for (let i = 0; i < m; i++) {
        //same color as in render to know which row is which
        /*ictx.fillStyle = `hsl(${(360 * i) / m}, 100%, 50%)`;
        ictx.fillText(i, matrixXStart + i * cellSize, matrixYStart - 5);
        ictx.fillText(i, matrixXStart - 15, matrixYStart + i * cellSize + 10);*/
        //no numbers just colors
        ictx.fillStyle = `hsl(${(360 * i) / m}, 100%, 50%)`;
        ictx.fillRect(
            matrixXStart + i * cellSize,
            matrixYStart - cellSize - 5,
            cellSize,
            cellSize
        );
        ictx.fillRect(
            matrixXStart - cellSize - 5,
            matrixYStart + i * cellSize,
            cellSize,
            cellSize
        );
        for (let j = 0; j < m; j++) {
            ictx.fillStyle = `hsl(${
                (120 * (matrix[i][j] + 1)) / 2
            }, 100%, 50%)`;
            const rect = new Path2D();
            rect.rect(
                matrixXStart + i * cellSize,
                matrixYStart + j * cellSize,
                cellSize,
                cellSize
            );
            ictx.fill(rect);

            if (selectedMatrixPath[0] === i && selectedMatrixPath[1] === j) {
                ictx.strokeStyle = "white";
                ictx.lineWidth = 3;
                ictx.stroke(rect);
            }
            matrixPaths[i][j] = rect;
        }
    }
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function webgl() {
    if (!gl) {
        console.log("WebGL not supported, exiting");
        return;
    }
    gl.clearColor(0.1, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    const vertexShaderSource = `#version 300 es
in vec4 a_position;
void main() {
    gl_Position = a_position;
}`;
    const fragmentShaderSource = `#version 300 es
precision highp float;
out vec4 outColor;
void main() {
    outColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
}`;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentShaderSource
    );

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(
        program,
        "a_position"
    );
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function init() {
    console.log("Game:init");
    setInterval(loop, 16);

    //initialize canvas
    canvas = document.getElementById("canvas");

    //ctx = canvas.getContext("2d");
    gl = canvas.getContext("webgl2");
    webgl();
    return;

    console.log("Game:initializing matrix");
    matrix = makeRandomMatrix();
    matrixPaths = new Array(m).fill(null).map(() => new Array(m).fill(null));

    console.log("Game:initializing particles");
    for (let i = 0; i < n; i++) {
        console.log("Game:initializing particle", i);
        colors[i] = Math.floor(Math.min(Math.random() * m * 1, m - 1));
        positionsX[i] = Math.random() * 2 - 1;
        positionsY[i] = Math.random() * 2 - 1;
        positionsZ[i] = Math.random() * zDepth - zDepthHalf;
        velocitiesX[i] = 0;
        velocitiesY[i] = 0;
        velocitiesZ[i] = 0;
    }

    renderInfo();
}

function loop() {
    console.log("Game:tick");
    //tick();
    //render();
}

function getCellIndex(x, y, z) {
    const ix = Math.floor(x / gridFactor);
    const iy = Math.floor(y / gridFactor);
    const iz = Math.floor(z / gridFactor);
    return `${ix},${iy},${iz}`;
}

function assignParticlesToGrid() {
    grid.clear();
    for (let i = 0; i < n; i++) {
        const cellIndex = getCellIndex(
            positionsX[i],
            positionsY[i],
            positionsZ[i]
        );
        if (!grid.has(cellIndex)) {
            grid.set(cellIndex, []);
        }
        grid.get(cellIndex).push(i);
    }
}

function getNeighboringCells(cellIndex) {
    const [ix, iy, iz] = cellIndex.split(",").map(Number);
    const neighbors = [];
    const wrap = (index, max) =>
        index < -gridMax ? max - 1 : index >= max ? -gridMax : index;

    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
                const wrappedIx = wrap(ix + dx, gridMax);
                const wrappedIy = wrap(iy + dy, gridMax);
                const wrappedIz = wrap(iz + dz, gridMax);
                neighbors.push(`${wrappedIx},${wrappedIy},${wrappedIz}`);
            }
        }
    }
    return neighbors;
}

function tick() {
    assignParticlesToGrid();

    //update velocities
    for (let i = 0; i < n; i++) {
        let totalForceX = 0;
        let totalForceY = 0;
        let totalForceZ = 0;

        const cellIndex = getCellIndex(
            positionsX[i],
            positionsY[i],
            positionsZ[i]
        );
        const neighboringCells = getNeighboringCells(cellIndex);
        for (const neighborCell of neighboringCells) {
            if (!grid.has(neighborCell)) continue;
            for (const j of grid.get(neighborCell)) {
                if (i === j) continue;
                let rx = positionsX[j] - positionsX[i];
                let ry = positionsY[j] - positionsY[i];
                let rz = positionsZ[j] - positionsZ[i];
                if (2 - Math.abs(rx) < Math.abs(rx)) {
                    rx = -Math.sign(rx) * (2 - Math.abs(rx));
                }
                if (2 - Math.abs(ry) < Math.abs(ry)) {
                    ry = -Math.sign(ry) * (2 - Math.abs(ry));
                }
                if (zDepth - Math.abs(rz) < Math.abs(rz)) {
                    rz = -Math.sign(rz) * (zDepth - Math.abs(rz));
                }
                const r = Math.sqrt(rx * rx + ry * ry + rz * rz);
                if (r > 0 && r < rMax) {
                    const f = force(r / rMax, matrix[colors[i]][colors[j]]);
                    totalForceX += (rx / r) * f;
                    totalForceY += (ry / r) * f;
                    totalForceZ += (rz / r) * f;
                }
            }
        }

        totalForceX *= rMax * forceFactor;
        totalForceY *= rMax * forceFactor;
        totalForceZ *= rMax * forceFactor;

        velocitiesX[i] *= friction;
        velocitiesY[i] *= friction;
        velocitiesZ[i] *= friction;

        velocitiesX[i] += totalForceX * dt;
        velocitiesY[i] += totalForceY * dt;
        velocitiesZ[i] += totalForceZ * dt;
        //update positions
        for (let i = 0; i < n; i++) {
            positionsX[i] += velocitiesX[i] * dt;
            if (positionsX[i] < -1) {
                positionsX[i] = 1;
            } else if (positionsX[i] > 1) {
                positionsX[i] = -1;
            }
            positionsY[i] += velocitiesY[i] * dt;
            if (positionsY[i] < -1) {
                positionsY[i] = 1;
            } else if (positionsY[i] > 1) {
                positionsY[i] = 1;
            }
            positionsZ[i] += velocitiesZ[i] * dt;
            if (positionsZ[i] < -zDepthHalf) {
                positionsZ[i] = zDepthHalf;
            } else if (positionsZ[i] > zDepthHalf) {
                positionsZ[i] = -zDepthHalf;
            }
        }
    }
}

function render() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < n; i++) {
        const darkness = 1;
        ctx.beginPath();
        const f = 1 / (positionsZ[i] + 1);
        const screenX = (f * positionsX[i] + 1) * 0.5 * canvas.width;
        const screenY = (f * positionsY[i] + 1) * 0.5 * canvas.height;
        ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = `hsla(${
            (360 * colors[i]) / m
        }, 100%, 50%, ${darkness})`;
        ctx.fill();
    }
}

window.addEventListener("load", init);

window.addEventListener("mousedown", (event) => {
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
            if (
                ctx.isPointInPath(
                    matrixPaths[i][j],
                    event.offsetX,
                    event.offsetY
                )
            ) {
                selectedMatrixPath = [i, j];
                console.log("selected matrix path", i, j);
                //re-render
                renderInfo();
            }
        }
    }
});

window.addEventListener("keydown", (event) => {
    if (event.key === "+") {
        matrix[selectedMatrixPath[0]][selectedMatrixPath[1]] += 0.1;
        if (matrix[selectedMatrixPath[0]][selectedMatrixPath[1]] > 1) {
            matrix[selectedMatrixPath[0]][selectedMatrixPath[1]] = 1;
        }
        //re-render
        renderInfo();
    } else if (event.key === "-") {
        matrix[selectedMatrixPath[0]][selectedMatrixPath[1]] -= 0.1;
        if (matrix[selectedMatrixPath[0]][selectedMatrixPath[1]] < -1) {
            matrix[selectedMatrixPath[0]][selectedMatrixPath[1]] = -1;
        }
        //re-render
        renderInfo();
    } else if (event.key === "g") {
        gridFactor += 0.1;
        gridMax = 1 / gridFactor;
        renderInfo();
    } else if (event.key === "f") {
        //change grid factor
        gridFactor -= 0.1;
        gridMax = 1 / gridFactor;
        renderInfo();
    } else if (event.key === "r") {
        rMax += 0.1;
        renderInfo();
    } else if (event.key === "e") {
        rMax -= 0.1;
        renderInfo();
    } else if (event.key === "q") {
        forceFactor *= 0.5;
        renderInfo();
    } else if (event.key === "w") {
        forceFactor *= 2;
        renderInfo();
    } else if (event.key === "0") {
        useGridPartitioning = !useGridPartitioning;
        renderInfo();
    }
});
