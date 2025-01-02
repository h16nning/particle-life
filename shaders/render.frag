#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 outColor;

void main() {
    if(length(gl_PointCoord - vec2(0.5f)) > 0.5f) {
        discard;
    }
    outColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
}