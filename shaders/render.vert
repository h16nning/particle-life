#version 300 es
uniform vec3 u_offset;
uniform float u_zDepth;
uniform float u_pointSize;

in vec3 a_position;
in vec4 a_color;
out vec4 v_color;

void main() {
    float f = 1.0f;// / (a_position.z - u_zDepth);
        //run position through orthographic projection, apply offset
    vec3 updatedPositions = vec3(f * a_position.x * 0.8f, f * a_position.y, 1.0f) + u_offset * 1.425f;

    gl_Position = vec4(updatedPositions, 1.0f);
    gl_PointSize = u_pointSize;
    v_color = a_color;
}