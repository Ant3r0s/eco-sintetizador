import { pipeline, cos_sim } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// --- BANCO DE PUZLES ---
const PUZZLE_BANK = [
    { source: 'El sujeto abandonó el arma en el puente al anochecer.', answer: 'El fugitivo se deshizo de la pistola cuando el sol se ponía sobre el viaducto.' },
    { source: 'La transmisión contenía datos encriptados sobre la ubicación del artefacto.', answer: 'El mensaje cifrado revelaba dónde estaba el objeto.' },
    { source: 'La simulación comenzó a mostrar fallos estructurales.', answer: 'El programa empezó a tener errores graves.' },
    { source: 'Su lealtad a la corporación era inquebrantable.', answer: 'Era totalmente fiel a la empresa.' },
    { source: 'El sistema de soporte vital de la nave falló de forma catastrófica.', answer: 'El oxígeno de la nave se agotó de repente.' },
    { source: 'Los recuerdos del androide habían sido borrados.', answer: 'La memoria del sintético fue eliminada.' },
    { source: 'La criatura emergió de las profundidades abisales.', answer: 'El monstruo salió del fondo del océano.' }
];
const DISTRACTOR_POOL = [
    'Los gatos comen pescado.', 'El cielo es generalmente azul.', 'La gravedad tira de las cosas hacia abajo.', 'El agua está compuesta de H2O.',
    'La semana tiene siete días.', 'El sol es una estrella.', 'Los árboles necesitan luz para crecer.', 'Los ordenadores funcionan con electricidad.'
];

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
    showGame() {
        this.loader.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
    },
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

const AI = {
    async init() {
        // =================================================================
        // ======================= EL PUTO ARREGLO FINAL ===================
        // =================================================================
        // Dejamos de usar rutas relativas de mierda.
        // Construimos la URL completa y absoluta a nuestra carpeta de modelos.
        const modelPath = `${window.location.href.substring(0, window.location.href.lastIndexOf('/'))}/models/all-MiniLM-L6-v2`;
        
        // Y le pasamos esa URL. Ahora no tiene cojones a perderse.
        this.embedder = await pipeline('feature-extraction', modelPath);
        // =================================================================
        // =================================================================
    },
    async getSimilarity(text1, text2) {
        if (!this.embedder) return 0;
        const e1 = await this.embedder(text1, { pooling: 'mean', normalize: true });
        const e2 = await this.embedder(text2, { pooling: 'mean', normalize: true });
        const similarity = (cos_sim(e1.data, e2.data) + 1) / 2 * 100;
        return Math.round(similarity);
    }
};

const Game = {
    state: {
        stability: 100,
        usedPuzzleIndices: new Set()
    },
    async init() {
        UI.init();
        try {
            await AI.init();
            UI.showGame();
            UI.showResult('Iniciando interfaz del Eco-Sintetizador. Eres un Tejedor de Ecos. Tu misión: restaurar la realidad.');
            await new Promise(r => setTimeout(r, 3000));
            this.nextPuzzle();
        } catch (error) {
            console.error("FALLO CRÍTICO AL INICIAR LA IA:", error);
            UI.loader.textContent = "ERROR: EL NÚCLEO SEMÁNTICO NO RESPONDE. RECARGA LA SIMULACIÓN.";
        }
    },
    generatePuzzle() {
        if (this.state.usedPuzzleIndices.size >= PUZZLE_BANK.length) {
            return null;
        }
        let puzzleIndex;
        do {
            puzzleIndex = Math.floor(Math.random() * PUZZLE_BANK.length);
        } while (this.state.usedPuzzleIndices.has(puzzleIndex));
        
        this.state.usedPuzzleIndices.add(puzzleIndex);
        const puzzleData = PUZZLE_BANK[puzzleIndex];
        const distractors = [...DISTRACTOR_POOL].sort(() => 0.5 - Math.random()).slice(0, 2);
        const targets = [puzzleData.answer, ...distractors].sort(() => 0.5 - Math.random());

        return {
            source: puzzleData.source,
            targets: targets,
            answer: puzzleData.answer
        };
    },
    nextPuzzle() {
        this.currentPuzzle = this.generatePuzzle();
        if (this.currentPuzzle) {
            UI.renderPuzzle(this.currentPuzzle);
            UI.showResult('Analiza el Eco Fuente. Encuentra la resonancia semántica en las señales objetivo.');
        } else {
            UI.showResult('HAS ESTABILIZADO TODOS LOS ECOS DISPONIBLES. LA REALIDAD TE DA LAS GRACIAS... POR AHORA.');
            UI.targetEchoesList.innerHTML = '';
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
            UI.showResult(`RESONANCIA: ${similarity}%. ¡FALLO DE SINCRONIZACIÓN! Estabilidad comprometida: -${damage}%`);
            UI.updateStability(this.state.stability);
        }
        await new Promise(r => setTimeout(r, 2500));
        if (this.state.stability <= 0) {
            UI.showResult('COLAPSO TOTAL DE LA REALIDAD. SIMULACIÓN TERMINADA.');
            UI.targetEchoesList.innerHTML = '';
            UI.sourceEchoText.textContent = '...SEÑAL PERDIDA...';
            return;
        }
        this.nextPuzzle();
    }
};

Game.init();
