let particles;

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

export function resizeRandomMatrix(config) {
    const rows = [];
    for (let i = 0; i < config.m; i++) {
        const row = [];
        for (let j = 0; j < config.m; j++) {
            if (i < config.matrix.length && j < config.matrix[i].length) {
                row.push(config.matrix[i][j]);
            } else {
                row.push(Math.random() * 2 - 1);
            }
        }
        rows.push(row);
    }
    config.matrix = rows;
    return rows;
}

const generation = {
    BY_COLOR_DISTRIBUTION: (config) => {
        setParticleColors(config);
        for (let i = 0; i < config.MAX_PARTICLES; i++) {
            particles.positions.x[i] = Math.random() * 2 - 1;
            particles.positions.y[i] = Math.random() * 2 - 1;
            particles.positions.z[i] =
                Math.random() * config.zDepth - config.zDepthHalf;
            particles.velocities.x[i] = 0;
            particles.velocities.y[i] = 0;
            particles.velocities.z[i] = 0;
        }
    },
};

function generateParticles(config) {
    particles = {
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
    generation.BY_COLOR_DISTRIBUTION(config);
    return particles;
}

function setParticleColors(config) {
    const colorDistribution = config.colorDistribution;
    const colorWeights = [];
    for (let i = 0; i < config.m; i++) {
        colorWeights.push(Math.pow(i + 1, colorDistribution));
    }
    const totalWeight = colorWeights.reduce((a, b) => a + b, 0);

    const normalizedWeights = colorWeights.map((w) => w / totalWeight); //-> sum then equals 1

    for (let i = 0; i < config.MAX_PARTICLES; i++) {
        const random = Math.random();
        let color = 0;
        let sum = 0;
        for (let j = 0; j < config.m; j++) {
            sum += normalizedWeights[j];
            if (random < sum) {
                color = j;
                break;
            }
        }
        particles.colors[i] = color;
    }

    console.log(particles.colors);
}

function getParticles() {
    return particles;
}

export {
    logColorDistribution,
    makeRandomMatrix,
    generateParticles,
    setParticleColors,
    getParticles,
};
