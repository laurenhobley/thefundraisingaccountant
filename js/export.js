/*
  Builds the finished prompt in FAC's sheet format, as plain text: the
  member's answers with their labels, any "same group" notes, then FAC's
  Final Prompt word for word, then the guardrail line.

  Every number in it is one the member typed. Labels:
  - Known with a source: "(source: ...)", no tag.
  - Reasonable estimate with a source: "[Estimate] (source: ...)".
  - Unsupported, no label yet, or a label missing its source: "[Unsupported]".
  - An answer kept as is or skipped (blank, vague, no number or year, a
    calculation that doesn't add up): "[Unsupported]".
*/
var FACExport = (function () {
  var S = FACSheet;
  var FILE_NAME = "roi-bot-prompt-sheet.txt";
  var UNSUPPORTED = "[Unsupported]";

  // One answer as it appears in the prompt: the text, then its tags.
  function answerText(Q, state, path) {
    var a = S.get(state, path), text = S.trim(a.text), tags = [];
    var kept = a.skipped && S.baseIssue(Q, path, a);
    if (S.needsLabel(path) && S.hasNumber(text)) {
      var note = S.trim(a.note), source = Q.exportText.source.replace(/\{note\}/g, function () { return note; });
      if (a.label === "known" && note) tags.push(source);
      else if (a.label === "estimate" && note) tags.push(Q.labels.estimate.tag, source);
      else tags.push(UNSUPPORTED);
    }
    if (kept && tags.indexOf(UNSUPPORTED) < 0) tags.push(UNSUPPORTED);
    return [text].concat(tags).join(" ").replace(/^\s+|\s+$/g, "");
  }

  function line(label, value) { return (label + ": " + value).replace(/\s+$/, ""); }

  function labelOf(q) { return q.label + (q.note ? " " + q.note : ""); }

  function programName(Q, i) { return S.section(Q, "programs").itemLabel + " " + (i + 1); }

  function build(Q, state) {
    var L = [], org = S.section(Q, "org"), prog = S.section(Q, "programs");
    function q(sec, id) { return sec.questions.filter(function (x) { return x.id === id; })[0]; }

    L.push(org.title);
    L.push(line(q(org, "name").label, answerText(Q, state, "org.name")));
    L.push(line(Q.exportText.location, [answerText(Q, state, "org.city"), answerText(Q, state, "org.zip")].join(" ")
      .replace(/\[Unsupported\] \[Unsupported\]/, UNSUPPORTED)));
    ["website", "mission", "keywords"].forEach(function (id) { L.push(line(q(org, id).label, answerText(Q, state, "org." + id))); });
    L.push("");

    L.push(prog.title + " " + prog.note);
    state.programs.forEach(function (p, i) {
      prog.questions.forEach(function (x, k) {
        var text = line(labelOf(x), answerText(Q, state, "programs." + i + "." + x.id));
        L.push(k === 0 ? (i + 1) + ". " + text : "   * " + text);
      });
    });

    ["pain", "benchmarks"].forEach(function (id) {
      var sec = S.section(Q, id);
      L.push("");
      L.push(sec.title + " " + sec.note);
      state[id].forEach(function (a, i) {
        if (S.trim(a.text)) L.push("* " + answerText(Q, state, id + "." + i));
      });
    });

    var groups = S.sameGroups(state);
    if (groups.length) {
      L.push("");
      groups.forEach(function (g) {
        L.push(Q.exportText.sameGroup
          .replace(/\{program\}/g, programName(Q, +g.path.split(".")[1]))
          .replace(/\{other\}/g, programName(Q, g.other))
          .replace(/\{number\}/g, function () { return g.value; }));
      });
    }

    L.push("", Q.finalPrompt, "", Q.guardrail);
    return L.join("\n");
  }

  return { build: build, answerText: answerText, FILE_NAME: FILE_NAME };
})();
