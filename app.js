(function () {
  "use strict";
  var C = window.CONFIG, D = window.DATA;
  var $ = function (s) { return document.querySelector(s); };
  var PALETTE = ["#2f81f7", "#2da44e", "#d97706", "#a371f7", "#db61a2", "#1b9aaa"];
  var fmt = function (n, d) {
    return Number(n).toLocaleString("id-ID", { maximumFractionDigits: d == null ? 2 : d });
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* ---------- Statistik ---------- */
  function sortedCopy(a) { return a.slice().sort(function (x, y) { return x - y; }); }
  function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  // Persentil interpolasi linear (posisi = 1 + (n-1)p), sama dengan PERCENTILE.INC
  function pct(a, p) {
    var s = sortedCopy(a), pos = (s.length - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos);
    return s[lo] + (s[hi] - s[lo]) * (pos - lo);
  }
  function sd(a) {
    if (a.length < 2) return 0;
    var m = mean(a);
    return Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / (a.length - 1));
  }
  function modus(a) {
    var c = {}, best = 0;
    a.forEach(function (x) { c[x] = (c[x] || 0) + 1; best = Math.max(best, c[x]); });
    if (best < 2) return null;
    return Object.keys(c).filter(function (k) { return c[k] === best; }).map(Number);
  }
  function stats(a) {
    return {
      n: a.length, total: a.reduce(function (s, x) { return s + x; }, 0), mean: mean(a), median: pct(a, .5),
      q1: pct(a, .25), q3: pct(a, .75), sd: sd(a), min: Math.min.apply(null, a), max: Math.max.apply(null, a),
      modus: modus(a)
    };
  }

  /* ---------- State ---------- */
  var groups = [], cats = [];
  D.forEach(function (r) {
    if (groups.indexOf(r.kelompok) < 0) groups.push(r.kelompok);
    if (cats.indexOf(r.kategori) < 0) cats.push(r.kategori);
  });
  var colorOf = {};
  groups.forEach(function (g, i) { colorOf[g] = PALETTE[i % PALETTE.length]; });
  var state = { filter: null, q: "", sortKey: null, sortDir: "asc", page: 1, pageSize: 6 };
  var charts = {};

  function activeGroups() { return state.filter ? [state.filter] : groups; }
  function valuesOf(g) { return D.filter(function (r) { return r.kelompok === g; }).map(function (r) { return r.nilai; }); }

  /* ---------- Teks statis dari CONFIG ---------- */
  document.title = C.judul;
  $("#breadcrumb").textContent = C.breadcrumb || "DATALAB";
  $("#mk").textContent = C.mataKuliah || "";
  $("#judul").textContent = C.judul;
  $("#penulis").innerHTML = (C.penulis || []).map(esc).join("<br>");
  $("#temuan").innerHTML = (C.temuan || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  $("#kesimpulanList").innerHTML = (C.kesimpulan || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  $("#cap1").textContent = C.labelNilai + " per " + C.labelKategori.toLowerCase() + " (" + C.satuan + ")";
  $("#logNote").textContent = C.skalaLog ? (C.catatanSkalaLog || "Sumbu y memakai skala logaritmik.") : "";
  $("#thKategori").textContent = C.labelKategori;
  $("#thKelompok").textContent = C.labelKelompok;
  $("#thNilai").textContent = C.labelNilai + " (" + C.satuan + ")";

  (function renderSumber() {
    var s = C.sumber || {}, rows = [];
    function add(k, v) { if (v) rows.push("<dt>" + k + "</dt><dd>" + v + "</dd>"); }
    add("Judul artikel", esc(s.judul || ""));
    add("Penulis", esc(s.penulis || ""));
    add("Jurnal", esc(s.jurnal || ""));
    add("Data diambil dari", esc(s.tabel || ""));
    add("Deskripsi", esc(s.deskripsi || ""));
    if (s.link) add("Tautan", '<a href="' + esc(s.link) + '" target="_blank" rel="noopener">' + esc(s.link) + "</a>");
    $("#sumberDl").innerHTML = rows.join("");
    $("#catatan").innerHTML = (s.catatan || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
  })();

  /* ---------- Chips filter ---------- */
  function renderChips() {
    var html = '<button type="button" class="chip" data-g="" aria-pressed="' + (!state.filter) + '">Semua</button>';
    groups.forEach(function (g) {
      html += '<button type="button" class="chip" data-g="' + esc(g) + '" aria-pressed="' + (state.filter === g) +
        '"><i style="background:' + colorOf[g] + '"></i>' + esc(g) + "</button>";
    });
    $("#chips").innerHTML = html;
    $("#selKelompok").innerHTML = '<option value="">Semua ' + esc(C.labelKelompok) + "</option>" +
      groups.map(function (g) { return '<option value="' + esc(g) + '"' + (state.filter === g ? " selected" : "") + ">" + esc(g) + "</option>"; }).join("");
    $("#filterInfo").textContent = state.filter ? "Filter aktif: " + state.filter : "Semua " + C.labelKelompok;
    $("#btnClear").hidden = !state.filter;
  }
  $("#chips").addEventListener("click", function (e) {
    var b = e.target.closest(".chip"); if (!b) return;
    setFilter(b.getAttribute("data-g") || null);
  });
  $("#selKelompok").addEventListener("change", function (e) { setFilter(e.target.value || null); });
  $("#btnClear").addEventListener("click", function () { setFilter(null); });
  function setFilter(g) { state.filter = g; state.page = 1; renderAll(); }

  /* ---------- KPI dan tabel statistik ---------- */
  function renderKpis() {
    $("#kpis").innerHTML = activeGroups().map(function (g) {
      var s = stats(valuesOf(g));
      return '<div class="kpi" style="border-left-color:' + colorOf[g] + '"><div class="k">' + esc(g) + '</div>' +
        '<div class="v">' + fmt(s.total, 0) + " " + esc(C.satuan) + '</div>' +
        '<div class="s">total · rata-rata ' + fmt(s.mean) + " · n = " + s.n + "</div></div>";
    }).join("");
  }
  function renderStatTable() {
    var gs = activeGroups(), st = {};
    gs.forEach(function (g) { st[g] = stats(valuesOf(g)); });
    var P = function (p) { return function (g) { return pct(valuesOf(g), p); }; };
    var rows = [
      ["Jumlah data (n)", function (g) { return st[g].n; }, 0],
      ["Total", function (g) { return st[g].total; }, 2],
      ["Mean", function (g) { return st[g].mean; }, 2],
      ["Median (Q2 = D5 = P50)", function (g) { return st[g].median; }, 2],
      ["Modus", function (g) { return st[g].modus ? st[g].modus.map(function (x) { return fmt(x); }).join(", ") : "tidak ada"; }, null],
      ["Minimum", function (g) { return st[g].min; }, 2],
      ["Maksimum", function (g) { return st[g].max; }, 2],
      ["Kuartil 1 (Q1 = P25)", function (g) { return st[g].q1; }, 2],
      ["Kuartil 3 (Q3 = P75)", function (g) { return st[g].q3; }, 2],
      ["Rentang antarkuartil (Q3 − Q1)", function (g) { return st[g].q3 - st[g].q1; }, 2],
      ["Simpangan baku (s)", function (g) { return st[g].sd; }, 2],
      ["Desil 1 (D1 = P10)", P(.1), 2],
      ["Desil 9 (D9 = P90)", P(.9), 2],
      ["Persentil 95 (P95)", P(.95), 2]
    ];
    var h = "<thead><tr><th>Ukuran</th>" + gs.map(function (g) { return '<th class="num">' + esc(g) + "</th>"; }).join("") + "</tr></thead><tbody>";
    rows.forEach(function (r) {
      h += "<tr><td>" + r[0] + "</td>" + gs.map(function (g) {
        var v = r[1](g);
        return '<td class="num">' + (r[2] === null ? esc(v) : fmt(v, r[2])) + "</td>";
      }).join("") + "</tr>";
    });
    $("#statTable").innerHTML = h + "</tbody>";
  }

  /* ---------- Grafik ---------- */
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function logMin() {
    var lo = Math.min.apply(null, D.map(function (r) { return r.nilai; }));
    return Math.pow(10, Math.floor(Math.log10(Math.max(lo, 1))));
  }
  function renderCharts() {
    var text = css("--text"), muted = css("--muted"), grid = css("--grid"), gs = activeGroups();
    Chart.defaults.font.family = "system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif";
    Chart.defaults.color = muted;
    function axes(titleY, log) {
      return {
        x: { grid: { display: false }, ticks: { color: muted } },
        y: { type: log ? "logarithmic" : "linear", beginAtZero: !log, min: log ? logMin() : undefined, grid: { color: grid },
             ticks: { color: muted, callback: function (v) {
               if (log) { var m = v / Math.pow(10, Math.floor(Math.log10(v))); if (m !== 1 && m !== 2 && m !== 5) return ""; }
               return fmt(v, 0); } },
             title: { display: true, text: titleY, color: muted } }
      };
    }
    var tip = { callbacks: { label: function (c) { return c.dataset.label + ": " + fmt(c.parsed.y) + " " + C.satuan; } } };
    var legend = { position: "bottom", labels: { color: text, boxWidth: 12 } };

    if (charts.c1) charts.c1.destroy();
    charts.c1 = new Chart($("#ch1"), {
      type: "bar",
      data: {
        labels: cats,
        datasets: gs.map(function (g) {
          return { label: g, backgroundColor: colorOf[g], borderRadius: 3,
            data: cats.map(function (c) {
              var r = D.filter(function (x) { return x.kelompok === g && x.kategori === c; })[0];
              return r ? r.nilai : null;
            }) };
        })
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legend, tooltip: tip }, scales: axes(C.labelNilai + " (" + C.satuan + ")", !!C.skalaLog) }
    });

    if (charts.c2) charts.c2.destroy();
    var st = gs.map(function (g) { return stats(valuesOf(g)); });
    charts.c2 = new Chart($("#ch2"), {
      type: "bar",
      data: {
        labels: gs,
        datasets: [
          { label: "Mean", backgroundColor: css("--accent"), borderRadius: 3, data: st.map(function (s) { return s.mean; }) },
          { label: "Median", backgroundColor: "#8b949e", borderRadius: 3, data: st.map(function (s) { return s.median; }) }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: legend, tooltip: tip }, scales: axes(C.labelNilai + " (" + C.satuan + ")", false) }
    });
  }

  /* ---------- Tabel data mentah ---------- */
  function filteredRows() {
    var q = state.q.trim().toLowerCase();
    var rows = D.filter(function (r) {
      return (!state.filter || r.kelompok === state.filter) &&
        (!q || (r.kategori + " " + r.kelompok + " " + r.nilai).toLowerCase().indexOf(q) >= 0);
    });
    if (state.sortKey) {
      var k = state.sortKey, dir = state.sortDir === "asc" ? 1 : -1;
      rows = rows.slice().sort(function (a, b) {
        return (typeof a[k] === "number" ? a[k] - b[k] : String(a[k]).localeCompare(String(b[k]), "id")) * dir;
      });
    }
    return rows;
  }
  function renderTable() {
    var rows = filteredRows(), pages = Math.max(1, Math.ceil(rows.length / state.pageSize));
    if (state.page > pages) state.page = pages;
    var slice = rows.slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
    $("#rawBody").innerHTML = slice.length ? slice.map(function (r) {
      return "<tr><td>" + esc(r.kategori) + "</td><td>" + esc(r.kelompok) + '</td><td class="num">' + fmt(r.nilai) + "</td></tr>";
    }).join("") : '<tr><td colspan="3" class="muted">Tidak ada data yang cocok.</td></tr>';
    $("#rowCount").textContent = rows.length + " dari " + D.length + " baris";
    $("#pageInfo").textContent = "Halaman " + state.page + " dari " + pages;
    $("#prev").disabled = state.page <= 1;
    $("#next").disabled = state.page >= pages;
    document.querySelectorAll(".sort").forEach(function (b) {
      b.setAttribute("data-dir", b.getAttribute("data-key") === state.sortKey ? state.sortDir : "");
    });
  }
  $("#q").addEventListener("input", function (e) { state.q = e.target.value; state.page = 1; renderTable(); });
  $("#prev").addEventListener("click", function () { state.page--; renderTable(); });
  $("#next").addEventListener("click", function () { state.page++; renderTable(); });
  document.querySelectorAll(".sort").forEach(function (b) {
    b.addEventListener("click", function () {
      var k = b.getAttribute("data-key");
      state.sortDir = state.sortKey === k && state.sortDir === "asc" ? "desc" : "asc";
      state.sortKey = k; state.page = 1; renderTable();
    });
  });

  /* ---------- Tombol atas ---------- */
  $("#btnCsv").addEventListener("click", function () {
    var rows = filteredRows();
    var csv = "﻿" + [C.labelKategori, C.labelKelompok, C.labelNilai + " (" + C.satuan + ")"].map(q).join(",") + "\n" +
      rows.map(function (r) { return [q(r.kategori), q(r.kelompok), r.nilai].join(","); }).join("\n");
    function q(s) { return '"' + String(s).replace(/"/g, '""') + '"'; }
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = "data.csv"; document.body.appendChild(a); a.click(); a.remove();
  });
  $("#btnPrint").addEventListener("click", function () { window.print(); });
  window.addEventListener("beforeprint", function () { renderCharts(); });

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("#btnTheme").textContent = t === "light" ? "Mode gelap" : "Mode terang";
    try { localStorage.setItem("theme", t); } catch (e) {}
  }
  $("#btnTheme").addEventListener("click", function () {
    applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
    renderCharts();
  });
  var saved = null; try { saved = localStorage.getItem("theme"); } catch (e) {}
  applyTheme(saved === "light" ? "light" : "dark");

  function renderAll() { renderChips(); renderKpis(); renderStatTable(); renderCharts(); renderTable(); }
  renderAll();

  window.__stats = { stats: stats, pct: pct, valuesOf: valuesOf, groups: groups };
})();
