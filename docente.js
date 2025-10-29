const API_URL = "https://68fe58f87c700772bb13879c.mockapi.io/Sheets";

(function () {
  /* ===========================================================
     CONSTANTES / UTILIDADES
     =========================================================== */
  const STORAGE_PREFIX = "evalix_notas_";
  const tbody = document.getElementById("gradesTbody");
  const anioInput = document.getElementById("anio");
  const periodoSel = document.getElementById("periodo");
  const asignaturaSel = document.getElementById("asignatura");
  const netStatus = document.getElementById("netStatus");
  const userEmailSpan = document.getElementById("userEmail");

  function randomIntBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Normaliza a número con 1 decimal (0.0–5.0) o '' si vacío
  function normalizeToOneDecimalNumberOrEmpty(v) {
    if (v === "" || v === null || v === undefined) return "";
    const n = parseFloat(String(v).replace(",", "."));
    if (Number.isNaN(n)) return "";
    const clamped = Math.max(0, Math.min(5, n));
    return Math.round(clamped * 10) / 10; // 1 decimal
  }

  // Muestra 1 decimal en inputs (ej. 4.0)
  function formatNoteInputOneDecimal(val) {
    if (val === "" || val === null || val === undefined) return "";
    const num = Number(val);
    if (Number.isNaN(num)) return "";
    return num.toFixed(1);
  }

  /* ===========================================================
     ESTADO GLOBAL
     =========================================================== */
  let state = { anio: 2025, periodo: 1, nextId: 1001, rows: [] };

  /* ===========================================================
     ARRAYS: nombres por asignatura (25 cada)
     =========================================================== */
  const NOMBRES = {
    matematicas: [
      "Juan Pérez","María López","Carlos Gómez","Laura Torres","Andrés Rojas",
      "Sofía Ramírez","Felipe Castro","Valentina Díaz","Daniel Herrera","Camila Ortiz",
      "Sebastián Morales","Natalia Ruiz","Tomás Vargas","Lucía Mendoza","Diego Silva",
      "Isabella Romero","Santiago Navarro","Paula Martínez","Julián León","Gabriela Cruz",
      "David Torres","Alejandra Peña","Martín Gil","Daniela Arias","Simón Cárdenas"
    ],
    ciencias: [
      "Marcos Peña","Estefanía Blanco","Hernán Salazar","Mónica Gil","Óscar Pinto",
      "Rocío Velásquez","Iván Cabrera","Carolina Mena","Raúl Fuentes","Adriana Solano",
      "Germán Varela","Noelia Cano","Enrique Paredes","Karen Acosta","Lina Bravo",
      "Alonso Rubio","Marta Bernal","Pablo Duarte","Melisa Ocampo","Óliver Correa",
      "Verónica Salinas","Rubén Maldonado","Marina Solís","Fabián Vidal","Teresa Lozano"
    ],
    espanol: [
      "Claudia Ríos","Roque Medina","Elena Aguirre","Gonzalo Peña","Marina Patiño",
      "Ivanna Gómez","Ramiro Castillo","Mireya Cifuentes","Luis Navarro","Beatriz Salcedo",
      "Federico Prada","Lorena Bravo","Hugo Santana","Vanessa León","Norberto Cruz",
      "Paola Vargas","Rubén Rojas","Angélica Molina","César Silva","Nerea Duarte",
      "Javier Cortés","Bianca Herrera","Mauricio Ortiz","Ariadna Muñoz","Marcelo García"
    ]
  };

  // Genera 25 estudiantes para la asignatura con documento aleatorio y notas vacías
  function generateStudentsFor(subjectKey) {
    const names = NOMBRES[subjectKey] || NOMBRES.matematicas;
    const usedDocs = new Set();
    return names.map((fullName, i) => {
      let doc;
      do {
        doc = String(randomIntBetween(10000000, 99999999));
      } while (usedDocs.has(doc));
      usedDocs.add(doc);
      return {
        idEst: String(1001 + i),
        documento: doc,
        nombre: fullName,
        n1: "",
        n2: "",
        n3: "",
        n4: "",
        prom: 0
      };
    });
  }

  /* ===========================================================
     FETCH SIMULADO / ASINCRONÍA
     =========================================================== */
  async function fetchStudentsFor(subjectKey) {
    // Simula latencia de red y devuelve 25 estudiantes
    return new Promise((resolve) =>
      setTimeout(() => resolve(generateStudentsFor(subjectKey)), 300)
    );
  }

  /* ===========================================================
     LÓGICA: promedio (1 decimal) y render
     =========================================================== */
  function calcPromedio(row) {
    const notes = [row.n1, row.n2, row.n3, row.n4]
      .map((v) => (v === "" ? "" : Number(v)))
      .filter((v) => v !== "");
    const avg = notes.length ? notes.reduce((a, b) => a + b, 0) / notes.length : 0;
    row.prom = Math.round(avg * 10) / 10; // 1 decimal
    return row.prom;
  }

  function renderRows() {
    tbody.innerHTML = "";
    state.rows.forEach((r, idx) => {
      calcPromedio(r);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class="form-control form-control-sm cell-view-input" value="${r.idEst}" readonly></td>
        <td><input class="form-control form-control-sm cell-view-input" value="${r.documento}" readonly></td>
        <td><input class="form-control form-control-sm cell-view-input" value="${r.nombre}" readonly></td>

        <td><input class="form-control form-control-sm nota" type="number" step="0.1" min="0" max="5" value="${formatNoteInputOneDecimal(r.n1)}" data-k="n1"></td>
        <td><input class="form-control form-control-sm nota" type="number" step="0.1" min="0" max="5" value="${formatNoteInputOneDecimal(r.n2)}" data-k="n2"></td>
        <td><input class="form-control form-control-sm nota" type="number" step="0.1" min="0" max="5" value="${formatNoteInputOneDecimal(r.n3)}" data-k="n3"></td>
        <td><input class="form-control form-control-sm nota" type="number" step="0.1" min="0" max="5" value="${formatNoteInputOneDecimal(r.n4)}" data-k="n4"></td>

        <td><span class="prom-badge badge bg-${r.prom >= 3 ? "success" : "danger"}">${(r.prom ? r.prom.toFixed(1) : "0.0")}</span></td>
        <td><button type="button" class="btn btn-sm btn-outline-danger" data-del="${idx}">Eliminar</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* ===========================================================
     CARGA / GUARDADO / EXPORT / LIMPIAR
     =========================================================== */
  async function loadSubject() {
    state.anio = parseInt(anioInput.value, 10) || 2025;
    state.periodo = parseInt(periodoSel.value, 10) || 1;

    const key = STORAGE_PREFIX + asignaturaSel.value;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        state.rows = JSON.parse(raw);
        showStatus("Datos cargados desde localStorage.", "success");
        renderRows();
        return;
      } catch (e) {
        console.warn("parse error", e);
      }
    }

    showStatus("Cargando estudiantes...", "info");
    state.rows = await fetchStudentsFor(asignaturaSel.value);
    showStatus("25 estudiantes cargados.", "success");
    renderRows();
  }

  function saveState() {
    const rowsTr = [...tbody.children];
    rowsTr.forEach((tr, idx) => {
      const inputs = tr.querySelectorAll("[data-k]");
      inputs.forEach((inp) => {
        const k = inp.getAttribute("data-k");
        const normalized = normalizeToOneDecimalNumberOrEmpty(inp.value); // Number or ''
        state.rows[idx][k] = normalized === "" ? "" : normalized;
      });
      calcPromedio(state.rows[idx]);
    });
    try {
      localStorage.setItem(
        STORAGE_PREFIX + asignaturaSel.value,
        JSON.stringify(state.rows)
      );
      showStatus("Datos guardados correctamente.", "success");
    } catch (e) {
      console.error(e);
      showStatus("Error guardando datos.", "danger");
    }
  }

  function exportCSV() {
    const headers = [
      "Id Estudiante","Documento","Estudiante","Nota 1","Nota 2","Nota 3","Nota 4","Promedio"
    ];
    const rows = state.rows.map((r) => [
      r.idEst,
      r.documento,
      r.nombre,
      r.n1 === "" ? "" : Number(r.n1).toFixed(1),
      r.n2 === "" ? "" : Number(r.n2).toFixed(1),
      r.n3 === "" ? "" : Number(r.n3).toFixed(1),
      r.n4 === "" ? "" : Number(r.n4).toFixed(1),
      r.prom === "" ? "" : Number(r.prom).toFixed(1)
    ]);
    const csv = [headers.join(","), ...rows.map((a) => a.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evalix_${state.anio}_${asignaturaSel.value}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  function clearAll() {
    if (
      !confirm(
        "Esto eliminará todas las filas guardadas localmente para esta asignatura. ¿Continuar?"
      )
    )
      return;
    const key = STORAGE_PREFIX + asignaturaSel.value;
    localStorage.removeItem(key);
    loadSubject();
  }

  /* ===========================================================
     EVENTOS (delegación en tabla + UI)
     =========================================================== */

  // Eliminar fila
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-del]");
    if (!btn) return;
    const idx = Number(btn.getAttribute("data-del"));
    state.rows.splice(idx, 1);
    renderRows();
  });

  // Normalizar a 1 decimal en blur / change
  function handleNormalizeEvent(e) {
    const node = e.target;
    const k = node?.getAttribute?.("data-k");
    if (!["n1", "n2", "n3", "n4"].includes(k || "")) return;
    const tr = node.closest("tr");
    const idx = [...tbody.children].indexOf(tr);
    if (!Number.isFinite(idx)) return;

    const normalized = normalizeToOneDecimalNumberOrEmpty(node.value);
    node.value = normalized === "" ? "" : formatNoteInputOneDecimal(normalized);
    state.rows[idx][k] = normalized === "" ? "" : normalized;
    calcPromedio(state.rows[idx]);
    const badge = tr.querySelector(".prom-badge");
    if (badge)
      badge.textContent = state.rows[idx].prom
        ? state.rows[idx].prom.toFixed(1)
        : "0.0";
    badge?.classList.toggle("bg-success", state.rows[idx].prom >= 3);
    badge?.classList.toggle("bg-danger", state.rows[idx].prom < 3);
  }

  tbody.addEventListener("blur", handleNormalizeEvent, true);
  tbody.addEventListener("change", handleNormalizeEvent);

  // Cambios en asignatura
  asignaturaSel.addEventListener("change", loadSubject);

  // Botones
  document.getElementById("saveBtn").addEventListener("click", saveState);
  document.getElementById("exportBtn").addEventListener("click", exportCSV);
  document.getElementById("clearBtn").addEventListener("click", clearAll);
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("evalix_user");
    window.location.replace("login.html");
  });

  /* ===========================================================
     Helpers UI y arranque
     =========================================================== */
  function showStatus(msg, type = "info") {
    netStatus.classList.remove(
      "d-none",
      "alert-info",
      "alert-success",
      "alert-warning",
      "alert-danger"
    );
    netStatus.classList.add(`alert-${type}`);
    netStatus.textContent = msg;
    setTimeout(() => netStatus.classList.add("d-none"), 3000);
  }

  // Init
  (function init() {
    try {
      const u = JSON.parse(localStorage.getItem("evalix_user") || "{}");
      if (u && u.email) userEmailSpan.textContent = u.email;
    } catch {}
    anioInput.value = state.anio;
    periodoSel.value = state.periodo;
    loadSubject();
  })();
})();
