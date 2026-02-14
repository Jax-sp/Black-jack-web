//reproductores de audio
const audioPlayer = new Audio();
audioPlayer.loop = true; 
audioPlayer.volume = 0.05;

const sfxPlayer = new Audio();
sfxPlayer.volume = 0.05; 

//archivos de audio
const musicTracks = {
    'facil': 'music/easy-theme.mp3',
    'medio': 'music/medium-theme.mp3',
    'dificil': 'music/hard-theme.mp3',
    'experto': 'music/expert-theme.mp3',
    'leon': 'music/leon-must-die-theme.mp3',
    'CAOS': 'music/caos-theme.mp3',
    'menu': 'music/menu-theme.mp3' 
};

const soundEffects = {
    'win': [
        'sfx/match-win_1.mp3',
        'sfx/match-win_2.mp3',
        'sfx/match-win_3.mp3'
    ],
    'lose': [
        'sfx/match-lose_1.mp3',
        'sfx/match-lose_2.mp3',
        'sfx/match-lose_3.mp3'
    ],
    
    'player_lose_life': [
        'sfx/leon_pain_1.mp3',
        'sfx/leon_pain_2.mp3',
        'sfx/leon_pain_3.mp3'
    ],
    'opponent_lose_life': [
        'sfx/ganado_pain_1.mp3',
        'sfx/ganado_pain_2.mp3',
        'sfx/ganado_pain_3.mp3',
        'sfx/ganado_pain_4.mp3'
    ],

    'player_hit': [
        'sfx/leon_hit_1.mp3',
        'sfx/leon_hit_2.mp3',
        'sfx/leon_hit_3.mp3'
    ],
    'player_stand': [
        'sfx/leon_stand_1.mp3',
        'sfx/leon_stand_2.mp3',
        'sfx/leon_stand_3.mp3'
    ],
    'opponent_hit': [ 
        'sfx/ganado_hit_1.mp3',
        'sfx/ganado_hit_2.mp3',
        'sfx/ganado_hit_3.mp3'
    ],
    'opponent_stand': [
        'sfx/ganado_stand_1.mp3',
        'sfx/ganado_stand_2.mp3',
        'sfx/ganado_stand_3.mp3'
    ]
};

//estado del audio
let isMusicStarted = false;

/**
 * reproduce la música correspondiente a la dificultad.
 * @param {string} difficulty - ('facil', 'medio', 'dificil', etc.)
 */

function playMusic(difficulty) {
    const track = musicTracks[difficulty];
    
    if (track) {
        isMusicStarted = true;
        if (audioPlayer.src !== track) {
            audioPlayer.src = track;
        }
        audioPlayer.play().catch(e => console.error("Audio no pudo empezar:", e));
    }
}

/**
 * Detiene la música de fondo y opcionalmente
 * cambia a la pista del menú.
 * @param {boolean} [playMenuMusic=true]
 */
function stopMusic(playMenuMusic = true) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;

    if (playMenuMusic) {
        playMusic('menu');
    }
}

/**
 * eeproduce un efecto de sonido una vez.
 * si el 'effectName' tiene varios sonidos, elige uno al azar.
 * @param {string} effectName - ('win', 'lose', 'player_lose_life', 'opponent_lose_life')
 */
function playSoundEffect(effectName) {
    const sfxTracks = soundEffects[effectName]; 

    if (!sfxTracks || sfxTracks.length === 0) {
        console.warn(`No se encontraron SFX para: ${effectName}`);
        return;
    }

    const randomIndex = Math.floor(Math.random() * sfxTracks.length);
    const sfxTrack = sfxTracks[randomIndex];

    if (sfxTrack) {
        sfxPlayer.src = sfxTrack;
        sfxPlayer.play().catch(e => console.error("SFX no pudo empezar:", e));
    }
}

/**
 * actualiza el color y texto del boton de audio.
 * @param {HTMLElement} button - el botón de audio.
 */
function updateMuteButton(button) {
    if (audioPlayer.muted) {
        button.textContent = 'Audio: OFF';
        button.classList.add('muted');
        button.classList.remove('unmuted');
    } else {
        button.textContent = 'Audio: ON';
        button.classList.remove('muted');
        button.classList.add('unmuted');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    const audioButton = document.getElementById('btn-audio-toggle');
    if (!audioButton) return; 

    audioPlayer.muted = false;
    updateMuteButton(audioButton);

    audioButton.addEventListener('click', () => {
        
        if (!isMusicStarted) {
            playMusic('menu');
        }

        audioPlayer.muted = !audioPlayer.muted;
        updateMuteButton(audioButton);
    });
});