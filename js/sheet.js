/*
  Stores the member's answers with their labels, and saves the draft in the
  member's own browser. No screen code lives here, so it can be tested alone.

  Each answer is { text, label, note }. label is "", "known", "estimate" or
  "unsupported". Known and Reasonable estimate both need a note (the source).
*/
var FACSheet = (function () {
  var STORE = "fac-prompt-sheet-draft-v1";

  function trim(s) { return String(s || "").replace(/^\s+|\s+$/g, ""); }
  function answer() { return { text: "", label: "", note: "" }; }

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

  // Every answer whose figure still needs attention, in sheet order.
  function problems(state) {
    var out = [], all = paths(state);
    for (var i = 0; i < all.length; i++) {
      if (!needsLabel(all[i])) continue;
      var st = status(get(state, all[i]));
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
    paths: paths, steps: steps, stepOf: stepOf, problems: problems,
    addProgram: addProgram, removeProgram: removeProgram, addItem: addItem, removeItem: removeItem,
    save: save, load: load, clear: clear
  };
})();
