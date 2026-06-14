/* ============================================================
   infeos® — KI-Verlustrechner
   Cost-of-inaction model + live preview + lead gate + PDF
   ============================================================ */
(function () {
  'use strict';

  /* ----- CONFIG ----- */
  // Web3Forms Access-Key — zentral in index.html (window.WEB3FORMS_KEY) gesetzt.
  // Solange der Platzhalter steht, wird das PDF erzeugt & heruntergeladen, aber keine
  // E-Mail-Benachrichtigung verschickt.
  const WEB3FORMS_KEY = window.WEB3FORMS_KEY || 'REPLACE-WITH-INFEOS-WEB3FORMS-KEY';

  const WEEKS = 4.33;                 // Wochen pro Monat
  const WORK_HOURS_PER_YEAR = 1700;   // produktive Stunden / Jahr
  const REALISIERUNG = 0.70;          // konservativer Realisierungsgrad mit infeos

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtInt = (n) => new Intl.NumberFormat('de-DE').format(Math.round(n));
  const fmtDec = (n) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(n);
  const $ = (id) => document.getElementById(id);

  /* ----- Field display config ----- */
  const FIELDS = {
    mitarbeiter:    { suffix: '' },
    kosten:         { suffix: ' €' },
    routineMA:      { suffix: '' },
    routineStd:     { suffix: ' h', dec: true },
    autoRoutine:    { suffix: ' %' },
    dataStd:        { suffix: ' h' },
    autoData:       { suffix: ' %' },
    anfragen:       { suffix: '' },
    minProAnfrage:  { suffix: ' min' },
    standardAnteil: { suffix: ' %' },
    fehlerStd:      { suffix: ' h' },
    leads:          { suffix: '' },
    dealWert:       { suffix: ' €' },
    verloren:       { suffix: ' %' },
  };
  const KEYS = Object.keys(FIELDS);

  /* ----- Branche presets ----- */
  const BRANCHE = {
    dienstleistung: { kosten: 58, routineMA: 12, routineStd: 13, autoRoutine: 50, dataStd: 30, autoData: 65, anfragen: 350, minProAnfrage: 10, standardAnteil: 55, fehlerStd: 9, leads: 80, dealWert: 2500, verloren: 10 },
    produktion:     { kosten: 56, routineMA: 18, routineStd: 11, autoRoutine: 45, dataStd: 35, autoData: 55, anfragen: 250, minProAnfrage: 8, standardAnteil: 45, fehlerStd: 14, leads: 40, dealWert: 6000, verloren: 7 },
    handel:         { kosten: 48, routineMA: 14, routineStd: 12, autoRoutine: 50, dataStd: 30, autoData: 65, anfragen: 1200, minProAnfrage: 6, standardAnteil: 65, fehlerStd: 8, leads: 200, dealWert: 350, verloren: 12 },
    handwerk:       { kosten: 52, routineMA: 6, routineStd: 10, autoRoutine: 40, dataStd: 18, autoData: 55, anfragen: 180, minProAnfrage: 7, standardAnteil: 50, fehlerStd: 7, leads: 60, dealWert: 3500, verloren: 14 },
    tourismus:      { kosten: 44, routineMA: 16, routineStd: 12, autoRoutine: 45, dataStd: 28, autoData: 60, anfragen: 900, minProAnfrage: 7, standardAnteil: 60, fehlerStd: 8, leads: 300, dealWert: 600, verloren: 12 },
    gesundheit:     { kosten: 50, routineMA: 14, routineStd: 14, autoRoutine: 45, dataStd: 40, autoData: 55, anfragen: 600, minProAnfrage: 9, standardAnteil: 50, fehlerStd: 10, leads: 90, dealWert: 400, verloren: 8 },
    sonstige:       {},
  };
  const BRANCHE_LABEL = {
    dienstleistung: 'Dienstleistung & Beratung', produktion: 'Produktion & Industrie',
    handel: 'Handel & E-Commerce', handwerk: 'Bau & Handwerk', tourismus: 'Tourismus & Hotellerie',
    gesundheit: 'Gesundheit & Pflege', sonstige: 'Sonstige',
  };

  /* ----- Read inputs ----- */
  function readInputs() {
    const I = {};
    KEYS.forEach((k) => { I[k] = parseFloat($(k).value) || 0; });
    I.branche = $('branche').value;
    return I;
  }

  /* ----- The model ----- */
  function compute(I) {
    const manual  = I.routineMA * I.routineStd * WEEKS * I.kosten * (I.autoRoutine / 100);
    const data    = I.dataStd * WEEKS * I.kosten * (I.autoData / 100);
    const service = I.anfragen * (I.minProAnfrage / 60) * I.kosten * (I.standardAnteil / 100);
    const fehler  = I.fehlerStd * WEEKS * I.kosten;
    const chancen = I.leads * I.dealWert * (I.verloren / 100);

    const month = manual + data + service + fehler + chancen;
    const labor = manual + data + service + fehler;
    const saveMonth = month * REALISIERUNG;
    const fteMonthlyCost = (WORK_HOURS_PER_YEAR / 12) * I.kosten || 1;
    const fte = (labor * REALISIERUNG) / fteMonthlyCost;

    return {
      manual, data, service, fehler, chancen,
      month, year: month * 12,
      saveMonth, saveYear: saveMonth * 12,
      fte,
      lines: [
        { label: 'Manuelle &amp; repetitive Routinearbeit', small: `${fmtInt(I.routineMA)} MA × ${fmtDec(I.routineStd)} h × 4,33 Wo × ${fmtInt(I.kosten)} € × ${fmtInt(I.autoRoutine)} %`, value: manual },
        { label: 'Datenpflege, Dokumente &amp; Suche', small: `${fmtInt(I.dataStd)} h × 4,33 Wo × ${fmtInt(I.kosten)} € × ${fmtInt(I.autoData)} %`, value: data },
        { label: 'Kundenservice — Standardanfragen', small: `${fmtInt(I.anfragen)} Anfr. × ${fmtInt(I.minProAnfrage)} min × ${fmtInt(I.kosten)} € × ${fmtInt(I.standardAnteil)} %`, value: service },
        { label: 'Fehler &amp; Nacharbeit', small: `${fmtInt(I.fehlerStd)} h × 4,33 Wo × ${fmtInt(I.kosten)} €`, value: fehler },
        { label: 'Entgangene Aufträge (Reaktionszeit)', small: `${fmtInt(I.leads)} Leads × ${fmtInt(I.dealWert)} € × ${fmtInt(I.verloren)} %`, value: chancen },
      ],
    };
  }

  /* ----- Slider visuals + value labels ----- */
  function paintField(k) {
    const el = $(k);
    if (!el || el.type !== 'range') return;
    const min = parseFloat(el.min), max = parseFloat(el.max), val = parseFloat(el.value);
    const pct = ((val - min) / (max - min)) * 100;
    el.style.setProperty('--pct', pct + '%');
    const out = $('v_' + k);
    if (out) {
      const cfg = FIELDS[k];
      out.textContent = (cfg.dec ? fmtDec(val) : fmtInt(val)) + cfg.suffix;
    }
  }

  /* ----- Live preview ----- */
  function livePreview() {
    const r = compute(readInputs());
    $('lpMonth').textContent = fmtInt(r.month);
    $('lpYear').textContent = '€ ' + fmtInt(r.year);
  }

  function updateAll() {
    KEYS.forEach(paintField);
    livePreview();
  }

  /* ----- Animate ----- */
  function animateValue(el, to, dur) {
    if (!el) return;
    if (reduceMotion) { el.textContent = fmtInt(to); return; }
    const start = performance.now();
    (function tick(now) {
      const p = Math.min((now - start) / (dur || 1300), 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmtInt(to * e);
      if (p < 1) requestAnimationFrame(tick);
    })(performance.now());
  }

  /* ----- State of last result ----- */
  let LAST = null;

  /* ----- Render results ----- */
  function renderResults(r) {
    animateValue($('r_month'), r.month, 1300);
    animateValue($('r_year'), r.year, 1500);
    animateValue($('r_save'), r.saveYear, 1500);
    animateValue($('r_saveMonth'), r.saveMonth, 1300);
    $('r_fte').textContent = fmtDec(r.fte);

    // breakdown lines
    const maxVal = Math.max(...r.lines.map((l) => l.value), 1);
    $('loss_lines').innerHTML = r.lines.map((l) => `
      <div class="bd-line">
        <div class="bd-line__label">${l.label}<small>${l.small}</small></div>
        <div class="bd-bar"><span data-w="${Math.max(2, (l.value / maxVal) * 100)}"></span></div>
        <div class="bd-line__val">€ ${fmtInt(l.value)}</div>
      </div>`).join('');
    $('sum_loss').textContent = fmtInt(r.month);
    $('sum_save').textContent = fmtInt(r.saveMonth);
    $('val_save').textContent = fmtInt(r.saveMonth);

    // animate bars after paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('#loss_lines .bd-bar span').forEach((s) => { s.style.width = s.dataset.w + '%'; });
        const bs = $('bar_save'); if (bs) bs.style.width = '100%';
      }, 120);
    });
  }

  /* ----- Calculate flow ----- */
  function doCalculate() {
    const I = readInputs();
    const r = compute(I);
    LAST = { I, r };

    const form = $('calcForm');
    const loader = $('loader');
    const results = $('results');
    const steps = ['Analysiere deine Prozesse …', 'Bewerte Automatisierungs-Potenzial …', 'Rechne Verluste &amp; Einsparung …'];
    let si = 0;
    form.style.display = 'none';
    loader.classList.add('show');
    $('loaderText').innerHTML = steps[0];
    const iv = setInterval(() => { si++; if (steps[si]) $('loaderText').innerHTML = steps[si]; }, 520);

    setTimeout(() => {
      clearInterval(iv);
      loader.classList.remove('show');
      results.classList.add('show');
      renderResults(r);
      results.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }, reduceMotion ? 200 : 1650);
  }

  function backToForm() {
    $('results').classList.remove('show');
    $('calcForm').style.display = 'flex';
    document.querySelector('.live-bar').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ----- Lead validation ----- */
  function validateLead() {
    let ok = true;
    const req = [['l_vorname', 'e_vorname'], ['l_nachname', 'e_nachname'], ['l_firma', 'e_firma']];
    req.forEach(([f, e]) => {
      const val = $(f).value.trim();
      const bad = !val;
      $(f).classList.toggle('error', bad);
      $(e).classList.toggle('show', bad);
      if (bad) ok = false;
    });
    const email = $('l_email').value.trim();
    const emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    $('l_email').classList.toggle('error', emailBad);
    $('e_email').classList.toggle('show', emailBad);
    if (emailBad) ok = false;

    const consent = $('l_consent').checked;
    $('e_consent').classList.toggle('show', !consent);
    if (!consent) ok = false;
    return ok;
  }

  function getContact() {
    return {
      vorname: $('l_vorname').value.trim(),
      nachname: $('l_nachname').value.trim(),
      firma: $('l_firma').value.trim(),
      email: $('l_email').value.trim(),
      telefon: $('l_telefon').value.trim(),
      position: $('l_position').value,
    };
  }

  /* ----- PDF ----- */
  function buildPDF(contact, I, r) {
    if (!(window.jspdf && window.jspdf.jsPDF)) return false;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const M = 48;
    const teal = [22, 188, 196], magenta = [224, 36, 154], navy = [12, 25, 55], ink = [30, 41, 66], grey = [120, 134, 168];

    // Header band
    doc.setFillColor(navy[0], navy[1], navy[2]); doc.rect(0, 0, W, 92, 'F');
    doc.setFillColor(teal[0], teal[1], teal[2]); doc.rect(0, 92, W, 4, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text('infeos', M, 46);
    doc.setTextColor(teal[0], teal[1], teal[2]); doc.setFontSize(9); doc.text('®', M + 58, 38);
    doc.setTextColor(180, 195, 225); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text('ideen in software · KI optimal nutzen', M, 62);
    doc.setTextColor(200, 210, 235); doc.setFontSize(9);
    doc.text('KI-Potenzial-Auswertung', W - M, 46, { align: 'right' });
    doc.text(new Date().toLocaleDateString('de-DE'), W - M, 62, { align: 'right' });

    let y = 130;
    doc.setTextColor(ink[0], ink[1], ink[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(19);
    doc.text('Was dich fehlende KI kostet', M, y);
    y += 22; doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text(`Erstellt für: ${contact.firma}  ·  ${contact.vorname} ${contact.nachname}  ·  Branche: ${BRANCHE_LABEL[I.branche] || I.branche}`, M, y);

    // Hero numbers
    y += 28;
    const cardW = (W - M * 2 - 24) / 3;
    const cards = [
      ['Verlust / Monat', '€ ' + fmtInt(r.month), magenta],
      ['Verlust / Jahr', '€ ' + fmtInt(r.year), magenta],
      ['Realisierbar / Jahr', '€ ' + fmtInt(r.saveYear), teal],
    ];
    cards.forEach((c, i) => {
      const x = M + i * (cardW + 12);
      doc.setFillColor(247, 249, 253); doc.roundedRect(x, y, cardW, 70, 8, 8, 'F');
      doc.setTextColor(grey[0], grey[1], grey[2]); doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
      doc.text(c[0].toUpperCase(), x + 14, y + 22);
      doc.setTextColor(c[2][0], c[2][1], c[2][2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(17);
      doc.text(c[1], x + 14, y + 48);
    });

    // Breakdown table
    y += 100;
    doc.setTextColor(ink[0], ink[1], ink[2]); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Aufschlüsselung der monatlichen Verluste', M, y);
    y += 14;
    doc.setDrawColor(225, 230, 240); doc.line(M, y, W - M, y); y += 6;
    doc.setFontSize(10);
    r.lines.forEach((l) => {
      y += 20;
      doc.setFont('helvetica', 'normal'); doc.setTextColor(ink[0], ink[1], ink[2]);
      doc.text(l.label.replace(/&amp;/g, '&'), M, y);
      doc.setFont('helvetica', 'bold');
      doc.text('€ ' + fmtInt(l.value), W - M, y, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.setTextColor(grey[0], grey[1], grey[2]); doc.setFontSize(8);
      doc.text(l.small.replace(/&amp;/g, '&'), M, y + 11);
      doc.setFontSize(10);
      doc.setDrawColor(238, 241, 248); doc.line(M, y + 18, W - M, y + 18);
    });
    y += 34;
    doc.setFillColor(235, 250, 250); doc.roundedRect(M, y, W - M * 2, 40, 8, 8, 'F');
    doc.setTextColor(14, 142, 149); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Realisierbar mit infeos (konservativ ~70 %)', M + 14, y + 25);
    doc.text('€ ' + fmtInt(r.saveMonth) + ' / Monat', W - M - 14, y + 25, { align: 'right' });

    // Methodology
    y += 64;
    doc.setTextColor(grey[0], grey[1], grey[2]); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const method = 'So rechnen wir: Zeitposten = Personen x Stunden x 4,33 Wochen x Vollkostensatz, gewichtet mit dem konservativen Automatisierungsgrad. Entgangene Auftraege = Leads x OE-Auftragswert x Verlust-Anteil. Realisierbar = 70% der adressierbaren Verluste (Ramp-up & Change eingerechnet). Annahme: 1.700 produktive Stunden/Jahr. Zahlen, Daten, Fakten - kein Bauchgefuehl.';
    doc.text(doc.splitTextToSize(method, W - M * 2), M, y);

    // Footer CTA
    const fy = doc.internal.pageSize.getHeight() - 70;
    doc.setFillColor(navy[0], navy[1], navy[2]); doc.rect(0, fy, W, 70, 'F');
    doc.setFillColor(teal[0], teal[1], teal[2]); doc.rect(0, fy, W, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Lass uns deinen groessten Hebel in einen Plan verwandeln.', M, fy + 28);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(190, 205, 235);
    doc.text('infeos GmbH · Mustergasse 22 · 39100 Bozen, Suedtirol · +39 327 3220377 · fakturo@infeos.eu', M, fy + 46);

    const safe = (contact.firma || 'infeos').replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
    doc.save(`infeos-KI-Auswertung-${safe}.pdf`);
    return true;
  }

  /* ----- Web3Forms ----- */
  async function sendLead(contact, I, r) {
    if (!WEB3FORMS_KEY || WEB3FORMS_KEY.indexOf('REPLACE') === 0) return 'no-key';
    const msg = [
      'Neuer Lead aus dem KI-Verlustrechner', '',
      '--- KONTAKT ---',
      `Name: ${contact.vorname} ${contact.nachname}`,
      `Firma: ${contact.firma}`,
      `E-Mail: ${contact.email}`,
      `Telefon: ${contact.telefon || '—'}`,
      `Position: ${contact.position || '—'}`,
      `Branche: ${BRANCHE_LABEL[I.branche] || I.branche}`, '',
      '--- ERGEBNIS ---',
      `Verlust/Monat:        € ${fmtInt(r.month)}`,
      `Verlust/Jahr:         € ${fmtInt(r.year)}`,
      `Realisierbar/Jahr:    € ${fmtInt(r.saveYear)}`, '',
      '--- POSTEN/MONAT ---',
      ...r.lines.map((l) => `${l.label.replace(/&amp;/g, '&')}: € ${fmtInt(l.value)}`), '',
      '--- EINGABEN ---',
      `Mitarbeiter: ${I.mitarbeiter} · Stundenkosten: ${I.kosten} €`,
      `Routine: ${I.routineMA} MA × ${I.routineStd} h, autom. ${I.autoRoutine}%`,
      `Daten: ${I.dataStd} h/Wo, autom. ${I.autoData}%`,
      `Service: ${I.anfragen} Anfr. × ${I.minProAnfrage} min, Standard ${I.standardAnteil}%`,
      `Fehler: ${I.fehlerStd} h/Wo`,
      `Chancen: ${I.leads} Leads × ${I.dealWert} €, verloren ${I.verloren}%`,
    ].join('\n');

    const fd = new FormData();
    fd.append('access_key', WEB3FORMS_KEY);
    fd.append('subject', `[KI-Rechner] ${contact.firma} — € ${fmtInt(r.month)}/Monat Verlust`);
    fd.append('from_name', 'infeos · KI-Verlustrechner');
    fd.append('name', `${contact.vorname} ${contact.nachname}`);
    fd.append('email', contact.email);
    fd.append('telefon', contact.telefon);
    fd.append('firma', contact.firma);
    fd.append('verlust_monat', String(Math.round(r.month)));
    fd.append('message', msg);
    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
      const j = await res.json().catch(() => ({}));
      return (res.ok && j.success !== false) ? 'ok' : 'fail';
    } catch (e) { return 'fail'; }
  }

  /* ----- Submit lead ----- */
  async function submitLead() {
    if (!LAST) return;
    if (!validateLead()) {
      const firstErr = document.querySelector('.lead-field .error');
      if (firstErr) firstErr.focus();
      return;
    }
    const btn = $('leadBtn');
    btn.disabled = true; btn.style.opacity = '.7';
    const original = btn.innerHTML; btn.textContent = 'Erstelle PDF …';

    const contact = getContact();
    const { I, r } = LAST;

    const pdfOk = buildPDF(contact, I, r);
    const sent = await sendLead(contact, I, r);

    // Reveal success + unlock breakdown
    $('leadFormView').style.display = 'none';
    $('leadSuccess').classList.add('show');
    $('breakdownWrap').classList.remove('locked');
    // re-trigger bar widths now that they are visible
    requestAnimationFrame(() => setTimeout(() => {
      document.querySelectorAll('#loss_lines .bd-bar span').forEach((s) => { s.style.width = s.dataset.w + '%'; });
      const bs = $('bar_save'); if (bs) bs.style.width = '100%';
    }, 80));

    const note = $('leadSuccessNote');
    if (!pdfOk) note.textContent = 'Hinweis: PDF-Bibliothek nicht geladen — bitte Verbindung prüfen.';
    else if (sent === 'no-key') note.textContent = '(Demo: Web3Forms-Key noch nicht hinterlegt — PDF wurde lokal erstellt.)';
    else if (sent === 'fail') note.textContent = '(E-Mail-Versand aktuell nicht erreichbar — dein PDF wurde aber erstellt.)';
    else note.textContent = '';

    btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = original;
    $('leadCard').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  }

  /* ----- Wire up ----- */
  function init() {
    const yearEl = $('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

    KEYS.forEach((k) => {
      const el = $(k);
      if (el) el.addEventListener('input', () => { paintField(k); livePreview(); });
    });

    $('branche').addEventListener('change', (e) => {
      const preset = BRANCHE[e.target.value] || {};
      Object.entries(preset).forEach(([k, v]) => { if ($(k)) $(k).value = v; });
      updateAll();
    });

    $('calcBtn').addEventListener('click', doCalculate);
    $('recalcBtn').addEventListener('click', backToForm);
    $('leadBtn').addEventListener('click', submitLead);
    $('unlockScroll').addEventListener('click', () => $('leadCard').scrollIntoView({ behavior: 'smooth', block: 'center' }));

    // clear error on input
    ['l_vorname', 'l_nachname', 'l_firma', 'l_email'].forEach((id) => {
      $(id).addEventListener('input', () => { $(id).classList.remove('error'); const e = $('e_' + id.slice(2)); if (e) e.classList.remove('show'); });
    });
    $('l_consent').addEventListener('change', () => $('e_consent').classList.remove('show'));

    updateAll();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
