const playerHandEl = document.getElementById('player-hand');
const opponentHandEl = document.getElementById('opponent-hand');
const playerScoreEl = document.getElementById('player-score');
const opponentScoreEl = document.getElementById('opponent-score');
const playerTrumpsEl = document.getElementById('player-trumps');
const opponentTrumpsEl = document.getElementById('opponent-trumps');
const playerLivesEl = document.getElementById('player-lives');
const opponentLivesEl = document.getElementById('opponent-lives');
const roundNumberEl = document.getElementById('round-number');
const currentBetEl = document.getElementById('current-bet');
const messagesEl = document.getElementById('messages');
const targetScoreEl = document.getElementById('target-score');
const btnHit = document.getElementById('btn-hit');
const btnStand = document.getElementById('btn-stand');
const playerTrumpCountEl = document.getElementById('player-trump-count');
const btnOpenMenu = document.getElementById('btn-open-menu');
const trumpMenu = document.getElementById('trump-menu');
const closeMenu = document.getElementById('close-menu');
const trumpMenuListEl = document.getElementById('trump-menu-list');
const timerDisplayEl = document.getElementById('timer-display').querySelector('span');
const trumpNotificationEl = document.getElementById('trump-notification');

// --- Nuevos Selectores (Inicio/Fin) ---
const startScreenEl = document.getElementById('start-screen');
const gameBoardEl = document.getElementById('game-board');
const controlsEl = document.getElementById('controls');
const endScreenEl = document.getElementById('end-screen');
const endMessageEl = document.getElementById('end-message');
const btnRestart = document.getElementById('btn-restart');


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//ESTADO DEL JUEGO
let state = {
    deck: [],
    playerHand: [],
    opponentHand: [],
    playerTrumps: [],
    opponentTrumps: [],
    playerScore: 0,
    opponentScore: 0,
    playerLives: 10,
    opponentLives: 10,
    round: 1,
    baseBet: 1,
    currentBet: 1,
    pot: 0, 
    targetScore: 21,
    isPlayerTurn: true,
    isRoundOver: false,
    isMatchOver: false,
    playerPassed: false,
    opponentPassed: false,
    playerUsedTrumpThisTurn: false,
    opponentUsedTrumpThisTurn: false,
    timeLeft: 30,
    playerShieldActive: false,
    opponentShieldActive: false,
    adaptiveCurrentTrumpChance: 0.15,
    adaptiveCurrentTurnTime: 20
};
let turnTimerInterval = null;
let currentSettings = {};

const BASE_TRUMP_IDS = ['TARGET_24', 'STEAL_TRUMP_RND', 'SWAP_HANDS', 'DOUBLE_BET', 'REDUCE_BET_1', 'TARGET_27', 'ERASE_RIVAL_TRUMP_RND', 'DECK_ERASE_SELF', 'DECK_ERASE_RIVAL'];
const ADVANCED_TRUMP_IDS = [...BASE_TRUMP_IDS, 'SHIELD', 'RETURN_CARD', 'LIFE_PLUS_1', 'LIFE_PLUS_2', 'LIFE_PLUS_3', 'CURSED_BET', 'BET_MINUS_2', 'BET_PLUS_2', 'I_WONT_DIE'];
const TRUMP_CARDS = {
    'DESPERATION': { name: 'Desesperación', id: 'DESPERATION', description: 'Si pierdes, pierdes todo. Si ganas, duplicas la apuesta.', effect: (user) => { const isWin = Math.random() < 0.5; if (isWin) { state.currentBet *= 2; setMessage("¡Ganaste! Apuesta duplicada."); } else { state.currentBet = 0; setMessage("¡Perdiste! Apuesta anulada."); } return true; } },
    'ALL_OR_NOTHING': { name: 'Todo o Nada', id: 'ALL_OR_NOTHING', description: 'Si pierdes, pierdes todo. Si ganas, duplicas la apuesta.', effect: (user) => { const isWin = Math.random() < 0.5; if (isWin) { state.currentBet *= 2; setMessage("¡Ganaste! Apuesta duplicada."); } else { state.currentBet = 0; setMessage("¡Perdiste! Apuesta anulada."); } return true; } },
    'RETURN_CARD': { name: 'Carta de Regreso', id: 'RETURN_CARD', description: 'Devuelve una carta de tu mano al mazo.', effect: (user) => { const hand = user === 'player' ? state.playerHand : state.opponentHand; if (hand.length > 0) { const cardToReturn = hand.pop(); state.deck.push(cardToReturn); setMessage("¡Carta devuelta al mazo!"); return true; } else { setMessage("No tienes cartas para devolver."); return false; } } },
    'SHIELD': { name: 'Escudo', id: 'SHIELD', description: 'Bloquea el próximo ataque.', effect: (user) => { if (user === 'player') state.playerShieldActive = true; else state.opponentShieldActive = true; setMessage("¡Escudo activado!"); return true; } },
    'STEAL_TRUMP_RND': { name: 'Robar Comodín', id: 'STEAL_TRUMP_RND', description: 'Roba un comodín al azar del rival.', effect: (user) => { const rivalTrumps = (user === 'player') ? state.opponentTrumps : state.playerTrumps; const userTrumps = (user === 'player') ? state.playerTrumps : state.opponentTrumps; if (rivalTrumps.length > 0) { const indexToSteal = Math.floor(Math.random() * rivalTrumps.length); const stolenTrump = rivalTrumps.splice(indexToSteal, 1)[0]; userTrumps.push(stolenTrump); setMessage("¡Comodín robado!"); return true; } else { setMessage("El rival no tiene comodines para robar."); return false; } } },
    'SWAP_HANDS': {name: 'Cambio de Manos', id: 'SWAP_HANDS', description: 'Intercambia tu mano con la del oponente.', effect: (user) => { if (user === 'player') { [state.playerHand, state.opponentHand] = [state.opponentHand, state.playerHand]; } else { [state.opponentHand, state.playerHand] = [state.playerHand, state.opponentHand]; } setMessage("¡Las manos se han intercambiado!"); return true; } },
    'TARGET_24': { name: 'Objetivo 24', id: 'TARGET_24', description: 'El objetivo para ganar ahora es 24.', effect: (user) => { state.targetScore = 24; setMessage(`${user === 'player' ? 'Jugador' : 'Oponente'} usó "Objetivo 24".`); return true; }},
    'DOUBLE_BET': { name: 'Doble Apuesta', id: 'DOUBLE_BET', description: 'Duplica la apuesta de la ronda actual.', effect: (user) => { state.currentBet *= 2; setMessage(`${user === 'player' ? 'Jugador' : 'Oponente'} usó "Doble Apuesta".`); return true; }},
    'REDUCE_BET_1': { name: 'Reducir Apuesta', id: 'REDUCE_BET_1', description: 'Reduce la apuesta actual en 1.', effect: (user) => { if (state.currentBet > 1) { state.currentBet--; setMessage(`${user === 'player' ? 'Jugador' : 'Oponente'} redujo la apuesta.`); return true; } else { setMessage("La apuesta ya es 1."); return false; }}},
    'TARGET_27': { name: 'A por 27', id: 'TARGET_27', description: 'El objetivo para ganar ahora es 27.', effect: (user) => { state.targetScore = 27; setMessage(`${user === 'player' ? 'Jugador' : 'Oponente'} usó "A por 27".`); return true; }},
    'ERASE_RIVAL_TRUMP_RND': { name: 'Borrar Comodín Rival', id: 'ERASE_RIVAL_TRUMP_RND', description: 'Elimina un comodín al azar de la mano del rival.', effect: (user) => { const rivalTrumps = user === 'player' ? state.opponentTrumps : state.playerTrumps; if (rivalTrumps.length > 0) { const indexToRemove = Math.floor(Math.random() * rivalTrumps.length); rivalTrumps.splice(indexToRemove, 1); setMessage("Un comodín rival fue borrado."); return true; } else { setMessage("El rival no tiene comodines."); return false; }}},
    'DECK_ERASE_SELF': { name: 'Borrado de Mazo (Propio)', id: 'DECK_ERASE_SELF', description: 'Si te pasas, borra tu mano y recibe 2 cartas nuevas.', effect: (user) => { const hand = user === 'player' ? state.playerHand : state.opponentHand; const score = calculateScore(hand, false); if (score > state.targetScore) { hand.length = 0; const c1 = drawCard(); const c2 = drawCard(); if (c1) hand.push(c1); if (c2) hand.push(c2); setMessage("Mazo borrado. Recibes 2 cartas nuevas."); return true; } else { setMessage("Solo puedes usar si te has pasado."); return false; } } },
    'DECK_ERASE_RIVAL': { name: 'Borrado de Mazo (Rival)', id: 'DECK_ERASE_RIVAL', description: 'Borra la mano del rival y le da 2 cartas nuevas.', effect: (user) => { const rivalHand = user === 'player' ? state.opponentHand : state.playerHand; rivalHand.length = 0; const c1 = drawCard(); const c2 = drawCard(); if (c1) rivalHand.push(c1); if (c2) rivalHand.push(c2); setMessage("Mazo rival borrado. Recibe 2 cartas nuevas."); return true; } },
    'LIFE_PLUS_1': { name: 'Vida Extra', id: 'LIFE_PLUS_1', description: 'Te otorga 1 punto de vida.', effect: (user) => { if (user === 'player') state.playerLives++; else state.opponentLives++; setMessage("¡+1 Vida!"); return true; } },
    'LIFE_PLUS_2': { name: 'Suerte Fortuita', id: 'LIFE_PLUS_2', description: 'Te otorga 2 puntos de vida.', effect: (user) => { if (user === 'player') state.playerLives += 2; else state.opponentLives += 2; setMessage("¡+2 Vidas!"); return true; } },
    'LIFE_PLUS_3': { name: 'Fortuna Divina', id: 'LIFE_PLUS_3', description: 'Te otorga 3 puntos de vida.', effect: (user) => { if (user === 'player') state.playerLives += 3; else state.opponentLives += 3; setMessage("¡+3 Vidas!"); return true; } },
    'CURSED_BET': { name: 'Apuesta Maldita', id: 'CURSED_BET', description: '50% de dividir la apuesta en 2, 50% de multiplicar en 2.', effect: (user) => { if (Math.random() < 0.5) { state.currentBet = Math.max(1, state.currentBet / 2); setMessage("¡Buena suerte! Apuesta dividida"); } else { state.currentBet *= 2; setMessage("¡JODER! Apuesta doblada"); } return true; } },
    'BET_MINUS_2': { name: 'Menos 2', id: 'BET_MINUS_2', description: 'Baja la apuesta en 2.', effect: (user) => { state.currentBet = Math.max(1, state.currentBet - 2); setMessage("Apuesta -2"); return true; } },
    'BET_PLUS_2': { name: 'Más 2', id: 'BET_PLUS_2', description: 'Aumenta la apuesta en 2.', effect: (user) => { state.currentBet += 2; setMessage("Apuesta +2"); return true; } },
    'I_WONT_DIE': { name: '¡YO NO MORIRÉ!', id: 'I_WONT_DIE', description: 'Anula la apuesta actual (la reduce a 0).', effect: (user) => { state.currentBet = 0; setMessage("¡La apuesta se anula!"); return true; } },
};

const CHAOS_TRUMP_IDS = [
    ...ADVANCED_TRUMP_IDS,
    'ALL_OR_NOTHING',
    'DESPERATION'
];

const OTHER_TRUMPS = {
    //para dificultad dificil
    'SHIELD': {
        name: 'Escudo',
        id: 'SHIELD',
        description: 'Niega el próximo comodín que juegue el rival.',
        effect: (user) => {
            if (user === 'player') {
                state.playerShieldActive = true;
            } else {
                state.opponentShieldActive = true;
            }
            setMessage("¡Escudo activado!");
            return true;
        }
    },
    'RETURN_CARD': {
        name: 'Retorno',
        id: 'RETURN_CARD',
        description: 'Devuelve tu carta más alta (no oculta) al mazo.',
        effect: (user) => {
            const hand = (user === 'player') ? state.playerHand : state.opponentHand;
            if (hand.length <= 1) { //no puede devolver si solo tiene 1 carta (la oculta)
                setMessage("No hay cartas para devolver.");
                return false;
            }

            let highestValue = -1;
            let highestIndex = -1;
            const startIndex = (user === 'player') ? 0 : 1; 

            for (let i = startIndex; i < hand.length; i++) {
                if (hand[i].value > highestValue) {
                    highestValue = hand[i].value;
                    highestIndex = i;
                }
            }

            if (highestIndex !== -1) {
                const returnedCard = hand.splice(highestIndex, 1)[0];
                state.deck.push(returnedCard);
                shuffleDeck(state.deck);
                setMessage("Carta más alta devuelta al mazo.");
                return true;
            }
            return false;
        }
    },
    //NUEVOS COMODINES CAOS
    'ALL_OR_NOTHING': {
        name: 'Todo o Nada',
        id: 'ALL_OR_NOTHING',
        description: '¡La apuesta sube a 99,999,999!',
        effect: (user) => {
            state.currentBet = 99999999;
            setMessage("¡¡¡TODO O NADA!!!");
            return true;
        }
    },
    'DESPERATION': {
        name: 'Desesperación',
        id: 'DESPERATION',
        description: '50% de bajar el objetivo (10-20), 50% de subirlo (22-40)',
        effect: (user) => {
            if (Math.random() < 0.5) {
                // Bajar
                state.targetScore = getRandomInt(10, 20);
                setMessage(`¡Desesperación! Nuevo objetivo: ${state.targetScore}`);
            } else {
                // Subir
                state.targetScore = getRandomInt(22, 40);
                setMessage(`¡Desesperación! Nuevo objetivo: ${state.targetScore}`);
            }
            return true;
        }
    }
}

const DIFFICULTY_SETTINGS = {
    'facil': { turnTime: 45, trumpChance: 0.50, seeOpponentCard: true, initialBet: 1, betIncrement: [0, 0], lives: 5, aiUseTrumps: false, trumpPool: BASE_TRUMP_IDS },
    'medio': { turnTime: 30, trumpChance: 0.25, seeOpponentCard: false, initialBet: 1, betIncrement: [1, 2], lives: 10, aiUseTrumps: true, trumpPool: BASE_TRUMP_IDS },
    'dificil': { turnTime: 15, trumpChance: 0.15, seeOpponentCard: false, initialBet: 1, betIncrement: [1, 2], lives: 10, aiUseTrumps: true, trumpPool: ADVANCED_TRUMP_IDS },
    'experto': { turnTime: 10, trumpChance: 0.10, seeOpponentCard: false, initialBet: 1, betIncrement: [1, 2, 3], lives: 15, aiUseTrumps: true, trumpPool: ADVANCED_TRUMP_IDS },
    'leon': { turnTime: 3, trumpChance: 0.05, seeOpponentCard: false, initialBet: 1, betIncrement: [2, 4, 6, 8, 10, 12], lives: 50, aiUseTrumps: true, trumpPool: CHAOS_TRUMP_IDS },
    'CAOS': { turnTime: 20, trumpChance: 1.0, seeOpponentCard: false, initialBet: 1, betIncrement: [5, 10, 30, 50], lives: 200, aiUseTrumps: true, trumpPool: CHAOS_TRUMP_IDS },
    'adaptativo': { turnTime: 15, trumpChance: 0.3, seeOpponentCard: false, initialBet: 1, betIncrement: [1], lives: 20, aiUseTrumps: true, trumpPool: CHAOS_TRUMP_IDS,
        isAdaptive: true,
        adaptiveTrumpChance: 0.15,
        adaptiveTurnTime: 20
     }, 
};

//LOGICA BASE DEL JUEGO (MAZO, CARTAS)
function createDeck() {
    let deck = [];
    for (let i = 1; i <= 10; i++) {
        deck.push({ rank: i, value: i, isAce: false });
    }
    deck.push({ rank: 11, value: 11, isAce: true }); // "11 Rojo" (As)
    deck.push({ rank: 11, value: 11, isAce: false }); // "11 Negro"
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function calculateScore(hand, isHidingFirstCard) {
    let score = 0;
    let handToScore = isHidingFirstCard ? hand.slice(1) : hand;
    score = handToScore.reduce((sum, card) => sum + card.value, 0);
    
    let aces = handToScore.filter(card => card.isAce === true).length;
    while (score > state.targetScore && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

function drawCard() {
    if (state.deck.length === 0) {
        setMessage("¡No hay más cartas en el mazo!");
        return null;
    }
    return state.deck.pop();
}

//LOGICA DE TURNOS, RONDAS Y TEMPORIZADOR

function initMatch() {
    state.playerLives = currentSettings.lives;
    state.opponentLives = currentSettings.lives;
    state.round = 1;
    state.pot = 0;
    state.isMatchOver = false;

    if (currentSettings.isAdaptive) {
        state.adaptiveCurrentTrumpChance = currentSettings.adaptiveTrumpChance;
        state.adaptiveCurrentTurnTime = currentSettings.adaptiveTurnTime;
        currentSettings.trumpChance = state.adaptiveCurrentTrumpChance;
        currentSettings.turnTime = state.adaptiveCurrentTurnTime;
    }
    
    state.playerTrumps = [];
    state.opponentTrumps = [];

    if (currentSettings === DIFFICULTY_SETTINGS['leon']) {
        for (let i = 0; i < 2; i++) {
            giveTrumpCard('player');
            giveTrumpCard('opponent');
        }
    }
    
    startRound();
}

function startRound() {
    if (state.isMatchOver) return;
    
    state.deck = createDeck();
    shuffleDeck(state.deck);
    state.playerHand = [drawCard(), drawCard()];
    state.opponentHand = [drawCard(), drawCard()];
    state.targetScore = 21;
    state.isPlayerTurn = true;
    state.isRoundOver = false;
    state.playerPassed = false;
    state.opponentPassed = false;
    state.playerUsedTrumpThisTurn = false;
    state.opponentUsedTrumpThisTurn = false;
    state.playerShieldActive = false;
    state.opponentShieldActive = false;

    if (currentSettings.isAdaptive && state.round > 1) {
        state.adaptiveCurrentTrumpChance = Math.min(0.80, state.adaptiveCurrentTrumpChance + 0.05);
        
        state.adaptiveCurrentTurnTime = Math.max(5, state.adaptiveCurrentTurnTime - 1);
        
        currentSettings.trumpChance = state.adaptiveCurrentTrumpChance;
        currentSettings.turnTime = state.adaptiveCurrentTurnTime;
        
        console.log(`IA Adaptada: Prob. Comodín=${state.adaptiveCurrentTrumpChance}, Tiempo Turno=${state.adaptiveCurrentTurnTime}`);
    }
    
    if (state.round === 1) {
        state.baseBet = currentSettings.initialBet;
    } else if (currentSettings.betIncrement[0] > 0 || currentSettings.betIncrement[1] > 0) {
        const [min, max] = currentSettings.betIncrement;
        const increment = Math.floor(Math.random() * (max - min + 1)) + min;
        state.baseBet += increment;
    }
    state.currentBet = state.baseBet + state.pot;
    state.pot = 0;

    updateUI();
    setMessage(`Ronda ${state.round}. Apuesta: ${state.currentBet}. Tu turno.`);
    startTurnTimer();
}

function playerHit() {
    if (!state.isPlayerTurn || state.isRoundOver) return;

    const playerScore = calculateScore(state.playerHand, false);
    if (playerScore >= state.targetScore) {
        setMessage(`Ya tienes ${state.targetScore} o más. No puedes pedir.`);
        return;
    }
    stopTurnTimer();

    const newCard = drawCard();
    if (!newCard) {
        setMessage("No hay más cartas. Debes plantarte.");
        btnHit.disabled = true;
        startTurnTimer(); 
        return;
    }

    playSoundEffect('player_hit');

    state.playerHand.push(newCard);
    state.playerPassed = false;
    
    if (Math.random() < currentSettings.trumpChance) {
        setTimeout(() => {
            giveTrumpCard('player');
            setMessage('¡Has obtenido un comodín!');
        }, 500);
    }
    
    updateUI();

    const realPlayerScore = calculateScore(state.playerHand, false);
    if (realPlayerScore > state.targetScore) {
        setMessage(`¡Te pasaste! (${realPlayerScore}). Usa 'Borrado de Mazo' o plántate.`);
        endPlayerTurn(); 
    } else {
        endPlayerTurn(); 
    }
}

function playerStand() {
    if (!state.isPlayerTurn || state.isRoundOver) return;
    stopTurnTimer();

    const realPlayerScore = calculateScore(state.playerHand, false);
    if (realPlayerScore > state.targetScore) {
        endRound('opponent', `Te pasaste (${realPlayerScore}) y decidiste plantarte.`);
        return;
    }
    
    playSoundEffect('player_stand');
    setMessage("Te plantas (pasas el turno).");
    state.playerPassed = true;
    
    endPlayerTurn();
}

function endPlayerTurn() {
    if (state.isRoundOver) return;
    state.playerUsedTrumpThisTurn = false;
    
    if (state.playerPassed && state.opponentPassed) {
        compareScoresAndEndRound();
        return;
    }
    
    state.isPlayerTurn = false;
    updateControls();
    setMessage('Turno del Oponente...');
    setTimeout(opponentTurn, 1500);
}

function endOpponentTurn() {
    if (state.isRoundOver) return;
    state.opponentUsedTrumpThisTurn = false;

    if (state.playerPassed && state.opponentPassed) {
        compareScoresAndEndRound();
        return;
    }

    state.isPlayerTurn = true;
    updateControls();
    setMessage('Tu turno.');
    startTurnTimer(); 
}


function compareScoresAndEndRound() {
    const pScore = calculateScore(state.playerHand, false);
    const oScore = calculateScore(state.opponentHand, false);
    
    if (pScore > state.targetScore) endRound('opponent', 'Te pasaste.');
    else if (oScore > state.targetScore) endRound('player', 'Oponente se pasó.');
    else if (pScore > oScore) endRound('player', `Ganas la ronda (${pScore} a ${oScore}).`);
    else if (oScore > pScore) endRound('opponent', `Oponente gana la ronda (${oScore} a ${pScore}).`);
    else endRound('draw', `Empate (${pScore} a ${oScore}).`);
}

function endRound(winner, reason) {
    if (state.isRoundOver) return;
    
    stopTurnTimer(); 
    state.isRoundOver = true;
    updateControls();

    let roundMessage = reason;
    const damage = state.currentBet; 

    if (winner === 'player') {
        state.opponentLives -= damage;
        if(damage > 0) {
            roundMessage += ` Oponente pierde ${damage} ${damage > 1 ? 'vidas' : 'vida'}.`;
            playSoundEffect('opponent_lose_life');
        }
    } else if (winner === 'opponent') {
        state.playerLives -= damage;
        if(damage > 0) {
            roundMessage += ` Pierdes ${damage} ${damage > 1 ? 'vidas' : 'vida'}.`;
            playSoundEffect('player_lose_life');
        }
    } else {
        state.pot = state.currentBet; 
        roundMessage += ' ¡Empate! La apuesta se acumula.';
    }
    
    state.round++;
    updateUI();
    setMessage(roundMessage);

    renderHand(state.opponentHand, opponentHandEl, false, false, true); 

    if (state.playerLives <= 0) endMatch(false);
    else if (state.opponentLives <= 0) endMatch(true);
    else setTimeout(startRound, 4000);
}

function endMatch(playerWon) {
    state.isMatchOver = true;
    stopTurnTimer(); 
    
    stopMusic(false);

    if (playerWon) {
        endMessageEl.textContent = "¡GANASTE EL JUEGO!";
        playSoundEffect('win');
    } else {
        endMessageEl.textContent = "GAME OVER";
        playSoundEffect('lose');
    }
    
    gameBoardEl.classList.add('hidden');
    controlsEl.classList.add('hidden');
    endScreenEl.classList.remove('hidden');
}

function opponentTurn() {
    if (state.isRoundOver) return;
    if (state.opponentPassed && state.playerPassed) {
        compareScoresAndEndRound();
        return;
    }
    setTimeout(decideOpponentAction, 1000);
}

function decideOpponentAction() {
    if (state.isRoundOver) return;
    const playerScore = calculateScore(state.playerHand, false);
    const opponentScore = calculateScore(state.opponentHand, false);
    
    if (currentSettings.aiUseTrumps) {
        if (opponentScore > state.targetScore) {
            const eraseTrump = state.opponentTrumps.find(t => t.id === 'DECK_ERASE_SELF');
            if (eraseTrump) {
                playTrumpCard(eraseTrump.id, 'opponent');
                setTimeout(decideOpponentAction, 1000);
                return;
            } else {
                opponentStand(true);
                return;
            }
        }
        
        if (playerScore > state.targetScore) {
            opponentStand(true); 
            return;
        }

        const trumpToPlay = evaluateTrumpCards_IA(playerScore, opponentScore);
        if (trumpToPlay) {
            playTrumpCard(trumpToPlay.id, 'opponent');
            setTimeout(decideOpponentAction, 1000);
            return;
        }
    }
    
    if (opponentScore < 17) opponentHit();
    else if (state.playerPassed && opponentScore < playerScore) opponentHit();
    else if (opponentScore >= 17 && opponentScore < playerScore) opponentHit();
    else opponentStand(false); 
}

function opponentHit() {
    setMessage('Oponente pide carta...');
    const newCard = drawCard();
    if (!newCard) {
        setMessage("Oponente no puede pedir más cartas. Se planta.");
        opponentStand(false);
        return;
    }

    playSoundEffect('opponent_hit');

    state.opponentHand.push(newCard);
    state.opponentPassed = false; 
    
    if (currentSettings.aiUseTrumps && Math.random() < currentSettings.trumpChance) {
        giveTrumpCard('opponent');
    }
    
    updateUI();
    const realOpponentScore = calculateScore(state.opponentHand, false);
    if (realOpponentScore > state.targetScore) setMessage("Oponente se pasó.");
    
    endOpponentTurn();
}

function opponentStand(isForced) {
    const realOpponentScore = calculateScore(state.opponentHand, false);
    if (realOpponentScore > state.targetScore && !isForced) {
        state.opponentPassed = true; 
        endOpponentTurn();
        return;
    }

    if (!isForced) setMessage('Oponente se planta (pasa el turno).');
    playSoundEffect('opponent_stand');
    state.opponentPassed = true;
    
    endOpponentTurn();
}

function evaluateTrumpCards_IA(playerScore, opponentScore) {
    const doubleBet = state.opponentTrumps.find(t => t.id === 'DOUBLE_BET');
    if (doubleBet && opponentScore >= 18 && opponentScore > playerScore && playerScore <= state.targetScore) {
        return doubleBet;
    }
    const target27 = state.opponentTrumps.find(t => t.id === 'TARGET_27');
    if (target27 && opponentScore > 24 && opponentScore <= 27) {
        return target27;
    }
    
    if (playerScore > opponentScore && playerScore <= state.targetScore && state.currentBet > 3) {
        
        const iWontDie = state.opponentTrumps.find(t => t.id === 'I_WONT_DIE');
        if (iWontDie) return iWontDie; 
        
        const betMinus2 = state.opponentTrumps.find(t => t.id === 'BET_MINUS_2');
        if (betMinus2) return betMinus2;
        
        const reduceBet1 = state.opponentTrumps.find(t => t.id === 'REDUCE_BET_1');
        if (reduceBet1) return reduceBet1;
    }

    if (opponentScore > playerScore && opponentScore >= 19 && opponentScore <= state.targetScore && playerScore <= state.targetScore) {
        
        const doubleBet = state.opponentTrumps.find(t => t.id === 'DOUBLE_BET');
        if (doubleBet) return doubleBet;
        
        const betPlus2 = state.opponentTrumps.find(t => t.id === 'BET_PLUS_2');
        if (betPlus2) return betPlus2;
    }

    if (opponentScore > state.targetScore) {
        if (opponentScore <= 24) {
            const target24 = state.opponentTrumps.find(t => t.id === 'TARGET_24');
            if (target24) return target24;
        }
        if (opponentScore <= 27) {
            const target27 = state.opponentTrumps.find(t => t.id === 'TARGET_27');
            if (target27) return target27;
        }
    }

    if (state.playerTrumps.length >= 2) {
         const eraseTrump = state.opponentTrumps.find(t => t.id === 'ERASE_RIVAL_TRUMP_RND');
         if (eraseTrump) return eraseTrump;
    }
    return null;
}

function giveTrumpCard(user) {
    const pool = currentSettings.trumpPool;
    const randomTrumpKey = pool[Math.floor(Math.random() * pool.length)];
    
    if (user === 'player') state.playerTrumps.push({ ...TRUMP_CARDS[randomTrumpKey] });
    else state.opponentTrumps.push({ ...TRUMP_CARDS[randomTrumpKey] });
    
    updateUI();
}

function playTrumpCard(trumpId, user) {
    if (user === 'player' && !state.isPlayerTurn) return;
    if (user === 'player') stopTurnTimer(); 

    const trumpArray = user === 'player' ? state.playerTrumps : state.opponentTrumps;
    const trumpIndex = trumpArray.findIndex(t => t.id === trumpId);
    
    if (trumpIndex === -1) {
        if (user === 'player') startTurnTimer();
        return;
    }

    const isPlayer = (user === 'player');
    const rivalShieldActive = isPlayer ? state.opponentShieldActive : state.playerShieldActive;
    
    if (rivalShieldActive) {
        if (isPlayer) {
            state.opponentShieldActive = false;
        } else {
            state.playerShieldActive = false;
        }
        
        trumpArray.splice(trumpIndex, 1);
        setMessage("¡Comodín negado por Escudo!");
        showTrumpNotification("ESCUDO");
        updateUI();
        
        if (isPlayer) startTurnTimer();
        return;
    }
    
    const trumpToPlay = trumpArray[trumpIndex];
    const success = trumpToPlay.effect(user);
    
    updateUI();

    if (success) {
        trumpArray.splice(trumpIndex, 1);
        showTrumpNotification(trumpToPlay.name); 
        
        if (user === 'player') {
            state.playerUsedTrumpThisTurn = true;
        } else {
            state.opponentUsedTrumpThisTurn = true;
        }
        
        updateUI();
    } else {
        if (user === 'player') {
            startTurnTimer();
        }
    }
}

function updateUI() {
    if (state.isMatchOver) return;

    state.playerScore = calculateScore(state.playerHand, false);
    const isOpponentCardVisible = currentSettings.seeOpponentCard;
    let opponentVisibleScore = calculateScore(state.opponentHand, !isOpponentCardVisible); 

    playerScoreEl.textContent = state.playerScore;
    
    if (isOpponentCardVisible) {
        opponentScoreEl.textContent = calculateScore(state.opponentHand, false);
    } else {
        opponentScoreEl.textContent = `${opponentVisibleScore} + ?`;
    }
    
    playerLivesEl.textContent = state.playerLives;
    opponentLivesEl.textContent = state.opponentLives;
    roundNumberEl.textContent = state.round;
    currentBetEl.textContent = state.currentBet;
    targetScoreEl.textContent = `Objetivo: ${state.targetScore}`;
    playerTrumpCountEl.textContent = state.playerTrumps.length;
    
    renderHand(state.playerHand, playerHandEl, false, true);
    renderHand(state.opponentHand, opponentHandEl, !isOpponentCardVisible, false);
    
    renderTrumps(state.playerTrumps.slice(0, 3), playerTrumpsEl, 'player'); 
    renderTrumps(state.opponentTrumps.slice(0, 3), opponentTrumpsEl, 'opponent');
    
    updateControls();
}

function renderHand(hand, element, isHidingFirstCard, isOwner, forceShowAll = false) {
    element.innerHTML = '';
    
    hand.forEach((card, index) => {
        let cardDiv;
        
        if (index === 0 && isHidingFirstCard && !isOwner && !forceShowAll) {
            cardDiv = document.createElement('div');
            cardDiv.className = 'card-back';
        } else {
            cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            
            if ((card.rank === 11 && card.isAce) || card.rank === 10) {
                 cardDiv.classList.add('red');
            }
            
            cardDiv.textContent = card.rank;
        }
        element.appendChild(cardDiv);
    });
}

function renderTrumps(trumps, element, user) {
    element.innerHTML = '';

    const isPlayer = (user === 'player');

    if (!isPlayer && !currentSettings.showOpponentTrumps) {
        return;
    }
    trumps.forEach(trump => {
        const trumpDiv = document.createElement('div');
        trumpDiv.className = 'trump-card';
        trumpDiv.title = trump.description;
        trumpDiv.textContent = trump.name;
        
        if (user === 'player') {
            trumpDiv.onclick = () => {
                if (state.isPlayerTurn && !state.isRoundOver) {
                    playTrumpCard(trump.id, 'player');
                    closeTrumpMenu();
                }
            };
        }
        element.appendChild(trumpDiv);
    });
}

function updateControls() {
    const enable = state.isPlayerTurn && !state.isRoundOver && !state.isMatchOver;
    btnHit.disabled = !enable || state.deck.length === 0;
    btnStand.disabled = !enable;
}

function setMessage(msg) {
    messagesEl.textContent = msg;
}

function startTurnTimer() {
    stopTurnTimer(); 
    state.timeLeft = currentSettings.turnTime;
    updateTimerDisplay();

    turnTimerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();
        if (state.timeLeft <= 0) {
            stopTurnTimer();
            if (state.isPlayerTurn) { 
                setMessage("¡Tiempo agotado! Te plantas (pasas turno).");
                playerStand(); 
            }
        }
    }, 1000);
}

function stopTurnTimer() {
    clearInterval(turnTimerInterval);
}

function updateTimerDisplay() {
    timerDisplayEl.textContent = state.timeLeft;
}

function showTrumpNotification(trumpName) {
    trumpNotificationEl.textContent = trumpName;
    trumpNotificationEl.classList.add('show');
    trumpNotificationEl.classList.remove('hidden');

    setTimeout(() => {
        trumpNotificationEl.classList.remove('show');
        trumpNotificationEl.classList.add('hidden');
    }, 2500);
}

function openTrumpMenu() {
    renderTrumps(state.playerTrumps, trumpMenuListEl, 'player');
    trumpMenu.classList.remove('hidden');
}

function closeTrumpMenu() {
    trumpMenu.classList.add('hidden');
}

function selectDifficulty(mode) {
    currentSettings = DIFFICULTY_SETTINGS[mode];
    if (!currentSettings) return; 

    startScreenEl.classList.add('hidden');
    gameBoardEl.classList.remove('hidden');
    controlsEl.classList.remove('hidden');

    playMusic(mode);

    initMatch();
}

function resetToMenu() {
    stopMusic(true);

    gameBoardEl.classList.add('hidden');
    controlsEl.classList.add('hidden');
    endScreenEl.classList.add('hidden');
    startScreenEl.classList.remove('hidden');
}

btnHit.addEventListener('click', playerHit);
btnStand.addEventListener('click', playerStand);
btnOpenMenu.addEventListener('click', openTrumpMenu);
closeMenu.addEventListener('click', closeMenu);
window.onclick = (event) => { if (event.target == trumpMenu) closeTrumpMenu(); };
btnRestart.addEventListener('click', resetToMenu);

document.querySelectorAll('.difficulty-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        selectDifficulty(e.target.dataset.mode);
    });
});