function logColorDistribution(colors) {
    //log count of each unique number
    const colorCount = colors.reduce((colorCount, color) => {
        colorCount[color] = (colorCount[color] || 0) + 1;
        return colorCount;
    }, {});
    console.log(colorCount);
}

function makeRandomMatrix(config) {
    const rows = [];
    for (let i = 0; i < config.m; i++) {
        const row = [];
        for (let j = 0; j < config.m; j++) {
            row.push(Math.random() * 2 - 1);
        }
        rows.push(row);
    }
    return rows;
}

const generation = {
    RANDOM: (p, config) => {
        for (let i = 0; i < config.MAX_PARTICLES; i++) {
            p.colors[i] = Math.floor(
                Math.min(Math.random() * config.m, config.m - 1)
            );
            p.positions.x[i] = Math.random() * 2 - 1;
            p.positions.y[i] = Math.random() * 2 - 1;
            p.positions.z[i] =
                Math.random() * config.zDepth - config.zDepthHalf;
            p.velocities.x[i] = 0;
            p.velocities.y[i] = 0;
            p.velocities.z[i] = 0;
        }
    },
    QUADRATIC_COLOR_DISTRIBUTION: (p, config) => {
        for (let i = 0; i < config.MAX_PARTICLES; i++) {
            p.colors[i] = Math.floor(
                Math.min(Math.random() * Math.random() * config.m, config.m - 1)
            );
            p.positions.x[i] = Math.random() * 2 - 1;
            p.positions.y[i] = Math.random() * 2 - 1;
            p.positions.z[i] =
                Math.random() * config.zDepth - config.zDepthHalf;
            p.velocities.x[i] = 0;
            p.velocities.y[i] = 0;
            p.velocities.z[i] = 0;
        }
    },
    CUBIC_COLOR_DISTRIBUTION: (p, config) => {
        for (let i = 0; i < config.MAX_PARTICLES; i++) {
            p.colors[i] = Math.floor(
                Math.min(
                    Math.random() * Math.random() * Math.random() * config.m,
                    config.m - 1
                )
            );
            p.positions.x[i] = Math.random() * 2 - 1;
            p.positions.y[i] = Math.random() * 2 - 1;
            p.positions.z[i] =
                Math.random() * config.zDepth - config.zDepthHalf;
            p.velocities.x[i] = 0;
            p.velocities.y[i] = 0;
            p.velocities.z[i] = 0;
        }
    },
};

function generateParticles(config) {
    const p = {
        positions: {
            x: new Float32Array(config.MAX_PARTICLES),
            y: new Float32Array(config.MAX_PARTICLES),
            z: new Float32Array(config.MAX_PARTICLES),
        },
        velocities: {
            x: new Float32Array(config.MAX_PARTICLES),
            y: new Float32Array(config.MAX_PARTICLES),
            z: new Float32Array(config.MAX_PARTICLES),
        },
        colors: new Int32Array(config.MAX_PARTICLES),
    };
    generation.RANDOM(p, config);
    return p;
}

export { logColorDistribution, makeRandomMatrix, generateParticles };
