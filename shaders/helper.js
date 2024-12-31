export function createShader(gl, type, source, ui) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (
        !gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
        !gl.isContextLost()
    ) {
        ui.error("Error while linking shader:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
    return shader;
}
