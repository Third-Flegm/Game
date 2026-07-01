let cardData = null;
let currentCard = null;
let state = 0;
let selectedOptionIndex = null;

const DEFAULT_CARD_SPRITE = "assets/card.jpg";
const stackGrid = document.getElementById("stackGrid");
const overlay = document.getElementById("overlay");
const cardPopup = document.getElementById("cardPopup");
const cardContent = document.getElementById("cardContent");
const cardPhase = document.getElementById("cardPhase");
const cardHint = document.getElementById("cardHint");

const stackTopicsByType = {
    frage: ["Glaube", "Gebet", "Gemeinde", "Hoffnung", "Liebe"],
    aktion: ["Hilfe", "Mut", "Entscheidung", "Zusammenarbeit", "Verantwortung"],
    ereignis: ["Glück", "Wende", "Chance", "Begegnung", "Veränderung"]
};

const defaultOptionsByType = {
    frage: ["Weihnachten", "Ostern", "Kirche", "Caritas", "Glaube", "Hoffnung", "Liebe", "Gebet"],
    aktion: ["Weitergehen", "Warten", "Zurückgehen", "Aussetzen", "Doppelt ziehen", "Noch einmal ziehen", "Neu starten", "Fragekarte ziehen"],
    ereignis: ["Weitergehen", "Warten", "Zurückgehen", "Aussetzen", "Noch einmal ziehen", "Stille halten", "Fragekarte ziehen"]
};

const questionTemplates = [
    (topic) => `Was bedeutet ${topic} in der Religion?`,
    (topic) => `Warum ist ${topic} wichtig?`,
    (topic) => `Wie kannst du ${topic} im Alltag zeigen?`,
    (topic) => `Erkläre den Wert von ${topic}.`,
    (topic) => `Beschreibe ${topic} mit eigenen Worten.`
];

const answerTemplates = [
    (topic) => `Es steht für ${topic} und zeigt, wie Menschen zusammenleben.`,
    (topic) => `Es hilft, ${topic} bewusst zu erleben und zu verstehen.`,
    (topic) => `Es erinnert daran, ${topic} wertzuschätzen und zu leben.`,
    (topic) => `Es ist ein wichtiger Gedanke rund um ${topic}.`,
    (topic) => `Es zeigt, dass ${topic} einen positiven Einfluss haben kann.`
];

function createGeneratedCard(stack, cardIndex) {
    const stackType = String(stack?.type || "frage").toLowerCase();
    const topics = stackTopicsByType[stackType] || stackTopicsByType.frage;
    const options = defaultOptionsByType[stackType] || defaultOptionsByType.frage;
    const topic = topics[cardIndex % topics.length] || "Wert";
    const questionTemplate = questionTemplates[cardIndex % questionTemplates.length];
    const answerTemplate = answerTemplates[cardIndex % answerTemplates.length];

    return {
        question: questionTemplate(topic),
        answer: answerTemplate(topic),
        options: options.slice(0, 4),
        sprite: DEFAULT_CARD_SPRITE
    };
}

function normalizeCardData(data) {
    const rawStacks = Array.isArray(data?.stacks) ? data.stacks : [];

    return {
        ...data,
        background: data?.background || "assets/background.jpg",
        stacks: rawStacks.map((stack, stackIndex) => {
            const baseCards = Array.isArray(stack?.cards) ? stack.cards : [];
            const cards = [];

            const stackType = String(stack?.type || "frage").toLowerCase();
            const defaultOptions = defaultOptionsByType[stackType] || defaultOptionsByType.frage;

            baseCards.forEach((card, cardIndex) => {
                const rawOptions = Array.isArray(card?.options) ? card.options : [];
                const filteredOptions = rawOptions.filter((option) => defaultOptions.includes(option));
                cards.push({
                    ...card,
                    question: card?.question || `Karte ${cardIndex + 1}`,
                    answer: card?.answer ?? "",
                    options: filteredOptions.length ? filteredOptions : defaultOptions.slice(0, 4),
                    sprite: card?.sprite || stack?.sprite || DEFAULT_CARD_SPRITE
                });
            });

            while (cards.length < 30) {
                cards.push(createGeneratedCard(stack, cards.length));
            }

            return {
                ...stack,
                sprite: stack?.sprite || DEFAULT_CARD_SPRITE,
                cards: cards.slice(0, 30)
            };
        })
    };
}

fetch("cards.json")
    .then((res) => res.json())
    .then((data) => {
        cardData = normalizeCardData(data);
        renderBackground();
        renderStacks();
    })
    .catch((error) => {
        console.error("Fehler beim Laden der Karten:", error);
        stackGrid.innerHTML = "<p>Die Kartendaten konnten nicht geladen werden.</p>";
    });

function renderBackground() {
    if (!cardData || !cardData.background) return;
    document.body.style.setProperty("--background-image", `url('${cardData.background}')`);
}

function renderStacks() {
    if (!cardData || !Array.isArray(cardData.stacks)) return;

    stackGrid.innerHTML = cardData.stacks
        .map((stack, index) => {
            const label = stack.label || `Stapel ${index + 1}`;
            const imageStyle = stack.sprite
                ? `background-image:url('${stack.sprite}')`
                : "";
            return `
            <button class="stack-card" type="button" data-stack-index="${index}" aria-label="${label}">
                <div class="stack-preview" style="${imageStyle}">
                    <span class="stack-number">${index + 1}</span>
                </div>
                <span class="sr-only">${label}</span>
            </button>`;
        })
        .join("");

    stackGrid.querySelectorAll("button").forEach((button) => {
        button.addEventListener("click", () => {
            if (state !== 0) return;
            const index = Number(button.dataset.stackIndex);
            const stack = cardData.stacks[index];
            if (!stack?.cards?.length) return;
            openCard(stack.cards[Math.floor(Math.random() * stack.cards.length)]);
        });
    });
}

function renderCardContent(card, phase) {
    if (!card) {
        cardContent.innerHTML = "";
        return;
    }

    const questionText = card.question || "Keine Frage vorhanden.";
    const optionsMarkup = Array.isArray(card.options) && card.options.length
        ? `<div class="card-options" role="list">${card.options
            .map((option, index) => {
                const isSelected = selectedOptionIndex === index;
                const buttonClass = isSelected ? "card-option-button is-selected" : "card-option-button";
                const buttonAttributes = phase === "answer" ? 'disabled aria-disabled="true"' : "";
                return `<button class="${buttonClass}" type="button" data-option-index="${index}" ${buttonAttributes}>${option}</button>`;
            })
            .join("")}</div>`
        : "";

    const answerMarkup = card.answer
        ? `<div class="card-answer">${card.answer}</div>`
        : "";

    cardContent.innerHTML = `
        <div class="card-question">${questionText}</div>
        ${optionsMarkup}
        ${phase === "answer" ? answerMarkup : ""}
    `;
}

function openCard(card) {
    currentCard = card;
    state = 1;
    selectedOptionIndex = null;
    cardPhase.textContent = "Frage";
    renderCardContent(card, "question");
    cardHint.textContent = card.answer ? "Tippe erneut, um die Antwort zu sehen." : "Tippe erneut, um die Karte zu schließen.";
    cardPopup.classList.toggle("has-sprite", Boolean(card.sprite));

    if (card.sprite) {
        cardPopup.style.backgroundImage = `url('${card.sprite}')`;
    } else {
        cardPopup.style.backgroundImage = "none";
    }

    overlay.classList.remove("hidden");
    requestAnimationFrame(() => overlay.classList.add("visible"));
}

function revealCard() {
    if (!currentCard) return;
    if (!currentCard.answer) {
        hideCard();
        return;
    }

    state = 2;
    cardPhase.textContent = "Antwort";
    renderCardContent(currentCard, "answer");
    cardHint.textContent = "Tippe erneut, um die Karte zu schließen.";
}

function hideCard() {
    overlay.classList.remove("visible");
    setTimeout(() => {
        overlay.classList.add("hidden");
        currentCard = null;
        selectedOptionIndex = null;
        cardPopup.style.backgroundImage = "none";
        state = 0;
    }, 220);
}

cardPopup.addEventListener("click", (event) => {
    const optionButton = event.target.closest(".card-option-button");
    if (optionButton) {
        event.stopPropagation();
        selectedOptionIndex = Number(optionButton.dataset.optionIndex);
        renderCardContent(currentCard, state === 2 ? "answer" : "question");
        return;
    }

    event.stopPropagation();
    if (state === 1) {
        revealCard();
    } else if (state === 2) {
        hideCard();
    }
});

overlay.addEventListener("click", (event) => {
    if (event.target !== overlay) return;
    if (state === 2 || !currentCard?.answer) {
        hideCard();
    }
});
