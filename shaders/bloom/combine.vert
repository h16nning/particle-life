attribute vec4 a_position;
varying vec2 v_texcoord;

void main() {
    v_texcoord = a_position.xy * 0.5 + 0.5;
    gl_Position = a_position;
}