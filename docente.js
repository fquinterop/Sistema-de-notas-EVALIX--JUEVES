const API_URL = "https://69001fe3e02b16d1754030a0.mockapi.io/users/docente";



(function () {
  const tbody = document.getElementById("gradesTbody");
  const anioInput = document.getElementById("anio");
  const periodoSel = document.getElementById("periodo");
  const asignaturaSel = document.getElementById("asignatura");
  const netStatus = document.getElementById("netStatus");
  const userEmailSpan = document.getElementById("userEmail");

  function normalize(v) {
    if (v === "") return "";
    const n = parseFloat(v);
    if (isNaN(n)) return "";
    return Math.min(5, Math.max(0, Math.round(n * 10) / 10));
  }

  function format1(v) {
    return v === "" ? "" : Number(v).toFixed(1);
  }

  const NOMBRES = {
    matematicas: [
      "Juan Pérez","María López","Carlos Gómez","Laura Torres","Andrés Rojas",
      "Sofía Ramírez","Felipe Castro","Valentina Díaz","Daniel Herrera","Camila Ortiz",
      "Sebastián Morales","Natalia Ruiz","Tomás Vargas","Lucía Mendoza","Diego Silva",
      "Isabella Romero","Santiago Navarro","Paula Martínez","Julián León","Gabriela Cruz",
      "David Torres","Alejandra Peña","Martín Gil","Daniela Arias","Simón Cárdenas"
    ]
  };

  function generar25() {
    return NOMBRES.matematicas.map((n, i) => ({
      idEst: String(1001 + i),
      documento: String(10000000 + i),
      nombre: n,
      n1: "", n2: "", n3: "", n4: "",
      prom: 0
    }));
  }

  let state = { rows: [] };

  function calcProm(r) {
    const notas = ["n1","n2","n3","n4"].map(k => r[k]).filter(v => v !== "");
    r.prom = notas.length === 0
      ? 0
      : Math.round((notas.reduce((a,b)=>a+b,0)/notas.length)*10)/10;
  }

  function mergeData(lo, api) {
    return lo.map(st => {
      const match = api.find(x => x.idEst == st.idEst);
      return match || st;
    });
  }

  async function load() {
    showStatus("Cargando...", "info");

    const local25 = generar25();

    let apiData = [];
    try {
      const res = await fetch(API_URL);
apiData = await res.json();

// Filtrar por asignatura, año y periodo
apiData = apiData.filter(x =>
  x.asignatura === asignaturaSel.value &&
  x.anio === anioInput.value &&
  x.periodo === periodoSel.value
);

    } catch (e) {
      showStatus("Sin conexión pero cargado local ✅", "warning");
      state.rows = local25;
      renderRows();
      return;
    }

    const merged = mergeData(local25, apiData);
    state.rows = merged;
    renderRows();

    if (apiData.length === 0) {
      showStatus("Subiendo estudiantes iniciales...", "info");
      for (const row of merged) await upsert(row);
      showStatus("Estudiantes cargados en MockAPI ✅", "success");
    } else {
      showStatus("Datos combinados MockAPI + Local ✅", "success");
    }
  }

  async function upsert(row) {
    const exists = state.rows.find(r => r.id == row.id);
    calcProm(row);

    const method = row.id ? "PUT" : "POST";
    const url = row.id ? `${API_URL}/${row.id}` : API_URL;

    const res = await fetch(url, {
      method,
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
  ...row,
  anio: anioInput.value,
  periodo: periodoSel.value,
  asignatura: asignaturaSel.value
})

    });
    const saved = await res.json();
    row.id = saved.id;
  }

  function renderRows() {
    tbody.innerHTML = "";
    state.rows.forEach((r, idx) => {
      calcProm(r);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.idEst}</td>
        <td>${r.documento}</td>
        <td>${r.nombre}</td>
        ${["n1","n2","n3","n4"].map(k => `
        <td>
          <input class="form-control form-control-sm nota"
            data-k="${k}" data-idx="${idx}"
            type="number" step="0.1" min="0" max="5"
            value="${format1(r[k])}">
        </td>`).join("")}
        <td>
          <span class="badge bg-${r.prom >= 3 ? "success":"danger"}">
            ${format1(r.prom)}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  tbody.addEventListener("change", async e => {
    const inp = e.target;
    const k = inp.dataset.k;
    if (!k) return;

    const idx = inp.dataset.idx;
    const r = state.rows[idx];

    r[k] = normalize(inp.value);
    calcProm(r);
    renderRows();

    await upsert(r);
    showStatus("Nota Almacenada ✅", "success");
  });

  document.getElementById("exportBtn").addEventListener("click", exportCSV);

  function exportCSV() {
    const headers = ["idEst","Documento","Nombre","N1","N2","N3","N4","Prom"];
    const rows = state.rows.map(r => [
      r.idEst, r.documento, r.nombre,
      format1(r.n1), format1(r.n2), format1(r.n3), format1(r.n4),
      format1(r.prom)
    ]);
    const data = [headers.join(","), ...rows.map(r=>r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([data],{type:"text/csv"}));
    a.download = "notas.csv";
    a.click();
  }

  function showStatus(msg, type="info") {
    netStatus.className = `alert alert-${type}`;
    netStatus.textContent = msg;
    netStatus.classList.remove("d-none");
    setTimeout(() => netStatus.classList.add("d-none"), 2800);

  }



// Cuando se cambie la asignatura, volvemos a cargar notas de MockAPI
asignaturaSel.addEventListener("change", () => {
  load();
});
periodoSel.addEventListener("change", () => {
  load();
});
anioInput.addEventListener("change", () => {
  load();
});









// Aquí va el código del botón limpiar 👇
document.getElementById("clearBtn").addEventListener("click", async () => {
  state.rows.forEach(r => {
    r.n1 = "";
    r.n2 = "";
    r.n3 = "";
    r.n4 = "";
    r.prom = 0;
  });

  renderRows();
  showStatus("Notas limpiadas en pantalla ✅", "info");

  for (const r of state.rows) {
    await upsert(r);
  }

  showStatus("Notas eliminadas en MockAPI ✅", "success");
});

// Aquí está el init 👇👇👇


  (function init() {
    const u = JSON.parse(localStorage.getItem("evalix_user")||"{}");
    if (u.email) userEmailSpan.textContent = u.email;
    load();
  })();
})();

document.getElementById("logoutBtn").addEventListener("click", () => {
  const confirmar = confirm("¿Seguro que deseas cerrar sesión.?");
  
  if (confirmar) {
    window.location.href = "index.html";
  }
});
