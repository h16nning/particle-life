export function initUI(config) {
    console.log("init: UI");
    const ui = {
        content: document.getElementById("content"),
        canvas: document.getElementById("canvas"),
        shell: document.getElementById("shell"),
        sidebar: document.getElementById("sidebar"),
        playPause: document.getElementById("play_pause"),
        reload: document.getElementById("reload"),
        saveConfig: document.getElementById("save_config"),
        logOutput: document.getElementById("log"),
        input_simulationSpeed: document.getElementById("input_simulationSpeed"),
        input_n: document.getElementById("input_n"),
        input_pointSize: document.getElementById("input_pointSize"),
        input_rMax: document.getElementById("input_rMax"),
        input_forceFactor: document.getElementById("input_forceFactor"),
        input_friction: document.getElementById("input_friction"),
        input_matrixSize: document.getElementById("input_matrixSize"),
        matrixDisplay: document.getElementById("matrixDisplay"),
    };

    function log(...msg) {
        //add span with message
        const span = document.createElement("span");
        span.textContent = msg.join(" ");
        ui.logOutput.appendChild(span);
    }

    function error(...msg) {
        console.error(...msg);
        //add span with message
        const span = document.createElement("span");
        span.style.color = "red";
        span.textContent = msg.join(" ");
        ui.logOutput.appendChild(span);
    }

    function warn(...msg) {
        //add span with message
        const span = document.createElement("span");
        span.style.color = "yellow";
        span.textContent = msg.join(" ");
        ui.logOutput.appendChild(span);
    }

    function noGL() {
        if (document.getElementById("noGL")) {
            return;
        }
        const noGL = document.createElement("div");
        noGL.textContent = "No WebGL context found";
        noGL.id = "noGL";
        ui.content.appendChild(noGL);
    }

    function inactiveTab() {
        if (document.getElementById("inactiveTab")) {
            return;
        }
        const inactiveTab = document.createElement("div");
        inactiveTab.textContent = "Tab lost focus";
        inactiveTab.id = "inactiveTab";
        ui.content.appendChild(inactiveTab);
    }

    function reEvaluateMatrix() {
        //create a grid of m*m divs
        const m = config.m + 1;
        const matrix = ui.matrixDisplay;
        //(styling is done in css)
        //only grid-template-columns is set here
        if (config.matrix == null) {
            return;
        }
        matrix.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
        for (let i = 0; i < m * m; i++) {
            if (i % m === 0 || i < m) {
                const index = (i < m ? i : i / m) - 1;
                const div = document.createElement("div");
                div.textContent = index;
                div.style.backgroundColor = `hsl(${
                    (360 * index) / config.m
                }, 100%, 50%)`;
                if (i === 0) {
                    div.classList.add("corner");
                } else {
                    div.classList.add("round");
                }
                matrix.appendChild(div);
            } else {
                const button = document.createElement("button");
                button.onclick = () => {
                    //remove id "selected_matrix_cell" from other, if it exists
                    const previous = document.getElementById(
                        "selected_matrix_cell"
                    );
                    if (previous) {
                        previous.id = "";
                    }
                    //add id to self
                    button.id = "selected_matrix_cell";
                };
                button.textContent = "*";

                const x = (i % m) - 1;
                const y = Math.floor(i / m) - 1;

                button.textContent = `${x},${y}`;

                const value = config.matrix[x][y];

                button.style.backgroundColor = `hsl(${
                    (120 * (config.matrix[x][y] + 1)) / 2
                }, 100%, 50%)`;
                matrix.appendChild(button);
            }
        }
    }

    //load config
    const savedConfig = loadConfig();
    if (savedConfig) {
        Object.assign(config, savedConfig);
        log("Loaded config from local storage");
    }

    ui.reload.addEventListener("click", () => {
        window.location.reload();
    });

    ui.playPause.addEventListener("click", () => {
        config.paused = !config.paused;
        //change button text
        if (config.paused) {
            ui.playPause.textContent = "Play";
        } else {
            ui.playPause.textContent = "Pause";
        }
    });

    ui.saveConfig.addEventListener("click", () => {
        saveConfig(config);
        log("Saved config to local storage");
    });

    ui.input_n.value = config.n;
    ui.input_n.addEventListener(
        "change",
        () => {
            const input = parseInt(ui.input_n.value);
            config.n = input;
            ui.input_n.value = config.n;
        },
        false
    );

    ui.input_simulationSpeed.value = config.simulationSpeed;
    ui.input_simulationSpeed.addEventListener(
        "change",
        () => {
            config.simulationSpeed = parseFloat(ui.input_simulationSpeed.value);
        },
        false
    );

    ui.input_pointSize.value = config.pointSize;
    ui.input_pointSize.addEventListener(
        "change",
        () => {
            config.pointSize = parseFloat(ui.input_pointSize.value);
        },
        false
    );

    ui.input_rMax.value = config.rMax;
    ui.input_rMax.addEventListener(
        "change",
        () => {
            config.rMax = parseFloat(ui.input_rMax.value);
        },
        false
    );

    ui.input_forceFactor.value = config.forceFactor;
    ui.input_forceFactor.addEventListener(
        "change",
        () => {
            config.forceFactor = parseFloat(ui.input_forceFactor.value);
        },
        false
    );

    ui.input_friction.value = config.friction;
    ui.input_friction.addEventListener(
        "change",
        () => {
            config.friction = parseFloat(ui.input_friction.value);
        },
        false
    );

    ui.input_matrixSize.value = config.m;
    ui.input_matrixSize.addEventListener(
        "change",
        () => {
            config.m = parseInt(ui.input_matrixSize.value);
        },
        false
    );

    addKeyboardShortcuts(config, { ...ui, reEvaluateMatrix });

    setInterval(() => {
        if (ui.logOutput.children.length > 0) {
            while (ui.logOutput.children.length > 25) {
                ui.logOutput.removeChild(ui.logOutput.children[0]);
            }
        }
    }, 1000);

    return {
        log,
        error,
        warn,
        noGL,
        inactiveTab,
        reEvaluateMatrix,
        //all elements
        ...ui,
    };
}

function addKeyboardShortcuts(config, ui) {
    document.addEventListener("keydown", (e) => {
        //focus on input field
        if (e.key === "z") {
            ui.input_simulationSpeed.focus();
        } else if (e.key === "n") {
            ui.input_n.focus();
        } else if (e.key === "p") {
            ui.input_pointSize.focus();
        } else if (e.key === "r") {
            ui.input_rMax.focus();
        } else if (e.key === "f") {
            ui.input_forceFactor.focus();
        } else if (e.key === "c") {
            ui.input_friction.focus();
        } else if (e.key === "p") {
            config.paused = !config.paused;
        } else if (e.key === "s") {
            ui.shell.classList.toggle("sidebar-hidden");
        } else if (e.key === "+") {
            const cell = document.getElementById("selected_matrix_cell");
            if (cell) {
                console.log(cell);
                const [x, y] = cell.textContent.split(",");
                config.matrix[x][y] = Math.min(config.matrix[x][y] + 0.05, 1);
                cell.style.backgroundColor = `hsl(${
                    (120 * (config.matrix[x][y] + 1)) / 2
                }, 100%, 50%)`;
            }
        } else if (e.key === "-") {
            const cell = document.getElementById("selected_matrix_cell");
            if (cell) {
                console.log(cell);
                const [x, y] = cell.textContent.split(",");
                config.matrix[x][y] = Math.max(config.matrix[x][y] - 0.05, -1);
                cell.style.backgroundColor = `hsl(${
                    (120 * (config.matrix[x][y] + 1)) / 2
                }, 100%, 50%)`;
            }
        }
    });
}

function saveConfig(config) {
    localStorage.setItem("config", JSON.stringify(config));
}

function loadConfig() {
    const config = localStorage.getItem("config");
    if (config) {
        return JSON.parse(config);
    }
    return {};
}
