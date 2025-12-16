// --- 1. CONFIGURACIÓN DEL JUEGO ---
// Definimos las constantes del juego
const WORD_LENGTH = 5; // Longitud de la palabra a adivinar
const MAX_ATTEMPTS = 6; // Número máximo de intentos
const gameContainer = document.getElementById('game-container'); // Obtiene el contenedor principal

// Lista simple de palabras (¡puedes expandirla!)
let WORD_LIST = []; // Esta será la lista GRANDE de TODAS las palabras válidas

// Definición de las filas del teclado (estándar QWERTY)
const KEYBOARD_LAYOUT = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

const keyboardContainer = document.getElementById('keyboard-container');
let secretWord = ""; // La palabra que el jugador debe adivinar
let currentAttempt = 0; // El índice de la fila actual (0 a 5)
let currentColumn = 0;  // El índice de la columna actual (0 a 4)

// Función asíncrona para cargar la lista de palabras desde el archivo JSON
// La clave que usaremos en localStorage
const LOCAL_STORAGE_KEY = 'validWords'; 

async function loadWords() {
    // 1. Intentar cargar del almacenamiento local
    const storedWords = localStorage.getItem(LOCAL_STORAGE_KEY);

    if (storedWords) {
        try {
            // Si hay palabras guardadas, las cargamos directamente
            WORD_LIST = JSON.parse(storedWords);
            console.log(`Palabras cargadas desde localStorage. Total: ${WORD_LIST.length}`);
            setupGame();
            return; // Detenemos la función aquí
        } catch (e) {
            console.error("Error al parsear palabras de localStorage, se cargará del archivo.", e);
            // Si hay un error, continuará a cargar el archivo JSON
        }
    }
    
    // 2. Cargar del archivo words.json (solo si no hay nada en localStorage o hubo error)
    try {
        const response = await fetch('words.json');
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.status}`);
        }
        
        const fileWords = await response.json();
        WORD_LIST = fileWords;

        // Opcional: Guardamos la lista inicial del archivo en localStorage para el futuro
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(WORD_LIST));

        console.log(`Palabras cargadas desde words.json. Total: ${WORD_LIST.length}`);
        setupGame();
        
    } catch (error) {
        console.error("No se pudo cargar la lista de palabras:", error);
        document.getElementById('message-area').textContent = "Error: No se pudo iniciar el juego.";
    }
}
// --- 2. FUNCIONES DE INICIALIZACIÓN ---

// Función para seleccionar la palabra secreta
// Si la palabra secreta puede ser CUALQUIERA de las palabras válidas
function pickSecretWord() {
    // Asegúrate de que la lista no esté vacía antes de intentar elegir
    if (WORD_LIST.length === 0) {
        console.error("WORD_LIST está vacía, no se puede elegir palabra secreta.");
        return; 
    }
    const randomIndex = Math.floor(Math.random() * WORD_LIST.length);
    secretWord = WORD_LIST[randomIndex];
    // console.log("Palabra Secreta: " + secretWord);
}

// Función para generar la cuadrícula visual del juego
function createGrid() {
    // Bucle para crear las 6 filas de intentos
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const row = document.createElement('div');
        row.classList.add('row');
        row.id = `row-${i}`; // ID único para cada fila
        
        // Bucle para crear las 5 celdas dentro de cada fila
        for (let j = 0; j < WORD_LENGTH; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${i}-${j}`; // ID único para cada celda
            row.appendChild(cell);
        }
        
        gameContainer.appendChild(row);
    }
}

// --- 3. INICIO DEL JUEGO ---

// Función principal que se ejecuta al cargar la página
function setupGame() {
    pickSecretWord(); // Selecciona la palabra a adivinar
    createGrid();     // Dibuja la cuadrícula
    createKeyboard(); 
    document.addEventListener('keydown', handleKeyPress);    
}

// Función para obtener la celda activa actualmente
function getActiveCell() {
    const activeRow = document.getElementById(`row-${currentAttempt}`);
    return activeRow.children[currentColumn];
}

// Función principal que maneja todas las pulsaciones de tecla
function handleKeyPress(event) {
    const key = event.key.toUpperCase();
    // 1. PREVENIR COMPORTAMIENTO POR DEFECTO DEL TECLADO FÍSICO (Para BACKSPACE/Enter)
    if (event.type === 'keydown' && (key === 'BACKSPACE' || key === 'DELETE' || key === 'ENTER')) {
        event.preventDefault(); 
    }
    
    // 1. Manejar la entrada de LETRAS
    // Regex simple para verificar que es una letra (A-Z)
    // Esta línea no vale if (key.length === 1 && key >= 'A' && key <= 'Z') {
    // ¡NUEVA CONDICIÓN! Acepta A-Z y la Ñ
    const esLetraValida = /^[A-ZÑ]$/.test(key); 

    if (key.length === 1 && esLetraValida) {

        if (currentColumn < WORD_LENGTH) {
            const cell = getActiveCell();
            cell.textContent = key; // Escribe la letra en la celda
            cell.classList.add('filled'); // Añade la clase 'filled' del CSS
            currentColumn++; // Avanza a la siguiente columna
        }
    } 
    
    // 2. Manejar la tecla BORRAR (Backspace)
    else if (key === 'BACKSPACE' || key === 'DELETE') {
        // Solo borra si NO estamos en la primera columna (columna 0)
        if (currentColumn > 0) {
            currentColumn--; // Retrocede una columna
            const cell = getActiveCell();
            cell.textContent = ''; // Borra el contenido
            cell.classList.remove('filled'); // Quita la clase 'filled'
        }
    } 

    // 3. Manejar la tecla ENVIAR (Enter)
    else if (key === 'ENTER') {
        // 1. Verificar si la palabra está completa
        if (currentColumn === WORD_LENGTH) {
            
            const guessRow = document.getElementById(`row-${currentAttempt}`);
            let currentGuess = '';
            for (let i = 0; i < WORD_LENGTH; i++) {
                currentGuess += guessRow.children[i].textContent;
            }

            // 2. NUEVA VALIDACIÓN: Verificar si la palabra está en nuestra lista (el diccionario)
            if (WORD_LIST .includes(currentGuess)) {
                checkGuess(); // La palabra es válida, ¡procedemos a chequear!
            } else {
            // --- LÓGICA DE AÑADIR PALABRA RECHAZADA ---
        
        // 1. Mostrar mensaje de error temporal y aplicar efecto visual
        displayMessage("Palabra no reconocida.", 3000); 
        //shakeRow(guessRow);
        
        // 2. Crear y mostrar el botón de añadir palabra
        const messageArea = document.getElementById('message-area');
        
        // Creamos un ID único para el botón basado en la palabra actual 
        const buttonId = `add-word-${currentGuess}`;
        
        // Solo lo creamos si no existe ya un botón para esta palabra
        if (!document.getElementById(buttonId)) {
            const addButton = document.createElement('button');
            addButton.textContent = `Añadir "${currentGuess}" al diccionario`;
            addButton.classList.add('add-word-button', 'temporary-button');
            addButton.id = buttonId; 
            
            addButton.addEventListener('click', () => {
                addValidWord(currentGuess); // Usamos la función que creaste
                
                // Actualizar la interfaz después de guardar
                addButton.textContent = `¡"${currentGuess}" guardada!`;
                addButton.disabled = true;
                
                // Opcional: limpiar el mensaje de error después de guardar
                setTimeout(() => {
                           const msgP = messageArea.querySelector('p');
                           if(msgP) messageArea.removeChild(msgP);
                        }, 1000);
                    });
            messageArea.appendChild(addButton);
 }
            } // CIERRE del 'else' de la validación
        } else {
            // Palabra incompleta
            displayMessage("Palabra incompleta.", 1000);
        }
    } // CIERRE del 'else if (key === 'ENTER')'

} // CIERRE FINAL de la función handleKeyPress

// Función principal para validar la palabra y dar feedback visual
function checkGuess() {
    const guessRow = document.getElementById(`row-${currentAttempt}`);
    let guess = '';
    
    // 1. Construir la palabra intentada a partir del DOM
    for (let i = 0; i < WORD_LENGTH; i++) {
        guess += guessRow.children[i].textContent;
    }
    
    // Convertir ambas a arrays para facilitar la manipulación de letras
    const secret = secretWord.split('');
    const attempt = guess.split('');

    // Array auxiliar para marcar las letras que ya se han matcheado como 'correct'
    const feedback = new Array(WORD_LENGTH).fill('absent');

    // 2. Primera pasada: Buscar aciertos exactos (VERDE)
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (attempt[i] === secret[i]) {
            feedback[i] = 'correct';
            secret[i] = null; // Marcar la letra secreta como usada
        }
    }

    // 3. Segunda pasada: Buscar aciertos de presencia (AMARILLO)
    for (let i = 0; i < WORD_LENGTH; i++) {
        // Solo procesamos las letras que no fueron ya 'correct'
        if (feedback[i] === 'absent') {
            const letterIndexInSecret = secret.indexOf(attempt[i]);
            
            if (letterIndexInSecret !== -1) {
                feedback[i] = 'present';
                secret[letterIndexInSecret] = null; // Marcar esta instancia de la letra secreta como usada
            }
        }
    }

    // 4. Aplicar los colores al DOM (Celdas y Teclado)
    let allCorrect = true;
    for (let i = 0; i < WORD_LENGTH; i++) {
        const cell = guessRow.children[i];
        const status = feedback[i];
        const keyLetter = attempt[i];
        
        // Aplicar color a la celda
        cell.classList.add(status); 
        
        // Aplicar color a la tecla (siempre aplica el color más "fuerte")
        const keyboardKey = document.querySelector(`.key[data-key="${keyLetter}"]`);
        
        if (keyboardKey) {
            // Lógica para mantener el mejor color (Correct > Present > Absent)
            if (keyboardKey.classList.contains('correct')) {
                // No hacemos nada, el verde es el mejor
            } else if (keyboardKey.classList.contains('present') && status === 'absent') {
                // No hacemos nada, el amarillo es mejor que el gris
            } else {
                // Removemos clases anteriores y añadimos la nueva
                keyboardKey.classList.remove('absent', 'present');
                keyboardKey.classList.add(status);
            }
        }

        if (status !== 'correct') {
            allCorrect = false;
        }
    }

    // 5. Determinar el final del juego
    endGameLogic(allCorrect, guess);
}

// Función para mostrar mensajes temporales al usuario
function displayMessage(message, duration) {
    const messageArea = document.getElementById('message-area');
    // Guardamos temporalmente el contenido de messageArea para no borrar el botón de "Jugar de nuevo"
    const originalContent = messageArea.innerHTML; 

    // Solo mostramos el mensaje si el juego sigue activo (no hay botón de reset)
    if (messageArea.querySelector('.play-again-button') === null) {
        messageArea.textContent = message;
        
        setTimeout(() => {
            messageArea.textContent = ''; // Limpia el mensaje después de la duración
            // Si quieres que el botón de reset vuelva a aparecer, usa originalContent aquí
        }, duration);
    }
}

// Función actualizada para manejar la lógica de fin del juego
function endGameLogic(won, word) {
    const messageArea = document.getElementById('message-area');
    messageArea.innerHTML = ''; // Limpiar mensajes temporales
    
    // Si el juego NO ha terminado, solo avanzamos de fila y salimos
    if (!won && currentAttempt < MAX_ATTEMPTS - 1) {
        currentAttempt++;
        currentColumn = 0;
        return; 
    }
    
    // Si el juego TERMINÓ (Ganar o Perder el último intento)

    // 1. Desconectar el teclado
    document.removeEventListener('keydown', handleKeyPress); 
    
    // 2. Determinar el mensaje final
    let message = '';
    if (won) {
        message = `¡Felicidades! Adivinaste la palabra: ${word}`;
    } else {
        message = `¡Perdiste! La palabra era: ${secretWord}`;
    }
    
    // 3. Mostrar mensaje final
    const messageP = document.createElement('p');
    messageP.textContent = message;
    messageArea.appendChild(messageP);

    // 4. Crear y añadir el botón "Jugar de nuevo"
    const playAgainButton = document.createElement('button');
    playAgainButton.textContent = 'Jugar de nuevo';
    playAgainButton.classList.add('play-again-button');
    
    // AÑADIR EVENTO DE CLIC: llama a la nueva función resetGame()
    playAgainButton.addEventListener('click', resetGame);
    
    messageArea.appendChild(playAgainButton);
}

function createKeyboard() {
    KEYBOARD_LAYOUT.forEach(rowKeys => {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('keyboard-row');

        rowKeys.forEach(key => {
            const button = document.createElement('button');
            button.textContent = key;
            button.setAttribute('data-key', key);
            button.classList.add('key');

            // Añadir estilos especiales para ENTER y BACKSPACE
            if (key === 'ENTER' || key === 'BACKSPACE') {
                button.classList.add('wide-key');
            }

            // Conectar la función de manejo de clic
            button.addEventListener('click', () => {
                // Simular el evento de teclado para reusar la lógica existente
                handleKeyPress({ key: key }); 
            });

            rowDiv.appendChild(button);
        });

        keyboardContainer.appendChild(rowDiv);
    });
}
// Nueva función para quitar los colores de feedback del teclado virtual
function resetKeyboardColors() {
    const keys = document.querySelectorAll('#keyboard-container .key');
    keys.forEach(key => {
        key.classList.remove('absent', 'present', 'correct');
    });
}
// Nueva función para reiniciar todo el juego
function resetGame() {
    // 1. Limpiar el estado y el DOM
    currentAttempt = 0;
    currentColumn = 0;
    gameContainer.innerHTML = ''; // Limpiar la cuadrícula anterior
    document.getElementById('message-area').innerHTML = ''; // Limpiar mensajes

    // 2. Resetear el teclado
    resetKeyboardColors();

    // 3. Reiniciar el juego (nueva palabra y nueva cuadrícula)
    pickSecretWord();
    createGrid();
    document.addEventListener('keydown', handleKeyPress); // Reconectar el listener del teclado
}

// Función para añadir una palabra nueva a la lista válida
function addValidWord(newWord) {
    // 1. Asegurarse de que no esté ya en la lista y cumpla la longitud
    if (!WORD_LIST.includes(newWord) && newWord.length === WORD_LENGTH) {
        
        // 2. Añadir a la lista de palabras actual en memoria
        WORD_LIST.push(newWord);
        
        // 3. Guardar la lista actualizada en el almacenamiento local del navegador
        // Usamos JSON.stringify para convertir el array JS a una cadena de texto
        localStorage.setItem('validWords', JSON.stringify(WORD_LIST));
        
        console.log(`Palabra añadida y guardada: ${newWord}`);
    }
}
// Llama a la función de inicio cuando el script se carga
loadWords();


