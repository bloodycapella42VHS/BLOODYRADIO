
/* BLOODYCAPELLA QUIZ ENGINE v1.1
   FIX: LAST QUESTION + RESULT GENERATION
*/
(() => {
  "use strict";

  const root = document.getElementById("bc-quiz");
  if (!root || root.dataset.bcInitialized === "2") return;
  root.dataset.bcInitialized = "2";

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
    traits: $("bc-traits"),
    second: $("bc-second"),
    bars: $("bc-bars")
  };

  const COUNT = 30;

  const qURL = root.dataset.questionsUrl;
  const cURL = root.dataset.charactersUrl;

  let questions = [];
  let characters = {};
  let round = [];
  let answers = [];
  let index = 0;
  let winner = null;

  const hide = e => {
    if (e) e.hidden = true;
  };

  const show = e => {
    if (e) e.hidden = false;
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

  async function load() {
    if (!qURL || !cURL) {
      throw new Error("Faltan las direcciones de los archivos.");
    }

    const responses = await Promise.all([
      fetch(qURL, { cache: "no-store" }),
      fetch(cURL, { cache: "no-store" })
    ]);

    if (!responses[0].ok) {
      throw new Error("No se pudo cargar questions.txt.");
    }

    if (!responses[1].ok) {
      throw new Error("No se pudo cargar characters.json.");
    }

    const data = await Promise.all(
      responses.map(response => response.json())
    );

    const q = data[0];
    const c = data[1];

    if (!Array.isArray(q) || q.length < COUNT) {
      throw new Error("Se necesitan al menos 30 preguntas.");
    }

    if (!c || typeof c !== "object") {
      throw new Error("El archivo de personajes no es válido.");
    }

    const ids = new Set();

    q.forEach((item, position) => {
      if (
        !item.id ||
        !item.question ||
        !Array.isArray(item.answers) ||
        item.answers.length < 2
      ) {
        throw new Error(
          "Pregunta inválida: " + (position + 1)
        );
      }

      if (ids.has(item.id)) {
        throw new Error("ID duplicado: " + item.id);
      }

      ids.add(item.id);

      item.answers.forEach(answer => {
        if (!answer.text || !c[answer.character]) {
          throw new Error(
            "Respuesta incorrecta en " + item.id
          );
        }
      });
    });

    questions = q;
    characters = c;
  }

  function begin() {
    round = shuffle(questions).slice(0, COUNT);

    // Cada respuesta comienza sin seleccionar.
    answers = Array.from({ length: COUNT }, () => null);

    index = 0;
    winner = null;

    screen(el.game);
    render();
  }

  function render() {
    const question = round[index];

    if (!question) {
      showError("No se encontró la pregunta solicitada.");
      return;
    }

    const selectedCharacter = answers[index];

    el.number.textContent =
      "REGISTRO " +
      String(index + 1).padStart(2, "0") +
      " / " + COUNT;

    const percentage = ((index + 1) / COUNT) * 100;

    el.progress.style.width = percentage + "%";
    el.percent.textContent = Math.round(percentage) + "%";

    el.question.textContent = question.question;

    el.options.replaceChildren();
    hide(el.warning);

    const shuffledAnswers = shuffle(question.answers);

    shuffledAnswers.forEach(answer => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "bc-option";
      button.textContent = answer.text;

      const active = selectedCharacter === answer.character;

      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));

      button.addEventListener("click", () => {
        // Guardar inmediatamente la respuesta.
        answers[index] = answer.character;

        // Actualizar visualmente todas las opciones.
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

    el.back.disabled = index === 0;

    el.next.textContent =
      index === COUNT - 1
        ? "CALCULAR RESULTADO"
        : "SIGUIENTE →";
  }

  function showError(message) {
    screen(el.intro);
    show(el.error);
    el.error.textContent = "ERROR DE SISTEMA: " + message;
  }

  function calculateResult() {
    // Verificar que todas las respuestas estén guardadas.
    const unanswered = answers.findIndex(
      answer => answer === null || answer === undefined
    );

    if (unanswered !== -1) {
      index = unanswered;
      screen(el.game);
      render();

      el.warning.textContent =
        "Falta responder esta pregunta antes de calcular el resultado.";

      show(el.warning);
      return;
    }

    const scores = {};

    Object.keys(characters).forEach(key => {
      scores[key] = 0;
    });

    answers.forEach(character => {
      if (Object.prototype.hasOwnProperty.call(scores, character)) {
        scores[character]++;
      }
    });

    const ranking = Object.entries(scores).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];

      return Math.random() - 0.5;
    });

    winner = ranking[0][0];

    const main = characters[winner];

    const secondary = ranking[1][1] > 0
      ? characters[ranking[1][0]]
      : null;

    const total = answers.length;

    
const requiredResults = {
  name: el.name,
  tag: el.tag,
  description: el.description,
  traits: el.traits,
  second: el.second,
  bars: el.bars
};

const missing = Object.entries(requiredResults)
  .filter(([key, element]) => !element)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(
    "[BloodyCapella] Elementos de resultados inexistentes:",
    missing
  );

  alert(
    "No se puede mostrar el resultado. Faltan estos elementos: " +
    missing.join(", ")
  );

  return;
}

el.name.textContent = main.name;
el.tag.textContent = main.code + " // " + main.title;
el.description.textContent = main.description;

    // Características del personaje.
    el.traits.replaceChildren();

    (main.traits || []).forEach(trait => {
      const span = document.createElement("span");

      span.className = "bc-trait";
      span.textContent = trait;

      el.traits.appendChild(span);
    });

    // Afinidad secundaria.
    el.second.textContent = secondary
      ? "Afinidad secundaria: " + secondary.name +
        " (" + ranking[1][1] + " respuestas)"
      : "No se detectó una afinidad secundaria clara.";

    // Distribución de resultados.
    el.bars.replaceChildren();

    ranking.forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "bc-score-row";

      const label = document.createElement("div");
      label.className = "bc-score-label";

      const name = document.createElement("span");
      name.textContent = characters[key].name;

      const score = document.createElement("strong");
      score.textContent = value + "/" + total;

      label.append(name, score);

      const track = document.createElement("div");
      track.className = "bc-score-track";

      const fill = document.createElement("div");
      fill.className = "bc-score-fill";

      fill.style.width = (value / total * 100) + "%";

      track.appendChild(fill);
      row.append(label, track);

      el.bars.appendChild(row);
    });

    screen(el.results);
  }

  function nextQuestion() {
    // Evita avanzar si no existe una respuesta.
    if (answers[index] === null || answers[index] === undefined) {
      el.warning.textContent =
        "Selecciona una respuesta antes de continuar.";

      show(el.warning);
      return;
    }

    hide(el.warning);

    if (index < COUNT - 1) {
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
    round = [];
    answers = [];
    index = 0;

    hide(el.error);
    screen(el.intro);
  }

  async function shareResult() {
    if (!winner) return;

    const character = characters[winner];

    const text =
      "Mi resultado en BloodyCapella Quiz Engine: " +
      character.name + " — " + character.title + ".";

    if (navigator.share) {
      try {
        await navigator.share({
          title: "BloodyCapella Quiz",
          text
        });
      } catch (error) {}
    } else if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);

        el.share.textContent = "COPIADO";

        setTimeout(() => {
          el.share.textContent = "COMPARTIR RESULTADO";
        }, 1500);

      } catch (error) {
        window.prompt("Copia tu resultado:", text);
      }
    } else {
      window.prompt("Copia tu resultado:", text);
    }
  }

  // Eventos principales.
  el.start.addEventListener("click", begin);
  el.next.addEventListener("click", nextQuestion);
  el.back.addEventListener("click", previousQuestion);
  el.restart.addEventListener("click", restart);
  el.share.addEventListener("click", shareResult);

  // Carga inicial.
  (async () => {
    try {
      el.start.disabled = true;

      show(el.loading);
      hide(el.error);

      await load();

      hide(el.loading);

      el.start.disabled = false;

      el.count.textContent =
        questions.length +
        " preguntas disponibles. Se seleccionarán 30 distintas por partida.";

    } catch (error) {
      hide(el.loading);

      show(el.error);

      el.error.textContent =
        "ERROR DE SISTEMA: " + error.message;

      el.start.disabled = true;

      console.error("[BloodyCapella Quiz Engine]", error);
    }
  })();

})();

async function load() {
  if (!qURL || !cURL) {
    throw new Error("Faltan las direcciones de los archivos.");
  }

  async function fetchJSON(url, filename) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        filename + ": error HTTP " + response.status
      );
    }

    try {
      return await response.json();
    } catch (error) {
      throw new Error(
        "Error al interpretar " + filename + ": " +
        error.message
      );
    }
  }

  const [q, c] = await Promise.all([
    fetchJSON(qURL, "questions.txt"),
    fetchJSON(cURL, "characters.json")
  ]);

  if (!Array.isArray(q) || q.length < COUNT) {
    throw new Error("No hay suficientes preguntas.");
  }

  if (!c || typeof c !== "object" || Array.isArray(c)) {
    throw new Error("El archivo de personajes no es válido.");
  }

  questions = q;
  characters = c;
}
