precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_weights[9]; //Adjust based on blur size! blurSize * 2 + 1

void main() {
    vec2 texelSize = vec2(1.0) / u_resolution;
    vec4 color = vec4(0.0);
    float totalWeight = 0.0;
    const int blurSize = 4;

    for(int x = -blurSize; x <= blurSize; x++) {
        for(int y = -blurSize; y <= blurSize; y++) {
            vec2 offset = vec2(float(x), float(y)) * texelSize;
            float weight = u_weights[blurSize + x] * u_weights[blurSize + y];
            color += texture2D(u_texture, v_texcoord + offset) * weight;
            totalWeight += weight;
        }
    }

    gl_FragColor = color / totalWeight;
}