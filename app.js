document.addEventListener("DOMContentLoaded", function () {


/* =========================================================
   ELEMENTOS DEL REPRODUCTOR
========================================================= */

const playButton =
    document.getElementById("playButton");

const previousButton =
    document.getElementById("previousButton");

const nextButton =
    document.getElementById("nextButton");

const songTitle =
    document.getElementById("songTitle");

const artistName =
    document.getElementById("artistName");

const currentTime =
    document.getElementById("currentTime");

const duration =
    document.getElementById("duration");

const progress =
    document.getElementById("progress");

const scopeStatus =
    document.getElementById("scopeStatus");

const canvas =
    document.getElementById("oscilloscopeCanvas");

const audio =
    document.getElementById("audioPlayer");
  

/* =========================================================
   COMPROBAR ELEMENTOS
========================================================= */

if (!playButton) {
    console.error("BloodyConnect: falta #playButton");
}

if (!audio) {
    console.error("BloodyConnect: falta #audioPlayer");
}

if (!canvas) {
    console.error(
        "BloodyConnect: falta #oscilloscopeCanvas"
    );
}


/* =========================================================
   CANVAS
========================================================= */

let ctx = null;

if (canvas) {

    ctx =
        canvas.getContext("2d");

}


/* =========================================================
   BIBLIOTECA MUSICAL
========================================================= */

const music = [

    {
        title: "Running Late",
        artist: "On-lyne",

        file:
    "https://github.com/bloodycapella42VHS/BLOODYRADIO/raw/refs/heads/main/music/Warframe%20_%20On-lyne%20-%20_Running%20Late_%20%28Official%20Music%20Visualizer%29.mp3",        cover:
            "https://raw.githubusercontent.com/bloodycapella42VHS/BLOODYRADIO/main/covers/images%20%283%29.jpeg"
    }

];


let currentTrack = 0;


/* =========================================================
   WEB AUDIO API
========================================================= */

let audioContext = null;
let analyser = null;
let source = null;


/* =========================================================
   CONFIGURAR AUDIO
========================================================= */

function setupAudio() {

    if (!audio) {
        return;
    }

    if (audioContext) {
        return;
    }


    const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContext) {

        console.error(
            "Web Audio API no disponible."
        );

        return;

    }


    /*
       Necesario para poder analizar audio
       proveniente de una URL externa.
    */


    audioContext =
        new AudioContext();


    analyser =
        audioContext.createAnalyser();


    analyser.fftSize =
        2048;


    analyser.smoothingTimeConstant =
        0.75;


    source =
        audioContext.createMediaElementSource(
            audio
        );


    source.connect(
        analyser
    );


    analyser.connect(
        audioContext.destination
    );

}


/* =========================================================
   FORMATO DE TIEMPO
========================================================= */

function formatTime(seconds) {
    if (
        isNaN(seconds) ||
        !isFinite(seconds)
    ) {

        return "00:00";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    const secs =
        Math.floor(
            seconds % 60
        );


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(secs).padStart(2, "0")
    );

}


/* =========================================================
   CARGAR CANCIÓN
========================================================= */

function loadTrack(index) {

    if (!audio) {
        return;
    }


    if (
        index < 0 ||
        index >= music.length
    ) {

        return;

    }


    currentTrack =
        index;


    const track =
        music[currentTrack];


    /*
       Actualizar información
    */

    if (songTitle) {

        songTitle.textContent =
            track.title;

    }


    if (artistName) {

        artistName.textContent =
            track.artist;

    }


    /*
       Detener audio anterior
    */

    audio.pause();


    /*
       Cargar nueva URL
    */

    audio.src =
        track.file;


    audio.load();


    /*
       Reiniciar progreso
    */

    if (progress) {

        progress.value = 0;

    }


    if (currentTime) {

        currentTime.textContent =
            "00:00";

    }


    if (duration) {

        duration.textContent =
            "00:00";

    }


    if (scopeStatus) {

        scopeStatus.textContent =
            "SIGNAL // READY";

    }


    if (playButton) {

        playButton.textContent =
            "▶";

    }

}


/* =========================================================
   REPRODUCIR
========================================================= */

async function playTrack() {

    if (!audio) {
        return;
    }

    try {

        await audio.play();

        if (playButton) {
            playButton.textContent = "Ⅱ";
        }

        if (scopeStatus) {
            scopeStatus.textContent =
                "SIGNAL // ACTIVE";
        }

    } catch (error) {

        console.error(
            "BloodyConnect Audio Error:",
            error
        );

        if (scopeStatus) {
            scopeStatus.textContent =
                "SIGNAL // AUDIO ERROR";
        }

    }
}


/* =========================================================
   PAUSAR
========================================================= */

function pauseTrack() {

    if (!audio) {
        return;
    }


    audio.pause();


    if (playButton) {

        playButton.textContent =
            "▶";

    }


    if (scopeStatus) {

        scopeStatus.textContent =
            "SIGNAL // PAUSED";

    }

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

if (playButton) {

    playButton.addEventListener(
        "click",
        function () {

            if (!audio) {
                return;
            }


            if (audio.paused) {

                playTrack();

            }

            else {

                pauseTrack();

            }

        }
    );

}


/* =========================================================
   METADATOS DEL AUDIO
========================================================= */

if (audio) {

    audio.addEventListener(
        "loadedmetadata",
        function () {

            if (duration) {

                duration.textContent =
                    formatTime(
                        audio.duration
                    );

            }

        }
    );

}


/* =========================================================
   PROGRESO DEL AUDIO
========================================================= */

if (audio) {

    audio.addEventListener(
        "timeupdate",
        function () {

            if (
                !audio.duration ||
                !isFinite(audio.duration)
            ) {

                return;

            }


            if (progress) {

                progress.value =
                    (
                        audio.currentTime /
                        audio.duration
                    ) * 100;

            }


            if (currentTime) {

                currentTime.textContent =
                    formatTime(
                        audio.currentTime
                    );

            }

        }
    );

}


/* =========================================================
   BARRA DE PROGRESO
========================================================= */

if (progress) {

    progress.addEventListener(
        "input",
        function () {

            if (
                !audio ||
                !audio.duration
            ) {

                return;

            }


            audio.currentTime =
                (
                    progress.value /
                    100
                ) *
                audio.duration;

        }
    );

}


/* =========================================================
   ERRORES DE AUDIO
========================================================= */

if (audio) {

    audio.addEventListener(
        "error",
        function () {

            console.error(
                "BloodyConnect: no se pudo cargar el audio.",
                audio.error
            );


            if (scopeStatus) {

                scopeStatus.textContent =
                    "SIGNAL // AUDIO ERROR";

            }

        }
    );

}


/* =========================================================
   CANVAS / OSCILOSCOPIO
========================================================= */

function resizeCanvas() {

    if (!canvas) {
        return;
    }


    const rect =
        canvas.getBoundingClientRect();


    /*
       Evitar canvas de tamaño 0
    */

    if (
        rect.width <= 0 ||
        rect.height <= 0
    ) {

        return;

    }


    const dpr =
        window.devicePixelRatio ||
        1;


    canvas.width =
        rect.width * dpr;


    canvas.height =
        rect.height * dpr;


    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

}


if (canvas) {

    resizeCanvas();


    window.addEventListener(
        "resize",
        resizeCanvas
    );

}


/* =========================================================
   DIBUJAR OSCILOSCOPIO
========================================================= */

function drawOscilloscope() {

    requestAnimationFrame(
        drawOscilloscope
    );


    if (
        !canvas ||
        !ctx
    ) {

        return;

    }


    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    if (
        width <= 0 ||
        height <= 0
    ) {

        return;

    }


    /*
       Limpiar
    */

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    /* =====================================================
       LÍNEA CENTRAL
    ===================================================== */

    ctx.beginPath();


    ctx.strokeStyle =
        "rgba(150,180,160,.10)";


    ctx.lineWidth =
        1;


    ctx.moveTo(
        0,
        height / 2
    );


    ctx.lineTo(
        width,
        height / 2
    );


    ctx.stroke();


    /* =====================================================
       SIN SEÑAL
    ===================================================== */

    if (
        !analyser ||
        !audio ||
        audio.paused
    ) {

        return;

    }


    /* =====================================================
       DATOS DEL AUDIO
    ===================================================== */

    const bufferLength =
        analyser.fftSize;


    const dataArray =
        new Uint8Array(
            bufferLength
        );


    analyser.getByteTimeDomainData(
        dataArray
    );


    /* =====================================================
       ONDA
    ===================================================== */

    ctx.beginPath();


    ctx.lineWidth =
        1.5;


    ctx.strokeStyle =
        "#a9c3a7";


    const sliceWidth =
        width /
        bufferLength;


    let x = 0;


    for (
        let i = 0;
        i < bufferLength;
        i++
    ) {


        const value =
            dataArray[i] /
            128.0;


        const y =
            value *
            height /
            2;


        if (i === 0) {

            ctx.moveTo(
                x,
                y
            );

        }

        else {

            ctx.lineTo(
                x,
                y
            );

        }


        x += sliceWidth;

    }


    ctx.stroke();

}


drawOscilloscope();


/* =========================================================
   SIGUIENTE
========================================================= */

if (nextButton) {

    nextButton.addEventListener(
        "click",
        function () {

            currentTrack++;


            if (
                currentTrack >=
                music.length
            ) {

                currentTrack = 0;

            }


            loadTrack(
                currentTrack
            );


            playTrack();

        }
    );

}


/* =========================================================
   ANTERIOR
========================================================= */

if (previousButton) {

    previousButton.addEventListener(
        "click",
        function () {

            currentTrack--;


            if (
                currentTrack < 0
            ) {

                currentTrack =
                    music.length - 1;

            }


            loadTrack(
                currentTrack
            );


            playTrack();

        }
    );

}


/* =========================================================
   FIN DE CANCIÓN
========================================================= */

if (audio) {

    audio.addEventListener(
        "ended",
        function () {

            currentTrack++;


            if (
                currentTrack >=
                music.length
            ) {

                currentTrack = 0;

            }


            loadTrack(
                currentTrack
            );


            playTrack();

        }
    );

}


/* =========================================================
   SELECCIÓN DE CANCIONES
========================================================= */

const tracks =
    document.querySelectorAll(
        ".track"
    );


tracks.forEach(
    function (track) {

        track.addEventListener(
            "click",
            function () {

                const title =
                    track.dataset.title;


                const artist =
                    track.dataset.artist;


                const trackDuration =
                    track.dataset.duration;


                const trackFile =
                    track.dataset.file;


                const trackCover =
                    track.dataset.cover;


                /*
                   Si la entrada HTML tiene
                   data-file, usarlo.
                */

                if (trackFile) {

                    music[currentTrack] = {

                        title:
                            title ||
                            "Unknown",

                        artist:
                            artist ||
                            "Unknown",

                        file:
                            trackFile,

                        cover:
                            trackCover ||
                            ""

                    };

                }


                if (songTitle) {

                    songTitle.textContent =
                        title ||
                        "Unknown";

                }


                if (artistName) {

                    artistName.textContent =
                        artist ||
                        "Unknown";

                }


                if (duration) {

                    duration.textContent =
                        trackDuration ||
                        "00:00";

                }


                if (trackFile) {

                    audio.src =
                        trackFile;

                    audio.load();

                }


                playTrack();

            }
        );

    }
);


/* =========================================================
   CARGAR CANCIÓN INICIAL
========================================================= */

loadTrack(0);


/* =========================================================
   NAVEGACIÓN
========================================================= */

const navButtons =
    document.querySelectorAll(
        ".nav-button"
    );


const libraryPanel =
    document.getElementById(
        "libraryPanel"
    );


const chatPanel =
    document.getElementById(
        "chatPanel"
    );


const profilePanel =
    document.getElementById(
        "profilePanel"
    );


function hidePanels() {

    if (libraryPanel) {

        libraryPanel.classList.add(
            "hidden"
        );

    }


    if (chatPanel) {

        chatPanel.classList.add(
            "hidden"
        );

    }


    if (profilePanel) {

        profilePanel.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   BOTONES DE NAVEGACIÓN
========================================================= */

navButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {


                navButtons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                const panel =
                    button.dataset.panel;


                hidePanels();


                if (
                    panel ===
                    "library"
                ) {

                    if (libraryPanel) {

                        libraryPanel.classList.remove(
                            "hidden"
                        );

                    }

                }


                if (
                    panel ===
                    "chat"
                ) {

                    if (chatPanel) {

                        chatPanel.classList.remove(
                            "hidden"
                        );

                    }

                }


                if (
                    panel ===
                    "profile"
                ) {

                    if (profilePanel) {

                        profilePanel.classList.remove(
                            "hidden"
                        );

                    }

                }

            }
        );

    }
);


/* =========================================================
   CHAT
========================================================= */

const chatInput =
    document.getElementById(
        "chatInput"
    );


const sendButton =
    document.getElementById(
        "sendButton"
    );


const chatMessages =
    document.getElementById(
        "chatMessages"
    );


function sendMessage() {

    if (!chatInput || !chatMessages) {

        return;

    }


    const text =
        chatInput.value.trim();


    if (text === "") {

        return;

    }


    const message =
        document.createElement(
            "div"
        );


    message.className =
        "chat-message";


    /*
       Usamos textContent para evitar
       interpretar HTML introducido
       por el usuario.
    */

    const label =
        document.createElement(
            "span"
        );


    label.textContent =
        "CAPELLA // NOW";


    message.appendChild(
        label
    );


    message.appendChild(
    document.createTextNode(
        text
    )
);

    chatMessages.appendChild(
        document.createTextNode(
            text
        )
    );

    chatInput.value = "";

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* =========================================================
   EVENTOS DEL CHAT
========================================================= */

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );

}


if (chatInput) {

    chatInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


});