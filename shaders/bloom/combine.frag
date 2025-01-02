precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
void main() {
    vec4 sceneColor = texture2D(u_scene, v_texcoord);
    vec4 bloomColor = texture2D(u_bloom, v_texcoord);
    gl_FragColor = bloomColor + sceneColor;
}