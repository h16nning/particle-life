export async function loadShaders() {
    const shaders = {
        render: {
            frag: await (await fetch("shaders/render.frag")).text(),
            vert: await (await fetch("shaders/render.vert")).text(),
        },
        particle: {
            frag: await (await fetch("shaders/particle.frag")).text(),
            vert: await (await fetch("shaders/particle.vert")).text(),
        },
    };

    return shaders;
}
