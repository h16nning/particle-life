#version 300 es

precision mediump float;

flat in int v_color;
in vec3 v_position;
uniform mediump int u_matrixSize;
uniform float u_pointSize;
out vec4 outColor;
flat in float debug;

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0f, 2.0f / 3.0f, 1.0f / 3.0f, 3.0f);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0f - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0f, 1.0f), c.y);
}

void main() {
    if(debug == -1.0f) {
        outColor = vec4(1.0f, 1.0f, 1.0f, 1.0f);
    } else {
        if(u_pointSize > 1.0f && length(gl_PointCoord - vec2(0.5f)) > 0.5f) {
            discard;
        }
        float saturation = 0.7f;

        if(abs(v_position.x) > 0.9f) {
            saturation = 7.0f * (1.0f - abs(v_position.x));
        }
        outColor = vec4(hsv2rgb(vec3(float(v_color) / float(u_matrixSize), saturation, 0.8f)), 1.0f);
    }
}