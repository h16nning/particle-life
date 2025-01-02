precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;

void main() {
    vec4 color = texture2D(u_texture, v_texcoord);
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    gl_FragColor = color;
    if(brightness > 0.1) {
        gl_FragColor = color;
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
}