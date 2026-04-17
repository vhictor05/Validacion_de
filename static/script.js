// =====================================================
// REFERENCIAS AL DOM
// =====================================================
const inputText = document.getElementById('inputText');
const validateBtn = document.getElementById('validateBtn');
const clearBtn = document.getElementById('clearBtn');
const copyBtn = document.getElementById('copyBtn');
const wordCount = document.getElementById('wordCount');
const resultsSection = document.getElementById('resultsSection');
const summaryBar = document.getElementById('summaryBar');
const errorList = document.getElementById('errorList');
const highlightSection = document.getElementById('highlightSection');
const highlightText = document.getElementById('highlightText');
const correctedSection = document.getElementById('correctedSection');
const correctedText = document.getElementById('correctedText');
const loadingSpinner = document.getElementById('loadingSpinner');
const assistantBubble = document.getElementById('assistantBubble');

// =====================================================
// 🆕 REEMPLAZAR PALABRA (CLICK EN SUGERENCIA)
// =====================================================
function reemplazarPalabra(original, nueva) {
  const textoActual = inputText.value;

  const regex = new RegExp(`\\b${original}\\b`, 'i');
  inputText.value = textoActual.replace(regex, nueva);

  // actualizar contador automáticamente
  inputText.dispatchEvent(new Event('input'));
}

// =====================================================
// CONTADOR DE PALABRAS
// =====================================================
inputText.addEventListener('input', () => {
  const text = inputText.value.trim();
  const count = text === '' ? 0 : text.split(/\s+/).filter(w => w.length > 0).length;

  wordCount.textContent = `${count} palabra${count !== 1 ? 's' : ''}`;
  wordCount.style.color = count === 0 ? '#555970' : '#a29bff';

  validateBtn.disabled = count === 0;
});

// =====================================================
// LIMPIAR
// =====================================================
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  wordCount.textContent = '0 palabras';
  wordCount.style.color = '#555970';
  resultsSection.hidden = true;
  validateBtn.disabled = true;
  inputText.focus();
});

// =====================================================
// COPIAR
// =====================================================
copyBtn.addEventListener('click', () => {
  const texto = correctedText.textContent;
  navigator.clipboard.writeText(texto).then(() => {
    copyBtn.textContent = '✓ Copiado';
    setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
  });
});

// =====================================================
// VALIDAR TEXTO
// =====================================================
validateBtn.addEventListener('click', async () => {
  const texto = inputText.value;

  if (!texto.trim()) {
    mostrarMensaje('Por favor, ingresa algún texto antes de validar.');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto })
    });

    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }

    const data = await response.json();

    setTimeout(() => {
      mostrarResultados(data);
      setLoading(false);
    }, 600);

  } catch (error) {
    console.error(error);
    mostrarMensaje('No se pudo conectar con el servidor.');
    setLoading(false);
  }
});

// =====================================================
// MOSTRAR RESULTADOS
// =====================================================
function mostrarResultados(data) {
  errorList.innerHTML = '';
  highlightSection.hidden = true;
  correctedSection.hidden = true;
  resultsSection.hidden = false;

  const { total_errores, errores, texto_original, texto_corregido } = data;

  if (total_errores === 0) {
    actualizarAsistente('ok');

    summaryBar.className = 'summary-bar summary-bar--success';
    summaryBar.innerHTML = `
      <span>✔</span>
      <span>¡El texto no presenta errores detectados!</span>
    `;
    return;
  }

  actualizarAsistente('error', total_errores);

  summaryBar.className = 'summary-bar summary-bar--error';
  summaryBar.innerHTML = `
    <span>⚠️</span>
    <span>Se encontraron <strong>${total_errores}</strong> problemas.</span>
  `;

  errores.forEach((error, index) => {
    const item = document.createElement('div');
    item.className = `error-item error-item--${error.tipo}`;
    item.style.animationDelay = `${index * 0.05}s`;

    const iconos = {
      ortografia: '🔤',
      mayuscula: '🔠',
      incoherente: '❓'
    };

    let candidatosHTML = '';
    if (error.candidatos && error.candidatos.length > 0) {
      const chips = error.candidatos.map(c => `
        <span class="chip" style="cursor:pointer"
          onclick="reemplazarPalabra('${error.palabra_original}', '${c}')">
          ${c}
        </span>
      `).join('');
      candidatosHTML = `<div class="error-item__candidates">${chips}</div>`;
    }

    let sugerenciaHTML = '';
    if (error.sugerencia) {
      sugerenciaHTML = `
        <p class="error-item__suggestion">
          💡 ${escapeHTML(error.sugerencia)}
        </p>`;
    }

    item.innerHTML = `
      <span class="error-item__icon">${iconos[error.tipo] || '❗'}</span>
      <div class="error-item__body">
        <p class="error-item__msg">${escapeHTML(error.mensaje)}</p>
        ${sugerenciaHTML}
        ${candidatosHTML}
      </div>
    `;

    errorList.appendChild(item);
  });

  const palabrasMal = errores
    .filter(e => e.tipo === 'ortografia' && e.palabra_original)
    .map(e => e.palabra_original);

  if (palabrasMal.length > 0) {
    let textoResaltado = escapeHTML(texto_original);

    palabrasMal.forEach(p => {
      const safe = p.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}])(${safe})(?=[^\\p{L}\\p{N}]|$)`, 'giu');
      textoResaltado = textoResaltado.replace(regex, `$1<mark class="highlight-error">$2</mark>`);
    });

    highlightSection.hidden = false;
    highlightText.innerHTML = textoResaltado;
  }

  if (texto_corregido && texto_corregido !== texto_original) {
    correctedSection.hidden = false;
    correctedText.textContent = texto_corregido;
  }
}

// =====================================================
// LOADING
// =====================================================
function setLoading(isLoading) {
  loadingSpinner.hidden = !isLoading;
  validateBtn.disabled = isLoading;
  validateBtn.style.opacity = isLoading ? '0.6' : '1';

  if (isLoading) {
    resultsSection.hidden = true;
    actualizarAsistente('cargando');
  }
}

// =====================================================
// MENSAJES
// =====================================================
function mostrarMensaje(msg) {
  resultsSection.hidden = false;
  errorList.innerHTML = '';
  correctedSection.hidden = true;

  summaryBar.className = 'summary-bar summary-bar--error';
  summaryBar.innerHTML = `<span>ℹ️</span><span>${msg}</span>`;
}

// =====================================================
// UTILS
// =====================================================
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =====================================================
// ASISTENTE
// =====================================================
function actualizarAsistente(tipo, errores = 0) {
  if (!assistantBubble) return;

  if (tipo === 'inicio') {
    assistantBubble.textContent = "Escribe un texto y te ayudo 😉";
  }

  if (tipo === 'cargando') {
    assistantBubble.textContent = "Analizando texto...";
  }

  if (tipo === 'error') {
    assistantBubble.textContent = `Encontré ${errores} errores 👀`;
  }

  if (tipo === 'ok') {
    assistantBubble.textContent = "Todo perfecto 🔥";
  }
}

actualizarAsistente('inicio');