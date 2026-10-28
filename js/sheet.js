/*
  Stores the member's answers with their labels, and saves the draft in the
  member's own browser. No screen code lives here, so it can be tested alone.

  Each answer is { text, label, note, asks, skipped }. label is "", "known",
  "estimate" or "unsupported". Known and Reasonable estimate both need a note
  (the source). asks counts the follow-ups shown for a missing answer (at most
  2); after two, the member may skip it, which marks it Unsupported.
*/
var FACSheet = (function () {
  var STORE = "fac-prompt-sheet-draft-v1";
  var MAX_ASKS = 2;

  function trim(s) { return String(s || "").replace(/^\s+|\s+$/g, ""); }
  // separate: the member confirmed this program is separate from an earlier
  // one with the same name or description.
  function answer() { return { text: "", label: "", note: "", asks: 0, skipped: false, separate: false }; }

  function section(Q, id) {
    for (var i = 0; i < Q.sections.length; i++) if (Q.sections[i].id === id) return Q.sections[i];
    return null;
  }

  function group(questions) {
    var g = {};
    for (var i = 0; i < questions.length; i++) g[questions[i].id] = answer();
    return g;
  }

  function blank(Q) {
    return {
      step: 0,
      org: group(section(Q, "org").questions),
      programs: [group(section(Q, "programs").questions)],
      pain: [answer()],
      benchmarks: [answer()]
    };
  }

  // Copies an answer from saved data, keeping only the three known fields.
  function copy(from) {
    var a = answer();
    if (from) {
      if (typeof from.text === "string") a.text = from.text;
      if (from.label === "known" || from.label === "estimate" || from.label === "unsupported") a.label = from.label;
      if (typeof from.note === "string") a.note = from.note;
      if (from.asks === 1 || from.asks === 2) a.asks = from.asks;
      if (from.skipped === true) a.skipped = true;
      if (from.separate === true) a.separate = true;
    }
    return a;
  }
  function copyGroup(into, from) {
    for (var id in into) if (into.hasOwnProperty(id) && from) into[id] = copy(from[id]);
    return into;
  }

  // Rebuilds a saved draft against the current questions, so a wording or
  // question change in questions.js never breaks an old draft.
  function repair(Q, data) {
    var s = blank(Q), i;
    if (!data) return s;
    copyGroup(s.org, data.org);
    if (data.programs && data.programs.length) {
      s.programs = [];
      for (i = 0; i < data.programs.length; i++) s.programs.push(copyGroup(group(section(Q, "programs").questions), data.programs[i]));
    }
    var lists = ["pain", "benchmarks"];
    for (var k = 0; k < lists.length; k++) {
      var from = data[lists[k]];
      if (from && from.length) {
        s[lists[k]] = [];
        for (i = 0; i < from.length; i++) s[lists[k]].push(copy(from[i]));
      }
    }
    if (typeof data.step === "number" && data.step >= 0) s.step = data.step;
    return s;
  }

  // Paths look like "org.zip", "programs.1.outputs" or "pain.0".
  function get(state, path) {
    var p = path.split(".");
    if (p[0] === "org") return state.org[p[1]];
    if (p[0] === "programs") return state.programs[+p[1]][p[2]];
    return state[p[0]][+p[1]];
  }

  function hasNumber(text) { return /\d/.test(text || ""); }
  function zipOk(text) { return /^\d{5}(-\d{4})?$/.test(trim(text)); }

  // "none": no number, so no label needed. "needsLabel", "needsNote",
  // "unsupported" (visibly flagged) or "ok".
  function status(a) {
    if (!hasNumber(a.text)) return "none";
    if (!a.label) return "needsLabel";
    if (a.label === "unsupported") return "unsupported";
    if (!trim(a.note)) return "needsNote";
    return "ok";
  }

  // The ZIP code is a location, not a figure, so it never needs a label.
  function needsLabel(path) { return path !== "org.zip"; }

  // ---------- Missing answers ----------

  // Blank (or only spaces) counts as missing. A ZIP code must be 5 digits.
  function isMissing(path, a) { return path === "org.zip" ? !zipOk(a.text) : !trim(a.text); }

  // The first filler word from Q.vagueWords in the text, as the member typed
  // it, or "". Whole words only, in any capitals.
  function vagueWord(Q, text) {
    var words = Q.vagueWords || [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var m = new RegExp("(^|[^A-Za-z0-9])(" + w + ")(?![A-Za-z0-9])", "i").exec(text || "");
      if (m) return m[2];
    }
    return "";
  }

  // ---------- Outputs: a number and a year ----------

  // A year is 1900-2099, alone or as a range (2024, 2023-24, 2023-2024), or a
  // fiscal year (FY24, FY 2024, FY2023-24). Digits inside a bigger number
  // (37,260 or 120000) are not a year.
  var FY = /\bFY\s?\d{2}(\d{2})?(\s*[-–—\/]\s*\d{2}(\d{2})?)?(?!\d)/gi;
  var YEAR = /(^|[^\d,.])(19|20)\d{2}(\s*[-–—\/]\s*(19|20)?\d{2})?(?!\d)(?!,\d)/g;

  function hasYear(text) {
    FY.lastIndex = 0; YEAR.lastIndex = 0;
    return FY.test(text || "") || YEAR.test(text || "");
  }
  // A number is any digit left once the years are taken out.
  function hasCount(text) {
    return /\d/.test(String(text || "").replace(FY, " ").replace(YEAR, "$1 "));
  }

  function isOutputs(path) { return /^programs\.\d+\.outputs$/.test(path); }

  // Which wording an Outputs answer needs: "outputNoNumber", "outputNoYear",
  // "outputNoNumberOrYear", or "" when it has both.
  function outputGap(text) {
    var n = hasCount(text), y = hasYear(text);
    return n && y ? "" : !n && !y ? "outputNoNumberOrYear" : !n ? "outputNoNumber" : "outputNoYear";
  }

  // ---------- Duplicate programs ----------

  // Capitals, spaces and punctuation don't count: "Housing Assistance" and
  // "housing  assistance." are the same.
  function same(text) { return String(text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/^ | $/g, ""); }

  // For a program's name or description, the index of the first earlier
  // program with the same text, or -1. Blank answers are never compared.
  function duplicateOf(state, path) {
    var p = path.split(".");
    if (p[0] !== "programs" || (p[2] !== "name" && p[2] !== "description")) return -1;
    var mine = same(state.programs[+p[1]][p[2]].text);
    if (!mine) return -1;
    for (var i = 0; i < +p[1]; i++) if (same(state.programs[i][p[2]].text) === mine) return i;
    return -1;
  }

  function isRequired(Q, path) {
    var p = path.split("."), sec = p[0] === "org" ? section(Q, "org") : p[0] === "programs" ? section(Q, "programs") : null;
    if (!sec) return false;
    var id = p[0] === "org" ? p[1] : p[2];
    for (var i = 0; i < sec.questions.length; i++) if (sec.questions[i].id === id) return !!sec.questions[i].required;
    return false;
  }

  // What a follow-up would ask about: "missing", "vague", "output" (an
  // Outputs answer with no number or no year), "duplicate" (same as an
  // earlier program; needs state) or "" (nothing), in that order.
  function issueOf(Q, path, a, state) {
    if (isRequired(Q, path) && isMissing(path, a)) return "missing";
    if (vagueWord(Q, a.text)) return "vague";
    if (isOutputs(path) && trim(a.text) && outputGap(a.text)) return "output";
    if (state && !a.separate && duplicateOf(state, path) > -1) return "duplicate";
    return "";
  }

  // Every answer on one screen, as paths.
  function answersOn(state, step) {
    var st = steps(state)[step], out = [], id, i;
    if (!st) return out;
    if (st.kind === "org") for (id in state.org) { if (state.org.hasOwnProperty(id)) out.push("org." + id); }
    else if (st.kind === "program") { for (id in state.programs[st.index]) if (state.programs[st.index].hasOwnProperty(id)) out.push("programs." + st.index + "." + id); }
    else if (st.kind === "pain" || st.kind === "benchmarks") for (i = 0; i < state[st.kind].length; i++) out.push(st.kind + "." + i);
    return out;
  }

  // Answers on this screen that need a follow-up (missing or vague) and
  // haven't been skipped or kept.
  function issues(Q, state, step) {
    var all = answersOn(state, step), out = [];
    for (var i = 0; i < all.length; i++) {
      var a = get(state, all[i]);
      if (issueOf(Q, all[i], a, state) && !a.skipped) out.push(all[i]);
    }
    return out;
  }

  // The required questions on one screen, as paths.
  function requiredOn(Q, state, step) {
    var st = steps(state)[step], out = [], qs, prefix;
    if (!st) return out;
    if (st.kind === "org") { qs = section(Q, "org").questions; prefix = "org."; }
    else if (st.kind === "program") { qs = section(Q, "programs").questions; prefix = "programs." + st.index + "."; }
    else return out;
    for (var i = 0; i < qs.length; i++) if (qs[i].required) out.push(prefix + qs[i].id);
    return out;
  }

  // Required answers on this screen that are missing and not skipped.
  function missing(Q, state, step) {
    var req = requiredOn(Q, state, step), out = [];
    for (var i = 0; i < req.length; i++) {
      var a = get(state, req[i]);
      if (isMissing(req[i], a) && !a.skipped) out.push(req[i]);
    }
    return out;
  }

  // Called when the member presses Next: counts one more follow-up for each
  // missing or vague answer and returns them. An empty list means Next can go ahead.
  function ask(Q, state, step) {
    var m = issues(Q, state, step);
    for (var i = 0; i < m.length; i++) {
      var a = get(state, m[i]);
      if (a.asks < MAX_ASKS) a.asks++;
    }
    return m;
  }

  function canSkip(a) { return a.asks >= MAX_ASKS; }
  function skip(state, path) {
    var a = get(state, path);
    if (canSkip(a)) a.skipped = true;
  }

  // A matching program only needs one follow-up: the member can confirm
  // straight away that it is separate. No Unsupported flag; it isn't a figure.
  function canConfirmSeparate(a) { return a.asks >= 1; }
  function confirmSeparate(state, path) {
    var a = get(state, path);
    if (canConfirmSeparate(a)) { a.separate = true; a.asks = 0; }
  }

  // Stores typed text. Fixing the answer clears the skip and the follow-ups,
  // and so does a different problem (a blank answer that becomes "TBD"
  // starts again at the first follow-up). Any edit asks again whether a
  // matching program is separate.
  function setText(Q, state, path, text) {
    var a = get(state, path), before = issueOf(Q, path, a, state);
    if (a.text !== text) a.separate = false;
    a.text = text;
    if (issueOf(Q, path, a, state) !== before || !before) { a.skipped = false; a.asks = 0; }
  }

  function paths(state) {
    var out = [], id, i;
    for (id in state.org) if (state.org.hasOwnProperty(id)) out.push("org." + id);
    for (i = 0; i < state.programs.length; i++)
      for (id in state.programs[i]) if (state.programs[i].hasOwnProperty(id)) out.push("programs." + i + "." + id);
    for (i = 0; i < state.pain.length; i++) out.push("pain." + i);
    for (i = 0; i < state.benchmarks.length; i++) out.push("benchmarks." + i);
    return out;
  }

  // One screen for Organization Info, one per program, then the two optional
  // sections, then the end screen.
  function steps(state) {
    var out = [{ kind: "org" }];
    for (var i = 0; i < state.programs.length; i++) out.push({ kind: "program", index: i });
    out.push({ kind: "pain" }, { kind: "benchmarks" }, { kind: "end" });
    return out;
  }
  function stepOf(state, path) {
    var p = path.split(".");
    if (p[0] === "org") return 0;
    if (p[0] === "programs") return 1 + (+p[1]);
    return state.programs.length + (p[0] === "pain" ? 1 : 2);
  }

  // Every answer that still needs attention, in sheet order. With Q, this
  // includes required answers that are "skipped" or still "blank", and
  // answers that are "vague" or were kept vague ("keptVague"), and Outputs
  // with a gap ("outputNoYear" and so on, plus "Kept" once kept as is).
  function problems(state, Q) {
    var out = [], all = paths(state), req = {}, i, s;
    if (Q) for (s = 0; s < steps(state).length; s++) {
      var r = requiredOn(Q, state, s);
      for (i = 0; i < r.length; i++) req[r[i]] = true;
    }
    for (i = 0; i < all.length; i++) {
      var a = get(state, all[i]);
      if (req[all[i]] && isMissing(all[i], a)) { out.push({ path: all[i], status: a.skipped ? "skipped" : "blank" }); continue; }
      if (Q && vagueWord(Q, a.text)) out.push({ path: all[i], status: a.skipped ? "keptVague" : "vague" });
      else if (Q && issueOf(Q, all[i], a) === "output") out.push({ path: all[i], status: outputGap(a.text) + (a.skipped ? "Kept" : "") });
      else if (Q && issueOf(Q, all[i], a, state) === "duplicate") out.push({ path: all[i], status: "duplicate", other: duplicateOf(state, all[i]) });
      if (!needsLabel(all[i])) continue;
      var st = status(a);
      if (st === "needsLabel" || st === "needsNote" || st === "unsupported") out.push({ path: all[i], status: st });
    }
    return out;
  }

  function addProgram(Q, state) {
    state.programs.push(group(section(Q, "programs").questions));
    return state.programs.length - 1;
  }
  function removeProgram(state, i) {
    if (state.programs.length > 1) state.programs.splice(i, 1);
  }
  function addItem(state, list) { state[list].push(answer()); }
  // A list always keeps one row; removing the last one just clears it.
  function removeItem(state, list, i) {
    if (state[list].length > 1) state[list].splice(i, 1);
    else state[list][0] = answer();
  }

  function save(state, storage) {
    try { (storage || window.localStorage).setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }
  function load(Q, storage) {
    var data = null;
    try { data = JSON.parse((storage || window.localStorage).getItem(STORE) || "null"); } catch (e) {}
    return repair(Q, data);
  }
  function clear(storage) {
    try { (storage || window.localStorage).removeItem(STORE); } catch (e) {}
  }

  return {
    section: section, blank: blank, repair: repair, get: get, trim: trim,
    hasNumber: hasNumber, zipOk: zipOk, status: status, needsLabel: needsLabel,
    isMissing: isMissing, requiredOn: requiredOn, missing: missing, ask: ask, canSkip: canSkip, skip: skip, setText: setText,
    vagueWord: vagueWord, isRequired: isRequired, issueOf: issueOf, answersOn: answersOn, issues: issues,
    hasYear: hasYear, hasCount: hasCount, outputGap: outputGap,
    same: same, duplicateOf: duplicateOf, canConfirmSeparate: canConfirmSeparate, confirmSeparate: confirmSeparate,
    paths: paths, steps: steps, stepOf: stepOf, problems: problems,
    addProgram: addProgram, removeProgram: removeProgram, addItem: addItem, removeItem: removeItem,
    save: save, load: load, clear: clear
  };
})();
