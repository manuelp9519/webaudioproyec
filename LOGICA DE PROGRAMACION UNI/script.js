document.addEventListener('DOMContentLoaded', () => {
    // --- CHECKLIST LOGIN ---
    const loginForm = document.getElementById('loginForm');
    const messageDisplay = document.getElementById('message');
    const transition = document.getElementById('transition');

    if (loginForm && messageDisplay) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (username === 'usuario' && password === '12345') {
                messageDisplay.textContent = '¡Inicio de sesión exitoso! Redirigiendo...';
                messageDisplay.className = 'message success';
                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('username', username);

                if (transition) {
                    transition.classList.add('active');
                }
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            } else {
                messageDisplay.textContent = 'Usuario o contraseña incorrectos.';
                messageDisplay.className = 'message error';
                document.getElementById('password').value = '';
            }
        });
        return; // Si estamos en login, no ejecutar el resto
    }

    // --- DASHBOARD ---
    const logoutButton = document.getElementById('logoutButton');
    const displayUsername = document.getElementById('displayUsername');
    const decibelsInput = document.getElementById('decibels');
    const checkAuditionButton = document.getElementById('checkAudition');
    const auditionResultDisplay = document.getElementById('auditionResult');
    const aulaResult = document.getElementById('aulaResult');
    const auditionChartCtx = document.getElementById('auditionChart') ? document.getElementById('auditionChart').getContext('2d') : null;
    const emitSoundButton = document.getElementById('emitSoundButton');
    const stopSoundButton = document.getElementById('stopSoundButton');
    const testAudio = document.getElementById('testAudio');
    const soundMessageDisplay = document.getElementById('soundMessage');
    const audioProgress = document.getElementById('audioProgress');

    // --- Lógica de Verificación de Sesión ---
    const isLoggedIn = localStorage.getItem('loggedIn');
    const storedUsername = localStorage.getItem('username');

    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    } else {
        if (displayUsername && storedUsername) {
            displayUsername.textContent = `Hola, ${storedUsername}`;
        }
    }

    // --- Lógica de Cerrar Sesión ---
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('username');
            window.location.href = 'index.html';
        });
    }

    // --- Resultados y gráfica ---
    let auditionResults = [];
    let auditionChart;

    try {
        auditionResults = JSON.parse(localStorage.getItem('auditionResults') || '[]');
        if (!Array.isArray(auditionResults)) auditionResults = [];
    } catch {
        auditionResults = [];
    }

    function asignarAula(decibels) {
        if (decibels <= 20) return "Aula normal";
        if (decibels > 20 && decibels <= 40) return "Aula normal";
        if (decibels > 40 && decibels <= 90) return "Aula adaptativa";
        return "Aula adaptativa";
    }

    function actualizarGrafica() {
        if (!auditionChartCtx) return;
        if (auditionChart) auditionChart.destroy();
        auditionChart = new Chart(auditionChartCtx, {
            type: 'line',
            data: {
                labels: auditionResults.map((_, i) => `Prueba ${i + 1}`),
                datasets: [{
                    label: 'Decibelios',
                    data: auditionResults,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0,123,255,0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                scales: {
                    y: {
                        min: 0,
                        max: 120,
                        title: { display: true, text: 'dB' }
                    }
                }
            }
        });
    }

    // --- Lógica del Programa de Nivel de Audición ---
    if (checkAuditionButton && decibelsInput && auditionResultDisplay && aulaResult) {
        checkAuditionButton.addEventListener('click', () => {
            const decibels = parseInt(decibelsInput.value);

            if (isNaN(decibels) || decibels < 0) {
                auditionResultDisplay.textContent = 'Por favor, introduce un número válido de decibelios.';
                auditionResultDisplay.className = 'message error';
                return;
            }

            // Guardar resultado
            auditionResults.push(decibels);
            localStorage.setItem('auditionResults', JSON.stringify(auditionResults));

            // Mostrar resultado textual
            let resultText = '';
            let resultClass = 'message';
            if (decibels <= 20) {
                resultText = `${decibels} dB: ¡Audición superior!`;
                resultClass += ' success';
            } else if (decibels > 20 && decibels <= 40) {
                resultText = `${decibels} dB: Audición normal.`;
                resultClass += ' normal';
            } else if (decibels > 40 && decibels <= 90) {
                resultText = `${decibels} dB: Pérdida de audición moderada.`;
                resultClass += ' warning';
            } else {
                resultText = `${decibels} dB: ¡No hay audición detectable o pérdida severa!`;
                resultClass += ' error';
            }
            auditionResultDisplay.textContent = resultText;
            auditionResultDisplay.className = resultClass;

            // Asignar aula y mostrar
            aulaResult.textContent = `Aula asignada: ${asignarAula(decibels)}`;

            // Actualizar gráfica
            actualizarGrafica();
        });
    }

    // Inicializar gráfica al cargar
    if (auditionResults.length > 0) {
        actualizarGrafica();
    }

    // --- Barra medidora del sonido interactiva ---
    if (testAudio && audioProgress) {
        testAudio.addEventListener('timeupdate', () => {
            if (testAudio.duration > 0) {
                const percent = (testAudio.currentTime / testAudio.duration) * 100;
                audioProgress.value = percent;

                // Cambia el color según el avance
                if (percent < 20) {
                    audioProgress.style.setProperty('accent-color', '#4caf50'); // verde
                } else if (percent < 40) {
                    audioProgress.style.setProperty('accent-color', '#ffc107'); // amarillo
                } else if (percent < 90) {
                    audioProgress.style.setProperty('accent-color', '#ff9800'); // naranja
                } else {
                    audioProgress.style.setProperty('accent-color', '#ff000d'); // rojo
                }
            }
        });

        testAudio.addEventListener('ended', () => {
            audioProgress.value = 0;
            audioProgress.style.setProperty('accent-color', '#4caf50');
        });
    }

    // --- Emisión y detención de sonido ---
    if (emitSoundButton && testAudio && soundMessageDisplay) {
        emitSoundButton.addEventListener('click', () => {
            testAudio.volume = 1.0;
            testAudio.muted = false;
            testAudio.play()
                .then(() => {
                    soundMessageDisplay.textContent = 'Sonido emitido a volumen máximo (simulando 100 dB).';
                    soundMessageDisplay.className = 'message success';
                })
                .catch(error => {
                    soundMessageDisplay.textContent = 'Error al reproducir el sonido. Asegúrate de que el archivo "tono.wav.mp3" existe y el navegador permite la reproducción.';
                    soundMessageDisplay.className = 'message error';
                    console.error('Error al reproducir el audio:', error);
                });
        });
    }
    if (stopSoundButton && testAudio) {
        stopSoundButton.addEventListener('click', () => {
            testAudio.pause();
            testAudio.currentTime = 0;
        });
    }
});
        