/*
  Builds the finished prompt as plain text, in RTCC parts: Context (the
  member's answers in FAC's sheet format, with their labels and any "same
  group" notes), Task (FAC's Final Prompt word for word), and Constraints
  (the member's own, then the guardrail line). Role is added once FAC writes it.

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
    var kept = a.skipped && S.baseIssue(Q, path, a, state);
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

  // The prompt in RTCC parts: Role (only once FAC writes it), Context (the
  // member's sheet), Task (FAC's Final Prompt, which says "Using the
  // information above", so it follows the Context), then Constraints (the
  // member's tone, length, format and audience, ending with the guardrail line).
  // The member can change the Role, Task and Constraints on the review
  // screen. The guardrail line always ends the prompt and can't be changed.
  function build(Q, state) {
    var R = Q.rtcc, P = parts(Q, state), out = [];
    if (S.trim(P.role)) out.push(R.roleHeading + ":", S.trim(P.role), "");
    out.push(R.contextHeading + ":", context(Q, state), "");
    out.push(R.taskHeading + ":", S.trim(P.task), "");
    out.push(R.constraintsHeading + ":");
    if (S.trim(P.constraints)) out.push(S.trim(P.constraints));
    out.push(Q.guardrail);
    return out.join("\n");
  }

  // FAC's wording for each part, or the member's own once they edit it.
  function defaults(Q, state) {
    return {
      role: Q.rtcc.role,
      task: Q.finalPrompt,
      // The member's constraint answers, then FAC's 10 rules for AI.
      constraints: S.section(Q, "constraints").questions.map(function (x) {
        var text = answerText(Q, state, "constraints." + x.id);
        return text ? line(x.label, text) : "";
      }).filter(function (t) { return t; }).concat((Q.rtcc.rules || []).map(function (r) { return "- " + r; })).join("\n")
    };
  }
  function parts(Q, state) {
    var D = defaults(Q, state), E = state.rtcc || {};
    return { role: E.role != null ? E.role : D.role, task: E.task != null ? E.task : D.task, constraints: E.constraints != null ? E.constraints : D.constraints };
  }

  // The Why Now sentences, filled with the member's own answers as typed.
  // Nothing is calculated; a missing number shows as a blank line.
  function whyNow(Q, state) {
    var W = Q.why, w = state.why, out = [];
    var amount = S.trim(w.lost.text).replace(/^\$\s*/, ""), pct = S.trim(w.demandPct.text).replace(/\s*%$/, "");
    var unserved = S.trim(w.unserved.text) || W.blank;
    function fill(t, values) { return t.replace(/\{(\w+)\}/g, function (m, k) { return values[k]; }); }
    if (amount) out.push(fill(W.lossSentence, { amount: amount, unserved: unserved }));
    if (pct) out.push(fill(W.demandSentence, { pct: pct, unserved: unserved }));
    return out;
  }

  // Step 2's answers: the pain statement, the donor tables and the magic wand.
  // Only what the member filled in.
  function step2(Q, state, L) {
    var why = S.section(Q, "why"), types = Q.why.types.filter(function (t) { return state.whyTypes.indexOf(t.id) > -1; });
    var whyLines = [];
    why.questions.forEach(function (x) {
      var text = answerText(Q, state, "why." + x.id);
      if (text) whyLines.push("* " + line(x.label, text));
      if (x.id === "lost" && types.length) whyLines.push("* " + line(Q.why.typesLabel, types.map(function (t) { return t.label; }).join(", ")));
    });
    if (whyLines.length) { L.push("", Q.why.exportTitle); L.push.apply(L, whyLines); }

    var D = Q.donors, C = D.columns;
    ["regular", "major"].forEach(function (t) {
      var rows = state.donors[t].map(function (r, i) {
        var path = "donors." + t + "." + i + ".", parts = [];
        var amount = S.trim(r.amount.text).replace(/^\$\s*/, "");
        if (amount) parts.push(line(C.amount.replace(/\s*\(\$\)$/, ""), "$" + amount));
        ["funds", "result", "words"].forEach(function (k) { var v = answerText(Q, state, path + k); if (v) parts.push(line(C[k], v)); });
        return parts.length ? "* " + parts.join("; ") : "";
      }).filter(function (x) { return x; });
      if (rows.length) { L.push("", D[t].title + " " + D.draftNote); L.push.apply(L, rows); }
    });

    var W = Q.wand, wl = [];
    var prog = answerText(Q, state, "wand.program"), amt = S.trim(state.wand.amount.text).replace(/^\$\s*/, ""), possible = answerText(Q, state, "wand.possible");
    if (prog) wl.push("* " + line(W.program, prog));
    if (amt) wl.push("* " + line(W.amount.replace(/\s*\(\$\)$/, ""), "$" + amt));
    if (possible) wl.push("* " + line(W.possible, possible));
    if (wl.length) { L.push("", W.exportTitle); L.push.apply(L, wl); }
  }

  // The member's answers in FAC's sheet format.
  function context(Q, state) {
    var L = [], org = S.section(Q, "org"), prog = S.section(Q, "programs");
    function q(sec, id) { return sec.questions.filter(function (x) { return x.id === id; })[0]; }

    L.push(org.title);
    L.push(line(q(org, "name").label, answerText(Q, state, "org.name")));
    L.push(line(Q.exportText.location, [answerText(Q, state, "org.city"), answerText(Q, state, "org.zip")].join(" ")
      .replace(/\[Unsupported\] \[Unsupported\]/, UNSUPPORTED)));
    ["website", "mission", "keywords"].forEach(function (id) { L.push(line(q(org, id).label, answerText(Q, state, "org." + id))); });
    L.push("");

    // Only programs above the red line, if the member stack ranked them.
    var k = S.included(state);
    L.push(prog.title + " " + prog.note);
    state.programs.slice(0, k).forEach(function (p, i) {
      prog.questions.forEach(function (x, k) {
        var text = line(labelOf(x), answerText(Q, state, "programs." + i + "." + x.id));
        L.push(k === 0 ? (i + 1) + ". " + text : "   * " + text);
      });
    });

    ["pain", "benchmarks"].forEach(function (id) {
      var sec = S.section(Q, id);
      L.push("");
      L.push(sec.title + " " + sec.note);
      var B = Q.benchmarkFields;
      state[id].forEach(function (a, i) {
        if (!S.trim(a.text)) return;
        L.push("* " + answerText(Q, state, id + "." + i));
        // A benchmark's source, program and how it connects, when filled in.
        if (id === "benchmarks") [["src", B.source], ["prog", B.program], ["how", B.connects]].forEach(function (f) {
          if (S.trim(a[f[0]])) L.push("   * " + line(f[1].exportLabel, S.trim(a[f[0]])));
        });
      });
    });

    step2(Q, state, L);

    var groups = S.sameGroups(state).filter(function (g) { return +g.path.split(".")[1] < k && g.other < k; });
    if (groups.length) {
      L.push("");
      groups.forEach(function (g) {
        L.push(Q.exportText.sameGroup
          .replace(/\{program\}/g, programName(Q, +g.path.split(".")[1]))
          .replace(/\{other\}/g, programName(Q, g.other))
          .replace(/\{number\}/g, function () { return g.value; }));
      });
    }

    return L.join("\n");
  }

  // ---------- Step 3 ----------

  var PACKAGE_FILE = "roi-bot-package.txt";

  // One step's prompt: FAC's line from the workbook, that step's inputs (only
  // the ones filled in, with their labels), then the guardrail line.
  // The member's own 3.4 boxes, in order.
  var ROI_ASK = ["investment", "value", "roi", "everyDollar", "ask", "timeframe"];

  function stepPrompt(Q, state, part) {
    var T = Q.story[part], L = [T.prompt, ""];
    function add(label, path) { var t = answerText(Q, state, path); if (t) L.push(line(label, t)); }
    if (part === "challenge") {
      var I = T.inputs;
      var types = Q.why.types.filter(function (t) { return state.whyTypes.indexOf(t.id) > -1; }).map(function (t) { return t.label; });
      var lost = answerText(Q, state, "why.lost");
      if (lost && lost.charAt(0) !== "$") lost = "$" + lost;
      if (lost || types.length) L.push(line(I.lost, [lost, types.length ? "(" + types.join(", ") + ")" : ""].join(" ").replace(/^\s+|\s+$/g, "")));
      add(I.unserved, "why.unserved");
      var demand = [answerText(Q, state, "why.demandPct"), answerText(Q, state, "why.demandServices")].filter(function (x) { return x; }).join("; ");
      if (demand) L.push(line(I.demand, demand));
      var served = [answerText(Q, state, "why.served"), answerText(Q, state, "why.period")].filter(function (x) { return x; }).join(" ");
      if (served) L.push(line(I.served, served));
      add(I.keyFact, "story.keyFact");
    } else if (part === "response") {
      var R = T.inputs;
      state.programs.slice(0, S.included(state)).forEach(function (p, i) {
        if (i) L.push("");
        add(R.name, "programs." + i + ".name"); add(R.description, "programs." + i + ".description");
        add(R.outputs, "programs." + i + ".outputs"); add(R.impact, "programs." + i + ".impact");
      });
    } else {
      var F = Q.story.fields;
      (part === "outcome" ? ["clientStory", "clientQuote", "secondQuote"] : ROI_ASK).forEach(function (id) {
        add(F[id].label, "story." + id);
      });
    }
    L.push("", Q.guardrail);
    return L.join("\n").replace(/\n{3,}/g, "\n\n");
  }

  // The funder story: each part is the member's own edit, or their latest
  // ROI.bot answer for that part.
  function funderPart(state, part) { return state.funder[part] != null ? state.funder[part] : S.latest(state, part); }
  function funderText(Q, state) {
    var P = Q.story.funder.parts;
    return S.STORY_PARTS.map(function (k) { return S.trim(funderPart(state, k)) ? P[k] + ":\n" + S.trim(funderPart(state, k)) : ""; })
      .filter(function (x) { return x; }).join("\n\n");
  }

  // The second Why Now sentence, once the member has filled in all three blanks.
  function investSentence(Q, state) {
    var s = state.story, v = { program: S.trim(s.investProgram.text), outcomes: S.trim(s.investOutcomes.text), dollars: answerText(Q, state, "story.investDollars") };
    if (!v.program || !v.outcomes || !v.dollars) return "";
    return Q.story.funder.investSentence.replace(/\{(\w+)\}/g, function (m, k) { return v[k]; });
  }

  // Everything the member made, in one file (FAC's process guide: "What the
  // member walks away with"). ROI.bot's answers are marked as ROI.bot's.
  function packageText(Q, state) {
    var P = Q.packageText, H = P.sections, out = [], org = S.trim(state.org.name.text);
    function section(title, body) { if (S.trim(body)) out.push("== " + title + " ==", S.trim(body), ""); }
    out.push(P.heading + (org ? ": " + org : ""), "");
    section(H.prompt, build(Q, state));
    section(H.whyNow, whyNow(Q, state).concat(investSentence(Q, state) ? [investSentence(Q, state)] : []).join("\n"));
    var k = S.included(state);
    section(H.programs, state.programs.map(function (p, i) {
      return (i + 1) + ". " + (S.trim(p.name.text) || Q.flow.empty) + (i >= k ? " (" + Q.rank.belowLine + ")" : "");
    }).join("\n"));
    if (state.rank.use === "yes") {
      // Each driver under the member's own name for it, then Money.
      var cols = Q.rank.columns.map(function (c) { return { id: c.id, name: c.named ? S.trim(state.rank.names[c.id]) || c.label : c.label }; });
      section(H.rank, state.programs.map(function (p, i) {
        var row = state.rankRows[i];
        return (S.trim(p.name.text) || Q.flow.empty) + ": " + cols.map(function (m) { return m.name + " " + (row.m[m.id] || Q.flow.empty); }).join(", ") +
          "; " + Q.rank.scoreLabel + " " + (S.trim(row.score) || Q.flow.empty);
      }).join("\n"));
    }
    // The member's own ROI and ask (with the "For every $1" line), not ROI.bot's.
    section(H.roiAsk, ROI_ASK.map(function (id) {
      var t = answerText(Q, state, "story." + id);
      return t ? line(Q.story.fields[id].label, t) : "";
    }).filter(function (x) { return x; }).join("\n"));
    var parts = S.STORY_PARTS.map(function (p) { return S.trim(S.latest(state, p)) ? Q.story.funder.parts[p] + ":\n" + S.trim(S.latest(state, p)) : ""; }).filter(function (x) { return x; });
    if (parts.length) section(H.story, Q.story.fromRoibot + "\n\n" + parts.join("\n\n"));
    section(H.funder, funderText(Q, state));
    var C = Q.actions.columns;
    section(H.actions, state.actions.map(function (a) {
      var bits = ["assignee", "title", "date", "status"].filter(function (x) { return S.trim(a[x]); }).map(function (x) { return line(C[x], S.trim(a[x])); });
      return bits.length ? "* " + bits.join("; ") : "";
    }).filter(function (x) { return x; }).join("\n"));
    section(H.assess, Q.assess.statements.map(function (st, i) { return state.assess.ratings[i] ? "* " + st + " " + state.assess.ratings[i] + "/5" : ""; })
      .filter(function (x) { return x; }).concat(S.trim(state.assess.takeaway) ? [line(Q.assess.takeaway, S.trim(state.assess.takeaway))] : []).join("\n"));
    return out.join("\n").replace(/\n+$/, "") + "\n";
  }

  return {
    build: build, answerText: answerText, defaults: defaults, parts: parts, whyNow: whyNow, FILE_NAME: FILE_NAME,
    stepPrompt: stepPrompt, funderPart: funderPart, funderText: funderText, investSentence: investSentence, packageText: packageText, PACKAGE_FILE: PACKAGE_FILE
  };
})();
