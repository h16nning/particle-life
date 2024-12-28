import { Game } from "./index.js";

function drawParticle(ctx, particle, particles) {
    ctx.fillStyle = particle.type.color;
    //this doesn't work: color not defined: ctx.fillStyle = color;

    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    if (particle.linkedTo) {
        if (particles[particle.linkedTo] === undefined) {
            console.log("linked to particle is undefined", particle.linkedTo);
            return;
        }
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(
            particles[particle.linkedTo].x,
            particles[particle.linkedTo].y
        );
        ctx.stroke();
    }
}

function render(ctx) {
    ctx.clearRect(0, 0, Game.size.width, Game.size.height);
    Game.particles.forEach((particle) =>
        drawParticle(ctx, particle, Game.particles)
    );
}

export { render };
