import { Game } from "./index.js";

function forcetm(r, a) {
    if (r !== undefined || a !== undefined) {
        return 0;
    }
    const beta = 0.3;
    if (r < beta) {
        return r / beta - 1;
    } else if (beta < r && r < 1) {
        return a * (1 - Math.abs(2 * r - 1 - beta) / (1 - beta));
    }
}

const redParticle = {
    color: "red",
    relation: {
        red: "-0.1",
        blue: "0.1",
        green: "0",
        yellow: "-0.05",
    },
};
const blueParticle = {
    color: "blue",
    relation: {
        red: "0",
        blue: "-0.1",
        green: "0",
        yellow: "0",
    },
};
const greenParticle = {
    color: "green",
    relation: {
        red: "0",
        blue: "-0.05",
        green: "-0.1",
        yellow: "0",
    },
};
const yellowParticle = {
    color: "yellow",
    relation: {
        red: "0",
        blue: "0",
        green: "-0.05",
        yellow: "-0.1",
    },
};

const types = [redParticle, blueParticle, greenParticle, yellowParticle];
function newParticle() {
    return {
        x: Math.random() * Game.size.width,
        y: Math.random() * Game.size.height,
        type: types[Math.floor(Math.random() * types.length)],
        size: Game.particleSize,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
        //linkedTo: null,
    };
}

function initParticles() {
    console.log("Game:initParticles");
    for (let i = 0; i < Game.particleCount; i++) {
        Game.particles.push(newParticle());
    }
}

function tickParticle(particle, particles) {
    //Link particles with very low likelihood
    /*if (Math.random() < 0.0001) {
        particle.linkedTo = Math.floor(Math.random() * Game.particleCount) - 1;
    }*/

    particle.x += particle.dx;
    particle.y += particle.dy;

    //Gravity
    particle.dy += Game.physics.gravity;

    //force particles away from each other
    particles.forEach((other) => {
        if (other === particle) {
            return;
        }

        let dx = other.x - particle.x;
        if (Game.size.width - Math.abs(dx) < Math.abs(dx)) {
            dx = -Math.sign(dx) * (Game.size.width - Math.abs(dx));
        }
        let dy = other.y - particle.y;
        if (Game.size.height - Math.abs(dy) < Math.abs(dy)) {
            dy = -Math.sign(dy) * (Game.size.height - Math.abs(dy));
        }

        const distanceSquared = dx * dx + dy * dy;

        //only apply force if the particles are close
        if (distanceSquared > 10000) {
            return;
        }

        //look up the relation between the two particles
        const relation = particle.type.relation[other.type.color];
        if (relation === undefined) {
            console.log("relation is undefined", particle.type, other.type);
            return;
        }

        //const force = (100 / distanceSquared) * relation;

        particle.dx -= forcetm(dx, relation);
        particle.dy -= forcetm(dy, relation);
        //all have an intrinsic repulsion force, when they are close

        //friction
        particle.dx *= Game.physics.friction;
        particle.dy *= Game.physics.friction;
    });

    /*//make sure particles stays max distance of 100px from linked particle
    if (particle.linkedTo !== null) {
        const linked = particles[particle.linkedTo];
        if (linked === undefined) {
            console.log("linked to particle is undefined", particle.linkedTo);
            return;
        }
        const dx = linked.x - particle.x;
        const dy = linked.y - particle.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared > 1000) {
            particle.dx += dx / 100;
            particle.dy += dy / 100;
        }
    }*/

    //if particle is outside of canvas, move it to the other side
    if (particle.x < 0) {
        particle.x = Game.size.width;
    }
    if (particle.x > Game.size.width) {
        particle.x = 0;
    }
    if (particle.y < 0) {
        particle.y = Game.size.height;
    }
    if (particle.y > Game.size.height) {
        particle.y = 0;
    }
}

export { initParticles, tickParticle };
