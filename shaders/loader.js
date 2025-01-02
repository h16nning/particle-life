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
        bloom: {
            clear: {
                frag: await (await fetch("shaders/bloom/clear.frag")).text(),
                vert: await (await fetch("shaders/bloom/clear.vert")).text(),
            },
            bright: {
                frag: await (await fetch("shaders/bloom/bright.frag")).text(),
                vert: await (await fetch("shaders/bloom/bright.vert")).text(),
            },
            blur: {
                frag: await (await fetch("shaders/bloom/blur.frag")).text(),
                vert: await (await fetch("shaders/bloom/blur.vert")).text(),
            },
            combine: {
                frag: await (await fetch("shaders/bloom/combine.frag")).text(),
                vert: await (await fetch("shaders/bloom/combine.vert")).text(),
            },
        },
        debugTexture: {
            frag: await (await fetch("shaders/debugTexture.frag")).text(),
            vert: await (await fetch("shaders/debugTexture.vert")).text(),
        },
    };

    return shaders;
}
