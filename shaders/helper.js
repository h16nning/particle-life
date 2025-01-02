export function createShader(gl, type, source, ui) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (
        !gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
        !gl.isContextLost()
    ) {
        const shaderType = type === gl.VERTEX_SHADER ? "vertex" : "fragment";
        ui.error(
            `Error while linking ${shaderType} shader:`,
            gl.getShaderInfoLog(shader)
        );
        gl.deleteShader(shader);
    }
    return shader;
}

export function createProgram(gl, vertSource, fragSource, ui) {
    const program = gl.createProgram();
    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertSource, ui);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragSource, ui);
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (
        !gl.getProgramParameter(program, gl.LINK_STATUS) &&
        !gl.isContextLost()
    ) {
        ui.error("Error while linking program:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
    return program;
}

export function createPostFXProgram(gl, vertSource, fragSource, ui) {
    const quadVertices = new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
    ]);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const program = createProgram(gl, vertSource, fragSource, ui);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    return {
        program: program,
        quadBuffer: quadBuffer,
        positionLocation: positionLocation,
    };
}

export function createDebugTextureProgram(gl, vertSource, fragSource, ui) {
    const quadVertices = new Float32Array([
        -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
    ]);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    const program = createProgram(gl, vertSource, fragSource, ui);
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texLocation = gl.getUniformLocation(program, "u_texture");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");

    return {
        program: program,
        positionLocation: positionLocation,
        resolutionLocation: resolutionLocation,
        texLocation: texLocation,
        quadBuffer: quadBuffer,
    };
}
