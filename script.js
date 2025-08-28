// --- BANCO DE PUZLES ---
const PUZZLE_BANK = [
    { source: 'El sujeto abandonó el arma en el puente al anochecer.', answer: 'El fugitivo se deshizo de la pistola cuando el sol se ponía sobre el viaducto.' },
    { source: 'La transmisión contenía datos encriptados sobre la ubicación del artefacto.', answer: 'El mensaje cifrado revelaba dónde estaba el objeto.' },
    { source: 'La simulación comenzó a mostrar fallos estructurales.', answer: 'El programa empezó a tener errores graves.' },
    { source: 'Su lealtad a la corporación era inquebrantable.', answer: 'Era totalmente fiel a la empresa.' },
    { source: 'El sistema de soporte vital de la nave falló de forma catastrófica.', answer: 'El oxígeno de la nave se agotó de repente.' }
];
const DISTRACTOR_POOL = [ 'Los gatos comen pescado.', 'El cielo es generalmente azul.', 'La semana tiene siete días.', 'El sol es una estrella.' ];

const UI = {
    init() {
        this.loader = document.getElementById('loader');
        this.gameContainer = document.getElementById('game-container');
        this.stabilityPercent = document.getElementById('stability-percent');
        this.sourceEchoText = document.getElementById('source-echo-text');
        this.targetEchoesList = document.getElementById('target-echoes-list');
        this.resultText = document.getElementById('result-text');
        this.body = document.body;
    },
    showGame() { this.loader.classList.add('hidden'); this.gameContainer.classList.remove('hidden'); },
    renderPuzzle(puzzle) {
        this.sourceEchoText.textContent = puzzle.source;
        this.targetEchoesList.innerHTML = '';
        puzzle.targets.forEach((target, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${target}`;
            li.addEventListener('click', () => Game.selectTarget(target));
            this.targetEchoesList.appendChild(li);
        });
    },
    updateStability(stability) {
        this.stabilityPercent.textContent = `${stability}%`;
        this.body.className = '';
        if (stability < 80) this.body.classList.add('stability-75');
        if (stability < 50) this.body.classList.add('stability-50');
        if (stability < 25) this.body.classList.add('stability-25');
        if (stability <= 0) this.body.classList.add('stability-0');
    },
    showResult(text) { this.resultText.textContent = text; }
};

// --- MÓDULO DE IA (RECONSTRUIDO CON TENSORFLOW.JS) ---
const AI = {
    model: null,
    async init() {
        // 'use' es el objeto que nos da el script de Universal Sentence Encoder
        this.model = await use.load();
    },
    async getSimilarity(text1, text2) {
        if (!this.model) return 0;
        
        // Obtenemos los 'embeddings' (la esencia de la frase en números)
        const embeddings = await this.model.embed([text1, text2]);
        const embeddingsArray = await embeddings.array();
        
        const vec1 = embeddingsArray[0];
        const vec2 = embeddingsArray[1];

        // Calculamos la similitud del coseno a mano (es más fiable)
        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;
        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            mag1 += vec1[i] * vec1[i];
            mag2 += vec2[i] * vec2[i];
        }
        mag1 = Math.sqrt(mag1);
        mag2 = Math.sqrt(mag2);

        if (mag1 === 0 || mag2 === 0) return 0;
        
        const similarity = dotProduct / (mag1 * mag2);
        return Math.round(similarity * 100);
    }
};

const Game = {
    state: { stability: 100, usedPuzzleIndices: new Set() },
    async init() {
        UI.init();
        try {
            await AI.init();
            UI.showGame();
            UI.showResult('Iniciando interfaz del Eco-Sintetizador...');
            await new Promise(r => setTimeout(r, 2000));
            this.nextPuzzle();
        } catch (error) {
            console.error("FALLO CRÍTICO AL INICIAR LA IA:", error);
            UI.loader.textContent = "ERROR: EL NÚCLEO SEMÁNTICO NO RESPONDE.";
        }
    },
    generatePuzzle() {
        if (this.state.usedPuzzleIndices.size >= PUZZLE_BANK.length) return null;
        let puzzleIndex;
        do { puzzleIndex = Math.floor(Math.random() * PUZZLE_BANK.length); } while (this.state.usedPuzzleIndices.has(puzzleIndex));
        this.state.usedPuzzleIndices.add(puzzleIndex);
        const puzzleData = PUZZLE_BANK[puzzleIndex];
        const distractors = [...DISTRACTOR_POOL].sort(() => 0.5 - Math.random()).slice(0, 2);
        const targets = [puzzleData.answer, ...distractors].sort(() => 0.5 - Math.random());
        return { source: puzzleData.source, targets: targets };
    },
    nextPuzzle() {
        this.currentPuzzle = this.generatePuzzle();
        if (this.currentPuzzle) {
            UI.renderPuzzle(this.currentPuzzle);
            UI.showResult('Analiza el Eco Fuente. Encuentra la resonancia semántica.');
        } else {
            UI.showResult('HAS ESTABILIZADO TODOS LOS ECOS. LA REALIDAD TE DA LAS GRACIAS.');
        }
    },
    async selectTarget(selectedTarget) {
        UI.targetEchoesList.innerHTML = '<li>ANALIZANDO RESONANCIA...</li>';
        const similarity = await AI.getSimilarity(this.currentPuzzle.source, selectedTarget);
        if (similarity > 70) {
            UI.showResult(`RESONANCIA: ${similarity}%. Eco Sincronizado. Estabilidad intacta.`);
        } else {
            const damage = 25;
            this.state.stability -= damage;
            if (this.state.stability < 0) this.state.stability = 0;
            UI.showResult(`RESONANCIA: ${similarity}%. ¡FALLO DE SINCRONIZACIÓN! Estabilidad: -${damage}%`);
            UI.updateStability(this.state.stability);
        }
        await new Promise(r => setTimeout(r, 2500));
        if (this.state.stability <= 0) {
            UI.showResult('COLAPSO TOTAL DE LA REALIDAD. SIMULACIÓN TERMINADA.');
            return;
        }
        this.nextPuzzle();
    }
};

Game.init();
