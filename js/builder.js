/*
  Shows the prompt sheet one section per screen, with Back and Next.
  Wording comes from questions.js; answers and labels live in sheet.js.
*/
(function () {
  var Q = FAC_QUESTIONS, S = FACSheet;
  var $ = function (id) { return document.getElementById(id); };
  var state = S.load(Q);
  var screen = $("screen");

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function idOf(path) { return "f-" + path.replace(/\./g, "-"); }
  function save() { S.save(state); }

  // ---------- Building the screens ----------

  function labelBox(path) {
    var id = idOf(path), L = Q.labels;
    var opts = ["known", "estimate", "unsupported"].map(function (k) {
      return '<label><input type="radio" class="lab-radio" name="' + id + '-lab" value="' + k + '" data-path="' + path + '"> ' + esc(L[k].name) + '</label>';
    }).join("");
    return '<div class="lab" id="' + id + '-lab" hidden>' +
      '<span class="lbl">' + esc(Q.labelPrompt) + '</span>' +
      '<div class="choice" role="radiogroup" aria-label="' + esc(Q.labelPrompt) + '">' + opts + '</div>' +
      '<div class="f lab-note-wrap" hidden><label for="' + id + '-note" class="lab-note-label"></label>' +
      '<input type="text" class="lab-note" id="' + id + '-note" data-path="' + path + '"></div>' +
      '<p class="lab-state"></p>' +
      '</div>';
  }

  // Follow-up for a missing or vague answer, plus the flag once it is skipped or kept.
  function followUpBox(path) {
    var id = idOf(path);
    return '<div class="fu" id="' + id + '-fu" aria-live="polite" hidden>' +
      '<p class="fu-q"></p>' +
      '<button type="button" class="btn quiet fu-skip" data-act="skip" data-path="' + path + '" hidden></button>' +
      '<button type="button" class="btn quiet fu-alt" data-act="alt" data-path="' + path + '" hidden></button>' +
      '</div>' +
      '<p class="skipped" id="' + id + '-skipped" hidden></p>';
  }

  function field(q, path) {
    var id = idOf(path);
    var input = q.kind === "long"
      ? '<textarea class="ans" id="' + id + '" data-path="' + path + '"></textarea>'
      : '<input class="ans" id="' + id + '" data-path="' + path + '" type="' + (q.kind === "url" ? "url" : "text") + '"' +
        (q.kind === "zip" ? ' inputmode="numeric" maxlength="10" autocomplete="postal-code"' : "") + '>';
    return '<div class="f">' +
      '<label for="' + id + '">' + esc(q.label) + (q.note ? ' <span class="opt">' + esc(q.note) + '</span>' : "") + (q.required ? '<span class="req">*</span>' : "") + '</label>' +
      (q.help ? '<p class="hint">' + esc(q.help) + '</p>' : "") +
      input + followUpBox(path) + (S.needsLabel(path) ? labelBox(path) : "") +
      '</div>';
  }

  function heading(num, title, note) {
    return '<h2 tabindex="-1"><span class="num">' + esc(num) + '</span>' + esc(title) + (note ? ' <span class="opt">' + esc(note) + '</span>' : "") + '</h2>';
  }

  var N = Q.flow.numbers;

  function orgScreen() {
    var sec = S.section(Q, "org");
    return heading(N.org, sec.title) + sec.questions.map(function (q) { return field(q, "org." + q.id); }).join("");
  }

  // Step 1.4: how the member wants the story written.
  function constraintsScreen() {
    var sec = S.section(Q, "constraints");
    return heading(N.constraints, sec.title, sec.note) + sec.questions.map(function (q) { return field(q, "constraints." + q.id); }).join("");
  }

  // The optional stack rank. Members pick three measures, score each program
  // 1-3 on each, and type the score (the three multiplied). The tool checks
  // the score, sorts by it when asked, and never fills a number in.
  function rankScreen() {
    var R = Q.rank, st = state.rank, n = state.programs.length;
    function radio(v, label) {
      return '<label><input type="radio" class="rank-use" name="rank-use" value="' + v + '"' + (st.use === v ? " checked" : "") + '> ' + esc(label) + '</label>';
    }
    var html = heading(N.program, R.title) +
      '<div class="f"><span class="lbl">' + esc(R.ask) + '</span><div class="choice" role="radiogroup" aria-label="' + esc(R.ask) + '">' +
      radio("yes", R.yes) + radio("no", R.no) + '</div></div>';
    if (st.use === "yes") {
      html += '<div class="f"><span class="lbl">' + esc(R.measuresLabel) + '</span><div class="choice">' +
        R.measures.map(function (m) {
          return '<label><input type="checkbox" class="rank-measure" value="' + m.id + '"' + (st.measures.indexOf(m.id) > -1 ? " checked" : "") + '> ' + esc(m.label) + '</label>';
        }).join("") + '</div></div>';
      var chosen = R.measures.filter(function (m) { return st.measures.indexOf(m.id) > -1; });
      html += '<p class="hint">' + esc(R.scoreHelp) + '</p><div class="rank-table">' +
        state.programs.map(function (p, i) {
          var row = state.rankRows[i];
          return '<div class="rank-row" id="rank-row-' + i + '"><span class="lbl">' + esc(programName(i)) + ': ' + esc(S.trim(p.name.text) || Q.flow.empty) + '</span><div class="rank-cells">' +
            chosen.map(function (m) {
              return '<label>' + esc(m.label) + ' <select class="rank-m" data-row="' + i + '" data-m="' + m.id + '"><option value=""></option>' +
                ["1", "2", "3"].map(function (v) { return '<option' + (row.m[m.id] === v ? " selected" : "") + '>' + v + '</option>'; }).join("") + '</select></label>';
            }).join("") +
            '<label>' + esc(R.scoreLabel) + ' <input type="text" class="rank-score" inputmode="numeric" data-row="' + i + '" value="' + esc(row.score) + '"></label>' +
            (i >= S.included(state) ? ' <span class="opt">(' + esc(R.belowLine) + ')</span>' : "") +
            '</div></div>';
        }).join("") + '</div>' +
        '<div class="actions"><button type="button" class="btn ghost" data-act="rankSort">' + esc(R.sortButton) + '</button></div>' +
        '<div class="f"><label for="rank-line">' + esc(R.lineLabel) + '</label><select id="rank-line" class="rank-line">' +
        state.programs.map(function (p, i) {
          return '<option value="' + (i + 1) + '"' + (S.included(state) === i + 1 ? " selected" : "") + '>' + esc(programName(i) + (S.trim(p.name.text) ? ": " + p.name.text : "")) + '</option>';
        }).join("") + '</select><p class="hint">' + esc(R.lineHelp) + '</p></div>';
    }
    return html + '<p class="fu-q" id="rank-msg" aria-live="polite"></p>';
  }

  // ---------- Step 2 ----------

  var LIVE_FORM = "impact-prompt-draft-v1";
  function liveDraft() { try { return JSON.parse(localStorage.getItem(LIVE_FORM) || "null"); } catch (e) { return null; } }

  // 2.1 The pain statement questions, the types of loss, and the Why Now preview.
  function whyScreen() {
    var W = Q.why, sec = S.section(Q, "why");
    var html = heading(W.number, sec.title, sec.note) + '<p class="hint">' + esc(W.intro) + '</p>' +
      (liveDraft() ? '<div><button type="button" class="btn ghost" data-act="importLive">' + esc(W.importButton) + '</button> <span class="hint" id="why-imported"></span></div>' : "");
    sec.questions.forEach(function (q) {
      html += field(q, "why." + q.id);
      if (q.id === "lost") html += '<div class="f"><span class="lbl">' + esc(W.typesLabel) + '</span><div class="choice">' +
        W.types.map(function (t) {
          return '<label><input type="checkbox" class="why-type" value="' + t.id + '"' + (state.whyTypes.indexOf(t.id) > -1 ? " checked" : "") + '> ' + esc(t.label) + '</label>';
        }).join("") + '</div></div>';
    });
    return html + '<div class="why-preview"><span class="lbl">' + esc(W.previewTitle) + '</span><div id="why-black"></div>' +
      '<p class="why-grey">' + esc(W.investSentence) + ' <span class="hint">' + esc(W.investNote) + '</span></p></div>';
  }
  function refreshWhy() {
    var box = $("why-black");
    if (!box) return;
    box.innerHTML = FACExport.whyNow(Q, state).map(function (s) { return '<p>' + esc(s) + '</p>'; }).join("");
  }

  // 2.2 The Regular and Major donor tables. The member types every amount;
  // FAC's levels are a grey hint only.
  function donorsScreen() {
    var D = Q.donors, C = D.columns;
    var html = heading(D.number, D.title) + '<p class="hint">' + esc(D.intro) + '</p><p class="hint">' + esc(D.tableIntro) + '</p>' +
      '<div class="examples"><span class="ex-tag">Example</span><p>' + esc(D.example) + '</p></div>';
    ["regular", "major"].forEach(function (t) {
      html += '<div class="donor-table"><span class="lbl">' + esc(D[t].title) + '</span>' + (D[t].intro ? '<p class="hint">' + esc(D[t].intro) + '</p>' : "") +
        '<p class="hint">' + esc(D[t].levelsHint) + '</p>' +
        state.donors[t].map(function (r, i) {
          var base = "donors." + t + "." + i + ".";
          return '<div class="donor-row"><div class="item-head"><span class="lbl">' + esc(D.rowLabel) + ' ' + (i + 1) + '</span>' +
            '<button type="button" class="icon-btn" data-act="removeDonorRow" data-table="' + t + '" data-index="' + i + '" aria-label="Remove ' + esc(D.rowLabel.toLowerCase()) + ' ' + (i + 1) + '">×</button></div>' +
            ["amount", "funds", "result", "words"].map(function (k) { return field({ label: C[k], kind: k === "amount" ? "text" : "long" }, base + k); }).join("") +
            '</div>';
        }).join("") +
        '<div><button type="button" class="btn ghost" data-act="addDonorRow" data-table="' + t + '">' + esc(D.addRow) + '</button></div></div>';
    });
    return html;
  }

  // 2.3 The magic wand.
  function wandScreen() {
    var W = Q.wand;
    var names = state.programs.map(function (p) { return S.trim(p.name.text); }).filter(function (t) { return t; });
    return heading(W.number, W.title) + '<p class="hint">' + esc(W.intro) + '</p>' +
      field({ label: W.program, help: W.programHelp, kind: "text" }, "wand.program").replace('id="f-wand-program"', 'id="f-wand-program" list="wand-programs"') +
      '<datalist id="wand-programs">' + names.map(function (t) { return '<option value="' + esc(t) + '">'; }).join("") + '</datalist>' +
      field({ label: W.amount, kind: "text" }, "wand.amount") + field({ label: W.possible, kind: "long" }, "wand.possible");
  }

  // Shows what still stops Next on the stack rank screen, and marks the rows.
  function showRankCheck(c) {
    $("rank-msg").textContent = c.msg ? Q.rank[c.msg] : "";
    Array.prototype.forEach.call(screen.querySelectorAll(".rank-row"), function (r, i) { r.classList.toggle("invalid-row", c.rows.indexOf(i) > -1); });
  }

  // The flowchart's "Happy with...?" checks: a summary with an Edit link for
  // each answer. Next (Yes, continue / Build our story) moves on.
  function checkpointScreen(of) {
    var F = Q.flow, C = F.checkpoints[of], rows = [];
    function row(label, value, path) {
      rows.push('<li><span class="lbl">' + esc(label) + ':</span> ' + esc(S.trim(value) || F.empty) +
        ' <button type="button" class="link" data-act="goto" data-step="' + S.stepOf(state, path) + '" data-focus="' + idOf(path) + '">' + esc(F.editLink) + '</button></li>');
    }
    if (of === "programs") {
      row(S.section(Q, "org").questions.filter(function (q) { return q.id === "keywords"; })[0].label, state.org.keywords.text, "org.keywords");
      state.programs.forEach(function (p, i) {
        row(programName(i), [p.name.text, p.outputs.text].filter(function (t) { return S.trim(t); }).join(" — ") +
          (i >= S.included(state) ? " (" + Q.rank.belowLine + ")" : ""), "programs." + i + ".name");
      });
    } else if (of === "benchmarks") {
      state.benchmarks.forEach(function (b, i) { if (S.trim(b.text)) row(nameOf("benchmarks." + i), b.text, "benchmarks." + i); });
    } else {
      var set = S.section(Q, "constraints").questions.filter(function (q) { return S.trim(state.constraints[q.id].text); });
      set.forEach(function (q) { row(q.label, state.constraints[q.id].text, "constraints." + q.id); });
    }
    var none = !rows.length && C.none
      ? '<p>' + esc(C.none) + ' <button type="button" class="link" data-act="goto" data-step="' + S.stepOf(state, of + (of === "benchmarks" ? ".0" : ".tone")) + '">' + esc(F.editLink) + '</button></p>' : "";
    return heading(N.check, C.title) + '<p>' + esc(C.text) + '</p>' + (rows.length ? '<ul class="checklist">' + rows.join("") + '</ul>' : none);
  }

  function programScreen(i) {
    var sec = S.section(Q, "programs"), n = state.programs.length;
    return heading(N.program, sec.itemLabel + " " + (i + 1) + " of " + n, sec.note) +
      sec.questions.map(function (q) { return field(q, "programs." + i + "." + q.id); }).join("") +
      '<div class="actions">' +
      '<button type="button" class="btn ghost" data-act="addProgram">' + esc(sec.addLabel) + '</button>' +
      (n > 1 ? '<button type="button" class="btn quiet" data-act="removeProgram" data-index="' + i + '">Remove this program</button>' : "") +
      '</div>';
  }

  function listScreen(id, num) {
    var sec = S.section(Q, id);
    var examples = sec.examples.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join("");
    var rows = state[id].map(function (a, i) {
      var path = id + "." + i, fid = idOf(path);
      return '<div class="f item">' +
        '<div class="item-head"><label for="' + fid + '">' + esc(sec.itemLabel) + ' ' + (i + 1) + '</label>' +
        '<button type="button" class="icon-btn" data-act="removeItem" data-list="' + id + '" data-index="' + i + '" aria-label="Remove ' + esc(sec.itemLabel.toLowerCase()) + ' ' + (i + 1) + '">×</button></div>' +
        '<textarea class="ans" id="' + fid + '" data-path="' + path + '"></textarea>' + followUpBox(path) + labelBox(path) +
        (id === "benchmarks" ? benchmarkFields(path, a) : "") +
        '</div>';
    }).join("");
    return heading(num, sec.title, sec.note) +
      (sec.help ? '<p class="hint">' + esc(sec.help) + '</p>' : "") +
      '<div class="examples"><span class="ex-tag">Example</span><ul>' + examples + '</ul></div>' +
      (id === "benchmarks" ? researchExamples() : "") +
      rows +
      '<div><button type="button" class="btn ghost" data-act="addItem" data-list="' + id + '">' + esc(sec.addLabel) + '</button></div>';
  }

  // FAC's research examples, as grey hints (never inside a box).
  function researchExamples() {
    var B = Q.benchmarkFields;
    return '<div class="examples"><span class="ex-tag">' + esc(B.examplesTitle) + '</span><table><thead><tr><th>' +
      esc(B.findingLabel) + '</th><th>' + esc(B.source.label) + '</th><th>' + esc(B.connects.exportLabel) + '</th></tr></thead><tbody>' +
      B.examples.map(function (x) { return '<tr><td>' + esc(x.finding) + '</td><td>' + esc(x.source) + '</td><td>' + esc(x.connects) + '</td></tr>'; }).join("") +
      '</tbody></table></div>';
  }

  // A benchmark's source, the program it connects to and how it connects.
  function benchmarkFields(path, a) {
    var B = Q.benchmarkFields, id = idOf(path);
    var names = state.programs.map(function (p) { return S.trim(p.name.text); }).filter(function (t) { return t; });
    if (a.prog && names.indexOf(a.prog) < 0) names.push(a.prog);
    return '<div class="bench-extra">' +
      '<div class="f"><label for="' + id + '-src">' + esc(B.source.label) + '</label><p class="hint">' + esc(B.source.help) + '</p>' +
      '<input type="text" class="ext" data-path="' + path + '" data-ext="src" id="' + id + '-src" value="' + esc(a.src) + '"></div>' +
      '<div class="f"><label for="' + id + '-prog">' + esc(B.program.label) + '</label>' +
      '<select class="ext" data-path="' + path + '" data-ext="prog" id="' + id + '-prog"><option value="">' + esc(B.program.none) + '</option>' +
      names.map(function (t) { return '<option' + (t === a.prog ? " selected" : "") + '>' + esc(t) + '</option>'; }).join("") + '</select></div>' +
      '<div class="f"><label for="' + id + '-how">' + esc(B.connects.label) + '</label><p class="hint">' + esc(B.connects.help) + '</p>' +
      '<textarea class="ext" data-path="' + path + '" data-ext="how" id="' + id + '-how">' + esc(a.how) + '</textarea></div>' +
      '</div>';
  }

  function programName(i) { return S.section(Q, "programs").itemLabel + " " + (i + 1); }

  // Names an answer for the end screen list, e.g. "Program 2: Outputs".
  function nameOf(path) {
    var p = path.split(".");
    if (p[0] === "org" || p[0] === "constraints") return S.section(Q, p[0]).questions.filter(function (q) { return q.id === p[1]; })[0].label;
    if (p[0] === "rank") return Q.rank.title;
    if (p[0] === "why") return S.section(Q, "why").questions.filter(function (q) { return q.id === p[1]; })[0].label;
    if (p[0] === "wand") return Q.wand.title + ": " + Q.wand[p[1]];
    if (p[0] === "donors") return Q.donors[p[1]].title + ", " + Q.donors.rowLabel.toLowerCase() + " " + (+p[2] + 1) + ": " + Q.donors.columns[p[3]];
    if (p[0] === "programs") {
      var sec = S.section(Q, "programs");
      return sec.itemLabel + " " + (+p[1] + 1) + ": " + sec.questions.filter(function (q) { return q.id === p[2]; })[0].label;
    }
    return S.section(Q, p[0]).itemLabel + " " + (+p[1] + 1);
  }

  // The last screen: what still needs attention, the finished prompt, and
  // the "I reviewed this" lock on Copy and Download.
  function reviewScreen() {
    var probs = S.problems(state, Q);
    var words = { needsLabel: "needs a label", needsNote: "needs a source note", unsupported: "is marked Unsupported",
      blank: "is still blank", skipped: "was skipped (Unsupported)", vague: "uses a vague word", keptVague: "is vague (Unsupported)",
      outputNoNumber: "has no number", outputNoYear: "has no year", outputNoNumberOrYear: "has no number or year",
      assumption: "is an “if” assumption with no source",
      math: "has a calculation that doesn't add up", keptMath: "has a calculation that doesn't add up (Unsupported)",
      outputNoNumberKept: "has no number (Unsupported)", outputNoYearKept: "has no year (Unsupported)", outputNoNumberOrYearKept: "has no number or year (Unsupported)" };
    var list = probs.length
      ? '<ul class="todo">' + probs.map(function (p) {
          return '<li><button type="button" class="link" data-act="goto" data-step="' + S.stepOf(state, p.path) + '" data-focus="' + idOf(p.path) + '">' +
            esc(nameOf(p.path)) + '</button> ' + (p.status === "duplicate" ? "is the same as " + esc(programName(p.other)) :
              p.status === "overlap" ? "shares " + esc(p.value) + " with " + esc(programName(p.other)) : words[p.status]) + '</li>';
        }).join("") + '</ul>'
      : '<p>' + esc(Q.review.allClear) + '</p>';
    var R = Q.review;
    return heading(N.review, R.title) + '<p>' + esc(R.text) + '</p>' + list + rtccEditor() +
      '<div class="f"><span class="lbl">' + esc(R.previewTitle) + '</span><pre id="exportPreview"></pre></div>' +
      '<label class="review-check"><input type="checkbox" id="reviewed"' + (state.reviewed ? " checked" : "") + '> ' + esc(R.checkbox) + '</label>' +
      '<div class="actions">' +
      '<button type="button" class="btn primary" id="copyPrompt" data-act="copy">' + esc(R.copyButton) + '</button>' +
      '<button type="button" class="btn ghost" id="downloadPrompt" data-act="download">' + esc(R.downloadButton) + '</button>' +
      '</div>' +
      '<p id="exportMsg" aria-live="polite"></p>' +
      '<div class="f"><span class="lbl">' + esc(R.versionsTitle) + '</span><div id="versions"></div></div>';
  }

  // The flowchart's "Prompt history": every prompt copied or downloaded,
  // newest first, kept in this browser only.
  function refreshVersions() {
    var box = $("versions"), R = Q.review;
    if (!box) return;
    if (!state.versions.length) { box.innerHTML = '<p class="hint">' + esc(R.versionsNone) + '</p>'; return; }
    box.innerHTML = state.versions.slice().reverse().map(function (v) {
      return '<details class="version"><summary>' + esc(R.versionLabel.replace(/\{n\}/g, v.n).replace(/\{date\}/g, function () { return v.at; })) + '</summary>' +
        '<pre class="version-text"></pre>' +
        '<button type="button" class="btn quiet" data-act="downloadVersion" data-index="' + v.n + '">' + esc(R.versionDownload) + '</button></details>';
    }).join("");
    Array.prototype.forEach.call(box.querySelectorAll(".version-text"), function (pre, k) {
      pre.textContent = state.versions[state.versions.length - 1 - k].text;
    });
  }

  function stamp() {
    try { return new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
    catch (e) { return new Date().toLocaleString(); }
  }
  function keepVersion(text) { S.addVersion(state, text, stamp()); save(); refreshVersions(); }

  // Role, Task and Constraints, editable on the review screen. Each has a
  // button to go back to FAC's wording (or the member's constraint answers).
  function rtccEditor() {
    var E = Q.rtccEdit, H = Q.rtcc, P = FACExport.parts(Q, state);
    function box(part, heading, help, reset) {
      return '<div class="f"><label for="rtcc-' + part + '">' + esc(heading) + '</label>' + (help ? '<p class="hint">' + esc(help) + '</p>' : "") +
        '<textarea class="rtcc-edit" id="rtcc-' + part + '" data-part="' + part + '">' + esc(P[part]) + '</textarea>' +
        '<div><button type="button" class="btn quiet" data-act="rtccReset" data-part="' + part + '">' + esc(reset) + '</button></div></div>';
    }
    return '<div class="rtcc"><span class="lbl">' + esc(E.title) + '</span><p class="hint">' + esc(E.text) + '</p>' +
      box("role", H.roleHeading, E.roleHelp, E.reset) + box("task", H.taskHeading, "", E.reset) +
      box("constraints", H.constraintsHeading, "", E.resetConstraints) + '</div>';
  }

  // Copy and Download stay locked until "I reviewed this" is ticked.
  function refreshReview() {
    var pre = $("exportPreview");
    if (!pre) return;
    pre.textContent = FACExport.build(Q, state);
    $("reviewed").checked = state.reviewed;
    $("copyPrompt").disabled = $("downloadPrompt").disabled = !state.reviewed;
    if (!state.reviewed) say(Q.review.locked);
  }
  function say(text) { var m = $("exportMsg"); if (m) m.textContent = text; }

  // Any change to the answers means the prompt changed: review it again.
  function unreview() { state.reviewed = false; }

  function copyPrompt() {
    if (!state.reviewed) return;
    var text = FACExport.build(Q, state);
    keepVersion(text);
    function fallback() {
      var range = document.createRange();
      range.selectNodeContents($("exportPreview"));
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
      say(Q.review.selected);
    }
    try { navigator.clipboard.writeText(text).then(function () { say(Q.review.copied); }, fallback); }
    catch (e) { fallback(); }
  }

  function saveFile(text, name) {
    var url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function downloadPrompt() {
    if (!state.reviewed) return;
    var text = FACExport.build(Q, state);
    keepVersion(text);
    saveFile(text, FACExport.FILE_NAME);
    say(Q.review.downloaded);
  }

  function downloadVersion(n) {
    var v = state.versions.filter(function (x) { return x.n === n; })[0];
    if (v) saveFile(v.text, FACExport.FILE_NAME.replace(/\.txt$/, "-v" + n + ".txt"));
  }

  function render(focusId) {
    var steps = S.steps(state);
    if (state.step >= steps.length) state.step = steps.length - 1;
    var st = steps[state.step];
    screen.innerHTML =
      st.kind === "org" ? orgScreen() :
      st.kind === "program" ? programScreen(st.index) :
      st.kind === "check" ? checkpointScreen(st.of) :
      st.kind === "rank" ? rankScreen() :
      st.kind === "pain" ? listScreen("pain", N.pain) :
      st.kind === "benchmarks" ? listScreen("benchmarks", N.benchmarks) :
      st.kind === "constraints" ? constraintsScreen() :
      st.kind === "why" ? whyScreen() :
      st.kind === "donors" ? donorsScreen() :
      st.kind === "wand" ? wandScreen() : reviewScreen();

    Array.prototype.forEach.call(screen.querySelectorAll(".ans"), function (el) {
      el.value = S.get(state, el.getAttribute("data-path")).text;
      refresh(el.getAttribute("data-path"));
    });

    $("counter").textContent = "Step " + (state.step + 1) + " of " + steps.length;
    $("back").disabled = state.step === 0;
    $("next").hidden = state.step === steps.length - 1;
    $("next").textContent = st.kind === "end" ? Q.flow.continueStep2 : st.kind !== "check" ? Q.flow.nextButton : st.of === "constraints" ? Q.flow.buildStory : Q.flow.checkpointYes;
    refreshWhy();
    refreshReview();
    refreshVersions();
    save();

    var target = focusId && $(focusId);
    if (target) target.focus();
    return st;
  }

  // Shows the follow-up while an answer is missing or vague, or the flag once
  // it has been skipped or kept.
  function refreshFollowUp(path) {
    var id = idOf(path), fu = $(id + "-fu");
    if (!fu) return;
    var F = Q.followUps, a = S.get(state, path), kind = S.issueOf(Q, path, a, state);
    var open = !!kind && a.asks > 0;
    fu.hidden = !open;

    // The flag under the answer: kept as is (Unsupported), or a noted same group.
    var flag = $(id + "-skipped"), base = S.baseIssue(Q, path, a), shared = S.sharedCount(state, path);
    var noted = a.overlap === "same" && !!shared;
    flag.hidden = !((a.skipped && base) || noted);
    flag.classList.toggle("noted", noted && !(a.skipped && base));
    flag.textContent = a.skipped && base ? (base === "vague" ? F.keptVague : base === "output" ? F.keptOutput : base === "math" ? F.keptMath : F.skipped)
      : noted ? F.overlapSameNote.replace(/\{program\}/g, programName(shared.other)) : "";

    $(id).classList.toggle("invalid", open);
    if (!open) return;
    var btn = fu.querySelector(".fu-skip"), alt = fu.querySelector(".fu-alt"), text;
    alt.hidden = true;
    if (kind === "assumption") {
      // Settled with the label box just below, so no button.
      text = F.ifNoSource[a.asks - 1];
      btn.hidden = true;
    } else if (kind === "overlap") {
      text = F.overlap.replace(/\{program\}/g, programName(shared.other)).replace(/\{number\}/g, shared.value);
      btn.textContent = F.overlapDifferent;
      alt.textContent = F.overlapSame;
      btn.hidden = alt.hidden = false;
    } else if (kind === "duplicate") {
      text = (/\.name$/.test(path) ? F.duplicateName : F.duplicateDescription).replace(/\{program\}/g, programName(S.duplicateOf(state, path)));
      btn.textContent = F.separateButton;
      btn.hidden = !S.canConfirmSeparate(a);
    } else {
      var lines = kind === "vague" ? F.vague : kind === "output" ? F[S.outputGap(a.text)] : kind === "math" ? F.mathWrong : path === "org.zip" ? F.missingZip : F.missing;
      text = lines[a.asks - 1].replace(/\{word\}/g, S.vagueWord(Q, a.text)).replace(/\{calc\}/g, function () { return S.mathProblem(a.text); });
      btn.textContent = kind === "missing" ? F.skipButton : F.keepButton;
      btn.hidden = !S.canSkip(a);
    }
    fu.querySelector(".fu-q").textContent = text;
  }

  // Shows or hides the label box for one answer, without rebuilding the screen.
  function refresh(path) {
    refreshFollowUp(path);
    var box = $(idOf(path) + "-lab");
    if (!box) return;
    var a = S.get(state, path), st = S.status(a);
    box.hidden = st === "none";
    box.querySelectorAll(".lab-radio").forEach(function (r) { r.checked = r.value === a.label; });
    var noteWrap = box.querySelector(".lab-note-wrap"), noteKind = Q.labels[a.label];
    noteWrap.hidden = !(a.label === "known" || a.label === "estimate");
    if (!noteWrap.hidden) {
      box.querySelector(".lab-note-label").innerHTML = esc(noteKind.noteLabel) + '<span class="req">*</span>';
      var note = box.querySelector(".lab-note");
      if (document.activeElement !== note) note.value = a.note;
    }
    var msg = box.querySelector(".lab-state");
    msg.className = "lab-state " + st;
    msg.textContent = st === "unsupported" ? Q.labels.unsupported.name + ": " + Q.labels.unsupported.help :
      st === "needsLabel" ? "Choose a label." : st === "needsNote" ? noteKind.help : "";
    box.setAttribute("data-status", st);
  }

  function go(step, focusId) {
    state.step = step;
    render(focusId);
    if (!focusId) {
      window.scrollTo(0, 0);
      screen.querySelector("h2").focus({ preventScroll: true });
    }
  }

  // ---------- Events ----------

  screen.addEventListener("input", onEdit);
  screen.addEventListener("change", onEdit);
  function onEdit(e) {
    var el = e.target, path = el.getAttribute("data-path");
    if (el.id === "reviewed") { state.reviewed = el.checked; refreshReview(); save(); return; }
    if (onRankEdit(e)) return;
    if (el.classList.contains("why-type")) {
      if (e.type !== "change") return;
      var at = state.whyTypes.indexOf(el.value);
      if (el.checked && at < 0) state.whyTypes.push(el.value);
      if (!el.checked && at > -1) state.whyTypes.splice(at, 1);
      unreview(); save(); return;
    }
    if (el.classList.contains("rtcc-edit")) { state.rtcc[el.getAttribute("data-part")] = el.value; unreview(); refreshReview(); save(); return; }
    if (!path) return;
    if (el.classList.contains("ext")) { S.get(state, path)[el.getAttribute("data-ext")] = el.value; unreview(); save(); return; }
    if (el.classList.contains("ans")) S.setText(Q, state, path, el.value);
    else if (el.classList.contains("lab-radio")) S.setLabel(Q, state, path, el.value);
    else if (el.classList.contains("lab-note")) S.setNote(Q, state, path, el.value);
    unreview();
    refresh(path);
    refreshWhy();
    save();
  }

  // Stack rank controls. Returns true when it handled the event.
  function onRankEdit(e) {
    var el = e.target, c = el.classList, R = state.rank;
    if (!(c.contains("rank-use") || c.contains("rank-measure") || c.contains("rank-m") || c.contains("rank-score") || c.contains("rank-line"))) return false;
    if (c.contains("rank-use")) { if (e.type !== "change") return true; R.use = el.value; }
    else if (c.contains("rank-measure")) {
      if (e.type !== "change") return true;
      var at = R.measures.indexOf(el.value);
      if (el.checked && at < 0) { if (R.measures.length < 3) R.measures.push(el.value); else el.checked = false; }
      if (!el.checked && at > -1) R.measures.splice(at, 1);
    }
    else if (c.contains("rank-m")) state.rankRows[+el.getAttribute("data-row")].m[el.getAttribute("data-m")] = el.value;
    else if (c.contains("rank-score")) state.rankRows[+el.getAttribute("data-row")].score = el.value;
    else if (c.contains("rank-line")) R.line = +el.value;
    unreview();
    save();
    // Choosing yes or no, a measure or the red line changes what the screen shows.
    if (c.contains("rank-use") || c.contains("rank-measure") || c.contains("rank-line")) render();
    return true;
  }

  // Removing a program asks for a second click, like "Clear form" on the live page.
  var armed = null;
  screen.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act"), i = +b.getAttribute("data-index"), list = b.getAttribute("data-list");
    if (act === "copy") { copyPrompt(); return; }
    if (act === "download") { downloadPrompt(); return; }
    if (act === "downloadVersion") { downloadVersion(i); return; }
    if (act === "importLive") {
      S.importLive(Q, state, liveDraft()); unreview(); render();
      if ($("why-imported")) $("why-imported").textContent = Q.why.imported;
      return;
    }
    if (act === "addDonorRow") { S.addDonorRow(state, b.getAttribute("data-table")); unreview(); render(); return; }
    if (act === "removeDonorRow") { S.removeDonorRow(state, b.getAttribute("data-table"), i); unreview(); render(); return; }
    if (act === "rtccReset") { state.rtcc[b.getAttribute("data-part")] = null; unreview(); render(); return; }
    if (act === "rankSort") {
      var ok = S.sortByScore(state);
      if (ok) { unreview(); render(); $("rank-msg").textContent = Q.rank.sorted; }
      else showRankCheck(S.rankCheck(state));
      save();
      return;
    }
    // Everything else below changes the answers, except going to a listed item.
    if (act !== "goto" && !(act === "removeProgram" && armed !== b)) unreview();
    if (act === "addProgram") { go(1 + S.addProgram(Q, state)); }
    else if (act === "removeProgram") {
      if (armed !== b) { armed = b; b.textContent = "Click again to remove this program"; return; }
      S.removeProgram(state, i); go(Math.min(1 + i, state.programs.length));
    }
    else if (act === "addItem") { S.addItem(state, list); render(idOf(list + "." + (state[list].length - 1))); }
    else if (act === "removeItem") { S.removeItem(state, list, i); render(); }
    else if (act === "goto") { go(+b.getAttribute("data-step"), b.getAttribute("data-focus")); }
    else if (act === "skip") {
      var path = b.getAttribute("data-path");
      var kind = S.issueOf(Q, path, S.get(state, path), state);
      if (kind === "duplicate") S.confirmSeparate(state, path);
      else if (kind === "overlap") S.resolveOverlap(state, path, "different");
      else S.skip(state, path);
      refresh(path); save();
      $(idOf(path)).focus();
    }
    else if (act === "alt") {
      var p2 = b.getAttribute("data-path");
      S.resolveOverlap(state, p2, "same");
      refresh(p2); save();
      $(idOf(p2)).focus();
    }
  });

  $("back").addEventListener("click", function () { go(state.step - 1); });
  // Next asks a follow-up for each missing or vague answer instead of moving on.
  $("next").addEventListener("click", function () {
    if (S.steps(state)[state.step].kind === "rank") {
      var c = S.rankCheck(state);
      if (!c.msg) go(state.step + 1); else showRankCheck(c);
      return;
    }
    var m = S.ask(Q, state, state.step);
    if (!m.length) { go(state.step + 1); return; }
    m.forEach(refresh);
    save();
    $(idOf(m[0])).focus();
  });

  var clearArmed = false;
  $("clear").addEventListener("click", function () {
    if (!clearArmed) { clearArmed = true; $("clear").textContent = "Click again to clear everything"; setTimeout(function () { clearArmed = false; $("clear").textContent = "Start over"; }, 4000); return; }
    clearArmed = false; $("clear").textContent = "Start over";
    S.clear(); state = S.blank(Q); go(0);
  });

  $("intro").textContent = Q.intro;
  if ($("howToLink")) $("howToLink").textContent = Q.howTo.linkText;
  render();
})();
