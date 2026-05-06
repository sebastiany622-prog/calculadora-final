// Chemistry Constants
const N_A = 6.022e23;
const atomicWeights = {
  'H': 1.008, 'He': 4.0026, 'Li': 6.94, 'Be': 9.0122, 'B': 10.81, 'C': 12.011, 'N': 14.007, 'O': 15.999, 'F': 18.998, 'Ne': 20.180,
  'Na': 22.990, 'Mg': 24.305, 'Al': 26.982, 'Si': 28.085, 'P': 30.974, 'S': 32.06, 'Cl': 35.45, 'Ar': 39.948, 'K': 39.098, 'Ca': 40.078,
  'Mn': 54.938, 'Fe': 55.845, 'Cu': 63.546, 'Zn': 65.38, 'Ag': 107.87, 'I': 126.90, 'Au': 196.97, 'Pb': 207.2
};

// --- Logic Helpers ---

function parseFormula(formula) {
  const regex = /([A-Z][a-z]*)(\d*)/g;
  const elements = {};
  let match;
  while ((match = regex.exec(formula)) !== null) {
    const el = match[1];
    const count = parseInt(match[2] || 1);
    elements[el] = (elements[el] || 0) + count;
  }
  return elements;
}

function calculateMolarMass(formula) {
  const elements = parseFormula(formula);
  let totalMass = 0;
  for (const el in elements) {
    if (atomicWeights[el]) {
      totalMass += atomicWeights[el] * elements[el];
    } else {
      return null;
    }
  }
  return totalMass;
}

// --- Navigation ---

// --- Periodic Keyboard ---

function initKeyboard() {
  const elements = ['H', 'C', 'N', 'O', 'P', 'S', 'F', 'Cl', 'Br', 'I', 'Na', 'K', 'Ca', 'Mg', 'Fe', 'Cu', 'Zn', 'Ag', 'Au', 'Pb', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const targets = ['keyboard-moles', 'keyboard-masa', 'keyboard-comp'];
  
  targets.forEach(targetId => {
    const container = document.getElementById(targetId);
    if (!container) return;
    container.innerHTML = '';
    elements.forEach(el => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      btn.textContent = el;
      btn.onclick = () => {
        const activeSection = document.querySelector('.view-section.active');
        const input = activeSection.querySelector('input[type="text"]');
        if (input) {
          input.value += el;
          input.focus();
        }
      };
      container.appendChild(btn);
    });
  });
}

// --- Calculations ---

function formatScientific(num) {
  if (num === 0) return "0";
  const str = num.toExponential(3);
  let [base, exp] = str.split('e');
  
  // Convertir el exponente a superíndices Unicode
  const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', 
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '', '-': '⁻' // Ocultar el + por estética
  };
  
  let unicodeExp = '';
  for (let char of exp) {
    unicodeExp += superscripts[char] !== undefined ? superscripts[char] : char;
  }
  
  return `${base} × 10${unicodeExp}`;
}

function executeMoles() {
  const mass = parseFloat(document.getElementById('mass-input').value);
  const formula = document.getElementById('formula-input-moles').value;
  const resultArea = document.getElementById('results-moles-section');
  
  if (!mass || !formula) return;
  const molarMass = calculateMolarMass(formula);
  if (!molarMass) return;

  const moles = mass / molarMass;
  const molecules = moles * N_A;
  const elements = parseFormula(formula);
  let atomsTotal = 0;
  for (const el in elements) atomsTotal += elements[el];
  const atoms = molecules * atomsTotal;

  document.getElementById('result-moles').textContent = moles.toFixed(4);
  document.getElementById('result-molecules').textContent = formatScientific(molecules);
  document.getElementById('result-atoms').textContent = formatScientific(atoms);
  
  resultArea.classList.add('active');
  mascotSpeak("¡Moles calculados! La cantidad de materia es despreciable para mi genio, Morty.", 8000);
}

function executeMasaMolar() {
  const formula = document.getElementById('formula-input-masa').value;
  const resultArea = document.getElementById('results-masa-section');
  if (!formula) return;
  const molarMass = calculateMolarMass(formula);
  if (!molarMass) return;

  document.getElementById('result-masa-val').textContent = molarMass.toFixed(3);
  resultArea.classList.add('active');
  mascotSpeak("¡Masa molecular lista! ¡Wubba Lubba Dub Dub!", 8000);
}

function executeComposicion() {
  const formula = document.getElementById('formula-input-composicion').value;
  const resultArea = document.getElementById('results-comp-section');
  const container = document.getElementById('composition-results');
  if (!formula) return;
  const molarMass = calculateMolarMass(formula);
  if (!molarMass) return;

  const elements = parseFormula(formula);
  container.innerHTML = '';
  for (const el in elements) {
    const pct = (atomicWeights[el] * elements[el] / molarMass) * 100;
    const item = document.createElement('div');
    item.className = 'res-item';
    item.innerHTML = `<h3>${el} (%)</h3><div class="val">${pct.toFixed(2)}%</div>`;
    container.appendChild(item);
  }
  resultArea.classList.add('active');
  mascotSpeak("¡Análisis de composición terminado! Todo es química y nada tiene sentido.", 8000);
}

function addEmpiricalElement() {
  const container = document.getElementById('empirical-elements-container');
  const div = document.createElement('div');
  div.className = 'grid-pct dynamic-el-row';
  div.innerHTML = `
    <input type="text" class="el-symbol" placeholder="Símbolo">
    <input type="number" class="el-pct" placeholder="% Masa">
  `;
  container.appendChild(div);
}

function executeEmpiricalFormula() {
  const rows = document.querySelectorAll('.dynamic-el-row');
  const targetMass = parseFloat(document.getElementById('target-mass').value);
  const resultArea = document.getElementById('results-formula-section');

  const elementsData = [];
  let minMoles = Infinity;

  rows.forEach(row => {
    const symbol = row.querySelector('.el-symbol').value.trim();
    const pct = parseFloat(row.querySelector('.el-pct').value);
    if (symbol && !isNaN(pct) && atomicWeights[symbol]) {
      const moles = pct / atomicWeights[symbol];
      elementsData.push({ symbol, moles, weight: atomicWeights[symbol] });
      if (moles < minMoles) minMoles = moles;
    }
  });

  if (elementsData.length === 0) return;

  let empStr = "";
  let empMass = 0;

  elementsData.forEach(el => {
    const ratio = Math.round(el.moles / minMoles);
    if (ratio > 0) {
      empStr += `${el.symbol}${ratio > 1 ? ratio : ''}`;
      empMass += ratio * el.weight;
    }
  });

  document.getElementById('result-empirical').textContent = empStr;

  if (targetMass && empMass > 0) {
    const factor = Math.round(targetMass / empMass);
    let molStr = "";
    elementsData.forEach(el => {
      const ratio = Math.round(el.moles / minMoles);
      if (ratio > 0) molStr += `${el.symbol}${ratio * factor > 1 ? ratio * factor : ''}`;
    });
    document.getElementById('result-molecular').textContent = molStr;
  } else {
    document.getElementById('result-molecular').textContent = "N/A";
  }

  resultArea.classList.add('active');
  mascotSpeak("¡Fórmula deducida! No me des las gracias, Morty.", 8000);
}

// Mascot & Dialogue Logic
const introDialogues = [
  "¡Wubba Lubba Dub Dub! ¡Bienvenido a mi Calculadora Química Interdimensional, Morty!",
  "He hackeado la realidad para que puedas calcular moles sin que te explote el cerebro.",
  "Usa el menú de arriba para moverte entre las secciones. ¡No toques nada que parezca inestable!"
];

const sectionDialogues = {
  'dashboard': "Este es el Centro de Control. Desde aquí dominamos la tabla periódica.",
  'moles': "En esta sección convertimos la masa en moles y contamos moléculas. ¡Ciencia pura!",
  'masa': "Aquí calculamos el peso molecular. Es la base de todo, no lo arruines.",
  'composicion': "¿Quieres saber de qué está hecho algo? Aquí analizamos los porcentajes de cada elemento.",
  'formula': "Deducimos fórmulas empíricas y moleculares. Básicamente, leemos el ADN de las sustancias."
};

async function cleanImageBackground(imgId, threshold = 40) {
  const img = document.getElementById(imgId);
  if (!img) return;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    await new Promise((resolve, reject) => {
      if (img.complete) resolve();
      else { img.onload = resolve; img.onerror = reject; }
    });
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2];
      const isWhite = (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold);
      const isGray = (Math.abs(r-204)<threshold && Math.abs(g-204)<threshold && Math.abs(b-204)<threshold);
      if (isWhite || isGray) data[i + 3] = 0;
    }
    ctx.putImageData(imageData, 0, 0);
    img.src = canvas.toDataURL();
  } catch (e) { console.error("Canvas fail", e); }
}

function triggerRickEntrance() {
  const portal = document.getElementById('portal');
  const rick = document.getElementById('mascot-trigger');
  const rickMask = document.getElementById('rick-mask');
  if(!portal || !rick) return;

  cleanImageBackground('mascot-trigger').then(() => {
    portal.classList.add('portal-anim');

    // 1.5s: portal abierto → Rick empieza a crecer DENTRO del círculo (invisible afuera)
    setTimeout(() => {
      rick.classList.add('rick-anim');
      // No ponemos opacity aquí: rickPop maneja la transición de 0→1
    }, 1500);

    // 4.0s: Rick llenó el portal → CRUZA: quita clip del mask, Rick aparece completo
    setTimeout(() => {
      if(rickMask) rickMask.classList.add('rick-front');
      rick.style.opacity = "1"; // Garantiza visibilidad permanente tras el cruce
    }, 4000);

    // 4.5s: sorbo celebratorio
    setTimeout(() => {
      simulateDrink();
    }, 4500);

    // 5s: diálogos
    setTimeout(() => {
      playDialogueSequence(introDialogues);
    }, 5000);
  });
}

function playDialogueSequence(messages, index = 0) {
  if (index >= messages.length) return;
  mascotSpeak(messages[index], 8000);
  setTimeout(() => {
    playDialogueSequence(messages, index + 1);
  }, 9000);
}

let speechTimeout;
function mascotSpeak(message, duration = 6000) {
  const bubble = document.getElementById('mascot-speech');
  if(!bubble) return;
  bubble.textContent = message;
  bubble.classList.add('visible');
  
  // Limpiar el temporizador anterior para que no borre el mensaje nuevo accidentalmente
  if (speechTimeout) clearTimeout(speechTimeout);
  
  speechTimeout = setTimeout(() => {
    bubble.classList.remove('visible');
  }, duration);
}

function simulateDrink() {
  const rick = document.getElementById('mascot-trigger');
  if(rick) {
    rick.classList.add('drinking-anim');
    setTimeout(() => rick.classList.remove('drinking-anim'), 3600); // Mismo tiempo que drinkMotion (3.5s)
  }
}

// Iniciar música de fondo al primer clic (Tema de Rick y Morty vía YouTube iframe invisible)
let musicStarted = false;
document.addEventListener('click', () => {
  if (!musicStarted) {
    const audioDiv = document.createElement('div');
    // Inyecta el video oficial de la canción en loop e invisible
    audioDiv.innerHTML = '<iframe width="1" height="1" src="https://www.youtube.com/embed/wh10k2LPniI?autoplay=1&loop=1&playlist=wh10k2LPniI" frameborder="0" allow="autoplay; encrypted-media" style="position:absolute; opacity:0; pointer-events:none; left:-9999px;"></iframe>';
    document.body.appendChild(audioDiv);
    musicStarted = true;
  }
});

function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.main-nav button').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`view-${viewId}`).classList.add('active');
  const navBtn = document.querySelector(`.main-nav button[data-target="${viewId}"]`);
  if(navBtn) navBtn.classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Sequential Guide Message
  if (sectionDialogues[viewId]) {
    mascotSpeak(sectionDialogues[viewId], 8000);
  }
}

function loadExample(section, formula, mass = null) {
  const formulaInput = document.getElementById(`formula-input-${section}`);
  if (formulaInput) formulaInput.value = formula;
  if (mass && section === 'moles') document.getElementById('mass-input').value = mass;
  
  const compoundNames = { 'H2O': 'Agua', 'NaCl': 'Sal', 'C6H12O6': 'Glucosa', 'O2': 'Oxígeno', 'CO2': 'Dióxido de Carbono', 'KMnO4': 'Permanganato', 'Fe2O3': 'Óxido de Hierro', 'NH3': 'Amoníaco', 'CH4': 'Metano', 'HCl': 'Ácido Clorhídrico' };
  const name = compoundNames[formula] || formula;
  mascotSpeak(`He cargado los datos de ${name}. ¡Fíjate bien cómo se mueven los átomos, Morty!`, 8000);
}

function loadFormulaExample(elements, mass = null) {
  const container = document.getElementById('empirical-elements-container');
  container.innerHTML = '';
  
  for (const [symbol, pct] of Object.entries(elements)) {
    const div = document.createElement('div');
    div.className = 'grid-pct dynamic-el-row';
    div.innerHTML = `
      <input type="text" class="el-symbol" value="${symbol}" placeholder="Símbolo">
      <input type="number" class="el-pct" value="${pct}" placeholder="% Masa">
    `;
    container.appendChild(div);
  }
  
  document.getElementById('target-mass').value = mass || '';
  mascotSpeak("¡Análisis porcentual cargado! Esto es química de alto nivel, no intentes esto en tu garaje, Morty.", 8000);
}

function clearCurrentView(view) {
  if (view === 'formula') {
    const container = document.getElementById('empirical-elements-container');
    container.innerHTML = `
      <div class="grid-pct dynamic-el-row">
        <input type="text" class="el-symbol" placeholder="Símbolo (ej: C)">
        <input type="number" class="el-pct" placeholder="% Masa">
      </div>
      <div class="grid-pct dynamic-el-row">
        <input type="text" class="el-symbol" placeholder="Símbolo (ej: H)">
        <input type="number" class="el-pct" placeholder="% Masa">
      </div>
    `;
    document.getElementById('target-mass').value = '';
    document.getElementById('results-formula-section').classList.remove('active');
  } else {
    const input = document.getElementById(`formula-input-${view}`);
    if(input) input.value = '';
    if(view === 'moles') document.getElementById('mass-input').value = '';
    const results = document.getElementById(`results-${view}-section`);
    if(results) results.classList.remove('active');
    
    if (view === 'composicion') {
      const compRes = document.getElementById('composition-results');
      if (compRes) compRes.innerHTML = '';
    }
  }
  mascotSpeak("¡Datos borrados! Como si nunca hubieran existido en esta línea temporal.", 8000);
}

window.onload = () => {
  initKeyboard();
  triggerRickEntrance();
  
  const rick = document.getElementById('mascot-trigger');
  if(rick) {
    rick.onclick = () => {
      const messages = [
        "¡Soy Rick Sanchez! ¡He convertido este navegador en un portal de conocimiento!",
        "¡Wubba Lubba Dub Dub! ¡La química es la única magia real, Morty!",
        "¿Sabías que hay un universo donde todo está hecho de pizza? No entres ahí, es grasiento.",
        "¡No me toques la bata! Estoy calculando la entropía del multiverso.",
        "¡Cállate y sigue calculando! ¡El tiempo es relativo pero los exámenes son reales!",
        "*Glup glup glup*... ¡Ah! Eso es ciencia destilada pura."
      ];
      mascotSpeak(messages[Math.floor(Math.random() * messages.length)], 6000);
      
      // 50% de probabilidad de que tome de la botella
      if (Math.random() > 0.5) {
        simulateDrink();
      }
    };
  }
};
