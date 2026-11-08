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
  // one with the same name or description. overlap: for a number shared with
  // an earlier program's Outputs, "different" or "same" group.
  // src, prog and how are a benchmark's source, the program it connects to
  // (by name) and how it connects (FAC's process guide, form 2.3).
  function answer() { return { text: "", label: "", note: "", asks: 0, skipped: false, separate: false, overlap: "", src: "", prog: "", how: "" }; }

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
      reviewed: false,
      org: group(section(Q, "org").questions),
      programs: [group(section(Q, "programs").questions)],
      pain: [answer()],
      benchmarks: [answer()],
      constraints: group(section(Q, "constraints").questions),
      // Each prompt the member copied or downloaded: { n, at, text }.
      versions: [],
      // Optional stack rank. use: "", "yes" or "no". names: what the member
      // calls Driver 1-3. line: how many programs are above the red line
      // (null means all of them). rankRows[i] goes with programs[i]:
      // { m: { d1, d2, d3, money: "1".."3" }, score: "the Stack Rank the member typed" }.
      rank: { use: "", names: driverNames(), line: null },
      rankRows: [rankRow()],
      // The member's own wording for the prompt's Role, Task and
      // Constraints, edited on the review screen. null means FAC's wording
      // (or, for Constraints, the member's constraint answers).
      rtcc: { role: null, task: null, constraints: null },
      // Step 2 (FAC's workshop workbook): the pain statement questions and
      // types of loss, the Regular and Major donor tables, and the magic wand.
      why: group(section(Q, "why").questions),
      whyTypes: [],
      donors: { regular: [donorRow(), donorRow(), donorRow(), donorRow()], major: [donorRow(), donorRow(), donorRow(), donorRow()] },
      wand: { program: answer(), amount: answer(), possible: answer() },
      // Step 3: the member's own inputs (story.*), what they pasted back from
      // ROI.bot for each part (rounds kept so they can compare), their
      // funder story (null = their latest ROI.bot answer), next steps and
      // the self-assessment.
      story: group(storyIds.map(function (id) { return { id: id }; })),
      storyApproved: false,
      storyOut: { challenge: storyOut(), response: storyOut(), outcome: storyOut(), roi: storyOut() },
      funder: { challenge: null, response: null, outcome: null, roi: null },
      actions: [action(), action(), action()],
      assess: { ratings: ["", "", ""], takeaway: "" },
      pkgReviewed: false
    };
  }

  var storyIds = ["keyFact", "clientStory", "clientQuote", "secondQuote", "investment", "value", "roi", "everyDollar", "ask", "timeframe", "investProgram", "investOutcomes", "investDollars"];
  var STORY_PARTS = ["challenge", "response", "outcome", "roi"];
  // choice: "", "keep" or "revise" (FAC's process guide: keep or revise each part).
  function storyOut() { return { draft: "", rounds: [], choice: "" }; }
  function action() { return { assignee: "", title: "", date: "", status: "" }; }

  // A new paste from ROI.bot becomes a new round, unless it's the same as the last.
  function addRound(state, part, text) {
    var o = state.storyOut[part], last = o.rounds[o.rounds.length - 1];
    o.draft = text;
    if (!trim(text) || (last && last.text === text)) return false;
    o.rounds.push({ n: (last ? last.n : 0) + 1, text: text });
    return true;
  }
  function latest(state, part) { var r = state.storyOut[part].rounds; return r.length ? r[r.length - 1].text : ""; }

  function donorRow() { return { amount: answer(), funds: answer(), result: answer(), words: answer() }; }

  function rankRow() { return { m: {}, score: "" }; }
  // FAC's stack ranking template: three drivers the member names, plus
  // Money. The same ids as Q.rank.columns, which holds their wording.
  var DRIVERS = ["d1", "d2", "d3"], RANK_COLUMNS = DRIVERS.concat("money");
  function driverNames() { return { d1: "", d2: "", d3: "" }; }

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
      if (from.overlap === "different" || from.overlap === "same") a.overlap = from.overlap;
      ["src", "prog", "how"].forEach(function (k) { if (typeof from[k] === "string") a[k] = from[k]; });
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
    if (data.reviewed === true) s.reviewed = true;
    copyGroup(s.constraints, data.constraints);
    ["role", "task", "constraints"].forEach(function (k) { if (data.rtcc && typeof data.rtcc[k] === "string") s.rtcc[k] = data.rtcc[k]; });
    copyGroup(s.why, data.why);
    var typeIds = (Q.why.types || []).map(function (t) { return t.id; });
    if (data.whyTypes && data.whyTypes.length) s.whyTypes = data.whyTypes.filter(function (id) { return typeIds.indexOf(id) > -1; });
    ["regular", "major"].forEach(function (t) {
      var rows = data.donors && data.donors[t];
      if (rows && rows.length) s.donors[t] = rows.map(function (r) { return copyGroup(donorRow(), r); });
    });
    copyGroup(s.wand, data.wand);
    copyGroup(s.story, data.story);
    if (data.storyApproved === true) s.storyApproved = true;
    STORY_PARTS.forEach(function (p) {
      var from = data.storyOut && data.storyOut[p], to = s.storyOut[p];
      if (from) {
        if (typeof from.draft === "string") to.draft = from.draft;
        if (from.choice === "keep" || from.choice === "revise") to.choice = from.choice;
        // Drafts from before Keep or revise had an "I'm happy with this part" tick.
        else if (from.happy === true) to.choice = "keep";
        (from.rounds || []).forEach(function (r) { if (r && typeof r.n === "number" && typeof r.text === "string") to.rounds.push({ n: r.n, text: r.text }); });
      }
      if (data.funder && typeof data.funder[p] === "string") s.funder[p] = data.funder[p];
    });
    if (data.actions && data.actions.length) s.actions = data.actions.slice(0, 3).map(function (a) {
      var x = action();
      for (var k in x) if (a && typeof a[k] === "string") x[k] = a[k];
      return x;
    });
    while (s.actions.length < 3) s.actions.push(action());
    if (data.assess) {
      if (data.assess.ratings) s.assess.ratings = [0, 1, 2].map(function (i) { var v = data.assess.ratings[i]; return /^[1-5]$/.test(v) ? v : ""; });
      if (typeof data.assess.takeaway === "string") s.assess.takeaway = data.assess.takeaway;
    }
    if (data.pkgReviewed === true) s.pkgReviewed = true;
    // A draft from before the four columns (it has no driver names) keeps
    // its yes/no and red line, but not its scores: the columns changed.
    var R = data.rank || {}, current = !!R.names;
    if (R.use === "yes" || R.use === "no") s.rank.use = R.use;
    if (current) DRIVERS.forEach(function (id) { if (typeof R.names[id] === "string") s.rank.names[id] = R.names[id]; });
    if (typeof R.line === "number" && R.line >= 1) s.rank.line = Math.floor(R.line);
    s.rankRows = s.programs.map(function (p, n) {
      var from = current && (data.rankRows || [])[n], row = rankRow();
      if (from && from.m) RANK_COLUMNS.forEach(function (id) { if (/^[123]$/.test(from.m[id])) row.m[id] = from.m[id]; });
      if (from && typeof from.score === "string") row.score = from.score;
      return row;
    });
    if (data.versions && data.versions.length) for (i = 0; i < data.versions.length; i++) {
      var v = data.versions[i];
      if (v && typeof v.n === "number" && typeof v.at === "string" && typeof v.text === "string") s.versions.push({ n: v.n, at: v.at, text: v.text });
    }
    return s;
  }

  // Keeps a copy of a prompt the member copied or downloaded, unless it's
  // the same as the last one kept. Returns the version.
  function addVersion(state, text, at) {
    var last = state.versions[state.versions.length - 1];
    if (last && last.text === text) return last;
    var v = { n: (last ? last.n : 0) + 1, at: at, text: text };
    state.versions.push(v);
    return v;
  }

  // Paths look like "org.zip", "programs.1.outputs", "pain.0", "constraints.tone",
  // "why.lost", "donors.regular.0.result" or "wand.possible".
  function get(state, path) {
    var p = path.split(".");
    if (p[0] === "org" || p[0] === "constraints" || p[0] === "why" || p[0] === "wand" || p[0] === "story") return state[p[0]][p[1]];
    if (p[0] === "donors") return state.donors[p[1]][+p[2]][p[3]];
    if (p[0] === "programs") return state.programs[+p[1]][p[2]];
    return state[p[0]][+p[1]];
  }

  // "24/7" (or 24x7, 24-7) is a schedule, not a figure.
  var ROUND_CLOCK = /\b24\s?[\/x×-]\s?7\b/gi;
  function figures(text) { return String(text || "").replace(ROUND_CLOCK, " "); }

  function hasNumber(text) { return /\d/.test(figures(text)); }
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
  // Nor are constraints ("about 300 words" is an instruction, not a figure).
  // In the donor tables, only the Tangible Result is a claim that needs a
  // source; investment amounts are the member's own ask levels. The same
  // goes for the magic wand's program and amount.
  function needsLabel(path) {
    if (path === "org.zip" || path.indexOf("constraints.") === 0 || path === "wand.program" || path === "wand.amount") return false;
    if (path.indexOf("donors.") === 0) return /\.result$/.test(path);
    // Step 3: only the figures that are claims (the key fact, the value
    // created and the dollars saved) need a source.
    if (path.indexOf("story.") === 0) return ["story.keyFact", "story.value", "story.investDollars"].indexOf(path) > -1;
    return true;
  }

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

  // True when an optional answer's filler word means "nothing here"
  // (Q.notNeededWords, e.g. "N/A"), so the follow-up suggests leaving it blank.
  function notNeeded(Q, path, a) {
    var w = vagueWord(Q, a.text).toLowerCase();
    return !!w && !isRequired(Q, path) && (Q.notNeededWords || []).some(function (x) { return x.toLowerCase() === w; });
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
    return /\d/.test(figures(text).replace(FY, " ").replace(YEAR, "$1 "));
  }

  function isOutputs(path) { return /^programs\.\d+\.outputs$/.test(path); }

  // Which wording an Outputs answer needs: "outputNoNumber", "outputNoYear",
  // "outputNoNumberOrYear", or "" when it has both.
  function outputGap(text) {
    var n = hasCount(text), y = hasYear(text);
    return n && y ? "" : !n && !y ? "outputNoNumberOrYear" : !n ? "outputNoNumber" : "outputNoYear";
  }

  // ---------- Arithmetic check ----------

  // Checks only the member's own math. It never works out a figure to show.
  // Tokens: a number ($ and commas allowed, % marks a percentage), an
  // operator, "=" or "≈", a word, the end of a sentence, or anything else.
  var MATH_TOKEN = /(\$?\s?\d[\d,]*(?:\.\d+)?%?)|([×*÷\/+\-−–])|([=≈~])|([A-Za-z][A-Za-z'’]*)|([.;:!?\n])|(\S)/g;

  // Multiplying and dividing before adding and subtracting.
  function evaluate(nums, ops) {
    var n = [nums[0]], o = [];
    for (var i = 0; i < ops.length; i++) {
      var b = nums[i + 1];
      if (ops[i] === "×" || ops[i] === "*") n[n.length - 1] *= b;
      else if (ops[i] === "÷" || ops[i] === "/") n[n.length - 1] /= b;
      else { o.push(ops[i]); n.push(b); }
    }
    var r = n[0];
    for (var j = 0; j < o.length; j++) r = o[j] === "+" ? r + n[j + 1] : r - n[j + 1];
    return r;
  }

  // The calculations written in an answer, like "414 clients × 90 days × $50
  // = $1,863,000", each as { quote, ok }. Words may sit between the numbers.
  // "$50/day" is "per day": "/" only divides when a number follows it. The
  // result must match exactly, to as many decimals as are written. A
  // calculation with a % in it is left alone.
  function calculations(text) {
    var t = String(text || ""), out = [], re = new RegExp(MATH_TOKEN.source, "g"), m;
    var nums, ops, op, start, words, pct, want, skips;
    function reset() { nums = []; ops = []; op = null; start = -1; words = 0; pct = false; want = false; skips = 0; }
    // "$1.6 million" (or 1.6M, 2 thousand, 3K, 1 billion) counts as 1,600,000.
    function scale(at) {
      var w = /^\s*(million|billion|thousand|m|b|k)\b/i.exec(t.slice(at));
      if (!w) return 1;
      var s = w[1].toLowerCase();
      return s === "thousand" || s === "k" ? 1e3 : s === "million" || s === "m" ? 1e6 : 1e9;
    }
    function val(s, at) { return parseFloat(s.replace(/[$,\s%]/g, "")) * scale(at); }
    reset();
    while ((m = re.exec(t))) {
      if (want) {
        // After "=": the next number is the written result. Skips "≈", "$" or bold marks.
        if (m[1]) {
          var written = m[1].replace(/,+$/, ""), end = m.index + written.length, x = scale(end);
          if (!pct && written.indexOf("%") < 0) {
            // Exact to the decimals written; a scaled result ("1.6 million") to the whole number.
            var f = x > 1 ? 1 : Math.pow(10, (written.split(".")[1] || "").length);
            var unit = x > 1 ? /^\s*\S+/.exec(t.slice(end))[0] : "";
            out.push({
              quote: t.slice(start, end + unit.length).replace(/^\s+/, ""),
              ok: Math.abs(Math.round(evaluate(nums, ops) * f) / f - Math.round(val(written, end) * f) / f) < 1e-9
            });
          }
          reset();
        } else if (m[5] || ++skips > 3) reset();
        continue;
      }
      if (m[1]) {
        var at = m.index + m[1].length;
        if (nums.length && op) { ops.push(op); nums.push(val(m[1], at)); op = null; }
        else { reset(); start = m.index; nums.push(val(m[1], at)); }
        if (m[1].indexOf("%") > -1) pct = true;
        words = 0;
      } else if (m[2] || (m[4] && /^x$/i.test(m[4]) && nums.length && !op)) {
        var o = m[2] ? m[2].replace(/[\-−–]/, "-") : "×";
        if (!nums.length || op) { reset(); continue; }
        if (o === "/" && !/^\s*\$?\s?\d/.test(t.slice(m.index + 1))) { words++; continue; }
        op = o === "x" ? "×" : o; words = 0;
      } else if (m[3]) {
        if (nums.length > 1 && !op) { want = true; skips = 0; } else reset();
      } else if (m[4]) {
        if (nums.length && ++words > 4) reset();
      } else if (m[5]) reset();
    }
    return out;
  }

  // The first calculation in the answer that doesn't add up, quoted, or "".
  function mathProblem(text) {
    var c = calculations(text);
    for (var i = 0; i < c.length; i++) if (!c[i].ok) return c[i].quote;
    return "";
  }

  // ---------- "If..." assumptions ----------

  // An answer with an assumption word ("if") and a figure (years don't
  // count). Whole words only, so "even if" counts but "gift" doesn't.
  function isAssumption(Q, path, a) {
    if (!needsLabel(path) || !hasCount(a.text)) return false;
    var words = Q.assumptionWords || [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp("(^|[^A-Za-z0-9])" + w + "(?![A-Za-z0-9])", "i").test(a.text)) return true;
    }
    return false;
  }

  // Settled once the label box has a source (Known or Reasonable estimate
  // with a note) or says Unsupported.
  function assumptionOpen(Q, path, a) {
    var st = status(a);
    return isAssumption(Q, path, a) && (st === "needsLabel" || st === "needsNote");
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

  // ---------- The same count in two programs ----------

  // The numbers in an answer, leaving out years and anything under 10.
  // Commas don't matter (1,680 = 1680). Dollars are only compared with
  // dollars ($831 is not the same as 831 children).
  function numbersIn(text) {
    var t = figures(text).replace(FY, " ").replace(YEAR, "$1 "), out = [], m;
    var re = /(\$\s?)?(\d[\d,]*(?:\.\d+)?)/g;
    while ((m = re.exec(t))) {
      var digits = m[2].replace(/,+$/, ""), value = parseFloat(digits.replace(/,/g, ""));
      if (value < 10) continue;
      out.push({ key: (m[1] ? "$" : "") + value, shown: (m[1] ? "$" : "") + digits });
    }
    return out;
  }

  // For a program's Outputs, the first number it shares with an earlier
  // program's Outputs, as { value, other }, or null.
  function sharedCount(state, path) {
    if (!isOutputs(path)) return null;
    var n = +path.split(".")[1], mine = numbersIn(state.programs[n].outputs.text);
    for (var j = 0; j < mine.length; j++)
      for (var i = 0; i < n; i++) {
        var theirs = numbersIn(state.programs[i].outputs.text);
        for (var k = 0; k < theirs.length; k++) if (theirs[k].key === mine[j].key) return { value: mine[j].shown, other: i };
      }
    return null;
  }

  // Shared numbers the member said are the same group in both programs, so
  // the export can tell ROI.bot not to add them together.
  function sameGroups(state) {
    var out = [];
    for (var i = 0; i < state.programs.length; i++) {
      var path = "programs." + i + ".outputs", s = state.programs[i].outputs.overlap === "same" && sharedCount(state, path);
      if (s) out.push({ path: path, value: s.value, other: s.other });
    }
    return out;
  }

  function isRequired(Q, path) {
    var p = path.split("."), sec = p[0] === "org" ? section(Q, "org") : p[0] === "programs" ? section(Q, "programs") : null;
    if (!sec) return false;
    var id = p[0] === "org" ? p[1] : p[2];
    for (var i = 0; i < sec.questions.length; i++) if (sec.questions[i].id === id) return !!sec.questions[i].required;
    return false;
  }

  // The answer's own problem: "missing", "vague", "output" (an Outputs answer
  // with no number or no year), "math", "dollar" (with state: a "For every
  // $1" line that doesn't match the investment and value) or "", in that
  // order. Skip or Keep my answer settles it (a.skipped).
  function baseIssue(Q, path, a, state) {
    if (isRequired(Q, path) && isMissing(path, a)) return "missing";
    if (vagueWord(Q, a.text)) return "vague";
    if (isOutputs(path) && trim(a.text) && outputGap(a.text)) return "output";
    if (mathProblem(a.text)) return "math";
    if (state && path === "story.everyDollar" && dollarOff(state)) return "dollar";
    return "";
  }

  // ---------- "For every $1" ----------

  // The first dollar figure in a text ($1,500 or $ 1500), as a number, or null.
  function firstDollars(text) {
    var m = /\$\s?(\d[\d,]*(?:\.\d+)?)/.exec(text || "");
    return m ? parseFloat(m[1].replace(/,/g, "")) : null;
  }

  // True when the member's "For every $1, $X" doesn't match their own value
  // created divided by their investment. Checked only when all three have a
  // dollar figure. X may be rounded to as many decimals as the member typed.
  // The right figure is never shown.
  function dollarOff(state) {
    var s = state.story, m = /\$\s?1(?!\d|[,.]\d)[^$]*\$\s?(\d[\d,]*(?:\.(\d+))?)/.exec(s.everyDollar.text || "");
    var inv = firstDollars(s.investment.text), val = firstDollars(s.value.text);
    if (!m || !inv || val === null) return false;
    var typed = parseFloat(m[1].replace(/,/g, "")), places = m[2] ? m[2].length : 0;
    return Math.abs(typed - val / inv) > 0.5 * Math.pow(10, -places) + 1e-9;
  }

  // The next unsettled problem a follow-up should ask about: the answer's
  // own problem, then "assumption" (an "if..." figure with no source), then
  // (with state) "duplicate" (same as an earlier program) and "overlap"
  // (shares a number with an earlier program), or "".
  // A kept answer still gets the later checks.
  function issueOf(Q, path, a, state) {
    var base = baseIssue(Q, path, a, state);
    if (base && !a.skipped) return base;
    if (base === "missing") return "";
    if (assumptionOpen(Q, path, a)) return "assumption";
    if (state && !a.separate && duplicateOf(state, path) > -1) return "duplicate";
    if (state && !a.overlap && sharedCount(state, path)) return "overlap";
    return "";
  }

  // Every answer on one screen, as paths.
  function answersOn(state, step) {
    var st = steps(state)[step], out = [], id, i;
    if (!st) return out;
    if (st.kind === "org") for (id in state.org) { if (state.org.hasOwnProperty(id)) out.push("org." + id); }
    else if (st.kind === "program") { for (id in state.programs[st.index]) if (state.programs[st.index].hasOwnProperty(id)) out.push("programs." + st.index + "." + id); }
    else if (st.kind === "pain" || st.kind === "benchmarks") for (i = 0; i < state[st.kind].length; i++) out.push(st.kind + "." + i);
    else if (st.kind === "constraints" || st.kind === "why" || st.kind === "wand") for (id in state[st.kind]) { if (state[st.kind].hasOwnProperty(id)) out.push(st.kind + "." + id); }
    else if (st.kind === "donors") out = donorPaths(state, st.of);
    else if (st.kind === "story" || st.kind === "funder") out = (STORY_FIELDS[st.of || "funder"] || []).map(function (id) { return "story." + id; });
    return out;
  }

  // Which of Step 3's own boxes sit on which screen.
  var STORY_FIELDS = { challenge: ["keyFact"], response: [], outcome: ["clientStory", "clientQuote", "secondQuote"], roi: ["investment", "value", "roi", "everyDollar", "ask", "timeframe"], funder: ["investProgram", "investOutcomes", "investDollars"] };

  // The donor tables' boxes: one table ("regular" or "major"), or both.
  function donorPaths(state, only) {
    var out = [];
    (only ? [only] : ["regular", "major"]).forEach(function (t) {
      state.donors[t].forEach(function (row, i) { for (var k in row) if (row.hasOwnProperty(k)) out.push("donors." + t + "." + i + "." + k); });
    });
    return out;
  }

  // Answers on this screen with an unsettled problem.
  function issues(Q, state, step) {
    var all = answersOn(state, step), out = [];
    for (var i = 0; i < all.length; i++) if (issueOf(Q, all[i], get(state, all[i]), state)) out.push(all[i]);
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
  // Skipping (or keeping) starts the count again, so a later check on the
  // same answer begins at its first follow-up.
  function skip(state, path) {
    var a = get(state, path);
    if (canSkip(a)) { a.skipped = true; a.asks = 0; }
  }

  // A matching program only needs one follow-up: the member can confirm
  // straight away that it is separate. No Unsupported flag; it isn't a figure.
  function canConfirmSeparate(a) { return a.asks >= 1; }
  function confirmSeparate(state, path) {
    var a = get(state, path);
    if (canConfirmSeparate(a)) { a.separate = true; a.asks = 0; }
  }

  // A shared number also needs one follow-up. "different" (different groups)
  // or "same" (same group, both programs; the export says not to add them).
  function resolveOverlap(state, path, choice) {
    var a = get(state, path);
    if (a.asks >= 1 && (choice === "different" || choice === "same")) { a.overlap = choice; a.asks = 0; }
  }

  // Stores typed text. Fixing the answer clears the skip, and a different
  // problem (a blank answer that becomes "TBD") starts again at the first
  // follow-up. Any edit asks again about a matching program or shared number.
  function setText(Q, state, path, text) {
    var a = get(state, path), baseBefore = baseIssue(Q, path, a, state), before = issueOf(Q, path, a, state);
    if (a.text !== text) { a.separate = false; a.overlap = ""; }
    a.text = text;
    var base = baseIssue(Q, path, a, state), now = issueOf(Q, path, a, state);
    if (base !== baseBefore || !base) a.skipped = false;
    if (now !== before || !now) a.asks = 0;
  }

  // Label and source changes go through here, so a settled assumption
  // starts its follow-up count again for any later check.
  function setLabel(Q, state, path, label) { relabel(Q, state, path, function (a) { a.label = label; }); }
  function setNote(Q, state, path, note) { relabel(Q, state, path, function (a) { a.note = note; }); }
  function relabel(Q, state, path, change) {
    var a = get(state, path), before = issueOf(Q, path, a, state);
    change(a);
    if (issueOf(Q, path, a, state) !== before) a.asks = 0;
  }

  function paths(state) {
    var out = [], id, i;
    for (id in state.org) if (state.org.hasOwnProperty(id)) out.push("org." + id);
    for (i = 0; i < state.programs.length; i++)
      for (id in state.programs[i]) if (state.programs[i].hasOwnProperty(id)) out.push("programs." + i + "." + id);
    for (i = 0; i < state.pain.length; i++) out.push("pain." + i);
    for (i = 0; i < state.benchmarks.length; i++) out.push("benchmarks." + i);
    for (id in state.constraints) if (state.constraints.hasOwnProperty(id)) out.push("constraints." + id);
    for (id in state.why) if (state.why.hasOwnProperty(id)) out.push("why." + id);
    out = out.concat(donorPaths(state));
    for (id in state.wand) if (state.wand.hasOwnProperty(id)) out.push("wand." + id);
    for (id in state.story) if (state.story.hasOwnProperty(id)) out.push("story." + id);
    return out;
  }

  // The screens follow Step 1 of FAC's flowchart: 1.1 Organization Info,
  // 1.2 one screen per program, a "Happy with programs and keywords?"
  // check, Local Context/Data (from FAC's sheet), 1.3 Benchmarks and its check,
  // 1.4 Constraints and its check, then 1.5 the review screen.
  // After the programs comes the optional stack rank.
  function steps(state) {
    var out = [{ kind: "org" }];
    for (var i = 0; i < state.programs.length; i++) out.push({ kind: "program", index: i });
    out.push({ kind: "rank" }, { kind: "check", of: "programs" }, { kind: "pain" }, { kind: "benchmarks" }, { kind: "check", of: "benchmarks" },
      { kind: "constraints" }, { kind: "check", of: "constraints" }, { kind: "end", stage: 1 },
      // Step 2, then the review screen again with Step 2 in the prompt.
      // 2.2 Donate Now and 2.3 Major Donors are the two donor tables, one screen each.
      { kind: "why" }, { kind: "donors", of: "regular" }, { kind: "donors", of: "major" }, { kind: "wand" }, { kind: "end", stage: 2 },
      // Step 3, the member's next steps and self-assessment, then the package.
      { kind: "story", of: "challenge" }, { kind: "story", of: "response" }, { kind: "story", of: "outcome" }, { kind: "story", of: "roi" },
      { kind: "funder" }, { kind: "actions" }, { kind: "assess" }, { kind: "package" });
    return out;
  }
  function stepOf(state, path) {
    var p = path.split("."), n = state.programs.length;
    if (p[0] === "org") return 0;
    if (p[0] === "programs") return 1 + (+p[1]);
    if (p[0] === "story") {
      var at = { challenge: 14, response: 15, outcome: 16, roi: 17, funder: 18 };
      for (var k in STORY_FIELDS) if (STORY_FIELDS[k].indexOf(p[1]) > -1) return n + at[k];
    }
    if (p[0] === "donors") return n + (p[1] === "major" ? 11 : 10);
    return n + ({ rank: 1, pain: 3, benchmarks: 4, constraints: 6, why: 9, wand: 12 })[p[0]];
  }

  // ---------- Step 2 ----------

  function addDonorRow(state, table) { state.donors[table].push(donorRow()); }
  // A table always keeps one row; removing the last one just clears it.
  function removeDonorRow(state, table, i) {
    if (state.donors[table].length > 1) state.donors[table].splice(i, 1);
    else state.donors[table][0] = donorRow();
  }

  // Screen 1 (index.html) saves the organization's name, website and ZIP
  // under this key. The builder takes them into its boxes that are still
  // blank, so nothing is typed twice. Returns how many it filled.
  var SCREEN1 = "roi-screen1-v1";
  function importScreen1(Q, state, s1) {
    if (!s1) return 0;
    var map = { name: "org", website: "website", zip: "zip" }, n = 0;
    for (var id in map) {
      var v = trim(s1[map[id]]);
      if (v && !trim(state.org[id].text)) { setText(Q, state, "org." + id, v); n++; }
    }
    return n;
  }
  function loadScreen1(storage) {
    try { return JSON.parse((storage || window.localStorage).getItem(SCREEN1) || "null"); } catch (e) { return null; }
  }

  // Brings in answers from the live pain statement form's saved draft (same
  // questions), only into boxes that are still blank. Returns how many it filled.
  function importLive(Q, state, live) {
    if (!live) return 0;
    var map = { lost: "lossAmount", unserved: "unserved", servicesLost: "servicesLost", couldNot: "couldNot", demandPct: "demandPct", served: "servedCount", period: "servedPeriod" };
    var n = 0;
    for (var id in map) {
      var v = trim(live[map[id]]);
      if (v && !trim(state.why[id].text)) { setText(Q, state, "why." + id, v); n++; }
    }
    var typeIds = Q.why.types.map(function (t) { return t.id; });
    (live.types || []).forEach(function (t) { if (typeIds.indexOf(t) > -1 && state.whyTypes.indexOf(t) < 0) { state.whyTypes.push(t); n++; } });
    return n;
  }

  // ---------- Stack rank ----------

  // What still stops Next on the stack rank screen: "" (nothing),
  // "needChoice", "needNames", "needScores" or "wrongScore", and the
  // program rows it's about. A Stack Rank must equal the four scores
  // multiplied together; the tool checks it but never fills it in.
  function rankCheck(state) {
    var R = state.rank, rows = [];
    if (!R.use) return { msg: "needChoice", rows: rows };
    if (R.use === "no") return { msg: "", rows: rows };
    if (DRIVERS.some(function (id) { return !trim(R.names[id]); })) return { msg: "needNames", rows: rows };
    state.rankRows.forEach(function (row, i) {
      if (RANK_COLUMNS.some(function (id) { return !row.m[id]; }) || !/^\d+$/.test(trim(row.score))) rows.push(i);
    });
    if (rows.length) return { msg: "needScores", rows: rows };
    state.rankRows.forEach(function (row, i) {
      var product = RANK_COLUMNS.reduce(function (x, id) { return x * +row.m[id]; }, 1);
      if (+trim(row.score) !== product) rows.push(i);
    });
    return { msg: rows.length ? "wrongScore" : "", rows: rows };
  }

  // Puts the programs in order of the scores the member typed, lowest first
  // (1 is best). Only once every score checks out. Ties keep their order.
  function sortByScore(state) {
    if (state.rank.use !== "yes" || rankCheck(state).msg) return false;
    var order = state.programs.map(function (p, i) { return i; });
    order.sort(function (a, b) { return (+trim(state.rankRows[a].score) - +trim(state.rankRows[b].score)) || a - b; });
    state.programs = order.map(function (i) { return state.programs[i]; });
    state.rankRows = order.map(function (i) { return state.rankRows[i]; });
    return true;
  }

  // Where the member might draw the red line (FAC's process guide: "where
  // scores jump"): after the program whose next Stack Rank is the most
  // times bigger, since the scores are multiplied. Only once every Stack
  // Rank checks out and the list is sorted. Returns how many programs are
  // above that line, or 0 for no suggestion (fewer than 2 programs, or no
  // jump at all). Only a suggestion: it never moves the line.
  function suggestLine(state) {
    if (state.rank.use !== "yes" || rankCheck(state).msg) return 0;
    var r = state.rankRows.map(function (row) { return +trim(row.score); }), best = 0, at = 0;
    for (var i = 1; i < r.length; i++) {
      if (r[i] < r[i - 1]) return 0;
      if (r[i] / r[i - 1] > best + 1e-9) { best = r[i] / r[i - 1]; at = i; }
    }
    return best > 1 ? at : 0;
  }

  // How many programs go into the prompt: those above the red line.
  function included(state) {
    var n = state.programs.length;
    return state.rank.use === "yes" && state.rank.line ? Math.min(state.rank.line, n) : n;
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
      var base = Q ? baseIssue(Q, all[i], a, state) : "";
      if (base === "vague") out.push({ path: all[i], status: a.skipped ? "keptVague" : "vague" });
      else if (base === "output") out.push({ path: all[i], status: outputGap(a.text) + (a.skipped ? "Kept" : "") });
      else if (base === "math") out.push({ path: all[i], status: a.skipped ? "keptMath" : "math" });
      else if (base === "dollar") out.push({ path: all[i], status: a.skipped ? "keptDollar" : "dollar" });
      // An open "if..." assumption is listed once, instead of "needs a label".
      var assumed = Q && assumptionOpen(Q, all[i], a);
      if (assumed) out.push({ path: all[i], status: "assumption" });
      if (Q && !a.separate && duplicateOf(state, all[i]) > -1) out.push({ path: all[i], status: "duplicate", other: duplicateOf(state, all[i]) });
      var shared = Q && !a.overlap && sharedCount(state, all[i]);
      if (shared) out.push({ path: all[i], status: "overlap", other: shared.other, value: shared.value });
      if (assumed || !needsLabel(all[i])) continue;
      var st = status(a);
      if (st === "needsLabel" || st === "needsNote" || st === "unsupported") out.push({ path: all[i], status: st });
    }
    return out;
  }

  function addProgram(Q, state) {
    state.programs.push(group(section(Q, "programs").questions));
    state.rankRows.push(rankRow());
    return state.programs.length - 1;
  }
  function removeProgram(state, i) {
    if (state.programs.length > 1) { state.programs.splice(i, 1); state.rankRows.splice(i, 1); }
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
    vagueWord: vagueWord, notNeeded: notNeeded, isRequired: isRequired, issueOf: issueOf, answersOn: answersOn, issues: issues,
    hasYear: hasYear, hasCount: hasCount, outputGap: outputGap,
    same: same, duplicateOf: duplicateOf, canConfirmSeparate: canConfirmSeparate, confirmSeparate: confirmSeparate,
    baseIssue: baseIssue, numbersIn: numbersIn, sharedCount: sharedCount, sameGroups: sameGroups, resolveOverlap: resolveOverlap,
    isAssumption: isAssumption, assumptionOpen: assumptionOpen, setLabel: setLabel, setNote: setNote,
    calculations: calculations, mathProblem: mathProblem,
    paths: paths, steps: steps, stepOf: stepOf, problems: problems, addVersion: addVersion,
    RANK_COLUMNS: RANK_COLUMNS, rankCheck: rankCheck, sortByScore: sortByScore, suggestLine: suggestLine, dollarOff: dollarOff, included: included,
    addDonorRow: addDonorRow, removeDonorRow: removeDonorRow, importLive: importLive, importScreen1: importScreen1, loadScreen1: loadScreen1, SCREEN1: SCREEN1,
    addRound: addRound, latest: latest, STORY_PARTS: STORY_PARTS,
    addProgram: addProgram, removeProgram: removeProgram, addItem: addItem, removeItem: removeItem,
    save: save, load: load, clear: clear
  };
})();
