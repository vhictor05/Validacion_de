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

// =====================================================
// CONTADOR + UX MEJORADO
// =====================================================
inputText.addEventListener('input', () => {
  const text = inputText.value.trim();
  const count = text === '' ? 0 : text.split(/\s+/).filter(w => w.length > 0).length;

  wordCount.textContent = `${count} palabra${count !== 1 ? 's' : ''}`;

  // 🎨 Cambio de color dinámico
  if (count === 0) {
    wordCount.style.color = "#555970";
  } else if (count < 5) {
    wordCount.style.color = "#ffb347";
  } else {
    wordCount.style.color = "#43e97b";
  }

  // 🚫 Deshabilitar botón si no hay texto
  validateBtn.disabled = text.length === 0;
});

// =====================================================
// LIMPIAR TEXTO
// =====================================================
clearBtn.addEventListener('click', () => {
  inputText.value = '';
  wordCount.textContent = '0 palabras';
  wordCount.style.color = "#555970";
  resultsSection.hidden = true;
  validateBtn.disabled = true;
  inputText.focus();
});

// =====================================================
// COPIAR TEXTO CORREGIDO (MEJORADO)
// =====================================================
copyBtn.addEventListener('click', () => {
  const texto = correctedText.textContent;
  navigator.clipboard.writeText(texto).then(() => {
    copyBtn.textContent = '✓ Copiado';
    copyBtn.style.background = '#43e97b';
    copyBtn.style.color = '#000';

    setTimeout(() => {
      copyBtn.textContent = 'Copiar';
      copyBtn.style.background = '';
      copyBtn.style.color = '';
    }, 2000);
  });
});

// =====================================================
// VALIDAR TEXTO → POST /validar
// =====================================================
validateBtn.addEventListener('click', async () => {
  const texto = inputText.value;

  if (!texto.trim()) {
    mostrarMensaje('Por favor, ingresa algún texto antes de validar.', 'warning');
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
    mostrarResultados(data);

  } catch (error) {
    console.error('Error al validar:', error);
    mostrarMensaje('No se pudo conectar con el servidor. ¿Está ejecutando el backend?', 'error');
  } finally {
    setLoading(false);
  }
});

// =====================================================
// MOSTRAR RESULTADOS
// =====================================================
function mostrarResultados(data) {
  errorList.innerHTML = '';
  if (highlightSection) highlightSection.hidden = true;
  correctedSection.hidden = true;
  resultsSection.hidden = false;

  const { total_errores, errores, texto_original, texto_corregido } = data;

  // 🔥 Scroll automático
  resultsSection.scrollIntoView({ behavior: 'smooth' });

  // --- Summary ---
  if (total_errores === 0) {
    summaryBar.className = 'summary-bar summary-bar--success';
    summaryBar.innerHTML = `
      <span>✅</span>
      <span>¡Texto perfecto! No se encontraron errores.</span>
    `;
    return;
  }

  summaryBar.className = 'summary-bar summary-bar--error';
  summaryBar.innerHTML = `
    <span>⚠️</span>
    <span>Se encontraron <strong>${total_errores}</strong> problema${total_errores !== 1 ? 's' : ''} en el texto.</span>
  `;

  // --- Lista errores ---
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
      const chips = error.candidatos.map(c => `<span class="chip">${c}</span>`).join('');
      candidatosHTML = `<div class="error-item__candidates">${chips}</div>`;
    }

    let sugerenciaHTML = '';
    if (error.sugerencia && error.tipo !== 'ortografia') {
      sugerenciaHTML = `<p class="error-item__suggestion">💡 Sugerencia: <em>${escapeHTML(error.sugerencia)}</em></p>`;
    } else if (error.sugerencia && error.tipo === 'ortografia') {
      sugerenciaHTML = `<p class="error-item__suggestion">💡 Corrección sugerida: <strong>${escapeHTML(error.sugerencia)}</strong></p>`;
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

  // --- Highlight errores ---
  const palabrasMal = errores
    .filter(e => e.tipo === 'ortografia' && e.palabra_original)
    .map(e => e.palabra_original);

  if (palabrasMal.length > 0 && highlightSection) {
    let textoResaltado = escapeHTML(texto_original);

    palabrasMal.forEach(palabra => {
      const safePalabra = palabra.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|[^\\p{L}\\p{N}])(${safePalabra})(?=[^\\p{L}\\p{N}]|$)`, 'giu');
      textoResaltado = textoResaltado.replace(
        regex,
        `$1<mark class="highlight-error" title="Error ortográfico">$2</mark>`
      );
    });

    highlightSection.hidden = false;
    highlightText.innerHTML = textoResaltado;
  }

  // --- Texto corregido ---
  if (texto_corregido && texto_corregido !== texto_original) {
    correctedSection.hidden = false;
    correctedText.textContent = texto_corregido;
  }
}

// =====================================================
// HELPERS
// =====================================================
function setLoading(isLoading) {
  loadingSpinner.hidden = !isLoading;
  validateBtn.disabled = isLoading;
  validateBtn.style.opacity = isLoading ? '0.6' : '1';

  if (isLoading) {
    resultsSection.hidden = true;
  }
}

function mostrarMensaje(msg, tipo) {
  resultsSection.hidden = false;
  errorList.innerHTML = '';
  correctedSection.hidden = true;

  const claseMap = {
    warning: 'summary-bar--error',
    error: 'summary-bar--error',
    success: 'summary-bar--success'
  };

  summaryBar.className = `summary-bar ${claseMap[tipo] || 'summary-bar--error'}`;
  summaryBar.innerHTML = `<span>ℹ️</span><span>${msg}</span>`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}