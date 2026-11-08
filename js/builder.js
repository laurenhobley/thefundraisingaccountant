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
        (q.kind === "zip" ? ' inputmode="numeric" maxlength="10" autocomplete="postal-code"' : "") + (q.placeholder ? ' placeholder="' + esc(q.placeholder) + '"' : "") + '>';
    return '<div class="f' + (q.kind === "zip" ? " f-zip" : "") + '">' +
      '<label for="' + id + '">' + esc(q.label) + (q.note ? ' <span class="opt">' + esc(q.note) + '</span>' : "") + (q.required ? '<span class="req">*</span>' : "") + '</label>' +
      (q.help ? '<p class="hint">' + esc(q.help) + '</p>' : "") +
      input + (q.kind === "zip" ? '<p class="hint zip-place" id="' + id + '-place" aria-live="polite"></p>' : "") +
      followUpBox(path) + (S.needsLabel(path) ? labelBox(path) : "") +
      '</div>';
  }

  // The place for the ZIP code ("Houston, TX"), from our own copy of
  // GeoNames' ZIP list, shown under the box. The list loads the first time
  // a ZIP needs it; then the prompt is shown again with the place in it.
  function refreshZipPlace() {
    var el = $("f-org-zip-place");
    if (!el) return;
    var zip = S.get(state, "org.zip").text, where = FACZip.place(zip);
    el.textContent = where ? Q.zipPlace.found.replace(/\{place\}/g, where) : where === "" && S.zipOk(zip) ? Q.zipPlace.unknown : "";
  }
  function needZipList() {
    if (FACZip.place(S.get(state, "org.zip").text) === null) FACZip.load(function () { refreshZipPlace(); refreshReview(); refreshPackage(); });
  }

  function heading(num, title, note) {
    return '<h2 tabindex="-1"><span class="num">' + esc(num) + '</span>' + esc(title) + (note ? ' <span class="opt">' + esc(note) + '</span>' : "") + '</h2>';
  }

  var N = Q.flow.numbers;

  function orgScreen() {
    var sec = S.section(Q, "org");
    return heading(N.org, sec.title) + docPanel() + sec.questions.map(function (q) { return field(q, "org." + q.id); }).join("");
  }

  // ---------- Fill from a document ----------
  // The pasted text and the suggestions found in it are kept in memory
  // only, so nothing from the member's document is saved in the browser.
  var docText = "", suggestions = [];
  var DOC_TYPES = ".docx,.pdf,.txt";

  // Finds suggestions in docText and says how many, after "before" (e.g. "Read report.docx.").
  function findAnswers(before) {
    suggestions = FACRead.suggest(docText).map(function (s) { s.done = ""; return s; });
    render("doc-text");
    var D = Q.documents, n = suggestions.length;
    $("doc-msg").textContent = (before ? before + " " : "") + (n ? D.found.replace(/\{n\}/g, n) : D.none);
  }

  // A chosen file: its text goes into the paste box, then Find answers.
  function readChosenFile(file) {
    var D = Q.documents, name = file.name;
    var finished = false;
    $("doc-msg").textContent = D.reading.replace(/\{file\}/g, name);
    FACRead.readFile(file).then(function (text) {
      finished = true;
      docText = text;
      findAnswers(D.readDone.replace(/\{file\}/g, name));
    }, function (err) {
      finished = true;
      if ($("doc-msg")) $("doc-msg").textContent = err && err.message === "type" ? D.wrongType : D.readFailed;
    });
    // A file that never finishes reading (a PDF opened from the computer
    // rather than the website) says so instead of "Reading…" for ever.
    setTimeout(function () { if (!finished && $("doc-msg")) $("doc-msg").textContent = D.readFailed; }, 30000);
  }

  function docPanel() {
    var D = Q.documents;
    return '<details class="doc-panel" id="doc-panel"' + (suggestions.length || docText ? " open" : "") + '><summary>' + esc(D.title) + '</summary>' +
      '<p class="hint">' + esc(D.intro) + '</p>' +
      '<div class="f"><label for="doc-file">' + esc(D.fileLabel) + '</label><input type="file" id="doc-file" accept="' + DOC_TYPES + '"></div>' +
      '<div class="f"><label for="doc-text">' + esc(D.pasteLabel) + '</label><textarea id="doc-text">' + esc(docText) + '</textarea></div>' +
      '<div class="actions"><button type="button" class="btn ghost" data-act="findAnswers">' + esc(D.findButton) + '</button></div>' +
      '<p class="hint" id="doc-msg" aria-live="polite"></p>' + suggestionList("") + '</details>';
  }

  // A suggestion's box: Local Context and Benchmarks items go into the
  // first blank item, so they're named by their section.
  function isList(path) { return /^(pain|benchmarks)\./.test(path); }
  function suggestionName(path) { return isList(path) ? S.section(Q, path.split(".")[0]).title : nameOf(path); }
  function currentText(path) {
    var p = path.split(".");
    if (isList(path) || (p[0] === "programs" && +p[1] >= state.programs.length)) return "";
    return S.trim(S.get(state, path).text);
  }
  function alreadyThere(s) {
    return isList(s.path) ? state[s.path.split(".")[0]].some(function (a) { return S.trim(a.text) === s.text; }) : currentText(s.path) === s.text;
  }

  // The suggestions whose path starts with prefix ("" for all), each with
  // its quote and Accept (or Replace my answer), Edit and Skip.
  function suggestionList(prefix) {
    var D = Q.documents, rows = suggestions.map(function (s, k) {
      if (s.path.indexOf(prefix) !== 0) return "";
      var buttons = s.done ? '<span class="sugg-done">' + esc(D[s.done]) + '</span>' :
        alreadyThere(s) ? '<span class="sugg-done">' + esc(D.sameAlready) + '</span>' :
        '<button type="button" class="btn ghost" data-act="suggAccept" data-index="' + k + '">' + esc(currentText(s.path) ? D.replace : D.accept) + '</button>' +
        '<button type="button" class="btn quiet" data-act="suggEdit" data-index="' + k + '">' + esc(D.edit) + '</button>' +
        '<button type="button" class="btn quiet" data-act="suggSkip" data-index="' + k + '">' + esc(D.skip) + '</button>';
      return '<div class="sugg" id="sugg-' + k + '"><span class="lbl">' + esc(suggestionName(s.path)) + '</span>' +
        '<p class="sugg-text">' + esc(s.text) + '</p>' +
        '<p class="sugg-quote"><span class="ex-tag">' + esc(D.quoteLabel) + '</span>' + esc(s.quote) + '</p>' +
        '<div class="actions">' + buttons + '</div></div>';
    }).join("");
    return rows ? '<div class="suggs"><span class="lbl">' + esc(D.listTitle) + '</span>' + rows + '</div>' : "";
  }

  // Puts a suggestion into its box, the way typing it would: a program by
  // its number in the document, a list item into the first blank item.
  // Returns where it went.
  function acceptSuggestion(k) {
    var s = suggestions[k], p = s.path.split("."), path = s.path;
    if (p[0] === "programs") while (state.programs.length <= +p[1]) S.addProgram(Q, state);
    if (isList(path)) {
      var at = -1;
      state[p[0]].forEach(function (a, i) { if (at < 0 && !S.trim(a.text)) at = i; });
      if (at < 0) { S.addItem(state, p[0]); at = state[p[0]].length - 1; }
      path = p[0] + "." + at;
    }
    S.setText(Q, state, path, s.text);
    s.done = "accepted";
    unreview();
    save();
    return path;
  }
  // Program suggestions follow the document's order, so they're dropped
  // once the member reorders or removes programs.
  function dropProgramSuggestions() { suggestions = suggestions.filter(function (s) { return !/^programs\./.test(s.path); }); }

  // Step 1.4: how the member wants the story written.
  function constraintsScreen() {
    var sec = S.section(Q, "constraints");
    return heading(N.constraints, sec.title, sec.note) + sec.questions.map(function (q) { return field(q, "constraints." + q.id); }).join("");
  }

  // What a stack rank column is called: the member's name for a driver
  // (or "Driver 1" until they name it), or "Money".
  function columnName(c) { return c.named ? S.trim(state.rank.names[c.id]) || c.label : c.label; }

  // The optional stack rank, from FAC's template. Members name three
  // drivers, score each program 1-3 on each driver and Money, and type the
  // Stack Rank (the four multiplied). The tool checks it, sorts by it when
  // asked, and never fills a number in.
  function rankScreen() {
    var R = Q.rank, st = state.rank;
    function radio(v, label) {
      return '<label><input type="radio" class="rank-use" name="rank-use" value="' + v + '"' + (st.use === v ? " checked" : "") + '> ' + esc(label) + '</label>';
    }
    function list(lines) { return '<ul>' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join("") + '</ul>'; }
    function col(c) { return '<span class="rank-col" data-id="' + c.id + '">' + esc(columnName(c)) + '</span>'; }
    var html = heading(N.program, R.title) +
      '<div class="f"><span class="lbl">' + esc(R.ask) + '</span><div class="choice" role="radiogroup" aria-label="' + esc(R.ask) + '">' +
      radio("yes", R.yes) + radio("no", R.no) + '</div></div>';
    if (st.use === "yes") {
      html += '<div class="hint rank-intro"><p>' + esc(R.intro) + '</p>' + list(R.introExamples) + list(R.instructions) +
        '<p><strong>' + esc(R.keyTitle) + ':</strong> ' + R.key.map(esc).join(" · ") + '</p></div>' +
        '<div class="f"><span class="lbl">' + esc(R.namesLabel) + '</span><div class="rank-cells">' +
        R.columns.filter(function (c) { return c.named; }).map(function (c) {
          return '<label>' + esc(c.label) + ' <input type="text" class="rank-name" id="rank-name-' + c.id + '" data-id="' + c.id + '" value="' + esc(st.names[c.id]) + '"></label>';
        }).join("") + '</div><p class="hint">' + esc(R.namesHelp) + '</p></div>';
      // × and = between the columns, for the eye only.
      function op(sign) { return '<span class="rank-op" aria-hidden="true">' + sign + '</span>'; }
      var ex = R.example;
      html += '<div class="examples rank-example"><span class="ex-tag">' + esc(ex.title) + '</span><table><thead><tr>' +
        ex.headings.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join("") + '</tr></thead><tbody>' +
        ex.rows.map(function (r) { return '<tr>' + r.map(function (v) { return '<td>' + esc(v) + '</td>'; }).join("") + '</tr>'; }).join("") +
        '</tbody></table></div>';
      html += '<div class="rank-table">' +
        state.programs.map(function (p, i) {
          var row = state.rankRows[i];
          return '<div class="rank-row" id="rank-row-' + i + '"><span class="lbl">' + esc(programName(i)) + ': ' + esc(S.trim(p.name.text) || Q.flow.empty) + '</span><div class="rank-cells">' +
            R.columns.map(function (m, k) {
              return (k ? op("×") : "") + '<label>' + col(m) + ' <select class="rank-m" data-row="' + i + '" data-m="' + m.id + '"><option value=""></option>' +
                ["1", "2", "3"].map(function (v) { return '<option' + (row.m[m.id] === v ? " selected" : "") + '>' + v + '</option>'; }).join("") + '</select></label>';
            }).join("") +
            // "= Stack Rank" stays together when the row wraps.
            '<span class="rank-total">' + op("=") + '<label>' + esc(R.scoreLabel) + ' <input type="text" class="rank-score" inputmode="numeric" data-row="' + i + '" value="' + esc(row.score) + '"></label></span>' +
            (i >= S.included(state) ? ' <span class="opt">(' + esc(R.belowLine) + ')</span>' : "") +
            '</div></div>';
        }).join("") + '</div>' +
        '<div class="actions"><button type="button" class="btn ghost" data-act="rankSort">' + esc(R.sortButton) + '</button></div>' +
        '<div class="f"><label for="rank-line">' + esc(R.lineLabel) + '</label><select id="rank-line" class="rank-line">' +
        state.programs.map(function (p, i) {
          return '<option value="' + (i + 1) + '"' + (S.included(state) === i + 1 ? " selected" : "") + '>' + esc(programName(i) + (S.trim(p.name.text) ? ": " + p.name.text : "")) + '</option>';
        }).join("") + '</select><p class="hint">' + esc(R.lineHelp) + '</p>' + suggestion() + '</div>';
    }
    return html + '<p class="fu-q" id="rank-msg" aria-live="polite"></p>';
  }

  // "Where scores jump": only the member's own Stack Ranks, never the jump itself.
  function suggestion() {
    var k = S.suggestLine(state);
    if (!k) return "";
    function named(i) { var t = S.trim(state.programs[i].name.text); return programName(i) + (t ? ": " + t : ""); }
    var v = { a: named(k - 1), x: S.trim(state.rankRows[k - 1].score), b: named(k), y: S.trim(state.rankRows[k].score) };
    return '<p class="hint rank-suggest" id="rank-suggest">' + esc(Q.rank.suggest.replace(/\{(\w)\}/g, function (m, c) { return v[c]; })) + '</p>';
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

  // 2.2 Donate Now (the Regular donor table) and 2.3 Major Donors (the Major
  // donor table), one screen each. The member types every amount; FAC's
  // levels are a grey hint only.
  function donorsScreen(of) {
    var D = Q.donors, C = D.columns, html = heading(D[of].number, D[of].screenTitle);
    if (of === "regular") html += '<p class="hint">' + esc(D.intro) + '</p><p class="hint">' + esc(D.tableIntro) + '</p>' +
      '<div class="examples"><span class="ex-tag">Example</span><p>' + esc(D.example) + '</p></div>';
    [of].forEach(function (t) {
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

  // ---------- Step 3 ----------

  function storyField(id) {
    var f = Q.story.fields[id];
    return field({ label: f.label, note: f.note, help: f.help, kind: id === "clientStory" || id === "value" || id === "ask" || id === "keyFact" ? "long" : "text" }, "story." + id);
  }

  // 3.1 to 3.4: FAC's prompt with this step's inputs, a copy button, a box
  // for ROI.bot's answer (each new paste kept as a round), then Keep or
  // Revise. Revise asks one question and links to the screen that feeds it.
  function storyScreen(part) {
    var T = Q.story[part], ST = Q.story, o = state.storyOut[part];
    var own = { challenge: ["keyFact"], response: [], outcome: ["clientStory", "clientQuote", "secondQuote"], roi: ["investment", "value", "roi", "everyDollar", "ask", "timeframe"] }[part];
    var feeds = { challenge: { path: "pain.0", name: S.section(Q, "pain").title }, response: { path: "programs.0.outputs", name: programName(0) } }[part];
    function choice(v, label) {
      return '<label><input type="radio" class="story-choice" name="story-choice" data-part="' + part + '" value="' + v + '"' + (o.choice === v ? " checked" : "") + '> ' + esc(label) + '</label>';
    }
    var html = heading(T.number, T.title) + '<p class="hint">' + esc(T.intro) + '</p>' +
      (T.example ? '<div class="examples"><span class="ex-tag">Example</span><p>' + esc(T.example) + '</p></div>' : "") +
      own.map(storyField).join("") +
      (part === "outcome" ? '<label class="review-check"><input type="checkbox" class="story-approved"' + (state.storyApproved ? " checked" : "") + '> ' + esc(T.approved) + '</label>' : "") +
      '<div class="f"><span class="lbl">' + esc(ST.promptTitle) + '</span><pre class="step-prompt" id="step-prompt"></pre></div>' +
      '<div class="actions"><button type="button" class="btn primary" id="copyStep" data-act="copyStep" data-part="' + part + '">' + esc(ST.copyButton) + '</button>' +
      roiBotLink("openRoiBotStep") + '</div>' +
      '<p id="step-msg" aria-live="polite" class="hint"></p>' +
      '<div class="f"><label for="story-out">' + esc(ST.outputLabel) + '</label><p class="hint">' + esc(ST.outputHelp) + '</p>' +
      '<textarea class="story-out" id="story-out" data-part="' + part + '">' + esc(o.draft || S.latest(state, part)) + '</textarea></div>' +
      '<div class="f"><span class="lbl">' + esc(ST.roundsTitle) + '</span><div id="story-rounds"></div></div>' +
      '<div class="f"><span class="lbl">' + esc(ST.choiceLabel) + '</span><div class="choice" role="radiogroup" aria-label="' + esc(ST.choiceLabel) + '">' +
      choice("keep", ST.keep) + choice("revise", ST.revise) + '</div>' +
      '<div class="revise" id="story-revise"' + (o.choice === "revise" ? "" : " hidden") + '><p class="revise-q">' + esc(T.revise) +
      (feeds ? ' <button type="button" class="link" data-act="goto" data-step="' + S.stepOf(state, feeds.path) + '" data-focus="' + idOf(feeds.path) + '">' +
        esc(ST.reviseGo.replace(/\{screen\}/g, feeds.name)) + '</button>' : "") +
      '</p><p class="hint">' + esc(ST.reviseNext) + '</p></div></div>';
    return html;
  }
  function refreshStory() {
    var pre = $("step-prompt"), st = S.steps(state)[state.step];
    if (!pre || st.kind !== "story") return;
    pre.textContent = FACExport.stepPrompt(Q, state, st.of);
    var blocked = st.of === "outcome" && !state.storyApproved;
    $("copyStep").disabled = blocked;
    if (blocked) $("step-msg").textContent = Q.story.outcome.needApproved;
    else if ($("step-msg").textContent === Q.story.outcome.needApproved) $("step-msg").textContent = "";
    var rounds = state.storyOut[st.of].rounds;
    $("story-rounds").innerHTML = rounds.slice().reverse().map(function (r) {
      return '<details class="version"><summary>' + esc(Q.story.roundLabel.replace(/\{n\}/g, r.n)) + '</summary><pre class="version-text">' + esc(r.text) + '</pre></details>';
    }).join("");
  }

  // 3.5: the funder story, editable, and the end of the Why Now statement.
  function funderScreen() {
    var F = Q.story.funder;
    return heading(F.number, F.title) + '<p class="hint">' + esc(F.intro) + '</p>' +
      S.STORY_PARTS.map(function (k) {
        return '<div class="f"><label for="funder-' + k + '">' + esc(F.parts[k]) + '</label>' +
          '<textarea class="funder-edit" id="funder-' + k + '" data-part="' + k + '">' + esc(FACExport.funderPart(state, k)) + '</textarea>' +
          '<div><button type="button" class="btn quiet" data-act="funderReset" data-part="' + k + '">' + esc(F.reset) + '</button></div></div>';
      }).join("") +
      '<div class="actions"><button type="button" class="btn ghost" data-act="copyFunder">' + esc(F.copyButton) + '</button></div><p id="step-msg" aria-live="polite" class="hint"></p>' +
      '<div class="why-preview"><span class="lbl">' + esc(F.investTitle) + '</span><div id="why-black"></div>' +
      ["investProgram", "investOutcomes", "investDollars"].map(storyField).join("") + '<p id="invest-sentence"></p></div>';
  }

  function actionsScreen() {
    var A = Q.actions, C = A.columns;
    return heading("", A.title) + '<p class="hint">' + esc(A.intro) + '</p>' +
      state.actions.map(function (a, i) {
        function input(k, type) {
          return '<label>' + esc(C[k]) + ' <input type="' + type + '" class="act" data-row="' + i + '" data-k="' + k + '" value="' + esc(a[k]) + '"></label>';
        }
        return '<div class="donor-row"><div class="item-head"><span class="lbl">' + esc(A.rowLabel) + ' ' + (i + 1) + '</span></div>' +
          input("assignee", "text") + input("title", "text") + input("date", "date") +
          '<label>' + esc(C.status) + ' <select class="act" data-row="' + i + '" data-k="status"><option value=""></option>' +
          A.statuses.map(function (s) { return '<option' + (a.status === s ? " selected" : "") + '>' + esc(s) + '</option>'; }).join("") + '</select></label></div>';
      }).join("");
  }

  function assessScreen() {
    var A = Q.assess;
    return heading("", A.title) + '<p class="hint">' + esc(A.intro) + '</p>' +
      A.statements.map(function (s, i) {
        return '<div class="f"><span class="lbl">' + esc(s) + '</span><div class="choice" role="radiogroup" aria-label="' + esc(s) + '">' +
          ["1", "2", "3", "4", "5"].map(function (v) {
            return '<label><input type="radio" class="rate" name="rate-' + i + '" data-row="' + i + '" value="' + v + '"' + (state.assess.ratings[i] === v ? " checked" : "") + '> ' + v + '</label>';
          }).join("") + '</div></div>';
      }).join("") +
      '<div class="f"><label for="takeaway">' + esc(A.takeaway) + '</label><textarea id="takeaway" class="takeaway">' + esc(state.assess.takeaway) + '</textarea></div>';
  }

  function packageScreen() {
    var P = Q.packageText;
    return heading("✓", P.title) + '<p>' + esc(P.text) + '</p>' +
      '<pre id="pkgPreview"></pre>' +
      '<label class="review-check"><input type="checkbox" id="pkg-reviewed"' + (state.pkgReviewed ? " checked" : "") + '> ' + esc(P.checkbox) + '</label>' +
      '<div class="actions"><button type="button" class="btn primary" id="copyPkg" data-act="copyPkg">' + esc(P.copyButton) + '</button>' +
      '<button type="button" class="btn ghost" id="downloadPkg" data-act="downloadPkg">' + esc(P.downloadButton) + '</button>' +
      '<button type="button" class="btn ghost" id="downloadPkgMd" data-act="downloadPkgMd">' + esc(P.downloadMdButton) + '</button></div>' +
      saveCopyLine() +
      '<p id="exportMsg" aria-live="polite"></p>';
  }
  function refreshPackage() {
    var pre = $("pkgPreview");
    if (pre) {
      pre.textContent = FACExport.packageText(Q, state);
      $("pkg-reviewed").checked = state.pkgReviewed;
      $("copyPkg").disabled = $("downloadPkg").disabled = $("downloadPkgMd").disabled = !state.pkgReviewed;
      if (!state.pkgReviewed) say(Q.review.locked.replace(Q.review.checkbox, Q.packageText.checkbox));
    }
    var inv = $("invest-sentence");
    if (inv) inv.textContent = FACExport.investSentence(Q, state);
  }

  // Copies any text, falling back to selecting it.
  function copyText(text, msgId, done, fallbackEl) {
    function fallback() {
      if (fallbackEl) { var range = document.createRange(); range.selectNodeContents(fallbackEl); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
      if ($(msgId)) $(msgId).textContent = Q.review.selected;
    }
    try { navigator.clipboard.writeText(text).then(function () { if ($(msgId)) $(msgId).textContent = done; }, fallback); }
    catch (e) { fallback(); }
  }

  // Step 3 controls. Returns true when it handled the event.
  function onStoryEdit(e) {
    var el = e.target, c = el.classList;
    if (c.contains("story-out")) {
      var part = el.getAttribute("data-part");
      if (e.type === "change") S.addRound(state, part, el.value); else state.storyOut[part].draft = el.value;
    }
    else if (c.contains("story-choice")) {
      if (e.type !== "change") return true;
      state.storyOut[el.getAttribute("data-part")].choice = el.value;
      $("story-revise").hidden = el.value !== "revise";
    }
    else if (c.contains("story-approved")) { if (e.type !== "change") return true; state.storyApproved = el.checked; }
    else if (c.contains("funder-edit")) state.funder[el.getAttribute("data-part")] = el.value;
    else if (c.contains("act")) state.actions[+el.getAttribute("data-row")][el.getAttribute("data-k")] = el.value;
    else if (c.contains("rate")) { if (e.type !== "change") return true; state.assess.ratings[+el.getAttribute("data-row")] = el.value; }
    else if (c.contains("takeaway")) state.assess.takeaway = el.value;
    else if (el.id === "pkg-reviewed") { state.pkgReviewed = el.checked; refreshPackage(); save(); return true; }
    else return false;
    unreview();
    refreshStory(); refreshPackage();
    save();
    return true;
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
      suggestionList("programs." + i + ".") +
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
      suggestionList(id + ".") +
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
    if (p[0] === "story") return Q.story.fields[p[1]].label;
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
      dollar: "doesn't match your investment and value", keptDollar: "doesn't match your investment and value (Unsupported)",
      outputNoNumberKept: "has no number (Unsupported)", outputNoYearKept: "has no year (Unsupported)", outputNoNumberOrYearKept: "has no number or year (Unsupported)" };
    var list = probs.length
      ? '<ul class="todo">' + probs.map(function (p) {
          return '<li><button type="button" class="link" data-act="goto" data-step="' + S.stepOf(state, p.path) + '" data-focus="' + idOf(p.path) + '">' +
            esc(nameOf(p.path)) + '</button> ' + (p.status === "duplicate" ? "is the same as " + esc(programName(p.other)) :
              p.status === "overlap" ? "shares " + esc(p.value) + " with " + esc(programName(p.other)) : words[p.status]) + '</li>';
        }).join("") + '</ul>'
      : '<p>' + esc(Q.review.allClear) + '</p>';
    var R = Q.review;
    var two = S.steps(state)[state.step].stage === 2;
    return heading(two ? N.review2 : N.review, two ? R.title2 : R.title) + '<p>' + esc(R.text) + '</p>' + list + rtccEditor() +
      '<div class="f"><span class="lbl">' + esc(R.previewTitle) + '</span><pre id="exportPreview"></pre></div>' +
      '<label class="review-check"><input type="checkbox" id="reviewed"' + (state.reviewed ? " checked" : "") + '> ' + esc(R.checkbox) + '</label>' +
      '<div class="actions">' +
      '<button type="button" class="btn primary" id="copyPrompt" data-act="copy">' + esc(R.copyButton) + '</button>' +
      '<button type="button" class="btn ghost" id="downloadPrompt" data-act="download">' + esc(R.downloadButton) + '</button>' +
      '<button type="button" class="btn ghost" id="downloadPromptMd" data-act="downloadMd">' + esc(R.downloadMdButton) + '</button>' +
      roiBotLink("openRoiBot") +
      '</div>' +
      saveCopyLine() +
      '<p id="exportMsg" aria-live="polite"></p>' +
      '<div class="f"><span class="lbl">' + esc(R.versionsTitle) + '</span><div id="versions"></div></div>';
  }

  // FAC's sheet: "Save a copy in your FA community google folder...". The
  // folder becomes a link once Steve adds its address to questions.js.
  // "Open ROI.bot" in a new tab. Nothing is sent: the member pastes the prompt there.
  function roiBotLink(id) {
    return '<a class="btn ghost" id="' + id + '" href="' + esc(Q.roiBotUrl) + '" target="_blank" rel="noopener">' + esc(Q.openRoiBot) + '</a>';
  }

  function saveCopyLine() {
    var C = Q.saveCopy;
    var folder = C.url ? '<a href="' + esc(C.url) + '" target="_blank" rel="noopener">' + esc(C.linkText) + '</a>' : esc(C.linkText);
    return '<p class="hint save-copy">' + esc(C.before) + folder + esc(C.after) + '</p>';
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
    $("copyPrompt").disabled = $("downloadPrompt").disabled = $("downloadPromptMd").disabled = !state.reviewed;
    $("openRoiBot").hidden = !state.reviewed;
    if (!state.reviewed) say(Q.review.locked);
  }
  function say(text) { var m = $("exportMsg"); if (m) m.textContent = text; }

  // Any change to the answers means the prompt changed: review it again.
  function unreview() { state.reviewed = false; state.pkgReviewed = false; }

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
    var type = /\.md$/.test(name) ? "text/markdown;charset=utf-8" : "text/plain;charset=utf-8";
    var url = URL.createObjectURL(new Blob([text], { type: type }));
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // The .txt, or (md) the same prompt as a Markdown file. Either is kept as a version.
  function downloadPrompt(md) {
    if (!state.reviewed) return;
    var text = FACExport.build(Q, state);
    keepVersion(text);
    if (md) saveFile(FACExport.markdown(Q, text), mdName(FACExport.FILE_NAME));
    else saveFile(text, FACExport.FILE_NAME);
    say(Q.review.downloaded);
  }
  function mdName(name) { return name.replace(/\.txt$/, ".md"); }

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
      st.kind === "donors" ? donorsScreen(st.of) :
      st.kind === "wand" ? wandScreen() :
      st.kind === "story" ? storyScreen(st.of) :
      st.kind === "funder" ? funderScreen() :
      st.kind === "actions" ? actionsScreen() :
      st.kind === "assess" ? assessScreen() :
      st.kind === "package" ? packageScreen() : reviewScreen();

    Array.prototype.forEach.call(screen.querySelectorAll(".ans"), function (el) {
      el.value = S.get(state, el.getAttribute("data-path")).text;
      refresh(el.getAttribute("data-path"));
    });

    $("counter").textContent = "Step " + (state.step + 1) + " of " + steps.length;
    renderProgress(st);
    $("back").disabled = state.step === 0;
    $("next").hidden = state.step === steps.length - 1;
    $("next").textContent = st.kind === "end" ? (st.stage === 2 ? Q.flow.continueStep3 : Q.flow.continueStep2) :
      st.kind !== "check" ? Q.flow.nextButton : st.of === "constraints" ? Q.flow.buildStory : Q.flow.checkpointYes;
    refreshWhy();
    refreshStory();
    refreshPackage();
    refreshReview();
    refreshVersions();
    needZipList();
    save();

    var target = focusId && $(focusId);
    if (target) target.focus();
    return st;
  }

  // The workbook part a screen belongs to, as [step, part] (0-based): 1.1
  // Organization Info; 1.2 the programs, stack rank and their check; 1.3
  // Outputs to Outcomes = the Step 1 review, where the prompt goes to
  // ROI.bot; 1.4 Add Context = Local Context and Benchmarks; 1.5 Add
  // Constraints; 2.1 Pain Statements; 2.2 Donate Now; 2.3 Major Donors; 2.4
  // Magic Wand; 2.5 Build the Prompt = the Step 2 review; 3.1-3.4 the story
  // parts; 3.5 Funder Story and what follows it.
  function partOf(st) {
    var k = st.kind;
    if (k === "org") return [0, 0];
    if (k === "program" || k === "rank" || (k === "check" && st.of === "programs")) return [0, 1];
    if (k === "end") return st.stage === 2 ? [1, 4] : [0, 2];
    if (k === "pain" || k === "benchmarks" || (k === "check" && st.of === "benchmarks")) return [0, 3];
    if (k === "constraints" || k === "check") return [0, 4];
    if (k === "why") return [1, 0];
    if (k === "donors") return st.of === "major" ? [1, 2] : [1, 1];
    if (k === "wand") return [1, 3];
    if (k === "story") return [2, S.STORY_PARTS.indexOf(st.of)];
    return [2, 4];
  }

  // The progress bar. A part is done once every screen in it comes before
  // this one, so it stays right even where the order isn't the workbook's
  // (1.3, the review, comes after 1.4 and 1.5 until ROI.bot's chat exists).
  // Each part's number goes to its first screen.
  function renderProgress(st) {
    var P = Q.progress, all = S.steps(state), here = partOf(st), first = {}, last = {};
    all.forEach(function (s, i) {
      var key = partOf(s).join();
      if (!(key in first)) first[key] = i;
      last[key] = i;
    });
    function status(si, pi) {
      var key = si + "," + pi;
      return key === here.join() ? "current" : last[key] < state.step ? "done" : "todo";
    }
    $("progress").setAttribute("data-step", here[0]);
    $("stepsTabs").innerHTML = P.steps.map(function (s, si) {
      var done = s.parts.every(function (x, pi) { return status(si, pi) === "done"; });
      var cls = si === here[0] ? "current" : done ? "done" : "todo";
      return '<li class="' + cls + '"' + (cls === "current" ? ' aria-current="step"' : "") + '>' +
        '<span class="num" aria-hidden="true">' + (cls === "done" ? "✓" : esc(s.n)) + '</span>' +
        '<span><span class="sr">' + esc(P.stepLabel.replace(/\{n\}/g, s.n)) + ' </span>' + esc(s.name) +
        (cls === "done" ? '<span class="sr"> (' + esc(P.done) + ')</span>' : "") + '</span></li>';
    }).join("");
    var step = P.steps[here[0]];
    $("parts").innerHTML = step.parts.map(function (name, pi) {
      var cls = status(here[0], pi), n = step.n + "." + (pi + 1), to = first[here[0] + "," + pi];
      var prev = pi > 0 && status(here[0], pi - 1) === "done";
      return '<li class="' + cls + (prev ? " after-done" : "") + '"' + (cls === "current" ? ' aria-current="step"' : "") + '>' +
        '<button type="button" class="dot" data-act="part" data-step="' + to + '" aria-label="' + esc(n + " " + name + (cls === "current" ? ", " + P.current : cls === "done" ? ", " + P.done : "")) + '">' + esc(n) + '</button>' +
        '<span class="part-label">' + esc(name) + '</span></li>';
    }).join("");
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
    var flag = $(id + "-skipped"), base = S.baseIssue(Q, path, a, state), shared = S.sharedCount(state, path);
    var noted = a.overlap === "same" && !!shared;
    flag.hidden = !((a.skipped && base) || noted);
    flag.classList.toggle("noted", noted && !(a.skipped && base));
    flag.textContent = a.skipped && base ? (base === "vague" ? F.keptVague : base === "output" ? F.keptOutput : base === "math" ? F.keptMath : base === "dollar" ? F.keptDollar : F.skipped)
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
      var lines = kind === "vague" ? (S.notNeeded(Q, path, a) ? F.notNeeded : F.vague) : kind === "output" ? F[S.outputGap(a.text)] : kind === "math" ? F.mathWrong : kind === "dollar" ? F.dollarWrong : path === "org.zip" ? F.missingZip : F.missing;
      text = lines[a.asks - 1].replace(/\{word\}/g, S.vagueWord(Q, a.text)).replace(/\{calc\}/g, function () { return S.mathProblem(a.text); });
      btn.textContent = kind === "missing" ? F.skipButton : F.keepButton;
      btn.hidden = !S.canSkip(a);
    }
    fu.querySelector(".fu-q").textContent = text;
  }

  // Shows or hides the label box for one answer, without rebuilding the screen.
  function refresh(path) {
    refreshFollowUp(path);
    if (path === "org.zip") { refreshZipPlace(); needZipList(); }
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
    if (el.id === "doc-text") { docText = el.value; return; }
    if (el.id === "doc-file") { if (e.type === "change" && el.files && el.files[0]) readChosenFile(el.files[0]); return; }
    if (onRankEdit(e)) return;
    if (onStoryEdit(e)) return;
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
    refreshStory();
    refreshPackage();
    save();
  }

  // Stack rank controls. Returns true when it handled the event.
  function onRankEdit(e) {
    var el = e.target, c = el.classList, R = state.rank;
    if (!(c.contains("rank-use") || c.contains("rank-name") || c.contains("rank-m") || c.contains("rank-score") || c.contains("rank-line"))) return false;
    if (c.contains("rank-use")) { if (e.type !== "change") return true; R.use = el.value; }
    else if (c.contains("rank-name")) {
      // Renames that driver's column in every row, without redrawing the
      // screen (so the cursor stays in the box).
      var id = el.getAttribute("data-id");
      R.names[id] = el.value;
      var name = columnName(Q.rank.columns.filter(function (k) { return k.id === id; })[0]);
      Array.prototype.forEach.call(screen.querySelectorAll('.rank-col[data-id="' + id + '"]'), function (s) { s.textContent = name; });
    }
    else if (c.contains("rank-m")) state.rankRows[+el.getAttribute("data-row")].m[el.getAttribute("data-m")] = el.value;
    else if (c.contains("rank-score")) state.rankRows[+el.getAttribute("data-row")].score = el.value;
    else if (c.contains("rank-line")) R.line = +el.value;
    unreview();
    save();
    // Choosing yes or no or the red line changes what the screen shows.
    if (c.contains("rank-use") || c.contains("rank-line")) render();
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
    if (act === "downloadMd") { downloadPrompt(true); return; }
    if (act === "downloadPkgMd") { if (state.pkgReviewed) { saveFile(FACExport.markdown(Q, FACExport.packageText(Q, state)), mdName(FACExport.PACKAGE_FILE)); say(Q.review.downloaded); } return; }
    if (act === "downloadVersion") { downloadVersion(i); return; }
    if (act === "copyStep") {
      var sp = S.steps(state)[state.step].of;
      if (sp === "outcome" && !state.storyApproved) return;
      copyText(FACExport.stepPrompt(Q, state, sp), "step-msg", Q.story.copied, $("step-prompt"));
      return;
    }
    if (act === "copyFunder") { copyText(FACExport.funderText(Q, state), "step-msg", Q.story.copied, null); return; }
    if (act === "funderReset") { state.funder[b.getAttribute("data-part")] = null; unreview(); render(); return; }
    if (act === "copyPkg") { if (state.pkgReviewed) copyText(FACExport.packageText(Q, state), "exportMsg", Q.review.copied, $("pkgPreview")); return; }
    if (act === "downloadPkg") { if (state.pkgReviewed) { saveFile(FACExport.packageText(Q, state), FACExport.PACKAGE_FILE); say(Q.review.downloaded); } return; }
    if (act === "importLive") {
      S.importLive(Q, state, liveDraft()); unreview(); render();
      if ($("why-imported")) $("why-imported").textContent = Q.why.imported;
      return;
    }
    if (act === "addDonorRow") { S.addDonorRow(state, b.getAttribute("data-table")); unreview(); render(); return; }
    if (act === "removeDonorRow") { S.removeDonorRow(state, b.getAttribute("data-table"), i); unreview(); render(); return; }
    if (act === "rtccReset") { state.rtcc[b.getAttribute("data-part")] = null; unreview(); render(); return; }
    if (act === "findAnswers") { findAnswers(""); return; }
    if (act === "suggSkip") { suggestions[i].done = "skipped"; render(); return; }
    if (act === "suggAccept") { acceptSuggestion(i); render(); return; }
    if (act === "suggEdit") { var put = acceptSuggestion(i); go(S.stepOf(state, put), idOf(put)); return; }
    if (act === "rankSort") {
      var ok = S.sortByScore(state);
      if (ok) dropProgramSuggestions();
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
      S.removeProgram(state, i); dropProgramSuggestions(); go(Math.min(1 + i, state.programs.length));
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
    S.clear(); state = S.blank(Q); docText = ""; suggestions = []; go(0);
  });

  // A part's number in the progress bar goes to that part's first screen.
  $("progress").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act=part]");
    if (b) go(+b.getAttribute("data-step"));
  });

  $("brand").textContent = Q.brand;
  $("title").textContent = Q.title;
  $("intro").textContent = Q.intro;
  if ($("howToLink")) $("howToLink").textContent = Q.howTo.linkText;
  render();
})();
