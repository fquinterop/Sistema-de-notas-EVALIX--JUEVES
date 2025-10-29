// =========================
// CONFIGURACIÓN DE API
// =========================
const API_BASE = 'https://68fe81337c700772bb13ddbe.mockapi.io/Admin';

// =========================
// CATÁLOGOS Y ESTADO
// =========================
const MATERIAS = ['Matemáticas', 'Español', 'Ciencias', 'Inglés', 'Educación Física', 'Artes'];
const PERIODOS = [1, 2, 3, 4];
let state = { nextId: 1001, autoId: true, rows: [] };

// =========================
// REFERENCIAS DOM
// =========================
const tbody = document.getElementById('studentsTbody');
const autoIdSwitch = document.getElementById('autoIdSwitch');
const netStatus = document.getElementById('netStatus');
const userEmailSpan = document.getElementById('userEmail');

// =========================
// SESIÓN (básica)
// =========================
(function checkSession() {
  const u = localStorage.getItem('evalix_user');
  if (!u) return; // No bloquea el acceso si no hay login
  const user = JSON.parse(u);
  userEmailSpan.textContent = user.email || '';
})();

// =========================
// FUNCIONES API
// =========================
async function apiGetStudents() {
  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error('Error al obtener datos');
  return await res.json();
}

async function apiAddStudent(student) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student)
  });
  if (!res.ok) throw new Error('Error al guardar');
  return await res.json();
}

async function apiDeleteStudent(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al eliminar');
}

// =========================
// UI
// =========================
function renderRows() {
  tbody.innerHTML = '';
  state.rows.forEach((r, idx) => {
    const materias = MATERIAS.map(m => `<option ${r.asignatura === m ? 'selected' : ''}>${m}</option>`).join('');
    const periodos = PERIODOS.map(p => `<option ${r.periodo == p ? 'selected' : ''}>${p}</option>`).join('');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input class="form-control form-control-sm" value="${r.idEst}" data-k="idEst" ${state.autoId ? 'readonly' : ''}></td>
      <td><input class="form-control form-control-sm" value="${r.documento}" data-k="documento"></td>
      <td><input class="form-control form-control-sm" value="${r.nombre}" data-k="nombre"></td>
      <td><select class="form-select form-select-sm" data-k="asignatura">${materias}</select></td>
      <td><input class="form-control form-control-sm" type="number" value="${r.anio}" data-k="anio"></td>
      <td><select class="form-select form-select-sm" data-k="periodo">${periodos}</select></td>
      <td><button class="btn btn-danger btn-sm" data-del="${idx}">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function showNetStatus(msg, type = 'info') {
  netStatus.className = `alert alert-${type}`;
  netStatus.textContent = msg;
  netStatus.classList.remove('d-none');
  setTimeout(() => netStatus.classList.add('d-none'), 4000);
}

// =========================
// LÓGICA DE ESTADO
// =========================
function nextId() {
  return String(state.nextId++);
}

function addRow(prefill = {}) {
  const row = {
    idEst: prefill.idEst || (state.autoId ? nextId() : ''),
    documento: prefill.documento || '',
    nombre: prefill.nombre || '',
    asignatura: prefill.asignatura || '',
    anio: prefill.anio || 2025,
    periodo: prefill.periodo || ''
  };
  state.rows.push(row);
  renderRows();
}

async function saveState() {
  try {
    for (const student of state.rows) await apiAddStudent(student);
    showNetStatus('Datos guardados en MockAPI ✅', 'success');
  } catch (e) {
    console.error(e);
    showNetStatus('Error al guardar en API ⚠️', 'warning');
  }
}

// =========================
// EVENTOS
// =========================
document.getElementById('addRowBtn').addEventListener('click', () => addRow());
document.getElementById('saveBtn').addEventListener('click', saveState);
document.getElementById('exportBtn').addEventListener('click', exportCSV);
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('¿Eliminar todos los registros?')) {
    state.rows = [];
    renderRows();
    showNetStatus('Datos limpiados.', 'info');
  }
});
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('evalix_user');
  window.location.href = 'index.html';
});

tbody.addEventListener('click', async e => {
  const btn = e.target.closest('[data-del]');
  if (!btn) return;
  const idx = parseInt(btn.dataset.del);
  const student = state.rows[idx];
  if (confirm('¿Eliminar estudiante?')) {
    state.rows.splice(idx, 1);
    renderRows();
    try {
      await apiDeleteStudent(student.idEst);
      showNetStatus('Eliminado del servidor ✅', 'success');
    } catch {
      showNetStatus('Eliminado localmente ⚠️', 'warning');
    }
  }
});

tbody.addEventListener('input', e => {
  const el = e.target.closest('[data-k]');
  if (!el) return;
  const idx = [...tbody.children].indexOf(el.closest('tr'));
  const key = el.dataset.k;
  state.rows[idx][key] = el.value;
});

// =========================
// EXPORTAR CSV
// =========================
function exportCSV() {
  const headers = ['ID Estudiante', 'Documento', 'Nombre', 'Asignatura', 'Año', 'Periodo'];
  const rows = state.rows.map(r => [r.idEst, r.documento, r.nombre, r.asignatura, r.anio, r.periodo]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'estudiantes_evalix.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// =========================
// CARGA INICIAL
// =========================
(async function init() {
  try {
    const server = await apiGetStudents();
    state.rows = server.map(r => ({
      mockId: r.id,
      idEst: r.idEst || r.id,
      documento: r.documento || '',
      nombre: r.nombre || '',
      asignatura: r.asignatura || '',
      anio: r.anio || 2025,
      periodo: r.periodo || ''
    }));
    showNetStatus('Datos cargados desde MockAPI.', 'success');
  } catch (error) {
    console.error('Error al cargar los datos desde MockAPI:', error);
    showNetStatus('Error al cargar datos desde MockAPI.', 'danger');
  }
})();
