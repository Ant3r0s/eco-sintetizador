import { pipeline, cos_sim } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

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
        this.body.className = ''; // Limpiamos clases viejas
        if (stability < 75) this.body.classList.add('stability-75');
        if (stability < 50) this.body.classList.add('stability-50');
        if (stability < 25) this.body.classList.add('stability-25');
        if (stability <= 0) this.body.classList.add('stability-0');
    },
    showResult(text) { this.resultText.textContent = text; }
};

const AI = {
    async init() {
        this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    },
    async getSimilarity(text1, text2) {
        if (!this.embedder) return 0;
        const e1 = await this.embedder(text1, { pooling: 'mean', normalize: true });
        const e2 = await this.embedder(text2, { pooling: 'mean', normalize: true });
        // cos_sim devuelve un valor entre -1 y 1. Lo normalizamos a 0-100.
        const similarity = (cos_sim(e1.data, e2.data) + 1) / 2 * 100;
        return Math.round(similarity);
    }
};

const Game = {
    puzzles: [
        { source: 'El agente neutralizó la amenaza sin dudarlo.', targets: ['Los espías son peligrosos.', 'El operativo eliminó el peligro con decisión.', 'La amenaza fue un simple malentendido.'], answer: 'El operativo eliminó el peligro con decisión.' },
        { source: 'La transmisión contenía datos encriptados sobre la ubicación del artefacto.', targets: ['El mensaje cifrado revelaba dónde estaba el objeto.', 'La radio no funcionaba bien.', 'El objeto era un tesoro antiguo.'], answer: 'El mensaje cifrado revelaba dónde estaba el objeto.' },
        { source: 'La simulación comenzó a mostrar fallos estructurales.', targets: ['El programa empezó a tener errores graves.', 'La estructura del edificio era sólida.', 'Me gusta simular que vuelo.'], answer: 'El programa empezó a tener errores graves.' }
    ],
    state: {
        stability: 100,
        currentPuzzle: 0
    },
    async init() {
        UI.init();
        await AI.init();
        UI.showGame();
        this.startPuzzle();
    },
    startPuzzle() {
        if (this.puzzles[this.state.currentPuzzle]) {
            UI.renderPuzzle(this.puzzles[this.state.currentPuzzle]);
            UI.showResult('Esperando selección de Eco Objetivo...');
        } else {
            UI.showResult('REALIDAD ESTABILIZADA. BUEN TRABAJO, OPERADOR.');
            UI.targetEchoesList.innerHTML = '';
        }
    },
    async selectTarget(selectedTarget) {
        UI.targetEchoesList.innerHTML = '<li>ANALIZANDO RESONANCIA...</li>';
        const puzzle = this.puzzles[this.state.currentPuzzle];
        const similarity = await AI.getSimilarity(puzzle.source, selectedTarget);
        UI.showResult(`Resonancia Semántica Detectada: ${similarity}%`);
        
        if (similarity > 70) { // Umbral para acertar
            UI.showResult(`Resonancia Semántica Detectada: ${similarity}%. Eco Sincronizado. Estabilidad intacta.`);
        } else {
            const damage = 25;
            this.state.stability -= damage;
            if (this.state.stability < 0) this.state.stability = 0;
            UI.showResult(`Resonancia Semántica Detectada: ${similarity}%. ¡FALLO DE SINCRONIZACIÓN! Estabilidad comprometida: -${damage}%`);
            UI.updateStability(this.state.stability);
        }

        await new Promise(r => setTimeout(r, 2000));

        if (this.state.stability <= 0) {
            UI.showResult('COLAPSO TOTAL DE LA REALIDAD. SIMULACIÓN TERMINADA.');
            UI.targetEchoesList.innerHTML = '';
            UI.sourceEchoText.textContent = '...SEÑAL PERDIDA...';
            return;
        }

        this.state.currentPuzzle++;
        this.startPuzzle();
    }
};

Game.init();
