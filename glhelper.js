import { reload, clear } from "./index.js";
export function initalizeGL(render, ui, callNumber) {
    if (callNumber === undefined || callNumber === 1) {
        callNumber = 1;

        window.addEventListener("blur", () => {
            console.log("Tab lost focus");
            ui.warn("Tab lost focus, removing WebGL context...");
            ui.inactiveTab();
            clear();
        });

        window.addEventListener("focus", () => {
            console.log("Tab regained focus");
            ui.log("Tab regained focus, re-initializing...");
            reload();
        });
    } else if (callNumber > 4) {
        ui.error("WebGL not supported, exiting");
        ui.noGL();
        cancelAnimationFrame(render);
        return null;
    } else if (callNumber > 1) {
        ui.warn("Trying to re-initialize WebGL...");
    } else {
        ui.log("Initialize WebGL...");
    }

    let canvas = document.getElementById("canvas");

    if (!canvas) {
        ui.warn("Canvas not found, creating new...");

        canvas = document.createElement("canvas");
        canvas.id = "canvas";
        ui.content.appendChild(canvas);
    }

    canvas.addEventListener(
        "webglcontextlost",
        function (event) {
            event.preventDefault();
            ui.error("WebGL context lost, trying to re-establish...");
            ui.noGL();
            cancelAnimationFrame(render);
        },
        false
    );

    canvas.addEventListener(
        "webglcontextrestored",
        (event) => {
            event.preventDefault();
            ui.log("WebGL context restored, reloading...");
            window.location.reload();
        },
        false
    );

    //get context

    ui.log("Canvas found, trying to get context...");

    let gl = null;
    try {
        gl =
            canvas.getContext("webgl2") ||
            canvas.getContext("experimental-webgl");
    } catch (e) {
        ui.error(
            "An error occurred while trying to get the WebGL context:",
            e.message
        );
        ui.noGL();
        return null;
    }

    if (!gl) {
        //remove canvas
        ui.error("WebGL context not found");

        try {
            ui.content.removeChild(canvas);
            canvas.remove();
        } catch (e) {
            ui.error("An error occurred while trying to remove the canvas:");
            ui.error(
                "An error occurred while trying to remove the canvas:",
                e.message
            );
        }

        initalizeGL(render, ui, callNumber + 1);

        return;
        /*ui.error("WebGL not supported, exiting");
        ui.noGL();

        
        return null;*/
    }

    ui.log("WebGL context found, completing initialization...");
    return [gl, canvas];
}
