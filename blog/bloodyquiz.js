/* BLOODYCAPELLA QUIZ ENGINE v2.0
   - Compatible con questions.txt de puntuación ponderada.
   - Selección de 30 preguntas sin repetición dentro de la partida.
   - Historial local para reducir repeticiones entre partidas completadas.
   - Conserva los objetos completos de respuesta al mezclar las opciones.
*/
(() => {
  "use strict";

  const root = document.getElementById("bc-quiz");
  if (!root || root.dataset.bcInitialized === "weighted-v2") return;
  root.dataset.bcInitialized = "weighted-v2";

  const $ = id => document.getElementById(id);

  const el = {
    intro: $("bc-intro"),
    game: $("bc-game"),
    results: $("bc-results"),
    start: $("bc-start"),
    next: $("bc-next"),
    back: $("bc-back"),
    restart: $("bc-restart"),
    share: $("bc-share"),
    number: $("bc-number"),
    progress: $("bc-progress"),
    percent: $("bc-progress-text"),
    question: $("bc-question"),
    options: $("bc-options"),
    warning: $("bc-warning"),
    loading: $("bc-loading"),
    error: $("bc-error"),
    count: $("bc-question-count"),
    name: $("bc-result-name"),
    tag: $("bc-result-tag"),
    description: $("bc-result-description"),
    image: $("bc-result-image"),
    traits: $("bc-traits"),
    second: $("bc-second"),
    bars: $("bc-bars")
  };

  const COUNT = 30;
  const MAX_POINTS_PER_ANSWER = 3;
  const qURL = root.dataset.questionsUrl;
  const cURL = root.dataset.charactersUrl;

  let questions = [];
  let characters = {};
  let round = [];
  let answers = [];
  let index = 0;
  let winner = null;
  let lastRanking = [];

  const HISTORY_KEY = "bloodycapella_quiz_completed_questions_v2";

  const hide = element => {
    if (element) element.hidden = true;
  };

  const show = element => {
    if (element) element.hidden = false;
  };

  function screen(target) {
    hide(el.intro);
    hide(el.game);
    hide(el.results);
    show(target);
  }

  function shuffle(array) {
    const result = array.slice();

    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }

    return result;
  }

  function readHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(saved) ? saved.filter(id => typeof id === "string") : [];
    } catch (error) {
      console.warn("[BloodyCapella] No se pudo leer el historial:", error);
      return [];
    }
  }

  function saveCompletedRound() {
    try {
      const history = new Set(readHistory());
      round.forEach(question => history.add(question.id));
      localStorage.setItem(HISTORY_KEY, JSON.stringify([...history]));
    } catch (error) {
      console.warn("[BloodyCapella] No se pudo guardar el historial:", error);
    }
  }

  async function fetchJSON(url, filename) {
    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(filename + ": error HTTP " + response.status);
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error("JSON inválido en " + filename + ": " + error.message);
    }
  }

  function validateData(questionData, characterData) {
    if (!Array.isArray(questionData) || questionData.length < COUNT) {
      throw new Error("Se necesitan al menos " + COUNT + " preguntas.");
    }

    if (
      !characterData ||
      typeof characterData !== "object" ||
      Array.isArray(characterData)
    ) {
      throw new Error("El archivo de personajes no es válido.");
    }

    const ids = new Set();

    questionData.forEach((item, position) => {
      if (
        !item ||
        typeof item.id !== "string" ||
        !item.id.trim() ||
        typeof item.question !== "string" ||
        !item.question.trim() ||
        !Array.isArray(item.answers) ||
        item.answers.length < 2
      ) {
        throw new Error("Pregunta inválida: posición " + (position + 1));
      }

      if (ids.has(item.id)) {
        throw new Error("ID de pregunta duplicado: " + item.id);
      }
      ids.add(item.id);

      item.answers.forEach((answer, answerPosition) => {
        if (
          !answer ||
          typeof answer.text !== "string" ||
          !answer.text.trim() ||
          !Array.isArray(answer.scores) ||
          answer.scores.length === 0
        ) {
          throw new Error(
            "Respuesta sin puntuaciones válidas en " + item.id +
            " (opción " + (answerPosition + 1) + ")."
          );
        }

        const scoredCharacters = new Set();

        answer.scores.forEach(score => {
          if (
            !score ||
            typeof score.character !== "string" ||
            !Object.prototype.hasOwnProperty.call(characterData, score.character)
          ) {
            throw new Error(
              "Personaje inexistente en " + item.id + ": " +
              (score && score.character ? score.character : "sin ID")
            );
          }

          if (
            !Number.isInteger(score.points) ||
            score.points < 1 ||
            score.points > MAX_POINTS_PER_ANSWER
          ) {
            throw new Error(
              "Puntuación inválida en " + item.id +
              ". Usa números enteros de 1 a " + MAX_POINTS_PER_ANSWER + "."
            );
          }

          if (scoredCharacters.has(score.character)) {
            throw new Error(
              "Personaje repetido dentro de una respuesta en " + item.id +
              ": " + score.character
            );
          }

          scoredCharacters.add(score.character);
        });
      });
    });

    return { questions: questionData, characters: characterData };
  }

  async function load() {
    if (!qURL || !cURL) {
      throw new Error("Faltan las direcciones de questions.txt o characters.json.");
    }

    const [questionData, characterData] = await Promise.all([
      fetchJSON(qURL, "questions.txt"),
      fetchJSON(cURL, "characters.json")
    ]);

    const validated = validateData(questionData, characterData);
    questions = validated.questions;
    characters = validated.characters;
  }

  function chooseRound() {
    const completed = new Set(readHistory());
    let available = questions.filter(question => !completed.has(question.id));

    // Si ya no quedan 30 preguntas inéditas, se reinicia el ciclo.
    if (available.length < COUNT) {
      try {
        localStorage.removeItem(HISTORY_KEY);
      } catch (error) {
        console.warn("[BloodyCapella] No se pudo reiniciar el historial:", error);
      }
      available = questions.slice();
    }

    return shuffle(available).slice(0, COUNT);
  }

  function begin() {
    round = chooseRound();
    answers = Array.from({ length: round.length }, () => null);
    index = 0;
    winner = null;
    lastRanking = [];

    screen(el.game);
    render();
  }

  function render() {
    const question = round[index];

    if (!question) {
      showError("No se encontró la pregunta solicitada.");
      return;
    }

    const selectedAnswer = answers[index];

    if (el.number) {
      el.number.textContent =
        "REGISTRO " + String(index + 1).padStart(2, "0") +
        " / " + round.length;
    }

    const percentage = ((index + 1) / round.length) * 100;

    if (el.progress) el.progress.style.width = percentage + "%";
    if (el.percent) el.percent.textContent = Math.round(percentage) + "%";
    if (el.question) el.question.textContent = question.question;

    if (!el.options) {
      showError("No se encontró el contenedor de respuestas (bc-options).");
      return;
    }

    el.options.replaceChildren();
    hide(el.warning);

    // Se mezclan objetos completos; sus puntuaciones permanecen vinculadas.
    shuffle(question.answers).forEach(answer => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "bc-option";
      button.textContent = answer.text;

      const active = selectedAnswer === answer;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));

      button.addEventListener("click", () => {
        answers[index] = answer;

        [...el.options.children].forEach(option => {
          option.classList.remove("is-selected");
          option.setAttribute("aria-pressed", "false");
        });

        button.classList.add("is-selected");
        button.setAttribute("aria-pressed", "true");
        hide(el.warning);
      });

      el.options.appendChild(button);
    });

    if (el.back) el.back.disabled = index === 0;
    if (el.next) {
      el.next.textContent =
        index === round.length - 1 ? "CALCULAR RESULTADO" : "SIGUIENTE →";
    }
  }

  function showError(message) {
    screen(el.intro);
    show(el.error);
    if (el.error) el.error.textContent = "ERROR DE SISTEMA: " + message;
    console.error("[BloodyCapella Quiz Engine]", message);
  }

  function calculateResult() {
    const unanswered = answers.findIndex(answer => !answer);

    if (unanswered !== -1) {
      index = unanswered;
      screen(el.game);
      render();

      if (el.warning) {
        el.warning.textContent =
          "Falta responder esta pregunta antes de calcular el resultado.";
        show(el.warning);
      }
      return;
    }

    const scores = {};
    Object.keys(characters).forEach(key => {
      scores[key] = 0;
    });

    answers.forEach(answer => {
      answer.scores.forEach(entry => {
        scores[entry.character] += entry.points;
      });
    });

    const ranking = Object.entries(scores).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    });

    winner = ranking[0] ? ranking[0][0] : null;
    lastRanking = ranking;

    if (!winner || !characters[winner]) {
      showError("No fue posible determinar un personaje ganador.");
      return;
    }

    const requiredResults = {
      name: el.name,
      tag: el.tag,
      description: el.description,
      traits: el.traits,
      second: el.second,
      bars: el.bars
    };

    const missing = Object.entries(requiredResults)
      .filter(([, element]) => !element)
      .map(([key]) => key);

    if (missing.length > 0) {
      showError(
        "Faltan elementos de resultados en Blogger: " + missing.join(", ")
      );
      return;
    }

    const main = characters[winner];

    // Retrato del personaje: la URL se obtiene de characters.json -> image.
    // El elemento es opcional para mantener compatibilidad con entradas antiguas.
    if (el.image) {
      const imageURL = typeof main.image === "string" ? main.image.trim() : "";

      if (imageURL) {
        try {
          const parsedURL = new URL(imageURL, window.location.href);
          if (parsedURL.protocol === "https:" || parsedURL.protocol === "http:") {
            el.image.onerror = () => {
              el.image.hidden = true;
              el.image.removeAttribute("src");
              console.warn("[BloodyCapella] No se pudo cargar el retrato:", imageURL);
            };
            el.image.src = parsedURL.href;
            el.image.alt = "Retrato de " + (main.name || winner);
            el.image.hidden = false;
          } else {
            el.image.hidden = true;
            el.image.removeAttribute("src");
          }
        } catch (error) {
          el.image.hidden = true;
          el.image.removeAttribute("src");
          console.warn("[BloodyCapella] URL de retrato inválida:", imageURL);
        }
      } else {
        el.image.hidden = true;
        el.image.removeAttribute("src");
        el.image.alt = "";
      }
    }

    const secondaryEntry = ranking.find(
      ([key, value]) => key !== winner && value > 0
    );
    const secondary = secondaryEntry ? characters[secondaryEntry[0]] : null;

    el.name.textContent = main.name || winner;
    el.tag.textContent = [main.code, main.title].filter(Boolean).join(" // ");
    el.description.textContent = main.description || "";

    el.traits.replaceChildren();
    (Array.isArray(main.traits) ? main.traits : []).forEach(trait => {
      const span = document.createElement("span");
      span.className = "bc-trait";
      span.textContent = trait;
      el.traits.appendChild(span);
    });

    el.second.textContent = secondaryEntry
      ? "Afinidad secundaria: " +
        (secondary.name || secondaryEntry[0]) +
        " (" + secondaryEntry[1] + " puntos)"
      : "No se detectó una afinidad secundaria clara.";

    el.bars.replaceChildren();

    const maxPossible = round.length * MAX_POINTS_PER_ANSWER;

    ranking.forEach(([key, value]) => {
      const character = characters[key];
      const row = document.createElement("div");
      row.className = "bc-score-row";

      const label = document.createElement("div");
      label.className = "bc-score-label";

      const name = document.createElement("span");
      name.textContent = character.name || key;

      const score = document.createElement("strong");
      const affinity = Math.round((value / maxPossible) * 100);
      score.textContent = value + " pts · " + affinity + "%";

      label.append(name, score);

      const track = document.createElement("div");
      track.className = "bc-score-track";

      const fill = document.createElement("div");
      fill.className = "bc-score-fill";
      fill.style.width = Math.min(100, affinity) + "%";

      track.appendChild(fill);
      row.append(label, track);
      el.bars.appendChild(row);
    });

    // El historial se guarda únicamente al completar una partida.
    saveCompletedRound();
    screen(el.results);
  }

  function nextQuestion() {
    if (!answers[index]) {
      if (el.warning) {
        el.warning.textContent = "Selecciona una respuesta antes de continuar.";
        show(el.warning);
      }
      return;
    }

    hide(el.warning);

    if (index < round.length - 1) {
      index++;
      render();
    } else {
      calculateResult();
    }
  }

  function previousQuestion() {
    if (index > 0) {
      index--;
      render();
    }
  }

  function restart() {
    winner = null;
    lastRanking = [];
    round = [];
    answers = [];
    index = 0;

    hide(el.error);
    screen(el.intro);
  }

  async function shareResult() {
    if (!winner || !characters[winner]) return;

    const character = characters[winner];
    const winnerScore = lastRanking.find(([key]) => key === winner);
    const text =
      "Mi resultado en BloodyCapella Quiz Engine: " +
      (character.name || winner) +
      (character.title ? " — " + character.title : "") +
      (winnerScore ? " (" + winnerScore[1] + " puntos)." : ".");

    if (navigator.share) {
      try {
        await navigator.share({
          title: "BloodyCapella Quiz",
          text
        });
      } catch (error) {
        // El usuario pudo cancelar el diálogo de compartir.
      }
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        if (el.share) {
          const originalText = el.share.textContent;
          el.share.textContent = "COPIADO";
          setTimeout(() => {
            el.share.textContent = originalText || "COMPARTIR RESULTADO";
          }, 1500);
        }
      } catch (error) {
        window.prompt("Copia tu resultado:", text);
      }
    } else {
      window.prompt("Copia tu resultado:", text);
    }
  }

  function connectEvents() {
    if (el.start) el.start.addEventListener("click", begin);
    if (el.next) el.next.addEventListener("click", nextQuestion);
    if (el.back) el.back.addEventListener("click", previousQuestion);
    if (el.restart) el.restart.addEventListener("click", restart);
    if (el.share) el.share.addEventListener("click", shareResult);
  }

  async function initialize() {
    try {
      if (el.start) el.start.disabled = true;
      show(el.loading);
      hide(el.error);

      await load();

      hide(el.loading);
      if (el.start) el.start.disabled = false;

      if (el.count) {
        el.count.textContent =
          questions.length +
          " preguntas disponibles. Se seleccionarán " + COUNT +
          " por partida, con puntuaciones ponderadas.";
      }
    } catch (error) {
      hide(el.loading);
      show(el.error);
      if (el.error) {
        el.error.textContent = "ERROR DE SISTEMA: " + error.message;
      }
      if (el.start) el.start.disabled = true;
      console.error("[BloodyCapella Quiz Engine]", error);
    }
  }

  connectEvents();
  initialize();
})();
