import {
    getParticles,
    makeRandomMatrix,
    resizeRandomMatrix,
    setParticleColors,
} from "./particles.js";

export function initUI(config) {
    console.log("init: UI");
    const ui = {
        //set in init, but after initUI is called, used to react to user input changes to m and new matrix

        content: document.getElementById("content"),
        canvas: document.getElementById("canvas"),
        shell: document.getElementById("shell"),
        sidebar: document.getElementById("sidebar"),
        toggleSidebar: document.getElementById("toggleSidebar"),
        playPause: document.getElementById("play_pause"),
        reload: document.getElementById("reload"),
        archiveConfig: document.getElementById("archiveConfig"),
        select_archivedConfig: document.getElementById("select_archivedConfig"),
        logOutput: document.getElementById("log"),
        input_simulationSpeed: document.getElementById("input_simulationSpeed"),
        input_n: document.getElementById("input_n"),
        input_pointSize: document.getElementById("input_pointSize"),
        input_rMax: document.getElementById("input_rMax"),
        input_beta: document.getElementById("input_beta"),
        input_forceFactor: document.getElementById("input_forceFactor"),
        input_friction: document.getElementById("input_friction"),
        input_colorDistribution: document.getElementById(
            "input_colorDistribution"
        ),
        input_matrixSize: document.getElementById("input_matrixSize"),
        matrixDisplay: document.getElementById("matrixDisplay"),
        randomizeMatrix: document.getElementById("randomizeMatrix"),
        colorCountDisplay: document.getElementById("colorCountDisplay"),
    };

    function log(...msg) {
        console.log(...msg);
        const span = document.createElement("span");
        span.textContent = msg.join(" ");
        ui.logOutput.appendChild(span);
    }

    function error(...msg) {
        console.error(...msg);
        const span = document.createElement("span");
        span.style.color = "red";
        span.textContent = msg.join(" ");
        ui.logOutput.appendChild(span);
    }

    function warn(...msg) {
        console.warn(...msg);
        const span = document.createElement("span");
        span.style.color = "yellow";
        span.textContent = msg.join(" ");
        ui.logOutput.appendChild(span);
    }

    function debug(...msg) {
        console.debug(...msg);
        const span = document.createElement("span");
        span.style.color = "magenta";
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

    function setupMatrixDisplay(config) {
        const m = config.m + 1;
        const matrix = ui.matrixDisplay;

        //remove all children
        matrix.innerHTML = "";

        if (config.matrix == null) {
            ui.error("Matrix is null");
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

                if (config.matrix[x] == null) {
                    config.matrix[x] = [];
                    warn("config.matrix[x] is null");
                }
                button.textContent = `${x},${y}`;

                button.style.backgroundColor = `hsl(${
                    (120 * (config.matrix[x][y] + 1)) / 2
                }, 100%, 50%)`;
                matrix.appendChild(button);
            }
        }
    }

    function setupColorCount(colors) {
        //display a bar diagram of the color distribution
        const colorCount = ui.colorCountDisplay;
        colorCount.innerHTML = "";
        const colorCountArray = new Array(config.m).fill(0);
        for (let i = 0; i < config.n; i++) {
            colorCountArray[colors[i]]++;
        }
        for (let i = 0; i < config.m; i++) {
            const div = document.createElement("div");
            div.style.width = `${(colorCountArray[i] / config.n) * 100}%`;
            div.style.backgroundColor = `hsl(${
                (360 * i) / config.m
            }, 100%, 50%)`;
            colorCount.appendChild(div);

            //add text
            const text = document.createElement("span");
            //count (percentage)
            text.textContent = `${colorCountArray[i]} (${(
                (colorCountArray[i] / config.n) *
                100
            ).toFixed(1)}%)`;
            div.appendChild(text);
        }
    }

    //load config
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

    ui.archiveConfig.addEventListener("click", () => {
        const name = prompt("Enter a name for the archived config");
        const date = new Date();
        archiveConfig(config, date, name);
        log("Archived config: ", date);
    });

    ui.select_archivedConfig.innerHTML =
        "<option disabled selected value>Select archived config</option>" +
        getArchivedConfigs().map((c, i) => {
            const isSelected = c.date === config.date;
            console.log(c.date, config.date);
            return `<option value="${i} ${isSelected ? "selected" : ""}">${
                c.name || c.date
            }</option>`;
        });
    ui.select_archivedConfig.addEventListener("change", () => {
        const index = parseInt(ui.select_archivedConfig.value);
        const archivedConfig = loadArchivedConfig(index);
        console.log(archivedConfig);
        if (archivedConfig) {
            console.log(archiveConfig);
            Object.assign(config, archivedConfig);
            saveConfig(config);
            console.log(config);
            window.location.reload();

            log("Loaded archived config: ", JSON.stringify(archivedConfig));
            log("Reloading in 100 seconds");
        }
    });

    ui.input_n.value = config.n;
    ui.input_n.addEventListener(
        "change",
        () => {
            const input = parseInt(ui.input_n.value);
            config.n = input;
            saveConfig(config);
        },
        false
    );

    ui.input_simulationSpeed.value = config.simulationSpeed;
    ui.input_simulationSpeed.addEventListener(
        "change",
        () => {
            config.simulationSpeed = parseFloat(ui.input_simulationSpeed.value);
            saveConfig(config);
        },
        false
    );

    ui.input_pointSize.value = config.pointSize;
    ui.input_pointSize.addEventListener(
        "change",
        () => {
            config.pointSize = parseFloat(ui.input_pointSize.value);
            saveConfig(config);
        },
        false
    );

    ui.input_rMax.value = config.rMax;
    ui.input_rMax.addEventListener(
        "change",
        () => {
            config.rMax = parseFloat(ui.input_rMax.value);
            saveConfig(config);
        },
        false
    );

    ui.input_beta.value = config.beta;
    ui.input_beta.addEventListener(
        "change",
        () => {
            config.beta = parseFloat(ui.input_beta.value);
            saveConfig(config);
        },
        false
    );

    ui.input_forceFactor.value = config.forceFactor;
    ui.input_forceFactor.addEventListener(
        "change",
        () => {
            config.forceFactor = parseFloat(ui.input_forceFactor.value);
            saveConfig(config);
        },
        false
    );

    ui.input_friction.value = config.friction;
    ui.input_friction.addEventListener(
        "change",
        () => {
            config.friction = parseFloat(ui.input_friction.value);
            saveConfig(config);
        },
        false
    );

    ui.input_colorDistribution.value = config.colorDistribution;
    ui.input_colorDistribution.addEventListener(
        "change",
        () => {
            config.colorDistribution = parseFloat(
                ui.input_colorDistribution.value
            );
            saveConfig(config);
            setParticleColors(config);
            setupColorCount(getParticles().colors);
        },
        false
    );

    ui.input_matrixSize.value = config.m;
    ui.input_matrixSize.addEventListener(
        "change",
        () => {
            config.m = parseInt(ui.input_matrixSize.value);
            resizeRandomMatrix(config);
            saveConfig(config);
            setParticleColors(config);
            setupMatrixDisplay(config);
            setupColorCount(getParticles().colors);
        },
        false
    );

    ui.randomizeMatrix.addEventListener(
        "click",
        () => {
            config.matrix = makeRandomMatrix(config);
            saveConfig(config);
            setupMatrixDisplay(config);
        },
        false
    );

    ui.toggleSidebar.addEventListener("click", () => {
        ui.shell.classList.toggle("sidebar-hidden");
    });

    addKeyboardShortcuts(config, { ...ui, setupMatrixDisplay });

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
        debug,
        noGL,
        inactiveTab,
        setupMatrixDisplay,
        setupColorCount,
        setParticleReference: (p) => {
            ui.particleReference = p;
        },
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
                config.matrix[x][y] = Math.min(config.matrix[x][y] + 0.15, 1);
                cell.style.backgroundColor = `hsl(${
                    (120 * (config.matrix[x][y] + 1)) / 2
                }, 100%, 50%)`;
                saveConfig(config);
            }
        } else if (e.key === "-") {
            const cell = document.getElementById("selected_matrix_cell");
            if (cell) {
                console.log(cell);
                const [x, y] = cell.textContent.split(",");
                config.matrix[x][y] = Math.max(config.matrix[x][y] - 0.15, -1);
                cell.style.backgroundColor = `hsl(${
                    (120 * (config.matrix[x][y] + 1)) / 2
                }, 100%, 50%)`;
                saveConfig(config);
            }
        }
    });
}

function saveConfig(config) {
    console.log("saveConfig", config);
    localStorage.setItem("config", JSON.stringify(config));
}

export function loadConfig() {
    const cString = localStorage.getItem("config");
    if (cString) {
        const c = JSON.parse(cString);
        if (!c.date) {
            c.date = new Date();
        }
        return c;
    }
    return {};
}

function archiveConfig(config, date, name) {
    const archive = localStorage.getItem("archive");
    name = name || "Untitled (" + date.toLocalString() + ")";
    if (archive) {
        const parsed = JSON.parse(archive);
        parsed.push({ ...config, date, name });
        localStorage.setItem("archive", JSON.stringify(parsed));
    } else {
        localStorage.setItem("archive", JSON.stringify([{ ...config, date }]));
    }
}

function getArchivedConfigs() {
    const archive = localStorage.getItem("archive");
    if (archive) {
        return JSON.parse(archive);
    }
    return [];
}

function loadArchivedConfig(index) {
    const archive = getArchivedConfigs();
    return archive[index];
}
