// Mancos F.C. - Lógica Oficial, Sistema de 5 Bombos & Administración

// ========================================================
// 1. DEFINICIÓN DE EQUIPOS Y 5 BOMBOS (POTS DE HABILIDAD)
// ========================================================
const MANCOS_TEAMS = {
  azul: { name: 'Azul', bulletClass: 'bullet-blue', pillClass: 'pill-blue', borderClass: 'team-card-blue' },
  blanco: { name: 'Blanco', bulletClass: 'bullet-white', pillClass: 'pill-white', borderClass: 'team-card-white' },
  negro: { name: 'Negro', bulletClass: 'bullet-black', pillClass: 'pill-black', borderClass: 'team-card-black' },
  rojo: { name: 'Rojo', bulletClass: 'bullet-red', pillClass: 'pill-red', borderClass: 'team-card-red' }
};

const POT_DEFINITIONS = {
  1: { name: 'Bombo 1', tag: 'B1', tagClass: 'pot-1-tag' },
  2: { name: 'Bombo 2', tag: 'B2', tagClass: 'pot-2-tag' },
  3: { name: 'Bombo 3', tag: 'B3', tagClass: 'pot-3-tag' },
  4: { name: 'Bombo 4', tag: 'B4', tagClass: 'pot-4-tag' },
  5: { name: 'Bombo 5', tag: 'B5', tagClass: 'pot-5-tag' }
};

// Persistencia en LocalStorage para jugadores y sorteo
function loadPlayersDatabase() {
  const saved = localStorage.getItem('mancos_players_db_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => ({
          ...p,
          goals: parseInt(p.goals, 10) || 0,
          ownGoals: parseInt(p.ownGoals, 10) || 0,
          cumulativeGoals: parseInt(p.cumulativeGoals !== undefined ? p.cumulativeGoals : (p.totalGoals || 0), 10) || 0,
          cumulativeOwnGoals: parseInt(p.cumulativeOwnGoals !== undefined ? p.cumulativeOwnGoals : (p.totalOwnGoals || 0), 10) || 0,
          matchdaysPlayed: parseInt(p.matchdaysPlayed, 10) || 0,
          lastPlaces: parseInt(p.lastPlaces, 10) || 0,
          potLevel: parseInt(p.potLevel, 10) || 1,
          teamKey: p.teamKey || ''
        }));
      }
    } catch (e) {
      return [];
    }
  }
  return [];
}

function savePlayersDatabase() {
  localStorage.setItem('mancos_players_db_v2', JSON.stringify(TOURNAMENT_PLAYERS));
}

function loadDrawnTeams() {
  const saved = localStorage.getItem('mancos_drawn_teams_v2');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return { azul: [], blanco: [], negro: [], rojo: [] };
    }
  }
  return { azul: [], blanco: [], negro: [], rojo: [] };
}

function saveDrawnTeams() {
  localStorage.setItem('mancos_drawn_teams_v2', JSON.stringify(currentDrawnTeams));
}

// Persistencia y control de la Ronda / Jornada activa
function loadCurrentRound() {
  const saved = localStorage.getItem('mancos_current_round_v1');
  const parsed = parseInt(saved, 10);
  return (!isNaN(parsed) && parsed >= 1) ? parsed : 1;
}

function saveCurrentRound(roundNumber) {
  const valid = Math.max(1, parseInt(roundNumber, 10) || 1);
  localStorage.setItem('mancos_current_round_v1', String(valid));
  updateRoundUI(valid);
}

function updateRoundUI(roundNumber) {
  const heroHeading = document.getElementById('hero-matchday-heading');
  if (heroHeading) {
    heroHeading.textContent = `Jornada ${roundNumber}`;
  }
  const inputRound = document.getElementById('input-round-number');
  if (inputRound && parseInt(inputRound.value, 10) !== roundNumber) {
    inputRound.value = roundNumber;
  }
  const liveRoundTitle = document.getElementById('admin-live-round-title');
  if (liveRoundTitle) {
    liveRoundTitle.textContent = `Control de Jornada ${roundNumber}`;
  }
}

// Base de datos de jugadores inicia limpia y en blanco
let TOURNAMENT_PLAYERS = loadPlayersDatabase();

// Estado de los equipos sorteados
let currentDrawnTeams = loadDrawnTeams();

// ========================================================
// 1.1 ESTADO Y CONTROL DE JORNADA EN VIVO (SESIÓN 2 HORAS)
// ========================================================
const DEFAULT_LIVE_STANDINGS = {
  azul:   { key: 'azul',   name: 'Azul',   pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 },
  blanco: { key: 'blanco', name: 'Blanco', pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 },
  negro:  { key: 'negro',  name: 'Negro',  pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 },
  rojo:   { key: 'rojo',   name: 'Rojo',   pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 }
};

function loadLiveStandings() {
  const saved = localStorage.getItem('mancos_live_standings_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        azul:   { ...DEFAULT_LIVE_STANDINGS.azul,   ...parsed.azul },
        blanco: { ...DEFAULT_LIVE_STANDINGS.blanco, ...parsed.blanco },
        negro:  { ...DEFAULT_LIVE_STANDINGS.negro,  ...parsed.negro },
        rojo:   { ...DEFAULT_LIVE_STANDINGS.rojo,   ...parsed.rojo }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_LIVE_STANDINGS));
    }
  }
  return JSON.parse(JSON.stringify(DEFAULT_LIVE_STANDINGS));
}

let LIVE_STANDINGS = loadLiveStandings();

function saveLiveStandings() {
  localStorage.setItem('mancos_live_standings_v2', JSON.stringify(LIVE_STANDINGS));
}

// Persistencia del Historial de Jornadas Pasadas (Snapshots de Fechas)
function loadMatchdaysHistory() {
  const saved = localStorage.getItem('mancos_matchdays_history_v1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

let MATCHDAYS_HISTORY = loadMatchdaysHistory();
let selectedHistoryRound = null;

function saveMatchdaysHistory() {
  localStorage.setItem('mancos_matchdays_history_v1', JSON.stringify(MATCHDAYS_HISTORY));
}

let currentLivePlayerFilter = 'all';

// ========================================================
// 2. FUNCIONES DE ORDENAMIENTO DESCENDENTE Y ESTADÍSTICAS
// ========================================================

// Pichichi de la Jornada en Vivo (solo goles anotados en la fecha actual)
function getSortedScorersLive() {
  return [...TOURNAMENT_PLAYERS].map((p) => ({
    ...p,
    goals: p.goals || 0
  })).sort((a, b) => {
    if (b.goals !== a.goals) {
      return b.goals - a.goals;
    }
    return a.name.localeCompare(b.name);
  });
}

// Goleadores Históricos Acumulados (acumulado histórico + goles en vivo actuales)
function getSortedScorersCumulative() {
  return [...TOURNAMENT_PLAYERS].map((p) => {
    const totalGoals = (p.cumulativeGoals || 0) + (p.goals || 0);
    return {
      ...p,
      totalGoals: totalGoals
    };
  }).sort((a, b) => {
    if (b.totalGoals !== a.totalGoals) {
      return b.totalGoals - a.totalGoals;
    }
    return a.name.localeCompare(b.name);
  });
}

// Colistas Históricos Acumulados (veces que quedó 4to puesto)
function getSortedColistas() {
  return [...TOURNAMENT_PLAYERS].map((p) => ({
    ...p,
    lastPlaces: p.lastPlaces || 0
  })).sort((a, b) => {
    if (b.lastPlaces !== a.lastPlaces) {
      return b.lastPlaces - a.lastPlaces;
    }
    return a.name.localeCompare(b.name);
  });
}

// Autogoles Históricos Acumulados (acumulado histórico + autogoles en vivo actuales)
function getSortedAutogolesCumulative() {
  return [...TOURNAMENT_PLAYERS].map((p) => {
    const totalOwnGoals = (p.cumulativeOwnGoals || 0) + (p.ownGoals || 0);
    return {
      ...p,
      totalOwnGoals: totalOwnGoals
    };
  }).sort((a, b) => {
    if (b.totalOwnGoals !== a.totalOwnGoals) {
      return b.totalOwnGoals - a.totalOwnGoals;
    }
    return a.name.localeCompare(b.name);
  });
}

function getSortedByProperty(property) {
  return [...TOURNAMENT_PLAYERS].sort((a, b) => {
    const valB = b[property] || 0;
    const valA = a[property] || 0;
    if (valB !== valA) {
      return valB - valA;
    }
    return a.name.localeCompare(b.name);
  });
}

// ========================================================
// 3. RENDERIZADO DEL PODIO EN 3 PILARES (ESTILO MEDALLERO)
// ========================================================
function renderTop3Podium(wrapperId, top3, valueKey, labelUnit, leaderTag) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;

  if (top3.length === 0) {
    wrapper.innerHTML = `
      <div class="podium-empty-box">
        <svg class="podium-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="10"/>
          <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        <strong class="podium-empty-title">Aún no hay jugadores registrados</strong>
        <span class="podium-empty-sub">Ingresa jugadores en los 5 bombos desde el Panel de Administración para activar las estadísticas.</span>
      </div>
    `;
    return;
  }

  // Si hay jugadores, completar hasta 3 para el podio visual
  const p1 = top3[0] || { name: '-', teamKey: 'blanco', [valueKey]: 0 };
  const p2 = top3[1] || { name: '-', teamKey: 'blanco', [valueKey]: 0 };
  const p3 = top3[2] || { name: '-', teamKey: 'blanco', [valueKey]: 0 };

  const t1 = MANCOS_TEAMS[p1.teamKey] || { bulletClass: 'bullet-white', pillClass: 'pill-white', name: 'Mancos F.C.' };
  const t2 = MANCOS_TEAMS[p2.teamKey] || { bulletClass: 'bullet-white', pillClass: 'pill-white', name: 'Mancos F.C.' };
  const t3 = MANCOS_TEAMS[p3.teamKey] || { bulletClass: 'bullet-white', pillClass: 'pill-white', name: 'Mancos F.C.' };

  wrapper.innerHTML = `
    <div class="podium-wrapper">
      <div class="podium-grid">
        
        <!-- 2do Lugar (Plata - Izquierda) -->
        <div class="podium-column col-silver">
          <div class="podium-player-box">
            <div class="player-crest-badge silver-border">
              <span class="team-bullet ${t2.bulletClass}"></span>
              <span class="medal-tag silver">2°</span>
            </div>
            <strong class="podium-player-name">${p2.name}</strong>
            <span class="player-team-pill ${t2.pillClass}">${t2.name}</span>
          </div>
          <div class="podium-pillar pillar-silver">
            <span class="pillar-number">${p2[valueKey]}</span>
            <span class="pillar-label">${labelUnit}</span>
          </div>
        </div>

        <!-- 1er Lugar (Oro - Centro) -->
        <div class="podium-column col-gold">
          <div class="podium-crown-tag">
            <svg class="crown-svg-inline" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 19h20v2H2zM2 5l5 7 5-8 5 8 5-7v12H2z"/>
            </svg>
            <span>${leaderTag}</span>
          </div>
          <div class="podium-player-box">
            <div class="player-crest-badge gold-border">
              <span class="team-bullet ${t1.bulletClass}"></span>
              <span class="medal-tag gold">1°</span>
            </div>
            <strong class="podium-player-name">${p1.name}</strong>
            <span class="player-team-pill ${t1.pillClass}">${t1.name}</span>
          </div>
          <div class="podium-pillar pillar-gold">
            <span class="pillar-number">${p1[valueKey]}</span>
            <span class="pillar-label">${labelUnit}</span>
          </div>
        </div>

        <!-- 3er Lugar (Bronce - Derecha) -->
        <div class="podium-column col-bronze">
          <div class="podium-player-box">
            <div class="player-crest-badge bronze-border">
              <span class="team-bullet ${t3.bulletClass}"></span>
              <span class="medal-tag bronze">3°</span>
            </div>
            <strong class="podium-player-name">${p3.name}</strong>
            <span class="player-team-pill ${t3.pillClass}">${t3.name}</span>
          </div>
          <div class="podium-pillar pillar-bronze">
            <span class="pillar-number">${p3[valueKey]}</span>
            <span class="pillar-label">${labelUnit}</span>
          </div>
        </div>

      </div>
      <div class="podium-base-floor"></div>
    </div>
  `;
}

// ========================================================
// 4. RENDERIZADO DE TABLA COMPLETA
// ========================================================
function renderGenericTable(tbodyId, players, valueKey) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (players.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-table-msg">
          No hay jugadores registrados aún. Ingresa los jugadores en el Panel de Administración.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = '';
  players.forEach((player, index) => {
    const position = index + 1;
    const team = MANCOS_TEAMS[player.teamKey] || { bulletClass: 'bullet-white', pillClass: 'pill-white', name: 'Mancos F.C.' };

    let rankBadgeClass = 'rank-default';
    if (position === 1) rankBadgeClass = 'rank-1';
    else if (position === 2) rankBadgeClass = 'rank-2-badge';
    else if (position === 3) rankBadgeClass = 'rank-3-badge';

    const tr = document.createElement('tr');
    if (position === 1) tr.classList.add('row-leader');

    const value = player[valueKey];
    tr.innerHTML = `
      <td class="td-pos">
        <span class="pos-badge ${rankBadgeClass}">${position}</span>
      </td>
      <td class="td-team">
        <div class="team-cell">
          <span class="team-bullet ${team.bulletClass}"></span>
          <strong class="team-title">${player.name}</strong>
        </div>
      </td>
      <td>
        <span class="player-team-pill ${team.pillClass}">${team.name}</span>
      </td>
      <td>${player.matchdaysPlayed}</td>
      <td class="td-pts">
        <span class="pts-pill ${value > 0 ? '' : 'pts-zero'}">${value}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ========================================================
// 5. GESTIÓN DE LOS 5 BOMBOS CON 5 INPUTS INDEPENDIENTES
// ========================================================
function renderPotsManagement() {
  const container = document.getElementById('pots-management-container');
  if (!container) return;

  // Actualizar barra de estado global
  const totalCountEl = document.getElementById('pots-total-count');
  const globalStatusEl = document.getElementById('pots-global-status');

  const totalPlayers = TOURNAMENT_PLAYERS.length;
  if (totalCountEl) totalCountEl.textContent = totalPlayers;

  if (globalStatusEl) {
    let allPotsFull = true;
    for (let p = 1; p <= 5; p++) {
      if (TOURNAMENT_PLAYERS.filter((pl) => pl.potLevel === p).length !== 4) {
        allPotsFull = false;
        break;
      }
    }

    if (totalPlayers === 20 && allPotsFull) {
      globalStatusEl.className = 'pots-status-pill ready';
      globalStatusEl.textContent = 'Completo (20/20) · Listo para Sortear';
    } else {
      globalStatusEl.className = 'pots-status-pill incomplete';
      globalStatusEl.textContent = `Faltan ${20 - totalPlayers} para completar`;
    }
  }

  container.innerHTML = '';

  for (let potNum = 1; potNum <= 5; potNum++) {
    const potDef = POT_DEFINITIONS[potNum];
    const playersInPot = TOURNAMENT_PLAYERS.filter((p) => p.potLevel === potNum);
    const isFull = playersInPot.length >= 4;

    const potCard = document.createElement('div');
    potCard.className = 'pot-card';

    // Generar lista de jugadores ingresados en este bombo
    let playersListHtml = '';
    if (playersInPot.length === 0) {
      playersListHtml = `<li class="pot-empty-msg">No hay jugadores en ${potDef.name} aún (0/4)</li>`;
    } else {
      playersInPot.forEach((player, idx) => {
        playersListHtml += `
          <li class="pot-player-item">
            <div class="pot-player-left">
              <span class="pot-player-num">${idx + 1}.</span>
              <span class="pot-player-name">${player.name}</span>
            </div>
            <div class="pot-player-actions">
              <button type="button" class="btn-slot-edit" data-player-id="${player.id}" title="Editar o sustituir casilla de ${player.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button type="button" class="btn-remove-player" data-player-id="${player.id}" title="Eliminar a ${player.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </li>
        `;
      });
    }

    potCard.innerHTML = `
      <div class="pot-card-head">
        <div class="pot-title-group">
          <span class="pot-badge-pill ${potDef.tagClass}">${potDef.name}</span>
        </div>
        <span class="pot-count-tag ${isFull ? 'balanced' : ''}">
          ${playersInPot.length}/4 jugadores
        </span>
      </div>

      <!-- Campo de entrada independiente para este Bombo -->
      <div class="pot-input-group">
        <label for="input-pot-${potNum}" class="pot-input-label sr-only">
          ${potDef.name}
        </label>
        <div class="pot-input-row">
          <input 
            type="text" 
            id="input-pot-${potNum}" 
            class="pot-text-input" 
            placeholder="${isFull ? 'Bombo completo (4/4)' : 'Nombre del jugador'}" 
            maxlength="28" 
            autocomplete="off"
            ${isFull ? 'disabled' : ''}
          >
          <button 
            type="button" 
            class="btn-pot-add" 
            data-pot="${potNum}"
            ${isFull ? 'disabled' : ''}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Agregar</span>
          </button>
        </div>
      </div>

      <ul class="pot-players-list">
        ${playersListHtml}
      </ul>
    `;

    container.appendChild(potCard);
  }

  // Listeners para agregar jugador por botón
  container.querySelectorAll('.btn-pot-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const potNum = parseInt(btn.getAttribute('data-pot'), 10);
      const input = document.getElementById(`input-pot-${potNum}`);
      if (input) addPlayerToPot(potNum, input);
    });
  });

  // Listeners para agregar jugador con tecla Enter
  container.querySelectorAll('.pot-text-input').forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const potNum = parseInt(input.id.replace('input-pot-', ''), 10);
        addPlayerToPot(potNum, input);
      }
    });
  });

  // Listeners para editar casilla de jugador
  container.querySelectorAll('.btn-slot-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerId = btn.getAttribute('data-player-id');
      openEditSlotModal(playerId);
    });
  });

  // Listeners para eliminar jugador
  container.querySelectorAll('.btn-remove-player').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerId = btn.getAttribute('data-player-id');
      removePlayer(playerId);
    });
  });
}

// Agregar jugador a un bombo específico
function addPlayerToPot(potNum, input) {
  const name = input.value.trim();
  if (!name) {
    input.focus();
    return;
  }

  const potPlayers = TOURNAMENT_PLAYERS.filter((p) => p.potLevel === potNum);
  if (potPlayers.length >= 4) {
    alert(`El Bombo ${potNum} ya tiene los 4 jugadores requeridos.`);
    return;
  }

  // Validar si el nombre ya existe en algún bombo
  const exists = TOURNAMENT_PLAYERS.some((p) => p.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    alert(`El jugador "${name}" ya está registrado en uno de los bombos.`);
    input.focus();
    return;
  }

  const newPlayer = {
    id: 'p_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    name: name,
    teamKey: '',
    potLevel: potNum,
    matchdaysPlayed: 0,
    goals: 0,
    cumulativeGoals: 0,
    lastPlaces: 0,
    ownGoals: 0,
    cumulativeOwnGoals: 0
  };

  TOURNAMENT_PLAYERS.push(newPlayer);
  savePlayersDatabase();

  renderPotsManagement();
  renderDrawnTeamsPreview();
  renderAllSections();
  renderMainRosters();

  // Mantener foco en el input para seguir escribiendo rápidamente si no está lleno
  setTimeout(() => {
    const nextInput = document.getElementById(`input-pot-${potNum}`);
    if (nextInput && !nextInput.disabled) {
      nextInput.focus();
    }
  }, 50);
}

// Eliminar jugador
function removePlayer(playerId) {
  const player = TOURNAMENT_PLAYERS.find((p) => p.id === playerId);
  if (!player) return;

  TOURNAMENT_PLAYERS = TOURNAMENT_PLAYERS.filter((p) => p.id !== playerId);

  // Retirar de los equipos sorteados si estaba asignado
  Object.keys(currentDrawnTeams).forEach((k) => {
    currentDrawnTeams[k] = currentDrawnTeams[k].filter((p) => p.id !== playerId);
  });

  savePlayersDatabase();
  saveDrawnTeams();

  renderPotsManagement();
  renderDrawnTeamsPreview();
  renderAllSections();
  renderMainRosters();
}

// Vaciar todos los jugadores
function clearAllPlayers() {
  if (TOURNAMENT_PLAYERS.length === 0) {
    alert('No hay jugadores registrados para eliminar.');
    return;
  }

  if (confirm('¿Estás seguro de que deseas vaciar todos los jugadores registrados y reiniciar de cero?')) {
    TOURNAMENT_PLAYERS = [];
    currentDrawnTeams = { azul: [], blanco: [], negro: [], rojo: [] };
    savePlayersDatabase();
    saveDrawnTeams();

    renderPotsManagement();
    renderDrawnTeamsPreview();
    renderAllSections();
    renderMainRosters();
    alert('Se han eliminado todos los jugadores. Los 5 bombos están en blanco.');
  }
}

// ========================================================
// 6. SORTEO EQUILIBRADO DE EQUIPOS (5 JUGADORES POR EQUIPO)
// ========================================================
function generateBalancedDraw(isRepeat = false) {
  // Verificar que cada uno de los 5 bombos tenga EXACTAMENTE 4 jugadores
  for (let i = 1; i <= 5; i++) {
    const inPot = TOURNAMENT_PLAYERS.filter((p) => p.potLevel === i);
    if (inPot.length < 4) {
      alert(`Para realizar el sorteo equilibrado, cada uno de los 5 bombos debe tener 4 jugadores (20 en total).\n\nEl Bombo ${i} actualmente tiene ${inPot.length}/4 jugadores.`);
      return;
    }
  }

  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];
  currentDrawnTeams = {
    azul: [],
    blanco: [],
    negro: [],
    rojo: []
  };

  // Por cada bombo (1 al 5), mezclar aleatoriamente y repartir 1 a cada equipo
  for (let potNum = 1; potNum <= 5; potNum++) {
    const playersInPot = TOURNAMENT_PLAYERS.filter((p) => p.potLevel === potNum);
    const shuffled = [...playersInPot].sort(() => Math.random() - 0.5);

    teamKeys.forEach((teamKey, idx) => {
      if (shuffled[idx]) {
        currentDrawnTeams[teamKey].push(shuffled[idx]);
      }
    });
  }

  saveDrawnTeams();
  renderDrawnTeamsPreview();

  const roundNum = loadCurrentRound();
  if (isRepeat) {
    alert(`¡Sorteo repetido con éxito! Se ha generado una nueva combinación equilibrada para la Jornada ${roundNum}.`);
  } else {
    alert(`¡Sorteo equilibrado generado con éxito para la Jornada ${roundNum}! Cada equipo ha recibido 1 jugador de cada bombo. Pulsa "Publicar Equipos en la Jornada" para confirmarlos.`);
  }
}

// Previsualizar los equipos sorteados en el panel admin
function renderDrawnTeamsPreview() {
  const container = document.getElementById('drawn-teams-container');
  if (!container) return;

  container.innerHTML = '';
  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];

  teamKeys.forEach((teamKey) => {
    const teamDef = MANCOS_TEAMS[teamKey];
    const players = currentDrawnTeams[teamKey] || [];

    const card = document.createElement('div');
    card.className = `drawn-team-card ${teamDef.borderClass}`;

    let playersListHtml = '';
    if (players.length === 0) {
      playersListHtml = `<li style="font-size:0.75rem; color:#94a3b8; font-style:italic;">Pendiente por sortear</li>`;
    } else {
      players.forEach((player) => {
        const potDef = POT_DEFINITIONS[player.potLevel] || { tag: `B${player.potLevel}`, tagClass: 'pot-1-tag' };
        playersListHtml += `
          <li>
            <span class="drawn-player-name">${player.name}</span>
            <div class="drawn-player-actions">
              <span class="pot-tag ${potDef.tagClass}">${potDef.tag}</span>
              <button type="button" class="btn-slot-edit" data-player-id="${player.id}" title="Editar o sustituir casilla de ${player.name}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
            </div>
          </li>
        `;
      });
    }

    card.innerHTML = `
      <div class="drawn-team-head">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="team-bullet ${teamDef.bulletClass}"></span>
          <strong style="color:#fff; font-size:0.9rem;">${teamDef.name}</strong>
        </div>
        <span style="font-size:0.72rem; font-weight:700; color:${players.length === 5 ? '#10b981' : '#f59e0b'};">
          ${players.length}/5 Jugadores
        </span>
      </div>
      <ul class="drawn-players-list">
        ${playersListHtml}
      </ul>
    `;

    container.appendChild(card);
  });

  // Listeners para editar casilla de jugador en la previsualización del sorteo
  container.querySelectorAll('.btn-slot-edit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerId = btn.getAttribute('data-player-id');
      openEditSlotModal(playerId);
    });
  });
}

// Aplicar los equipos sorteados a la pantalla principal
function applyTeamsToMatchday() {
  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];
  let isComplete = true;

  teamKeys.forEach((k) => {
    if (!currentDrawnTeams[k] || currentDrawnTeams[k].length !== 5) {
      isComplete = false;
    }
  });

  if (!isComplete) {
    const totalAssigned = teamKeys.reduce((acc, k) => acc + (currentDrawnTeams[k] ? currentDrawnTeams[k].length : 0), 0);
    if (totalAssigned === 0) {
      alert('Primero debes sortear o asignar jugadores a los equipos antes de publicar.');
      return;
    }
    if (!confirm(`Algunos equipos no tienen exactamente 5 jugadores (total asignados: ${totalAssigned}/20). ¿Deseas publicar las alineaciones de todas formas?`)) {
      return;
    }
  }

  // Actualizar teamKey en la base de datos
  teamKeys.forEach((teamKey) => {
    const players = currentDrawnTeams[teamKey];
    players.forEach((p) => {
      const original = TOURNAMENT_PLAYERS.find((tp) => tp.id === p.id);
      if (original) {
        original.teamKey = teamKey;
      }
    });
  });

  savePlayersDatabase();
  saveDrawnTeams();

  renderMainRosters();
  renderAllSections();
  renderPotsManagement();

  const roundNum = loadCurrentRound();
  alert(`¡Equipos publicados con éxito en la Jornada ${roundNum}! Los 4 planteles ya tienen sus 5 jugadores equilibrados.`);
}

// Renderizar planteles principales de la jornada
function renderMainRosters() {
  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];

  teamKeys.forEach((key) => {
    const list = document.getElementById(`roster-${key}-list`);
    const countTag = document.getElementById(`roster-count-${key}`);
    const teamPlayers = TOURNAMENT_PLAYERS.filter((p) => p.teamKey === key).sort((a, b) => a.potLevel - b.potLevel);

    if (countTag) {
      countTag.textContent = `${teamPlayers.length} Jugadores`;
    }

    if (list) {
      if (teamPlayers.length === 0) {
        list.innerHTML = `<li class="empty-roster-msg">Sin jugadores asignados aún</li>`;
      } else {
        list.innerHTML = '';
        teamPlayers.forEach((player) => {
          const potDef = POT_DEFINITIONS[player.potLevel] || { tag: `B${player.potLevel}`, tagClass: 'pot-1-tag' };
          const li = document.createElement('li');
          li.innerHTML = `
            <span class="player-dot"></span>
            <span>${player.name}</span>
            <span class="pot-tag ${potDef.tagClass}">${potDef.tag}</span>
          `;
          list.appendChild(li);
        });
      }
    }
  });
}

// ========================================================
// 6.1 MODAL DE EDICIÓN MANUAL DE CASILLA / SUPLENTE
// ========================================================
function openEditSlotModal(playerId) {
  const player = TOURNAMENT_PLAYERS.find((p) => p.id === playerId);
  if (!player) return;

  const modal = document.getElementById('modal-edit-slot');
  const idInput = document.getElementById('edit-player-id');
  const nameInput = document.getElementById('edit-player-name');
  const potSelect = document.getElementById('edit-player-pot');
  const teamSelect = document.getElementById('edit-player-team');
  const errorMsg = document.getElementById('edit-error-msg');

  if (!modal) return;

  if (errorMsg) {
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
  }

  if (idInput) idInput.value = player.id;
  if (nameInput) {
    nameInput.value = player.name;
    setTimeout(() => nameInput.focus(), 80);
  }
  if (potSelect) potSelect.value = String(player.potLevel || 1);
  if (teamSelect) teamSelect.value = player.teamKey || '';

  modal.style.display = 'flex';
}

function closeEditSlotModal() {
  const modal = document.getElementById('modal-edit-slot');
  if (modal) modal.style.display = 'none';
}

// ========================================================
// 6.2 TABLA DE POSICIONES EN VIVO Y CONTROL DE SESIÓN
// ========================================================
function renderStandingsTable() {
  const tbody = document.getElementById('live-standings-tbody');
  if (!tbody) return;

  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];
  const teamsArr = teamKeys.map((k) => {
    const item = LIVE_STANDINGS[k] || { ...DEFAULT_LIVE_STANDINGS[k] };
    const gf = parseInt(item.gf, 10) || 0;
    const gc = parseInt(item.gc, 10) || 0;
    const dg = gf - gc;
    return { ...item, gf, gc, dg };
  });

  // Ordenar por: 1) PTS desc, 2) DG desc, 3) GF desc, 4) Nombre
  teamsArr.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  tbody.innerHTML = '';
  teamsArr.forEach((team, idx) => {
    const pos = idx + 1;
    const teamDef = MANCOS_TEAMS[team.key] || { bulletClass: 'bullet-white', name: team.name };
    const isLeader = pos === 1;

    let rankBadgeClass = 'rank-default';
    if (pos === 1) rankBadgeClass = 'rank-1';
    else if (pos === 2) rankBadgeClass = 'rank-2-badge';
    else if (pos === 3) rankBadgeClass = 'rank-3-badge';

    let dgClass = 'neutral';
    let dgFormatted = '0';
    if (team.dg > 0) {
      dgClass = 'positive';
      dgFormatted = `+${team.dg}`;
    } else if (team.dg < 0) {
      dgClass = 'negative';
      dgFormatted = `${team.dg}`;
    }

    const tr = document.createElement('tr');
    if (isLeader) tr.className = 'row-leader';

    tr.innerHTML = `
      <td class="td-pos">
        <span class="pos-badge ${rankBadgeClass}">${pos}</span>
      </td>
      <td class="td-team">
        <div class="team-cell">
          <span class="team-bullet ${teamDef.bulletClass}"></span>
          <strong class="team-title">${teamDef.name}</strong>
        </div>
      </td>
      <td>${team.pj || 0}</td>
      <td class="col-secondary">${team.pg || 0}</td>
      <td class="col-secondary">${team.pe || 0}</td>
      <td class="col-secondary">${team.pp || 0}</td>
      <td class="col-secondary">${team.gf || 0}</td>
      <td class="col-secondary">${team.gc || 0}</td>
      <td class="td-dg ${dgClass}">${dgFormatted}</td>
      <td class="td-pts"><span class="pts-pill">${team.pts || 0}</span></td>
    `;
    tbody.appendChild(tr);
  });

  // Actualizar indicadores del Hero Banner
  const heroMatches = document.getElementById('hero-matches-count');
  const heroGoals = document.getElementById('hero-goals-count');

  if (heroMatches) {
    const totalPj = teamsArr.reduce((acc, t) => acc + (t.pj || 0), 0);
    heroMatches.textContent = Math.ceil(totalPj / 2);
  }
  if (heroGoals) {
    const totalGf = teamsArr.reduce((acc, t) => acc + (t.gf || 0), 0);
    const totalPlayerGoals = TOURNAMENT_PLAYERS.reduce((acc, p) => acc + (p.goals || 0), 0);
    heroGoals.textContent = Math.max(totalGf, totalPlayerGoals);
  }
}

// Regla Gol Gana Oficial: cada victoria es 1-0 (GF=PG), cada derrota 0-1 (GC=PP) y empates 0-0
function recalculateLiveStandingsTeam(teamKey) {
  const t = LIVE_STANDINGS[teamKey];
  if (!t) return;
  t.pg = Math.max(0, parseInt(t.pg, 10) || 0);
  t.pe = Math.max(0, parseInt(t.pe, 10) || 0);
  t.pp = Math.max(0, parseInt(t.pp, 10) || 0);
  t.gf = t.pg; // 1 gol a favor por victoria
  t.gc = t.pp; // 1 gol recibido por derrota
  t.pj = t.pg + t.pe + t.pp;
  t.pts = (t.pg * 3) + (t.pe * 1);
}

// ========================================================
// 6.2.1 ESTADO Y CONTROL DE LA ARENA DE PARTIDO EN VIVO
// ========================================================
let currentArenaTeamA = 'azul';
let currentArenaTeamB = 'blanco';
let lastMatchAction = null;

function swapArenaTeams() {
  const temp = currentArenaTeamA;
  currentArenaTeamA = currentArenaTeamB;
  currentArenaTeamB = temp;
  renderMatchArena();
}

function setArenaTeam(side, teamKey) {
  if (side === 'A') {
    if (teamKey === currentArenaTeamB) {
      currentArenaTeamB = currentArenaTeamA;
    }
    currentArenaTeamA = teamKey;
  } else {
    if (teamKey === currentArenaTeamA) {
      currentArenaTeamA = currentArenaTeamB;
    }
    currentArenaTeamB = teamKey;
  }
  renderMatchArena();
}

function registerArenaGoal(playerId, winnerTeamKey, loserTeamKey) {
  const scorer = TOURNAMENT_PLAYERS.find((p) => p.id === playerId);
  if (!scorer) return;

  const winnerDef = MANCOS_TEAMS[winnerTeamKey] || { name: winnerTeamKey };
  const loserDef = MANCOS_TEAMS[loserTeamKey] || { name: loserTeamKey };

  // Guardar acción previa para permitir Deshacer
  lastMatchAction = {
    type: 'goal',
    scorerId: playerId,
    winnerKey: winnerTeamKey,
    loserKey: loserTeamKey,
    scorerName: scorer.name,
    winnerName: winnerDef.name,
    loserName: loserDef.name
  };

  // 1. Sumar gol al jugador
  scorer.goals = (scorer.goals || 0) + 1;

  // 2. Sumar victoria al equipo ganador (+1 PG, +1 GF, +3 PTS, +1 PJ)
  if (LIVE_STANDINGS[winnerTeamKey]) {
    LIVE_STANDINGS[winnerTeamKey].pg = (LIVE_STANDINGS[winnerTeamKey].pg || 0) + 1;
    recalculateLiveStandingsTeam(winnerTeamKey);
  }

  // 3. Sumar automáticamente la derrota al equipo perdedor (+1 PP, +1 GC, +1 PJ)
  if (LIVE_STANDINGS[loserTeamKey]) {
    LIVE_STANDINGS[loserTeamKey].pp = (LIVE_STANDINGS[loserTeamKey].pp || 0) + 1;
    recalculateLiveStandingsTeam(loserTeamKey);
  }

  savePlayersDatabase();
  saveLiveStandings();

  // Actualizar todas las vistas
  renderMatchArena();
  renderMiniLiveStandings();
  lastMatchAction = null;
  renderMatchArena();
  renderMiniLiveStandings();
  renderLiveTeamsControl();
  renderLivePlayersScoring();
  renderStandingsTable();
  renderAllSections();

  showArenaStatusMsg(`¡Gol de ${scorer.name}! ${winnerDef.name} gana 1-0 a ${loserDef.name}. Derrota asignada a ${loserDef.name}.`, 'success');
}

function registerArenaDraw() {
  const teamADef = MANCOS_TEAMS[currentArenaTeamA] || { name: currentArenaTeamA };
  const teamBDef = MANCOS_TEAMS[currentArenaTeamB] || { name: currentArenaTeamB };

  lastMatchAction = {
    type: 'draw',
    teamAKey: currentArenaTeamA,
    teamBKey: currentArenaTeamB,
    teamAName: teamADef.name,
    teamBName: teamBDef.name
  };

  // Ambos equipos en cancha suman +1 empate y +1 punto (0-0)
  if (LIVE_STANDINGS[currentArenaTeamA]) {
    LIVE_STANDINGS[currentArenaTeamA].pe = (LIVE_STANDINGS[currentArenaTeamA].pe || 0) + 1;
    recalculateLiveStandingsTeam(currentArenaTeamA);
  }
  if (LIVE_STANDINGS[currentArenaTeamB]) {
    LIVE_STANDINGS[currentArenaTeamB].pe = (LIVE_STANDINGS[currentArenaTeamB].pe || 0) + 1;
    recalculateLiveStandingsTeam(currentArenaTeamB);
  }

  saveLiveStandings();

  renderMatchArena();
  renderMiniLiveStandings();
  lastMatchAction = null;
  renderMatchArena();
  renderMiniLiveStandings();
  renderLiveTeamsControl();
  renderLivePlayersScoring();
  renderStandingsTable();
  renderAllSections();

  showArenaStatusMsg(`Empate (0 - 0) registrado entre ${teamADef.name} y ${teamBDef.name}. (+1 punto a cada uno).`, 'info');
}

function undoLastMatchAction() {
  if (!lastMatchAction) return;

  if (lastMatchAction.type === 'goal') {
    const scorer = TOURNAMENT_PLAYERS.find((p) => p.id === lastMatchAction.scorerId);
    if (scorer && scorer.goals > 0) {
      scorer.goals -= 1;
    }
    if (LIVE_STANDINGS[lastMatchAction.winnerKey] && LIVE_STANDINGS[lastMatchAction.winnerKey].pg > 0) {
      LIVE_STANDINGS[lastMatchAction.winnerKey].pg -= 1;
      recalculateLiveStandingsTeam(lastMatchAction.winnerKey);
    }
    if (LIVE_STANDINGS[lastMatchAction.loserKey] && LIVE_STANDINGS[lastMatchAction.loserKey].pp > 0) {
      LIVE_STANDINGS[lastMatchAction.loserKey].pp -= 1;
      recalculateLiveStandingsTeam(lastMatchAction.loserKey);
    }
    showArenaStatusMsg(`Deshecho: se canceló el gol de ${lastMatchAction.scorerName} (${lastMatchAction.winnerName} vs ${lastMatchAction.loserName}).`, 'warning');
  } else if (lastMatchAction.type === 'draw') {
    if (LIVE_STANDINGS[lastMatchAction.teamAKey] && LIVE_STANDINGS[lastMatchAction.teamAKey].pe > 0) {
      LIVE_STANDINGS[lastMatchAction.teamAKey].pe -= 1;
      recalculateLiveStandingsTeam(lastMatchAction.teamAKey);
    }
    if (LIVE_STANDINGS[lastMatchAction.teamBKey] && LIVE_STANDINGS[lastMatchAction.teamBKey].pe > 0) {
      LIVE_STANDINGS[lastMatchAction.teamBKey].pe -= 1;
      recalculateLiveStandingsTeam(lastMatchAction.teamBKey);
    }
    showArenaStatusMsg(`Deshecho: se canceló el empate entre ${lastMatchAction.teamAName} y ${lastMatchAction.teamBName}.`, 'warning');
  } else if (lastMatchAction.type === 'owngoal') {
    const scorer = TOURNAMENT_PLAYERS.find((p) => p.id === lastMatchAction.scorerId);
    if (scorer && scorer.ownGoals > 0) {
      scorer.ownGoals -= 1;
    }
    if (LIVE_STANDINGS[lastMatchAction.winnerKey] && LIVE_STANDINGS[lastMatchAction.winnerKey].pg > 0) {
      LIVE_STANDINGS[lastMatchAction.winnerKey].pg -= 1;
      recalculateLiveStandingsTeam(lastMatchAction.winnerKey);
    }
    if (LIVE_STANDINGS[lastMatchAction.loserKey] && LIVE_STANDINGS[lastMatchAction.loserKey].pp > 0) {
      LIVE_STANDINGS[lastMatchAction.loserKey].pp -= 1;
      recalculateLiveStandingsTeam(lastMatchAction.loserKey);
    }
    showArenaStatusMsg(`Deshecho: se canceló el autogol de ${lastMatchAction.scorerName} (${lastMatchAction.winnerName} vs ${lastMatchAction.loserName}).`, 'warning');
  } else if (lastMatchAction.type === 'owngoal_only') {
    const scorer = TOURNAMENT_PLAYERS.find((p) => p.id === lastMatchAction.scorerId);
    if (scorer && scorer.ownGoals > 0) {
      scorer.ownGoals -= 1;
    }
    showArenaStatusMsg(`Deshecho: se canceló el autogol de ${lastMatchAction.scorerName}.`, 'warning');
  }

  lastMatchAction = null;
  savePlayersDatabase();
  saveLiveStandings();

  renderMatchArena();
  renderMiniLiveStandings();
  renderStandingsTable();
  renderAllSections();
}

function showArenaStatusMsg(text, type = 'success') {
  const banner = document.getElementById('arena-status-banner');
  if (!banner) return;
  banner.className = `arena-status-msg status-${type}`;
  banner.textContent = text;
  banner.style.display = 'block';

  clearTimeout(banner._timer);
  banner._timer = setTimeout(() => {
    if (banner) banner.style.display = 'none';
  }, 4500);
}

// ========================================================
// 6.2.2 REGISTRO DE AUTOGOLES (MODAL EN VIVO)
// ========================================================
let currentOwnGoalFilter = 'arena'; // 'arena' | 'all'

function openOwnGoalModal() {
  const modal = document.getElementById('modal-owngoal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  currentOwnGoalFilter = 'arena';

  const filterArenaBtn = document.getElementById('filter-owngoal-arena');
  const filterAllBtn = document.getElementById('filter-owngoal-all');
  if (filterArenaBtn) filterArenaBtn.classList.add('active');
  if (filterAllBtn) filterAllBtn.classList.remove('active');

  renderOwnGoalModalList();
}

function closeOwnGoalModal() {
  const modal = document.getElementById('modal-owngoal');
  if (!modal) return;
  modal.style.display = 'none';
  const modalAdmin = document.getElementById('modal-admin');
  if (!modalAdmin || modalAdmin.style.display !== 'flex') {
    document.body.style.overflow = '';
  }
}

function renderOwnGoalModalList() {
  const container = document.getElementById('owngoal-players-container');
  if (!container) return;

  function renderPlayerRowHtml(player) {
    const potDef = POT_DEFINITIONS[player.potLevel] || { tag: `B${player.potLevel || 1}`, tagClass: 'pot-1-tag' };
    const ownGoalsCount = player.ownGoals || 0;

    return `
      <div class="owngoal-player-row">
        <div class="owngoal-player-main">
          <span class="pot-tag ${potDef.tagClass}">${potDef.tag}</span>
          <span class="owngoal-player-fullname">${player.name}</span>
          ${ownGoalsCount > 0 ? `<span class="owngoal-pill-count">${ownGoalsCount} ${ownGoalsCount === 1 ? 'autogol' : 'autogoles'}</span>` : ''}
        </div>
        <div class="owngoal-player-btn-group">
          ${ownGoalsCount > 0 ? `
            <button type="button" class="btn-owngoal-minus" data-player-id="${player.id}" title="Restar 1 autogol por error">-</button>
          ` : ''}
          <button type="button" class="btn-owngoal-add" data-player-id="${player.id}" title="Registrar autogol de ${player.name}">
            + Autogol
          </button>
        </div>
      </div>
    `;
  }

  const defA = MANCOS_TEAMS[currentArenaTeamA] || { name: currentArenaTeamA, bulletClass: 'bullet-white' };
  const defB = MANCOS_TEAMS[currentArenaTeamB] || { name: currentArenaTeamB, bulletClass: 'bullet-white' };

  if (currentOwnGoalFilter === 'arena') {
    const playersA = TOURNAMENT_PLAYERS.filter((p) => p.teamKey === currentArenaTeamA).sort((a, b) => a.potLevel - b.potLevel);
    const playersB = TOURNAMENT_PLAYERS.filter((p) => p.teamKey === currentArenaTeamB).sort((a, b) => a.potLevel - b.potLevel);

    if (playersA.length === 0 && playersB.length === 0) {
      container.innerHTML = `
        <div class="owngoal-empty-state">
          No hay jugadores asignados a los equipos en cancha todavía.<br>
          <small>Publica los equipos en la pestaña "Armado" o cambia al filtro "Todos los Jugadores".</small>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="owngoal-team-group">
        <div class="owngoal-group-header header-team-${currentArenaTeamA}">
          <div class="group-header-left">
            <span class="team-bullet ${defA.bulletClass}"></span>
            <strong>${defA.name}</strong>
          </div>
          <span class="group-impact-hint">Si comete autogol: <strong>Gana ${defB.name} 1-0</strong></span>
        </div>
        <div class="owngoal-group-players">
          ${playersA.length ? playersA.map(renderPlayerRowHtml).join('') : '<p class="group-empty-hint">Sin jugadores asignados</p>'}
        </div>
      </div>

      <div class="owngoal-team-group">
        <div class="owngoal-group-header header-team-${currentArenaTeamB}">
          <div class="group-header-left">
            <span class="team-bullet ${defB.bulletClass}"></span>
            <strong>${defB.name}</strong>
          </div>
          <span class="group-impact-hint">Si comete autogol: <strong>Gana ${defA.name} 1-0</strong></span>
        </div>
        <div class="owngoal-group-players">
          ${playersB.length ? playersB.map(renderPlayerRowHtml).join('') : '<p class="group-empty-hint">Sin jugadores asignados</p>'}
        </div>
      </div>
    `;
  } else {
    // Todos los jugadores
    let allPlayers = [...TOURNAMENT_PLAYERS];
    allPlayers.sort((a, b) => {
      if ((b.ownGoals || 0) !== (a.ownGoals || 0)) {
        return (b.ownGoals || 0) - (a.ownGoals || 0);
      }
      return a.name.localeCompare(b.name);
    });

    container.innerHTML = `
      <div class="owngoal-group-players">
        ${allPlayers.map((p) => {
          const tDef = MANCOS_TEAMS[p.teamKey] || { bulletClass: 'bullet-white', name: 'Sin equipo' };
          const potDef = POT_DEFINITIONS[p.potLevel] || { tag: `B${p.potLevel || 1}`, tagClass: 'pot-1-tag' };
          const ownGoalsCount = p.ownGoals || 0;
          return `
            <div class="owngoal-player-row">
              <div class="owngoal-player-main">
                <span class="team-bullet ${tDef.bulletClass}"></span>
                <span class="pot-tag ${potDef.tagClass}">${potDef.tag}</span>
                <span class="owngoal-player-fullname">${p.name}</span>
                <small class="owngoal-player-teamname">(${tDef.name})</small>
                ${ownGoalsCount > 0 ? `<span class="owngoal-pill-count">${ownGoalsCount} ${ownGoalsCount === 1 ? 'autogol' : 'autogoles'}</span>` : ''}
              </div>
              <div class="owngoal-player-btn-group">
                ${ownGoalsCount > 0 ? `
                  <button type="button" class="btn-owngoal-minus" data-player-id="${p.id}" title="Restar 1 autogol">-</button>
                ` : ''}
                <button type="button" class="btn-owngoal-add" data-player-id="${p.id}" title="Registrar autogol de ${p.name}">+ Autogol</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  container.querySelectorAll('.btn-owngoal-add').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-player-id');
      registerArenaOwnGoal(pId);
    });
  });

  container.querySelectorAll('.btn-owngoal-minus').forEach((btn) => {
    btn.addEventListener('click', () => {
      const pId = btn.getAttribute('data-player-id');
      decrementPlayerOwnGoal(pId);
    });
  });
}

function registerArenaOwnGoal(playerId) {
  const scorer = TOURNAMENT_PLAYERS.find((p) => p.id === playerId);
  if (!scorer) return;

  scorer.ownGoals = (scorer.ownGoals || 0) + 1;

  let winnerKey = null;
  let loserKey = null;

  if (scorer.teamKey === currentArenaTeamA) {
    loserKey = currentArenaTeamA;
    winnerKey = currentArenaTeamB;
  } else if (scorer.teamKey === currentArenaTeamB) {
    loserKey = currentArenaTeamB;
    winnerKey = currentArenaTeamA;
  }

  if (winnerKey && loserKey) {
    const winnerDef = MANCOS_TEAMS[winnerKey] || { name: winnerKey };
    const loserDef = MANCOS_TEAMS[loserKey] || { name: loserKey };

    if (LIVE_STANDINGS[winnerKey]) {
      LIVE_STANDINGS[winnerKey].pg = (LIVE_STANDINGS[winnerKey].pg || 0) + 1;
      recalculateLiveStandingsTeam(winnerKey);
    }

    if (LIVE_STANDINGS[loserKey]) {
      LIVE_STANDINGS[loserKey].pp = (LIVE_STANDINGS[loserKey].pp || 0) + 1;
      recalculateLiveStandingsTeam(loserKey);
    }

    lastMatchAction = {
      type: 'owngoal',
      scorerId: playerId,
      winnerKey: winnerKey,
      loserKey: loserKey,
      scorerName: scorer.name,
      winnerName: winnerDef.name,
      loserName: loserDef.name
    };

    showArenaStatusMsg(`¡Autogol de ${scorer.name}! ${winnerDef.name} gana 1-0 a ${loserDef.name}.`, 'warning');
  } else {
    lastMatchAction = {
      type: 'owngoal_only',
      scorerId: playerId,
      scorerName: scorer.name
    };
    showArenaStatusMsg(`Autogol registrado para ${scorer.name}.`, 'warning');
  }

  savePlayersDatabase();
  saveLiveStandings();

  renderMatchArena();
  renderMiniLiveStandings();
  renderStandingsTable();
  renderAllSections();

  closeOwnGoalModal();
}

function decrementPlayerOwnGoal(playerId) {
  const player = TOURNAMENT_PLAYERS.find((p) => p.id === playerId);
  if (!player || !player.ownGoals || player.ownGoals <= 0) return;

  player.ownGoals -= 1;
  savePlayersDatabase();

  renderAllSections();
  renderOwnGoalModalList();
  showArenaStatusMsg(`Se restó 1 autogol a ${player.name}.`, 'info');
}

function renderMatchArena() {
  const container = document.getElementById('arena-duel-container');
  const pillsA = document.getElementById('pills-team-a');
  const pillsB = document.getElementById('pills-team-b');
  const btnUndo = document.getElementById('btn-undo-last-match');
  const btnDraw = document.getElementById('btn-register-arena-draw');

  if (!container) return;

  // Botón deshacer
  if (btnUndo) {
    btnUndo.style.display = lastMatchAction ? 'inline-flex' : 'none';
  }

  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];

  // Renderizar pills selector equipo A
  if (pillsA) {
    pillsA.innerHTML = '';
    teamKeys.forEach((key) => {
      const def = MANCOS_TEAMS[key];
      const isSelected = key === currentArenaTeamA;
      const isOpponent = key === currentArenaTeamB;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `arena-team-pill pill-${key} ${isSelected ? 'active' : ''} ${isOpponent ? 'is-opponent' : ''}`;
      btn.innerHTML = `<span class="team-bullet ${def.bulletClass}"></span><span>${def.name}</span>`;
      btn.addEventListener('click', () => setArenaTeam('A', key));
      pillsA.appendChild(btn);
    });
  }

  // Renderizar pills selector equipo B
  if (pillsB) {
    pillsB.innerHTML = '';
    teamKeys.forEach((key) => {
      const def = MANCOS_TEAMS[key];
      const isSelected = key === currentArenaTeamB;
      const isOpponent = key === currentArenaTeamA;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `arena-team-pill pill-${key} ${isSelected ? 'active' : ''} ${isOpponent ? 'is-opponent' : ''}`;
      btn.innerHTML = `<span class="team-bullet ${def.bulletClass}"></span><span>${def.name}</span>`;
      btn.addEventListener('click', () => setArenaTeam('B', key));
      pillsB.appendChild(btn);
    });
  }

  const defA = MANCOS_TEAMS[currentArenaTeamA] || { name: currentArenaTeamA, bulletClass: 'bullet-white' };
  const defB = MANCOS_TEAMS[currentArenaTeamB] || { name: currentArenaTeamB, bulletClass: 'bullet-white' };
  const statA = LIVE_STANDINGS[currentArenaTeamA] || { pts: 0, pj: 0, pg: 0 };
  const statB = LIVE_STANDINGS[currentArenaTeamB] || { pts: 0, pj: 0, pg: 0 };

  // Actualizar texto del botón de empate
  if (btnDraw) {
    const smallText = btnDraw.querySelector('small');
    if (smallText) {
      smallText.textContent = `Registra 0-0 entre ${defA.name} y ${defB.name} (+1 punto c/u)`;
    }
  }

  // Jugadores de cada equipo
  const playersA = TOURNAMENT_PLAYERS.filter((p) => p.teamKey === currentArenaTeamA).sort((a, b) => a.potLevel - b.potLevel);
  const playersB = TOURNAMENT_PLAYERS.filter((p) => p.teamKey === currentArenaTeamB).sort((a, b) => a.potLevel - b.potLevel);

  function renderPlayerTriggerList(players, myTeamKey, rivalTeamKey) {
    if (players.length === 0) {
      return `
        <div class="arena-empty-players">
          Sin jugadores asignados aún. Publica los equipos en la pestaña "Armado".
        </div>
      `;
    }
    return players.map((p) => {
      const potDef = POT_DEFINITIONS[p.potLevel] || { tag: `B${p.potLevel || 1}`, tagClass: 'pot-1-tag' };
      const goalsToday = p.goals || 0;
      return `
        <button type="button" class="btn-player-goal-trigger trigger-team-${myTeamKey}" data-player-id="${p.id}" data-my-team="${myTeamKey}" data-rival-team="${rivalTeamKey}">
          <div class="trigger-left">
            <span class="pot-tag ${potDef.tagClass}">${potDef.tag}</span>
            <strong class="trigger-player-name">${p.name}</strong>
          </div>
          <div class="trigger-right">
            <span class="trigger-goals-badge ${goalsToday > 0 ? 'has-goals' : ''}">${goalsToday} ${goalsToday === 1 ? 'gol' : 'goles'}</span>
            <span class="btn-touch-action">+ Gol Gana</span>
          </div>
        </button>
      `;
    }).join('');
  }

  container.innerHTML = `
    <!-- Columna Equipo A -->
    <div class="arena-team-column col-team-${currentArenaTeamA}">
      <div class="arena-team-card-head">
        <div class="arena-head-left">
          <span class="team-bullet ${defA.bulletClass}"></span>
          <h4 class="arena-team-title">${defA.name}</h4>
        </div>
        <div class="arena-head-pts">
          <span class="pts-number">${statA.pts || 0}</span>
          <span class="pts-txt">PTS (${statA.pj || 0} PJ)</span>
        </div>
      </div>
      <div class="arena-players-stack">
        <span class="arena-instruction">Toca al jugador que anotó el gol para ganar:</span>
        ${renderPlayerTriggerList(playersA, currentArenaTeamA, currentArenaTeamB)}
      </div>
    </div>

    <!-- Columna Equipo B -->
    <div class="arena-team-column col-team-${currentArenaTeamB}">
      <div class="arena-team-card-head">
        <div class="arena-head-left">
          <span class="team-bullet ${defB.bulletClass}"></span>
          <h4 class="arena-team-title">${defB.name}</h4>
        </div>
        <div class="arena-head-pts">
          <span class="pts-number">${statB.pts || 0}</span>
          <span class="pts-txt">PTS (${statB.pj || 0} PJ)</span>
        </div>
      </div>
      <div class="arena-players-stack">
        <span class="arena-instruction">Toca al jugador que anotó el gol para ganar:</span>
        ${renderPlayerTriggerList(playersB, currentArenaTeamB, currentArenaTeamA)}
      </div>
    </div>
  `;

  // Listeners para tocar al jugador que anotó el gol
  container.querySelectorAll('.btn-player-goal-trigger').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerId = btn.getAttribute('data-player-id');
      const myTeam = btn.getAttribute('data-my-team');
      const rivalTeam = btn.getAttribute('data-rival-team');
      registerArenaGoal(playerId, myTeam, rivalTeam);
    });
  });
}

function renderMiniLiveStandings() {
  const tbody = document.getElementById('arena-mini-standings-tbody');
  if (!tbody) return;

  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];
  teamKeys.forEach((k) => recalculateLiveStandingsTeam(k));

  const teamsArr = teamKeys.map((k) => {
    const item = LIVE_STANDINGS[k] || { ...DEFAULT_LIVE_STANDINGS[k] };
    const gf = parseInt(item.gf, 10) || 0;
    const gc = parseInt(item.gc, 10) || 0;
    const dg = gf - gc;
    return { ...item, gf, gc, dg };
  }).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  tbody.innerHTML = '';
  teamsArr.forEach((team, idx) => {
    const pos = idx + 1;
    const teamDef = MANCOS_TEAMS[team.key] || { bulletClass: 'bullet-white', name: team.name };
    let rankBadgeClass = pos === 1 ? 'rank-1' : pos === 2 ? 'rank-2-badge' : pos === 3 ? 'rank-3-badge' : 'rank-default';
    let dgClass = team.dg > 0 ? 'positive' : team.dg < 0 ? 'negative' : 'neutral';
    let dgFormatted = team.dg > 0 ? `+${team.dg}` : `${team.dg}`;

    const tr = document.createElement('tr');
    if (pos === 1) tr.className = 'row-leader';
    tr.innerHTML = `
      <td class="td-pos"><span class="pos-badge ${rankBadgeClass}">${pos}</span></td>
      <td class="td-team">
        <div class="team-cell">
          <span class="team-bullet ${teamDef.bulletClass}"></span>
          <strong class="team-title">${teamDef.name}</strong>
        </div>
      </td>
      <td>${team.pj || 0}</td>
      <td class="col-secondary">${team.pg || 0}</td>
      <td class="col-secondary">${team.pe || 0}</td>
      <td class="col-secondary">${team.pp || 0}</td>
      <td class="col-secondary">${team.gf || 0}</td>
      <td class="col-secondary">${team.gc || 0}</td>
      <td class="td-dg ${dgClass}">${dgFormatted}</td>
      <td class="td-pts"><span class="pts-pill">${team.pts || 0}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

// Renderizar la cuadrícula de control por equipo (Dinámica Gol Gana)
function renderLiveTeamsControl() {
  const container = document.getElementById('live-teams-control-container');
  if (!container) return;

  container.innerHTML = '';
  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];

  teamKeys.forEach((key) => {
    recalculateLiveStandingsTeam(key);
    const teamDef = MANCOS_TEAMS[key] || { bulletClass: 'bullet-white', name: key };
    const stat = LIVE_STANDINGS[key] || { ...DEFAULT_LIVE_STANDINGS[key] };
    const dg = (stat.gf || 0) - (stat.gc || 0);

    let dgClass = 'neutral';
    let dgFormatted = '0';
    if (dg > 0) {
      dgClass = 'positive';
      dgFormatted = `+${dg}`;
    } else if (dg < 0) {
      dgClass = 'negative';
      dgFormatted = `${dg}`;
    }

    const card = document.createElement('div');
    card.className = `live-team-card card-${key}`;
    card.innerHTML = `
      <div class="live-team-head">
        <div class="team-identity-live">
          <span class="team-bullet ${teamDef.bulletClass}"></span>
          <strong>${teamDef.name}</strong>
        </div>
        <div class="pts-live-badge">
          <span class="pts-live-label">PTS</span>
          <span class="pts-live-num">${stat.pts || 0}</span>
        </div>
      </div>

      <!-- Resumen automático de marcadores oficiales -->
      <div class="live-team-summary-row">
        <div class="summary-stat-cell" title="Partidos Jugados (PG + PE + PP)">
          <span class="cell-label">PJ</span>
          <span class="cell-val">${stat.pj || 0}</span>
        </div>
        <div class="summary-stat-cell cell-pg" title="Victorias (1-0)">
          <span class="cell-label">PG</span>
          <span class="cell-val">${stat.pg || 0}</span>
        </div>
        <div class="summary-stat-cell cell-pe" title="Empates (0-0)">
          <span class="cell-label">PE</span>
          <span class="cell-val">${stat.pe || 0}</span>
        </div>
        <div class="summary-stat-cell cell-pp" title="Derrotas (0-1)">
          <span class="cell-label">PP</span>
          <span class="cell-val">${stat.pp || 0}</span>
        </div>
        <div class="summary-stat-cell" title="Goles a Favor">
          <span class="cell-label">GF</span>
          <span class="cell-val">${stat.gf || 0}</span>
        </div>
        <div class="summary-stat-cell" title="Goles en Contra">
          <span class="cell-label">GC</span>
          <span class="cell-val">${stat.gc || 0}</span>
        </div>
        <div class="summary-stat-cell ${dgClass}" title="Diferencia de Gol">
          <span class="cell-label">DG</span>
          <span class="cell-val">${dgFormatted}</span>
        </div>
      </div>

      <!-- Acciones de Partido: Agregar Derrota, Empate o Victoria -->
      <div class="live-team-actions-grid">
        <!-- Control de Derrota (PP) -->
        <div class="action-card action-loss" title="Añade la derrota al equipo perdedor del partido">
          <div class="action-card-header">
            <span class="action-title">Derrotas (PP · 0-1)</span>
            <span class="action-sub">+1 GC / +1 PJ</span>
          </div>
          <div class="action-controls-row">
            <button type="button" class="btn-stat-step btn-step-sub" data-team="${key}" data-field="pp" data-delta="-1" title="Restar derrota">-</button>
            <span class="action-number-val loss-accent">${stat.pp || 0}</span>
            <button type="button" class="btn-stat-step btn-step-loss-add" data-team="${key}" data-field="pp" data-delta="1" title="Añadir derrota">+ Derrota</button>
          </div>
        </div>

        <!-- Control de Empate (PE) -->
        <div class="action-card action-draw" title="Añade un empate 0-0 si se acabó el tiempo sin goles">
          <div class="action-card-header">
            <span class="action-title">Empates (PE · 0-0)</span>
            <span class="action-sub">+1 PTS / +1 PJ</span>
          </div>
          <div class="action-controls-row">
            <button type="button" class="btn-stat-step btn-step-sub" data-team="${key}" data-field="pe" data-delta="-1" title="Restar empate">-</button>
            <span class="action-number-val draw-accent">${stat.pe || 0}</span>
            <button type="button" class="btn-stat-step btn-step-draw-add" data-team="${key}" data-field="pe" data-delta="1" title="Añadir empate">+ Empate</button>
          </div>
        </div>

        <!-- Control de Victoria Directa (PG) -->
        <div class="action-card action-win" title="Victorias (se suman automáticamente al registrar goles abajo)">
          <div class="action-card-header">
            <span class="action-title">Victorias (PG · 1-0)</span>
            <span class="action-sub">+3 PTS / +1 GF</span>
          </div>
          <div class="action-controls-row">
            <button type="button" class="btn-stat-step btn-step-sub" data-team="${key}" data-field="pg" data-delta="-1" title="Restar victoria">-</button>
            <span class="action-number-val win-accent">${stat.pg || 0}</span>
            <button type="button" class="btn-stat-step btn-step-win-add" data-team="${key}" data-field="pg" data-delta="1" title="Añadir victoria">+ Victoria</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  // Listeners de los botones de steppers de equipo
  container.querySelectorAll('.btn-stat-step').forEach((btn) => {
    btn.addEventListener('click', () => {
      const team = btn.getAttribute('data-team');
      const field = btn.getAttribute('data-field');
      const delta = parseInt(btn.getAttribute('data-delta'), 10);
      handleTeamStatChange(team, field, delta);
    });
  });
}

function handleTeamStatChange(teamKey, field, delta) {
  if (!LIVE_STANDINGS[teamKey]) return;
  const current = parseInt(LIVE_STANDINGS[teamKey][field], 10) || 0;
  LIVE_STANDINGS[teamKey][field] = Math.max(0, current + delta);

  recalculateLiveStandingsTeam(teamKey);

  saveLiveStandings();
  renderLiveTeamsControl();
  renderStandingsTable();
  renderAllSections();
}

// Renderizar la lista de jugadores para anotación rápida de Goles y Autogoles
function renderLivePlayersScoring() {
  const container = document.getElementById('live-players-scoring-container');
  if (!container) return;

  // Filtrar jugadores por equipo
  let playersToShow = [...TOURNAMENT_PLAYERS];
  if (currentLivePlayerFilter !== 'all') {
    playersToShow = playersToShow.filter((p) => p.teamKey === currentLivePlayerFilter);
  }

  if (playersToShow.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:18px 10px; color:#94a3b8; font-size:0.78rem; font-style:italic;">
        ${currentLivePlayerFilter === 'all' 
          ? 'No hay jugadores registrados en los bombos todavía. Agrega jugadores en la pestaña "5 Bombos".' 
          : 'No hay jugadores asignados a este equipo en la jornada.'}
      </div>
    `;
    return;
  }

  // Ordenar por bombo o goles
  playersToShow.sort((a, b) => {
    if ((b.goals || 0) !== (a.goals || 0)) return (b.goals || 0) - (a.goals || 0);
    return a.name.localeCompare(b.name);
  });

  container.innerHTML = '';
  playersToShow.forEach((player) => {
    const teamDef = MANCOS_TEAMS[player.teamKey] || { bulletClass: 'bullet-white', name: 'Sin Equipo' };
    const potDef = POT_DEFINITIONS[player.potLevel] || { tag: `B${player.potLevel || 1}`, tagClass: 'pot-1-tag' };

    const row = document.createElement('div');
    row.className = 'live-player-row';
    row.innerHTML = `
      <div class="live-player-left">
        <span class="team-bullet ${teamDef.bulletClass}"></span>
        <span class="live-player-name">${player.name}</span>
        <span class="pot-tag ${potDef.tagClass}">${potDef.tag}</span>
      </div>

      <div class="live-player-controls-wrap">
        <!-- Goles -->
        <div class="player-score-stepper goals-accent" title="Goles de ${player.name}">
          <span class="stepper-icon-svg icon-goal-svg" title="Goles">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>
            </svg>
          </span>
          <button type="button" class="btn-player-mini-step" data-player-id="${player.id}" data-action="dec-goal">-</button>
          <span class="player-score-val">${player.goals || 0}</span>
          <button type="button" class="btn-player-mini-step" data-player-id="${player.id}" data-action="inc-goal">+</button>
        </div>

        <!-- Autogoles -->
        <div class="player-score-stepper owngoals-accent" title="Autogoles de ${player.name}">
          <span class="stepper-icon-svg icon-owngoal-svg" title="Autogoles">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <button type="button" class="btn-player-mini-step btn-og" data-player-id="${player.id}" data-action="dec-owngoal">-</button>
          <span class="player-score-val">${player.ownGoals || 0}</span>
          <button type="button" class="btn-player-mini-step btn-og" data-player-id="${player.id}" data-action="inc-owngoal">+</button>
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  // Listeners para los botones de goles y autogoles
  container.querySelectorAll('.btn-player-mini-step').forEach((btn) => {
    btn.addEventListener('click', () => {
      const playerId = btn.getAttribute('data-player-id');
      const action = btn.getAttribute('data-action');
      handlePlayerScoringChange(playerId, action);
    });
  });
}

function handlePlayerScoringChange(playerId, action) {
  const player = TOURNAMENT_PLAYERS.find((p) => p.id === playerId);
  if (!player) return;

  if (action === 'inc-goal') {
    player.goals = (player.goals || 0) + 1;
    // En dinámica Gol Gana (1-0), cada gol equivale a una victoria del equipo
    if (player.teamKey && LIVE_STANDINGS[player.teamKey]) {
      LIVE_STANDINGS[player.teamKey].pg = (LIVE_STANDINGS[player.teamKey].pg || 0) + 1;
      recalculateLiveStandingsTeam(player.teamKey);
      saveLiveStandings();
    }
  } else if (action === 'dec-goal') {
    if ((player.goals || 0) > 0) {
      player.goals -= 1;
      if (player.teamKey && LIVE_STANDINGS[player.teamKey] && (LIVE_STANDINGS[player.teamKey].pg || 0) > 0) {
        LIVE_STANDINGS[player.teamKey].pg -= 1;
        recalculateLiveStandingsTeam(player.teamKey);
        saveLiveStandings();
      }
    }
  } else if (action === 'inc-owngoal') {
    player.ownGoals = (player.ownGoals || 0) + 1;
  } else if (action === 'dec-owngoal') {
    if ((player.ownGoals || 0) > 0) {
      player.ownGoals -= 1;
    }
  }

  savePlayersDatabase();
  renderLivePlayersScoring();
  renderLiveTeamsControl();
  renderStandingsTable();
  renderAllSections();
}

// Finalizar y Guardar Jornada: acumula estadísticas en el historial general,
// suma colista al 4to puesto, desasigna equipos para el siguiente sorteo y avanza la jornada (+1)
function finishAndSaveMatchday() {
  const currentRound = loadCurrentRound();

  const confirmMsg = `¿Deseas finalizar y guardar la Jornada ${currentRound}?\n\n` +
    `• Se acumularán los goles y autogoles de la jornada al historial general de cada jugador.\n` +
    `• Se sumará +1 jornada jugada a todos los participantes.\n` +
    `• Se sumará +1 récord de colista a los jugadores del equipo que quedó en 4° lugar.\n` +
    `• Los marcadores en vivo volverán a cero y los equipos se limpiarán para el nuevo sorteo.\n` +
    `• La jornada avanzará automáticamente a la Jornada ${currentRound + 1}.`;

  if (!confirm(confirmMsg)) {
    return;
  }

  // 1. Determinar el equipo que quedó en 4to lugar (colista de la jornada)
  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];
  const sortedLiveTeams = teamKeys.map((k) => {
    const item = LIVE_STANDINGS[k] || { ...DEFAULT_LIVE_STANDINGS[k] };
    const gf = parseInt(item.gf, 10) || 0;
    const gc = parseInt(item.gc, 10) || 0;
    const dg = gf - gc;
    return { ...item, gf, gc, dg };
  }).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.dg !== a.dg) return b.dg - a.dg;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.name.localeCompare(b.name);
  });

  // El 4to lugar es el último de la tabla ordenada (índice 3)
  const fourthPlaceTeam = sortedLiveTeams[3];
  const colistaTeamKey = fourthPlaceTeam ? fourthPlaceTeam.key : null;
  const championTeam = sortedLiveTeams[0] || null;

  // 1.1 Capturar Snapshot para el Historial de Jornadas Pasadas
  const now = new Date();
  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  let formattedDate = now.toLocaleDateString('es-ES', dateOptions);
  formattedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  // Copia de los planteles de la jornada con sus bombos
  const teamsSnapshot = {
    azul: (currentDrawnTeams.azul || []).map((p) => ({ id: p.id, name: p.name, potLevel: p.potLevel })),
    blanco: (currentDrawnTeams.blanco || []).map((p) => ({ id: p.id, name: p.name, potLevel: p.potLevel })),
    negro: (currentDrawnTeams.negro || []).map((p) => ({ id: p.id, name: p.name, potLevel: p.potLevel })),
    rojo: (currentDrawnTeams.rojo || []).map((p) => ({ id: p.id, name: p.name, potLevel: p.potLevel }))
  };

  // Goleadores y autogoles de la jornada
  const roundScorers = TOURNAMENT_PLAYERS
    .filter((p) => (p.goals || 0) > 0)
    .map((p) => ({ id: p.id, name: p.name, teamKey: p.teamKey, goals: p.goals }))
    .sort((a, b) => b.goals - a.goals);

  const roundOwnGoals = TOURNAMENT_PLAYERS
    .filter((p) => (p.ownGoals || 0) > 0)
    .map((p) => ({ id: p.id, name: p.name, teamKey: p.teamKey, ownGoals: p.ownGoals }))
    .sort((a, b) => b.ownGoals - a.ownGoals);

  const totalGfSum = sortedLiveTeams.reduce((acc, t) => acc + (t.gf || 0), 0);
  const totalPlayerGoals = roundScorers.reduce((acc, p) => acc + p.goals, 0);
  const totalGoals = Math.max(totalGfSum, totalPlayerGoals);
  const totalPjSum = sortedLiveTeams.reduce((acc, t) => acc + (t.pj || 0), 0);
  const totalMatches = Math.ceil(totalPjSum / 2);

  const matchdayRecord = {
    roundNumber: currentRound,
    timestamp: now.toISOString(),
    formattedDate: formattedDate,
    standings: sortedLiveTeams.map((t) => ({ ...t })),
    teams: teamsSnapshot,
    topScorers: roundScorers,
    ownGoals: roundOwnGoals,
    champion: championTeam ? { key: championTeam.key, name: championTeam.name, pts: championTeam.pts, dg: championTeam.dg } : null,
    colista: fourthPlaceTeam ? { key: fourthPlaceTeam.key, name: fourthPlaceTeam.name, pts: fourthPlaceTeam.pts, dg: fourthPlaceTeam.dg } : null,
    totalGoals: totalGoals,
    totalMatches: totalMatches
  };

  const existingHistoryIdx = MATCHDAYS_HISTORY.findIndex((m) => m.roundNumber === currentRound);
  if (existingHistoryIdx >= 0) {
    MATCHDAYS_HISTORY[existingHistoryIdx] = matchdayRecord;
  } else {
    MATCHDAYS_HISTORY.unshift(matchdayRecord);
  }
  selectedHistoryRound = currentRound;
  saveMatchdaysHistory();

  // 2. Acumular estadísticas en los jugadores
  TOURNAMENT_PLAYERS.forEach((player) => {
    const liveGoals = player.goals || 0;
    const liveOwnGoals = player.ownGoals || 0;

    // Acumular goles y autogoles
    player.cumulativeGoals = (player.cumulativeGoals || 0) + liveGoals;
    player.cumulativeOwnGoals = (player.cumulativeOwnGoals || 0) + liveOwnGoals;

    // Si el jugador participó (tenía equipo asignado en la jornada)
    if (player.teamKey) {
      player.matchdaysPlayed = (player.matchdaysPlayed || 0) + 1;

      // Si perteneció al equipo que terminó en 4° puesto, sumar colista
      if (colistaTeamKey && player.teamKey === colistaTeamKey) {
        player.lastPlaces = (player.lastPlaces || 0) + 1;
      }
    }

    // Reiniciar estadísticas de la sesión en vivo actual
    player.goals = 0;
    player.ownGoals = 0;
    player.teamKey = '';
  });

  // 3. Limpiar equipos sorteados para dejarlos listos para el próximo sorteo
  currentDrawnTeams = { azul: [], blanco: [], negro: [], rojo: [] };
  saveDrawnTeams();

  // 4. Reiniciar la tabla de posiciones en vivo a cero
  LIVE_STANDINGS = JSON.parse(JSON.stringify(DEFAULT_LIVE_STANDINGS));
  saveLiveStandings();

  // 5. Guardar la base de datos de jugadores actualizada
  savePlayersDatabase();

  // 6. Avanzar número de jornada (+1)
  const nextRound = currentRound + 1;
  saveCurrentRound(nextRound);

  // Limpiar última acción de arena
  lastMatchAction = null;

  // 7. Renderizar y actualizar todas las vistas
  renderStandingsTable();
  renderAllSections();
  renderMainRosters();
  renderDrawnTeamsPreview();
  renderPotsManagement();
  renderMatchArena();
  renderMiniLiveStandings();
  renderLiveTeamsControl();
  renderLivePlayersScoring();
  renderMatchdaysHistory();

  alert(`¡Jornada ${currentRound} finalizada y archivada con éxito!\n\n` +
    `• Las estadísticas se han acumulado permanentemente en el historial.\n` +
    `• Se guardó la copia oficial de la Jornada ${currentRound} en la pestaña "Historial".\n` +
    `• Los equipos han quedado limpios y listos para sortear la Jornada ${nextRound}.`);
}

// Reiniciar únicamente la sesión en vivo actual sin alterar el historial acumulado
function resetLiveSession() {
  const confirmMsg = '¿Deseas reiniciar a cero las estadísticas de la sesión en vivo actual (puntos, partidos y goles)?\n\n' +
    'Nota: Esta acción restablece los marcadores de la jornada en curso para corregir errores, pero NO borra el historial general ni los goles acumulados de jornadas anteriores.';

  if (!confirm(confirmMsg)) {
    return;
  }

  LIVE_STANDINGS = JSON.parse(JSON.stringify(DEFAULT_LIVE_STANDINGS));
  saveLiveStandings();

  TOURNAMENT_PLAYERS.forEach((p) => {
    p.goals = 0;
    p.ownGoals = 0;
  });
  savePlayersDatabase();

  lastMatchAction = null;
  renderMatchArena();
  renderMiniLiveStandings();
  renderLiveTeamsControl();
  renderLivePlayersScoring();
  renderStandingsTable();
  renderAllSections();

  alert('Los marcadores de la sesión en vivo actual se han reiniciado a cero.\n\nEl historial general del torneo permanece intacto.');
}

// ========================================================
// 6.3 RENDERIZADO DEL HISTORIAL DE JORNADAS PASADAS
// ========================================================
function renderMatchdaysHistory() {
  const badgeEl = document.getElementById('history-total-badge');
  const selectorWrapper = document.querySelector('.history-selector-wrapper');
  const selectorContainer = document.getElementById('history-selector-container');
  const detailContainer = document.getElementById('history-detail-container');

  if (badgeEl) {
    badgeEl.textContent = `${MATCHDAYS_HISTORY.length} ${MATCHDAYS_HISTORY.length === 1 ? 'Jornada' : 'Jornadas'}`;
  }

  if (!detailContainer) return;

  if (MATCHDAYS_HISTORY.length === 0) {
    if (selectorWrapper) selectorWrapper.style.display = 'none';
    detailContainer.innerHTML = `
      <div class="history-empty-box">
        <div class="history-empty-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h4 class="history-empty-title">Aún no hay jornadas archivadas</h4>
        <p class="history-empty-sub">
          Cuando el administrador finalice la sesión de 2 horas con el botón 
          <strong>"Finalizar y Guardar Jornada"</strong>, se registrará aquí automáticamente el resumen 
          con la fecha exacta, campeón, colista, tabla final de posiciones, goleadores y los 4 planteles sorteados.
        </p>
      </div>
    `;
    return;
  }

  if (selectorWrapper) selectorWrapper.style.display = 'block';

  // Ordenar por jornada descendente (más reciente primero)
  const sortedHistory = [...MATCHDAYS_HISTORY].sort((a, b) => b.roundNumber - a.roundNumber);

  if (selectedHistoryRound === null || !sortedHistory.some((m) => m.roundNumber === selectedHistoryRound)) {
    selectedHistoryRound = sortedHistory[0].roundNumber;
  }

  // Renderizar selectores de jornada
  if (selectorContainer) {
    selectorContainer.innerHTML = '';
    sortedHistory.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `history-pill-btn ${item.roundNumber === selectedHistoryRound ? 'active' : ''}`;

      let shortDate = '';
      try {
        const d = new Date(item.timestamp || Date.now());
        shortDate = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (e) {
        shortDate = item.formattedDate || '';
      }

      btn.innerHTML = `
        <span class="history-pill-round">Jornada ${item.roundNumber}</span>
        <span class="history-pill-date">${shortDate}</span>
      `;

      btn.addEventListener('click', () => {
        selectedHistoryRound = item.roundNumber;
        renderMatchdaysHistory();
      });

      selectorContainer.appendChild(btn);
    });
  }

  const activeRecord = sortedHistory.find((m) => m.roundNumber === selectedHistoryRound);
  if (!activeRecord) return;

  renderHistoryDetail(detailContainer, activeRecord);
}

function renderHistoryDetail(container, record) {
  const champ = record.champion || { name: 'Por definir', pts: 0, dg: 0 };
  const colista = record.colista || { name: 'Por definir', pts: 0 };
  const pichichi = record.topScorers && record.topScorers.length > 0 ? record.topScorers[0] : null;

  // 1. Tabla de Posiciones Final de la Fecha
  let standingsRows = '';
  (record.standings || []).forEach((team, idx) => {
    const pos = idx + 1;
    const teamDef = MANCOS_TEAMS[team.key] || { bulletClass: 'bullet-white', name: team.name };
    const isLeader = pos === 1;
    let rankBadgeClass = pos === 1 ? 'rank-1' : pos === 2 ? 'rank-2-badge' : pos === 3 ? 'rank-3-badge' : 'rank-default';

    let dgClass = 'neutral';
    let dgFormatted = '0';
    if (team.dg > 0) {
      dgClass = 'positive';
      dgFormatted = `+${team.dg}`;
    } else if (team.dg < 0) {
      dgClass = 'negative';
      dgFormatted = `${team.dg}`;
    }

    standingsRows += `
      <tr class="${isLeader ? 'row-leader' : ''}">
        <td class="td-pos"><span class="pos-badge ${rankBadgeClass}">${pos}</span></td>
        <td class="td-team">
          <div class="team-cell">
            <span class="team-bullet ${teamDef.bulletClass}"></span>
            <strong class="team-title">${teamDef.name}</strong>
          </div>
        </td>
        <td>${team.pj || 0}</td>
        <td class="col-secondary">${team.pg || 0}</td>
        <td class="col-secondary">${team.pe || 0}</td>
        <td class="col-secondary">${team.pp || 0}</td>
        <td class="col-secondary">${team.gf || 0}</td>
        <td class="col-secondary">${team.gc || 0}</td>
        <td class="td-dg ${dgClass}">${dgFormatted}</td>
        <td class="td-pts"><span class="pts-pill">${team.pts || 0}</span></td>
      </tr>
    `;
  });

  // 2. Goleadores de la Fecha
  let scorersHtml = '';
  if (record.topScorers && record.topScorers.length > 0) {
    scorersHtml = `
      <div class="history-scorers-grid">
        ${record.topScorers.map((s, idx) => {
          const tDef = MANCOS_TEAMS[s.teamKey] || { bulletClass: 'bullet-white', name: 'Mancos F.C.' };
          const pos = idx + 1;
          const badgeClass = pos === 1 ? 'rank-1' : pos === 2 ? 'rank-2-badge' : pos === 3 ? 'rank-3-badge' : 'rank-default';
          return `
            <div class="history-scorer-item ${idx === 0 ? 'leader-scorer' : ''}">
              <div class="scorer-left">
                <span class="pos-badge ${badgeClass}" style="width:20px; height:20px; font-size:0.68rem;">${pos}</span>
                <span class="team-bullet ${tDef.bulletClass}"></span>
                <strong class="scorer-name">${s.name}</strong>
                <span class="scorer-team-label">${tDef.name}</span>
              </div>
              <span class="scorer-goals-pill">${s.goals} ${s.goals === 1 ? 'gol' : 'goles'}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } else {
    scorersHtml = `<p class="history-empty-inline">No se registraron goles individuales en esta jornada.</p>`;
  }

  // 3. Planteles Sorteados de la Fecha
  const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];
  let rostersHtml = '';
  teamKeys.forEach((key) => {
    const tDef = MANCOS_TEAMS[key] || { name: key, borderClass: '', bulletClass: 'bullet-white' };
    const players = (record.teams && record.teams[key]) ? record.teams[key] : [];

    rostersHtml += `
      <div class="history-roster-card ${tDef.borderClass}">
        <div class="history-roster-head">
          <div class="team-identity">
            <span class="team-bullet ${tDef.bulletClass}"></span>
            <h5>${tDef.name}</h5>
          </div>
          <span class="history-roster-count">${players.length} Jugadores</span>
        </div>
        <ul class="history-roster-players">
          ${players.length > 0 ? players.map((p) => {
            const potDef = POT_DEFINITIONS[p.potLevel] || { tag: `B${p.potLevel || 1}`, tagClass: 'pot-1-tag' };
            return `
              <li>
                <span class="player-dot"></span>
                <span>${p.name}</span>
                <span class="pot-tag ${potDef.tagClass}">${potDef.tag}</span>
              </li>
            `;
          }).join('') : '<li class="empty-roster-msg">Sin alineación registrada</li>'}
        </ul>
      </div>
    `;
  });

  container.innerHTML = `
    <!-- Banner de la Jornada con Fecha y Datos Clave -->
    <div class="history-round-header">
      <div class="history-header-left">
        <div class="history-tag-badge">ARCHIVO OFICIAL</div>
        <h3 class="history-title">Jornada ${record.roundNumber}</h3>
        <p class="history-date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>${record.formattedDate}</span>
        </p>
      </div>
    </div>

    <!-- 4 Métricas de Honores -->
    <div class="history-honors-grid">
      <div class="history-honor-card card-champion">
        <div class="honor-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.45 1-1 1H7v2h10v-2h-2c-.55 0-1-.45-1-1v-2.34" />
            <path d="M6 5h12v6a6 6 0 0 1-12 0V5z" />
          </svg>
        </div>
        <div class="honor-info">
          <span class="honor-label">Campeón de la Fecha</span>
          <strong class="honor-value">${champ.name}</strong>
          <span class="honor-sub">${champ.pts || 0} Pts · Dif ${champ.dg >= 0 ? '+' : ''}${champ.dg || 0}</span>
        </div>
      </div>

      <div class="history-honor-card card-colista">
        <div class="honor-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
        <div class="honor-info">
          <span class="honor-label">Colista (4° Puesto)</span>
          <strong class="honor-value">${colista.name}</strong>
          <span class="honor-sub">${colista.pts || 0} Pts en la fecha</span>
        </div>
      </div>

      <div class="history-honor-card card-pichichi">
        <div class="honor-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <div class="honor-info">
          <span class="honor-label">Pichichi de la Fecha</span>
          <strong class="honor-value">${pichichi ? pichichi.name : 'Sin goles'}</strong>
          <span class="honor-sub">${pichichi ? pichichi.goals + ' goles marcados' : '-'}</span>
        </div>
      </div>

      <div class="history-honor-card card-stats">
        <div class="honor-icon-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        </div>
        <div class="honor-info">
          <span class="honor-label">Balance de Sesión</span>
          <strong class="honor-value">${record.totalGoals || 0} Goles</strong>
          <span class="honor-sub">${record.totalMatches || 0} partidos jugados</span>
        </div>
      </div>
    </div>
    </div>

    <!-- Tabla Final de Posiciones de la Jornada -->
    <div class="history-section-box mt-16">
      <div class="scorers-header-flex">
        <h4 class="scorers-subtitle">Tabla de Posiciones Final de la Jornada ${record.roundNumber}</h4>
        <span class="scorers-count-badge">Resultado final de las 2 horas</span>
      </div>
      <div class="table-responsive">
        <table class="mancos-table">
          <thead>
            <tr>
              <th class="th-pos">#</th>
              <th class="th-team">Equipo</th>
              <th>PJ</th>
              <th class="col-secondary">PG</th>
              <th class="col-secondary">PE</th>
              <th class="col-secondary">PP</th>
              <th class="col-secondary">GF</th>
              <th class="col-secondary">GC</th>
              <th>DG</th>
              <th class="th-pts">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${standingsRows}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Goleadores de la Jornada -->
    <div class="history-section-box mt-16">
      <div class="scorers-header-flex">
        <h4 class="scorers-subtitle">Goleadores de esta Jornada</h4>
        <span class="scorers-count-badge">Goles anotados en esta sesión</span>
      </div>
      ${scorersHtml}
    </div>

    <!-- Planteles Sorteados de la Jornada -->
    <div class="history-section-box mt-16">
      <div class="scorers-header-flex">
        <h4 class="scorers-subtitle">Equipos y Planteles Sorteados</h4>
        <span class="scorers-count-badge">Alineaciones de los 5 bombos</span>
      </div>
      <div class="history-rosters-grid">
        ${rostersHtml}
      </div>
    </div>
  `;
}

// ========================================================
// 7. INICIALIZAR Y RENDERIZAR TODO
// ========================================================
function renderAllSections() {
  // Actualizar contador general
  const totalBadge = document.getElementById('total-players-badge');
  if (totalBadge) totalBadge.textContent = `${TOURNAMENT_PLAYERS.length} Jugadores`;

  // Pichichi de la Jornada (Top 3 en Vivo)
  const liveScorers = getSortedScorersLive();
  renderTop3Podium('matchday-pichichi-wrapper', liveScorers.slice(0, 3), 'goals', 'GOLES', 'LÍDER FECHA');

  // Goleadores Acumulados (Histórico + Vivo)
  const cumulativeScorers = getSortedScorersCumulative();
  renderTop3Podium('cumulative-podium-wrapper', cumulativeScorers.slice(0, 3), 'totalGoals', 'GOLES', 'MÁXIMO GOLEADOR');
  renderGenericTable('cumulative-scorers-tbody', cumulativeScorers, 'totalGoals');

  // Colistas (Últimos lugares en historial)
  const sortedColistas = getSortedColistas();
  renderTop3Podium('colistas-podium-wrapper', sortedColistas.slice(0, 3), 'lastPlaces', 'VECES 4°', 'MÁS VECES ÚLTIMO');
  renderGenericTable('colistas-tbody', sortedColistas, 'lastPlaces');

  // Autogoles (Histórico + Vivo)
  const cumulativeAutogoles = getSortedAutogolesCumulative();
  renderTop3Podium('autogoles-podium-wrapper', cumulativeAutogoles.slice(0, 3), 'totalOwnGoals', 'AUTOGOLES', 'REY DEL AUTOGOL');
  renderGenericTable('autogoles-tbody', cumulativeAutogoles, 'totalOwnGoals');

  // Historial de Jornadas
  renderMatchdaysHistory();

  // Planteles de la jornada
  renderMainRosters();

  // Tabla de posiciones oficial de la jornada
  renderStandingsTable();
  renderMiniLiveStandings();
  renderMatchArena();

  // Actualizar indicador de ronda activa
  updateRoundUI(loadCurrentRound());
}

// ========================================================
// 8. EVENT LISTENERS
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Selector de Pestañas Principales (Posiciones, Goleadores, Colistas, Autogoles)
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 2. Control de Autenticación y Modal de Administración (4 Administradores Exclusivos)
  const ALLOWED_ADMINS = ['eduardo', 'gustavo', 'mauricio', 'morloy'];
  const ADMIN_PASSWORD = 'admins2026*';
  const ADMIN_DISPLAY_NAMES = {
    'eduardo': 'Eduardo',
    'gustavo': 'Gustavo',
    'mauricio': 'Mauricio',
    'morloy': 'Morloy'
  };

  const btnLogin = document.getElementById('btn-login');
  const modalLogin = document.getElementById('modal-login');
  const modalAdmin = document.getElementById('modal-admin');
  const adminLoginForm = document.getElementById('admin-login-form');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnCancelLogin = document.getElementById('btn-cancel-login');
  const btnCloseAdmin = document.getElementById('btn-close-admin');
  const btnBackAdmin = document.getElementById('btn-back-admin');
  const btnLogoutAdmin = document.getElementById('btn-logout-admin');

  function closeAdminPanel() {
    if (modalAdmin) modalAdmin.style.display = 'none';
    sessionStorage.removeItem('mancos_admin_logged');
    document.body.style.overflow = '';
  }

  function openAdminPanel(adminName = 'Eduardo') {
    if (modalLogin) modalLogin.style.display = 'none';
    if (modalAdmin) {
      modalAdmin.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      const nameBadge = document.getElementById('admin-user-name-display');
      if (nameBadge) {
        nameBadge.textContent = adminName;
      }
      renderPotsManagement();
      renderDrawnTeamsPreview();
      renderMatchArena();
      renderMiniLiveStandings();
      renderLiveTeamsControl();
      renderLivePlayersScoring();
      updateRoundUI(loadCurrentRound());
      const liveRoundTitle = document.getElementById('admin-live-round-title');
      if (liveRoundTitle) {
        liveRoundTitle.textContent = `Control de Jornada ${loadCurrentRound()}`;
      }
    }
  }

  function openLoginForm() {
    if (modalAdmin) closeAdminPanel();
    if (modalLogin) {
      modalLogin.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (loginErrorMsg) loginErrorMsg.style.display = 'none';
      const nameInput = document.getElementById('admin-name');
      if (nameInput) {
        nameInput.value = '';
        setTimeout(() => nameInput.focus(), 100);
      }
      const passInput = document.getElementById('admin-pass');
      if (passInput) {
        passInput.value = '';
      }
    }
  }

  // Clic en botón "Admin": SIEMPRE solicita nombre de administrador y contraseña
  if (btnLogin) {
    btnLogin.addEventListener('click', () => {
      openLoginForm();
    });
  }

  // Procesar Login de Administrador
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rawName = document.getElementById('admin-name').value.trim();
      const pass = document.getElementById('admin-pass').value.trim();
      const normalizedName = rawName.toLowerCase();

      const isValidAdmin = ALLOWED_ADMINS.includes(normalizedName);

      if (isValidAdmin && pass === ADMIN_PASSWORD) {
        const displayName = ADMIN_DISPLAY_NAMES[normalizedName] || rawName;
        sessionStorage.setItem('mancos_admin_logged', displayName);
        if (loginErrorMsg) loginErrorMsg.style.display = 'none';
        modalLogin.style.display = 'none';
        openAdminPanel(displayName);
      } else {
        if (loginErrorMsg) {
          loginErrorMsg.style.display = 'block';
          if (!isValidAdmin) {
            loginErrorMsg.textContent = 'Nombre de administrador no autorizado.';
          } else {
            loginErrorMsg.textContent = 'Contraseña incorrecta.';
          }
        }
      }
    });
  }

  // Cerrar / Cancelar Login
  if (btnCancelLogin && modalLogin) {
    btnCancelLogin.addEventListener('click', () => {
      modalLogin.style.display = 'none';
      document.body.style.overflow = '';
    });
  }

  // Cerrar Panel Admin con X o botón Volver
  if (btnCloseAdmin) {
    btnCloseAdmin.addEventListener('click', closeAdminPanel);
  }
  if (btnBackAdmin) {
    btnBackAdmin.addEventListener('click', closeAdminPanel);
  }

  // Cerrar Sesión de Administrador
  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', () => {
      closeAdminPanel();
      alert('Sesión cerrada con éxito.');
    });
  }

  // Botón Vaciar Todo en los Bombos
  const btnClearAll = document.getElementById('btn-clear-all-players');
  if (btnClearAll) {
    btnClearAll.addEventListener('click', clearAllPlayers);
  }

  // Cerrar modal de login al hacer clic en el backdrop exterior
  if (modalLogin) {
    modalLogin.addEventListener('click', (e) => {
      if (e.target === modalLogin) {
        modalLogin.style.display = 'none';
        document.body.style.overflow = '';
      }
    });
  }

  // Cerrar modales con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalOwnGoal = document.getElementById('modal-owngoal');
      if (modalOwnGoal && modalOwnGoal.style.display === 'flex') {
        closeOwnGoalModal();
        return;
      }
      if (modalEditSlot && modalEditSlot.style.display === 'flex') {
        closeEditSlotModal();
        return;
      }
      if (modalLogin && modalLogin.style.display === 'flex') {
        modalLogin.style.display = 'none';
        document.body.style.overflow = '';
      }
      if (modalAdmin && modalAdmin.style.display === 'flex') {
        closeAdminPanel();
      }
    }
  });

  // 3. Sub-pestañas dentro del Panel Administrador (Bombos vs Sorteo)
  const adminSubtabs = document.querySelectorAll('.admin-subtab-btn');
  const adminPanes = document.querySelectorAll('.admin-pane');

  adminSubtabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const paneId = btn.getAttribute('data-admin-pane');
      adminSubtabs.forEach((b) => b.classList.remove('active'));
      adminPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(paneId);
      if (targetPane) {
        targetPane.classList.add('active');
        if (paneId === 'admin-pane-live') {
          renderMatchArena();
          renderMiniLiveStandings();
          renderLiveTeamsControl();
          renderLivePlayersScoring();
          const liveRoundTitle = document.getElementById('admin-live-round-title');
          if (liveRoundTitle) {
            liveRoundTitle.textContent = `Control de Jornada ${loadCurrentRound()}`;
          }
        }
      }
    });
  });

  // 3.0 Controladores de Sesión en Vivo (Mesa de Control 2 Horas)
  const btnSwapTeams = document.getElementById('btn-swap-teams');
  if (btnSwapTeams) {
    btnSwapTeams.addEventListener('click', swapArenaTeams);
  }

  const btnArenaDraw = document.getElementById('btn-register-arena-draw');
  if (btnArenaDraw) {
    btnArenaDraw.addEventListener('click', registerArenaDraw);
  }

  const btnArenaUndo = document.getElementById('btn-undo-last-match');
  if (btnArenaUndo) {
    btnArenaUndo.addEventListener('click', undoLastMatchAction);
  }

  // Modal de Autogoles
  const btnOpenOwnGoalModal = document.getElementById('btn-open-owngoal-modal');
  if (btnOpenOwnGoalModal) {
    btnOpenOwnGoalModal.addEventListener('click', openOwnGoalModal);
  }

  const btnCloseOwnGoalModal = document.getElementById('btn-close-owngoal-modal');
  if (btnCloseOwnGoalModal) {
    btnCloseOwnGoalModal.addEventListener('click', closeOwnGoalModal);
  }

  const modalOwnGoal = document.getElementById('modal-owngoal');
  if (modalOwnGoal) {
    modalOwnGoal.addEventListener('click', (e) => {
      if (e.target === modalOwnGoal) {
        closeOwnGoalModal();
      }
    });
  }

  const filterOwnGoalArena = document.getElementById('filter-owngoal-arena');
  const filterOwnGoalAll = document.getElementById('filter-owngoal-all');
  if (filterOwnGoalArena && filterOwnGoalAll) {
    filterOwnGoalArena.addEventListener('click', () => {
      filterOwnGoalArena.classList.add('active');
      filterOwnGoalAll.classList.remove('active');
      currentOwnGoalFilter = 'arena';
      renderOwnGoalModalList();
    });

    filterOwnGoalAll.addEventListener('click', () => {
      filterOwnGoalAll.classList.add('active');
      filterOwnGoalArena.classList.remove('active');
      currentOwnGoalFilter = 'all';
      renderOwnGoalModalList();
    });
  }

  const btnFinishAndSaveRound = document.getElementById('btn-finish-and-save-round');
  if (btnFinishAndSaveRound) {
    btnFinishAndSaveRound.addEventListener('click', finishAndSaveMatchday);
  }

  const btnResetLiveStats = document.getElementById('btn-reset-live-stats');
  if (btnResetLiveStats) {
    btnResetLiveStats.addEventListener('click', resetLiveSession);
  }

  const teamFilterBtns = document.querySelectorAll('.btn-team-filter');
  teamFilterBtns.forEach((filterBtn) => {
    filterBtn.addEventListener('click', () => {
      teamFilterBtns.forEach((b) => b.classList.remove('active'));
      filterBtn.classList.add('active');
      currentLivePlayerFilter = filterBtn.getAttribute('data-team') || 'all';
      renderLivePlayersScoring();
    });
  });

  // Sincronización en vivo entre pestañas/dispositivos (Web Storage Event)
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('mancos_')) {
      LIVE_STANDINGS = loadLiveStandings();
      TOURNAMENT_PLAYERS = loadPlayersDatabase();
      currentDrawnTeams = loadDrawnTeams();
      MATCHDAYS_HISTORY = loadMatchdaysHistory();
      renderStandingsTable();
      renderAllSections();
      renderMainRosters();
      const roundNum = loadCurrentRound();
      updateRoundUI(roundNum);
      renderMatchArena();
      renderMiniLiveStandings();
      renderLiveTeamsControl();
      renderLivePlayersScoring();
      renderMatchdaysHistory();
    }
  });

  // 3.1 Editor de Ronda / Jornada del Torneo
  const currentRound = loadCurrentRound();
  updateRoundUI(currentRound);

  const inputRound = document.getElementById('input-round-number');
  const btnRoundDec = document.getElementById('btn-round-dec');
  const btnRoundInc = document.getElementById('btn-round-inc');

  if (inputRound) {
    inputRound.value = currentRound;
    inputRound.addEventListener('change', () => {
      let val = parseInt(inputRound.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      saveCurrentRound(val);
    });
    inputRound.addEventListener('input', () => {
      let val = parseInt(inputRound.value, 10);
      if (!isNaN(val) && val >= 1) {
        saveCurrentRound(val);
      }
    });
  }

  if (btnRoundDec) {
    btnRoundDec.addEventListener('click', () => {
      const current = loadCurrentRound();
      if (current > 1) {
        saveCurrentRound(current - 1);
      }
    });
  }

  if (btnRoundInc) {
    btnRoundInc.addEventListener('click', () => {
      const current = loadCurrentRound();
      saveCurrentRound(current + 1);
    });
  }

  // 4. Botones de Sorteo y Confirmación
  const btnGenerateDraw = document.getElementById('btn-generate-draw');
  const btnRepeatDraw = document.getElementById('btn-repeat-draw');
  const btnApplyTeams = document.getElementById('btn-apply-teams');

  if (btnGenerateDraw) {
    btnGenerateDraw.addEventListener('click', () => {
      generateBalancedDraw(false);
    });
  }

  if (btnRepeatDraw) {
    btnRepeatDraw.addEventListener('click', () => {
      generateBalancedDraw(true);
    });
  }

  if (btnApplyTeams) {
    btnApplyTeams.addEventListener('click', () => {
      applyTeamsToMatchday();
    });
  }

  // 4.1 Formulario de Edición de Casilla / Sustitución Manual
  const editSlotForm = document.getElementById('edit-slot-form');
  const btnCancelEditSlot = document.getElementById('btn-cancel-edit-slot');
  const modalEditSlot = document.getElementById('modal-edit-slot');

  if (editSlotForm) {
    editSlotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const playerId = document.getElementById('edit-player-id').value;
      const newName = document.getElementById('edit-player-name').value.trim();
      const newPot = parseInt(document.getElementById('edit-player-pot').value, 10);
      const newTeam = document.getElementById('edit-player-team').value;
      const errorMsg = document.getElementById('edit-error-msg');

      if (!newName) {
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.textContent = 'Por favor escribe el nombre del jugador o suplente.';
        }
        return;
      }

      // Validar si el nombre ya pertenece a otro jugador diferente
      const existsOther = TOURNAMENT_PLAYERS.some((p) => p.id !== playerId && p.name.toLowerCase() === newName.toLowerCase());
      if (existsOther) {
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.textContent = `Ya existe otro jugador registrado con el nombre "${newName}".`;
        }
        return;
      }

      const player = TOURNAMENT_PLAYERS.find((p) => p.id === playerId);
      if (!player) return;

      // Actualizar datos del jugador
      player.name = newName;
      player.potLevel = newPot;
      player.teamKey = newTeam;

      // Sincronizar en currentDrawnTeams
      const teamKeys = ['azul', 'blanco', 'negro', 'rojo'];
      teamKeys.forEach((k) => {
        if (currentDrawnTeams[k]) {
          currentDrawnTeams[k] = currentDrawnTeams[k].filter((p) => p.id !== playerId);
        }
      });

      if (newTeam && currentDrawnTeams[newTeam]) {
        currentDrawnTeams[newTeam].push(player);
      }

      savePlayersDatabase();
      saveDrawnTeams();

      renderPotsManagement();
      renderDrawnTeamsPreview();
      renderMatchArena();
      renderMiniLiveStandings();
      renderLiveTeamsControl();
      renderLivePlayersScoring();
      updateRoundUI(loadCurrentRound());
      const liveRoundTitle = document.getElementById('admin-live-round-title');
      if (liveRoundTitle) {
        liveRoundTitle.textContent = `Control de Jornada ${loadCurrentRound()}`;
      }
      renderMainRosters();
      renderAllSections();

      closeEditSlotModal();
    });
  }

  if (btnCancelEditSlot) {
    btnCancelEditSlot.addEventListener('click', closeEditSlotModal);
  }

  if (modalEditSlot) {
    modalEditSlot.addEventListener('click', (e) => {
      if (e.target === modalEditSlot) {
        closeEditSlotModal();
      }
    });
  }

  // 5. Inicializaciones
  sessionStorage.removeItem('mancos_admin_logged');
  renderAllSections();

  // 6. Registro de Service Worker para PWA (Instalable como App con Icono)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.warn('ServiceWorker no se pudo registrar:', err);
      });
    });
  }
});
