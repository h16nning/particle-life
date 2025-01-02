#version 300 es

precision mediump float;

in vec4 a_position;
in vec3 a_velocity;
in int a_color;
uniform float u_time;
uniform float u_dt;
uniform int u_n;
uniform float u_zDepth;
uniform float u_pointSize;
uniform float u_friction;
uniform float u_forceFactor;
uniform float u_rMax;
uniform float u_beta;
uniform sampler2D u_positionTexture;
uniform sampler2D u_velocityTexture;
uniform sampler2D u_colorTexture;
//TOD0 change to sampler2DArray to support dynamic matrix size
uniform sampler2D u_matrixTexture;
uniform mediump int u_matrixSize;
out vec3 v_velocity;
out vec3 v_position;
flat out int v_color;
flat out float debug;

float force(float r, float a) {
    if(r < u_beta) {
        return (r / u_beta - 1.0f);
    } else if(u_beta < r && r < 1.0f) {
        return a * (1.0f - abs(2.0f * r - 1.0f - u_beta) / (1.0f - u_beta));
    } else {
        return 0.0f;
    }
}

void main() {
    int texture_size = textureSize(u_positionTexture, 0).x;

    debug = 0.0f;
    vec3 velocity = a_velocity;

    vec3 position = a_position.xyz;
    vec3 totalForce = vec3(0.0f);

    int closeDistanceCounter = 0;
    for(int i = 0; i < u_n; i++) {
        if(i == gl_VertexID)
            continue; // No self-interaction

        //read position from texture
        ivec2 texelCoord = ivec2(i % texture_size, i / texture_size);

        vec3 otherPosition = texelFetch(u_positionTexture, texelCoord, 0).xyz;
        vec3 r = otherPosition - position;

        if(1.0f < abs(r.x)) {
            r.x -= 2.0f * sign(r.x);
        }
        if(1.0f < abs(r.y)) {
            r.y -= 2.0f * sign(r.y);
        }
        if(u_zDepth / 2.0f < abs(r.z)) {
            r.z -= u_zDepth * sign(r.z);
        }

        float distance = length(r);

        if(distance > 0.0f && distance < u_rMax) {
            int index = a_color * u_matrixSize + int(round(texelFetch(u_colorTexture, texelCoord, 0).r * float(u_matrixSize)));

            float a = texelFetch(u_matrixTexture, ivec2(index, 0), 0).g;

            totalForce += (r / distance) * force(distance / u_rMax, a);
        }
    }

    totalForce *= u_rMax * u_forceFactor;
    velocity += totalForce * u_dt;
    velocity *= sqrt(u_dt / u_friction);

    if(length(velocity) > 0.3f) {
        velocity = normalize(velocity) * 0.3f;
    }

    position += velocity * u_dt;

    if(position.x < -1.0f) {
        position.x += 2.0f;
    } else if(position.x > 1.0f) {
        position.x -= 2.0f;
    }
    if(position.y < -1.0f) {
        position.y = 2.0f + position.y;
    } else if(position.y > 1.0f) {
        position.y -= 2.0f;
    }
    if(position.z < -u_zDepth / 2.0f) {
        position.z += u_zDepth;
    } else if(position.z > u_zDepth / 2.0f) {
        position.z -= u_zDepth;
    }

    v_position = position;
    v_velocity = velocity;
    v_color = a_color;

    float f = 1.0f; //(position.z - u_zDepth);
    gl_Position = vec4(f * position.x * 0.625f, f * position.y, 1.0f, 1.0f);

    if(debug == -1.0f) {
        gl_PointSize = 2.0f * u_pointSize;
    } else {
        gl_PointSize = u_pointSize;//3.0 * (1.0 - abs(position.z)) + 1.0;
    }
}