import { createPostFXProgram, createProgram } from "../helper.js";
import { drawQuad } from "./quad.js";

const blurSize = 4;
const sigma = 1.0;
const weights = computeGaussianWeights(blurSize, sigma);

function computeGaussianWeights(blurSize, sigma) {
    const weights = [];
    let totalWeight = 0.0;
    for (let i = -blurSize; i <= blurSize; i++) {
        const weight =
            Math.exp(-(i * i) / (2.0 * sigma * sigma)) /
            (Math.sqrt(2.0 * Math.PI) * sigma);
        weights.push(weight);
        totalWeight += weight;
    }
    for (let i = 0; i < weights.length; i++) {
        weights[i] /= totalWeight;
    }
    return weights;
}

//TODO don't use hard coded values
const canvas = {
    width: 2000,
    height: 1250,
};

export function setupBloom(gl, shaders, ui) {
    console.log(shaders);
    const bloom = {
        ...createFramebuffer(gl),
        ...createBloomPrograms(gl, shaders, ui),
    };

    return bloom;
}

function createTexture(gl, width, height) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    if (!gl.isTexture(texture)) {
        console.error("Failed to create texture");
    }

    return texture;
}

function attachTextureToFramebuffer(gl, framebuffer, texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
    );

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer is not complete");
    }
}

function createFramebuffer(gl) {
    const sceneFramebuffer = gl.createFramebuffer();
    const sceneTexture = createTexture(gl, canvas.width, canvas.height);

    const brightFramebuffer = gl.createFramebuffer();
    const brightTexture = createTexture(gl, canvas.width, canvas.height);

    const blurFramebuffer = gl.createFramebuffer();
    const blurTexture = createTexture(gl, canvas.width, canvas.height);

    attachTextureToFramebuffer(gl, sceneFramebuffer, sceneTexture);
    attachTextureToFramebuffer(gl, brightFramebuffer, brightTexture);
    attachTextureToFramebuffer(gl, blurFramebuffer, blurTexture);

    return {
        sceneFramebuffer,
        sceneTexture,
        brightFramebuffer,
        brightTexture,
        blurFramebuffer,
        blurTexture,
    };
}

function createBloomPrograms(gl, shaders, ui) {
    const bright = createPostFXProgram(
        gl,
        shaders.bloom.bright.vert,
        shaders.bloom.bright.frag,
        ui
    );
    const blur = createPostFXProgram(
        gl,
        shaders.bloom.blur.vert,
        shaders.bloom.blur.frag,
        ui
    );
    const combine = createPostFXProgram(
        gl,
        shaders.bloom.combine.vert,
        shaders.bloom.combine.frag,
        ui
    );

    const clear = createPostFXProgram(
        gl,
        shaders.bloom.clear.vert,
        shaders.bloom.clear.frag,
        ui
    );

    return { bright, blur, combine, clear };
}

export function renderBloom(gl, bloom, ui) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, bloom.brightFramebuffer);
    // Clear usign a transparent color
    gl.useProgram(bloom.clear.program);
    gl.uniform4fv(
        gl.getUniformLocation(bloom.clear.program, "u_color"),
        [0.0, 0.0, 0.0, 0.2]
    );
    drawQuad(gl, bloom.clear.positionLocation, bloom.clear.quadBuffer);

    // Bright pass
    gl.useProgram(bloom.bright.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bloom.sceneTexture);
    gl.uniform1i(gl.getUniformLocation(bloom.bright.program, "u_texture"), 0);
    drawQuad(gl, bloom.bright.positionLocation, bloom.bright.quadBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, bloom.blurFramebuffer);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(bloom.blur.program);
    gl.uniform2f(
        gl.getUniformLocation(bloom.blur.program, "u_resolution"),
        canvas.width,
        canvas.height
    );
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bloom.brightTexture);
    gl.uniform1fv(
        gl.getUniformLocation(bloom.blur.program, "u_weights"),
        weights
    );
    gl.uniform1i(gl.getUniformLocation(bloom.blur.program, "u_texture"), 0);
    drawQuad(gl, bloom.blur.positionLocation, bloom.blur.quadBuffer);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(bloom.combine.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, bloom.sceneTexture);
    gl.uniform1i(gl.getUniformLocation(bloom.combine.program, "u_scene"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bloom.blurTexture);
    gl.uniform1i(gl.getUniformLocation(bloom.combine.program, "u_bloom"), 1);
    drawQuad(gl, bloom.combine.positionLocation, bloom.combine.quadBuffer);
}
