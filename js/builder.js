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

  // Follow-up for a missing required answer, plus the "skipped" flag.
  function followUpBox(path) {
    var id = idOf(path);
    return '<div class="fu" id="' + id + '-fu" aria-live="polite" hidden>' +
      '<p class="fu-q"></p>' +
      '<button type="button" class="btn quiet fu-skip" data-act="skip" data-path="' + path + '" hidden>' + esc(Q.followUps.skipButton) + '</button>' +
      '</div>' +
      '<p class="skipped" id="' + id + '-skipped" hidden>' + esc(Q.followUps.skipped) + '</p>';
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
      input + (q.required ? followUpBox(path) : "") + (S.needsLabel(path) ? labelBox(path) : "") +
      '</div>';
  }

  function heading(num, title, note) {
    return '<h2 tabindex="-1"><span class="num">' + esc(num) + '</span>' + esc(title) + (note ? ' <span class="opt">' + esc(note) + '</span>' : "") + '</h2>';
  }

  function orgScreen() {
    var sec = S.section(Q, "org");
    return heading("01", sec.title) + sec.questions.map(function (q) { return field(q, "org." + q.id); }).join("");
  }

  function programScreen(i) {
    var sec = S.section(Q, "programs"), n = state.programs.length;
    return heading("02", sec.itemLabel + " " + (i + 1) + " of " + n, sec.note) +
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
        '<textarea class="ans" id="' + fid + '" data-path="' + path + '"></textarea>' + labelBox(path) +
        '</div>';
    }).join("");
    return heading(num, sec.title, sec.note) +
      (sec.help ? '<p class="hint">' + esc(sec.help) + '</p>' : "") +
      '<div class="examples"><span class="ex-tag">Example</span><ul>' + examples + '</ul></div>' +
      rows +
      '<div><button type="button" class="btn ghost" data-act="addItem" data-list="' + id + '">' + esc(sec.addLabel) + '</button></div>';
  }

  // Names an answer for the end screen list, e.g. "Program 2: Outputs".
  function nameOf(path) {
    var p = path.split(".");
    if (p[0] === "org") return S.section(Q, "org").questions.filter(function (q) { return q.id === p[1]; })[0].label;
    if (p[0] === "programs") {
      var sec = S.section(Q, "programs");
      return sec.itemLabel + " " + (+p[1] + 1) + ": " + sec.questions.filter(function (q) { return q.id === p[2]; })[0].label;
    }
    return S.section(Q, p[0]).itemLabel + " " + (+p[1] + 1);
  }

  function endScreen() {
    var probs = S.problems(state, Q);
    var words = { needsLabel: "needs a label", needsNote: "needs a source note", unsupported: "is marked Unsupported",
      blank: "is still blank", skipped: "was skipped (Unsupported)" };
    var list = probs.length
      ? '<ul class="todo">' + probs.map(function (p) {
          return '<li><button type="button" class="link" data-act="goto" data-step="' + S.stepOf(state, p.path) + '" data-focus="' + idOf(p.path) + '">' +
            esc(nameOf(p.path)) + '</button> ' + words[p.status] + '</li>';
        }).join("") + '</ul>'
      : '<p>Every figure has a label and a source.</p>';
    return heading("✓", Q.endScreen.title) + '<p>' + esc(Q.endScreen.text) + '</p>' + list;
  }

  function render(focusId) {
    var steps = S.steps(state);
    if (state.step >= steps.length) state.step = steps.length - 1;
    var st = steps[state.step];
    screen.innerHTML =
      st.kind === "org" ? orgScreen() :
      st.kind === "program" ? programScreen(st.index) :
      st.kind === "pain" ? listScreen("pain", "03") :
      st.kind === "benchmarks" ? listScreen("benchmarks", "04") : endScreen();

    Array.prototype.forEach.call(screen.querySelectorAll(".ans"), function (el) {
      el.value = S.get(state, el.getAttribute("data-path")).text;
      refresh(el.getAttribute("data-path"));
    });

    $("counter").textContent = "Step " + (state.step + 1) + " of " + steps.length;
    $("back").disabled = state.step === 0;
    $("next").hidden = state.step === steps.length - 1;
    save();

    var target = focusId && $(focusId);
    if (target) target.focus();
    return st;
  }

  // Shows the follow-up while a required answer is missing, or the "skipped" flag.
  function refreshFollowUp(path) {
    var id = idOf(path), fu = $(id + "-fu");
    if (!fu) return;
    var a = S.get(state, path), open = !a.skipped && a.asks > 0 && S.isMissing(path, a);
    fu.hidden = !open;
    $(id + "-skipped").hidden = !a.skipped;
    $(id).classList.toggle("invalid", open);
    if (open) {
      var lines = path === "org.zip" ? Q.followUps.missingZip : Q.followUps.missing;
      fu.querySelector(".fu-q").textContent = lines[a.asks - 1];
      fu.querySelector(".fu-skip").hidden = !S.canSkip(a);
    }
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
    if (!path) return;
    var a = S.get(state, path);
    if (el.classList.contains("ans")) S.setText(state, path, el.value);
    else if (el.classList.contains("lab-radio")) a.label = el.value;
    else if (el.classList.contains("lab-note")) a.note = el.value;
    refresh(path);
    save();
  }

  // Removing a program asks for a second click, like "Clear form" on the live page.
  var armed = null;
  screen.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-act]");
    if (!b) return;
    var act = b.getAttribute("data-act"), i = +b.getAttribute("data-index"), list = b.getAttribute("data-list");
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
      S.skip(state, path); refresh(path); save();
      $(idOf(path)).focus();
    }
  });

  $("back").addEventListener("click", function () { go(state.step - 1); });
  // Next asks a follow-up for each missing required answer instead of moving on.
  $("next").addEventListener("click", function () {
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
  render();
})();
