import {
    logColorDistribution,
    makeRandomMatrix,
    generateParticles,
} from "./particleSetup.js";

import { initUI } from "./ui.js";
import { initalizeGL } from "./glhelper.js";
import { loadShaders } from "./shaders/loader.js";
import { createShader } from "./shaders/helper.js";

const fpsElement = document.querySelector("#fps");

let canvas = null;
let ctx = null;
/** @type {WebGL2RenderingContext} */
let gl = null;
let program;
let transformFeedback;
let timeUniformLocation;
let dtUniformLocation;
let nUniformLocation;
let zDepthUniformLocation;
let pointSizeUniformLocation;
let matrixSizeUniformLocation;
let rMaxUniformLocation;
let frictionUniformLocation;
let forceFactorUniformLocation;
let colorTextureUniformLocation;
let matrixTextureUniformLocation;

let ui;

let spaceBarPressed = false;

const config = {
    MAX_PARTICLES: 32000,
    paused: false,
    n: 5000,
    m: 6,
    matrix: null,
    rMax: 0.25,
    friction: 0.2,
    forceFactor: 20.0,
    simulationSpeed: 0.2,
    zDepth: null,
    zDepthHalf: null,
    pointSize: 1.5,
    reload: reload,
};
config.zDepth = 0.75 * config.rMax;
config.zDepthHalf = config.zDepth / 2;

let particles;

let colorBuffer;
let positionBuffers;
let velocityBuffers;

let positionAttributeLocation;
let velocityAttributeLocation;

let renderProgram;
let renderPositionBuffer;
let renderColorBuffer;
let render_u_offset;
let render_u_zDepth;
let render_u_pointSize;

let infoCanvas;
let ictx;

//matrix with all paths of the particle matrixes (access them onmouse event isPointinPath)
let matrixPaths;
let selectedMatrixPath = [null, null];

let shaderSources;

function linkProgram(p) {
    ui.log("Linking program...");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) {
        ui.error("Error while linking program:", gl.getProgramInfoLog(p));
        gl.deleteProgram(p);
        return null;
    }
    return p;
}

function initBuffers(gl) {
    console.log("Array size:", config.MAX_PARTICLES * 3);
    const positions = new Float32Array(config.MAX_PARTICLES * 3);
    const velocities = new Float32Array(config.MAX_PARTICLES * 3);

    // Create buffers
    positionBuffers = [gl.createBuffer(), gl.createBuffer()];
    velocityBuffers = [gl.createBuffer(), gl.createBuffer()];
    colorBuffer = gl.createBuffer();

    // Bind and initialize position buffer
    positionBuffers.forEach((buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    });

    // Bind and initialize velocity buffer
    velocityBuffers.forEach((buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, velocities, gl.DYNAMIC_DRAW);
    });

    // Bind and initialize color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles.colors, gl.DYNAMIC_DRAW);

    // Unbind buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    transformFeedback = gl.createTransformFeedback();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
}

function createTexture(gl, data, width, height, internalFormat, format, type) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        internalFormat,
        width,
        height,
        0,
        format,
        type,
        data
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
}

function createTextures(gl) {
    const textureSize = Math.ceil(Math.sqrt(config.n));
    const textureSize2 = textureSize * textureSize;
    const positionData = new Float32Array(textureSize2 * 4); // RGBA for positions
    const colorData = new Uint8Array(textureSize2 * 4); // RGBA for colors
    const matrixData = new Float32Array(config.m * config.m * 4); // RGBA for matrix

    // Initialize particle data
    for (let i = 0; i < textureSize2; i++) {
        positionData[i * 4] = particles.positions.x[i] || 0;
        positionData[i * 4 + 1] = particles.positions.y[i] || 0;
        positionData[i * 4 + 2] = particles.positions.z[i] || 0;
        positionData[i * 4 + 3] = 1.0; // Alpha channel

        colorData[i * 4] = particles.colors[i] * (255 / config.m) || 0;
        colorData[i * 4 + 1] = particles.colors[i] * (255 / config.m) || 0;
        colorData[i * 4 + 2] = particles.colors[i] * (255 / config.m) || 0;
        colorData[i * 4 + 3] = particles.colors[i] * (255 / config.m) || 0;
    }

    // Initialize matrix data
    for (let i = 0; i < config.m; i++) {
        for (let j = 0; j < config.m; j++) {
            matrixData[i * config.m * 4 + j * 4] = config.matrix[i][j];
            matrixData[i * config.m * 4 + j * 4 + 1] = config.matrix[i][j];
            matrixData[i * config.m * 4 + j * 4 + 2] = config.matrix[i][j];
            matrixData[i * config.m * 4 + j * 4 + 3] = 1.0;
        }
    }

    const positionTexture = createTexture(
        gl,
        positionData,
        textureSize,
        textureSize,
        gl.RGBA32F,
        gl.RGBA,
        gl.FLOAT
    );

    const colorTexture = createTexture(
        gl,
        colorData,
        textureSize,
        textureSize,
        gl.RGBA8,
        gl.RGBA,
        gl.UNSIGNED_BYTE
    );

    const matrixTexture = createTexture(
        gl,
        matrixData,
        config.m * config.m,
        1,
        gl.RGBA32F,
        gl.RGBA,
        gl.FLOAT
    );

    return [positionTexture, colorTexture, matrixTexture];
}

function initProgram(gl) {
    ui.log("Creating program...");
    program = gl.createProgram();

    ui.log("Creating shaders...");
    console.log("Creating shaders...");
    console.log(shaderSources);
    const vertexShader = createShader(
        gl,
        gl.VERTEX_SHADER,
        shaderSources.particle.vert,
        ui
    );
    const fragmentShader = createShader(
        gl,
        gl.FRAGMENT_SHADER,
        shaderSources.particle.frag,
        ui
    );

    ui.log("Attaching shaders...");
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    ui.log("Transform feedback varyings...");
    gl.transformFeedbackVaryings(
        program,
        ["v_position", "v_velocity"],
        gl.SEPARATE_ATTRIBS
    );

    linkProgram(program);

    gl.useProgram(program);

    // Get attribute locations
    positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    velocityAttributeLocation = gl.getAttribLocation(program, "a_velocity");
    const colorAttributeLocation = gl.getAttribLocation(program, "a_color");

    // Enable attributes
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(velocityAttributeLocation);
    gl.enableVertexAttribArray(colorAttributeLocation);

    // Bind position buffer to attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[0]);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    // Bind velocity buffer to attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffers[0]);
    gl.vertexAttribPointer(velocityAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    // Bind color buffer to attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribIPointer(colorAttributeLocation, 1, gl.INT, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, transformFeedback);
}

function initRenderProgram(gl) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, shaderSources.render.vert);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, shaderSources.render.frag);
    gl.compileShader(fragmentShader);

    renderProgram = gl.createProgram();
    gl.attachShader(renderProgram, vertexShader);
    gl.attachShader(renderProgram, fragmentShader);
    gl.linkProgram(renderProgram);

    renderPositionBuffer = gl.createBuffer();
    renderColorBuffer = gl.createBuffer();

    // Get attribute locations
    render_u_offset = gl.getUniformLocation(renderProgram, "u_offset");
    render_u_zDepth = gl.getUniformLocation(renderProgram, "u_zDepth");
    render_u_pointSize = gl.getUniformLocation(renderProgram, "u_pointSize");
}

function checkBufferSizes(gl) {
    // Check position buffer size
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[0]);
    const positionBufferSize = gl.getBufferParameter(
        gl.ARRAY_BUFFER,
        gl.BUFFER_SIZE
    );
    ui.log("Position buffer size:", positionBufferSize);
    console.log("Position buffer size:", positionBufferSize);

    // Check velocity buffer size
    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffers[0]);
    const velocityBufferSize = gl.getBufferParameter(
        gl.ARRAY_BUFFER,
        gl.BUFFER_SIZE
    );
    ui.log("Velocity buffer size:", velocityBufferSize);

    // Check color buffer size
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    const colorBufferSize = gl.getBufferParameter(
        gl.ARRAY_BUFFER,
        gl.BUFFER_SIZE
    );
    console.log("Color buffer size:", colorBufferSize);

    // Unbind the buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function updateBuffers(gl) {
    // Transfer data to GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[0]);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            ...particles.positions.x,
            ...particles.positions.y,
            ...particles.positions.y,
        ]),
        gl.DYNAMIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffers[0]);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            ...particles.velocities.x,
            ...particles.velocities.y,
            ...particles.velocities.z,
        ]),
        gl.DYNAMIC_DRAW
    );

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles.colors, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    checkBufferSizes(gl);
}

export function init() {
    ui.log("Initialize...");

    const result = initalizeGL(render, ui);
    if (!result) {
        return;
    } else {
        [gl, canvas] = result;
    }

    config.matrix = makeRandomMatrix(config);
    matrixPaths = new Array(config.m)
        .fill(null)
        .map(() => new Array(config.m).fill(null));

    ui.reEvaluateMatrix();

    // Initialize particle data
    particles = generateParticles(config);
    logColorDistribution(particles.colors);

    // Set up WebGL
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);

    initBuffers(gl);

    initProgram(gl);

    timeUniformLocation = gl.getUniformLocation(program, "u_time");
    dtUniformLocation = gl.getUniformLocation(program, "u_dt");
    nUniformLocation = gl.getUniformLocation(program, "u_n");
    zDepthUniformLocation = gl.getUniformLocation(program, "u_zDepth");
    pointSizeUniformLocation = gl.getUniformLocation(program, "u_pointSize");
    matrixSizeUniformLocation = gl.getUniformLocation(program, "u_matrixSize");
    frictionUniformLocation = gl.getUniformLocation(program, "u_friction");
    forceFactorUniformLocation = gl.getUniformLocation(
        program,
        "u_forceFactor"
    );
    rMaxUniformLocation = gl.getUniformLocation(program, "u_rMax");
    matrixTextureUniformLocation = gl.getUniformLocation(
        program,
        "u_matrixTexture"
    );

    colorTextureUniformLocation = gl.getUniformLocation(
        program,
        "u_colorTexture"
    );

    // Transfer data to GPU
    updateBuffers(gl);

    initRenderProgram(gl);

    return;
}

let then = 0;

let readIndex = 0;

let frameCounter = 0;

function render(now) {
    if (!gl || gl.isContextLost()) {
        ui.error("Called render, but no WebGL context available");
        cancelAnimationFrame(render);
        return;
    }
    if (config.paused) {
        requestAnimationFrame(render);
        return;
    }
    now *= 0.001; // convert to seconds
    const deltaTime = now - then; // compute time since last frame
    then = now; // remember time for next frame
    const fps = 1 / deltaTime; // compute frames per second
    frameCounter++;
    if (frameCounter % 8 === 0) {
        fpsElement.textContent = fps.toFixed(1);
    }

    const writeIndex = (readIndex + 1) % 2;
    gl.useProgram(program);
    gl.uniform1f(timeUniformLocation, performance.now() / 1000);
    gl.uniform1f(
        dtUniformLocation,
        deltaTime *
            60 *
            config.simulationSpeed *
            0.02 *
            (!spaceBarPressed ? 1 : 4)
    );
    gl.uniform1i(nUniformLocation, config.n);
    gl.uniform1f(zDepthUniformLocation, config.zDepth);
    gl.uniform1f(pointSizeUniformLocation, config.pointSize);
    gl.uniform1i(matrixSizeUniformLocation, config.m);
    gl.uniform1f(frictionUniformLocation, config.friction);
    gl.uniform1f(forceFactorUniformLocation, config.forceFactor);
    gl.uniform1f(rMaxUniformLocation, config.rMax);
    const [positionTexture, colorTexture, matrixTexture] = createTextures(gl);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.uniform1i(colorTextureUniformLocation, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, positionTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_positionTexture"), 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, matrixTexture);
    gl.uniform1i(matrixTextureUniformLocation, 2);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.disableVertexAttribArray(positionAttributeLocation);
    gl.disableVertexAttribArray(velocityAttributeLocation);

    gl.bindBufferBase(
        gl.TRANSFORM_FEEDBACK_BUFFER,
        0,
        positionBuffers[writeIndex]
    );
    gl.bindBufferBase(
        gl.TRANSFORM_FEEDBACK_BUFFER,
        1,
        velocityBuffers[writeIndex]
    );

    // Bind the buffers for reading
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[readIndex]);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionAttributeLocation);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ARRAY_BUFFER, velocityBuffers[readIndex]);
    gl.vertexAttribPointer(velocityAttributeLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(velocityAttributeLocation);

    //Clear
    gl.clearColor(0.04, 0.04, 0.05, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Start transform feedback
    gl.beginTransformFeedback(gl.POINTS);

    // Draw
    gl.drawArrays(gl.POINTS, 0, config.n);

    // End transform feedback
    gl.endTransformFeedback();

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const updatedPositions = new Float32Array(config.n * 3);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffers[readIndex]);
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, updatedPositions);
    for (let i = 0; i < config.n; i++) {
        particles.positions.x[i] = updatedPositions[i * 3];
        particles.positions.y[i] = updatedPositions[i * 3 + 1];
        particles.positions.z[i] = updatedPositions[i * 3 + 2];
    }

    // Unbind transform feedback buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
    gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

    //Delete textures
    gl.deleteTexture(positionTexture);
    gl.deleteTexture(colorTexture);
    gl.deleteTexture(matrixTexture);

    readIndex = writeIndex;

    // Render
    gl.useProgram(renderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, updatedPositions, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, particles.colors, gl.DYNAMIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderPositionBuffer);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    gl.bindBuffer(gl.ARRAY_BUFFER, renderColorBuffer);
    gl.vertexAttribPointer(1, 1, gl.INT, false, 0, 0);
    gl.enableVertexAttribArray(1);

    gl.uniform1f(render_u_zDepth, config.zDepth);
    gl.uniform1f(render_u_pointSize, config.pointSize);

    gl.uniform3fv(render_u_offset, [-1.0, 0, 0]);
    gl.drawArrays(gl.POINTS, 0, config.n);

    gl.uniform3fv(render_u_offset, [1.0, 0, 0]);
    gl.drawArrays(gl.POINTS, 0, config.n);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    requestAnimationFrame(render.bind(this));
}

export function clear() {
    ui.warn("Clearing WebGL context...");
    var numTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    for (var unit = 0; unit < numTextureUnits; ++unit) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    /*gl.deleteTexture(positionTexture);
    gl.deleteTexture(colorTexture);
    gl.deleteTexture(matrixTexture);*/

    const buffersToDelete = [
        positionBuffers[0],
        positionBuffers[1],
        velocityBuffers[0],
        velocityBuffers[1],
        colorBuffer,
    ];
    buffersToDelete.forEach((buffer) => {
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, 1, gl.STATIC_DRAW);
        gl.deleteBuffer(buffer);
    });

    gl.deleteTransformFeedback(transformFeedback);

    ui.log("WebGL context cleared");
    cancelAnimationFrame(render);
}

export async function reload() {
    ui.log("Reloading...");
    console.log("Reloading...");

    window.location.reload();
}

window.addEventListener("load", async () => {
    console.log("Window event: load");
    ui = initUI(config);
    shaderSources = await loadShaders();
    init();
    requestAnimationFrame(render);
});

window.addEventListener("keydown", (event) => {
    if (event.key === " ") {
        spaceBarPressed = true;
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key === " ") {
        spaceBarPressed = false;
    }
});
