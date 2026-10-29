/*
  export.js: the finished prompt. A made-up organization goes in; the
  export must match FAC's sheet format line for line, with Steve's labels
  and order, and contain no number the member didn't type.
*/
T.run("Export (js/export.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet, E = FACExport;
  var s = S.blank(Q);
  function set(p, t) { S.setText(Q, s, p, t); }
  function source(p, label, note) { S.setLabel(Q, s, p, label); if (note) S.setNote(Q, s, p, note); }
  function keep(p) { S.get(s, p).asks = 2; S.skip(s, p); }

  S.addProgram(Q, s); S.addProgram(Q, s); S.addItem(s, "pain"); S.addItem(s, "benchmarks");
  set("org.name", "Riverbend Food Bank"); set("org.city", "Riverbend, TX"); set("org.zip", "77999");
  set("org.website", "https://example.org"); set("org.mission", "We feed families in need.");
  keep("org.keywords");
  set("programs.0.name", "Weekend Meals"); set("programs.0.description", "Weekend meal kits for students");
  set("programs.0.outputs", "12,400 meals for 300 students in 2024"); source("programs.0.outputs", "known", "2024 annual report");
  set("programs.1.name", "Senior Pantry"); set("programs.1.description", "Monthly groceries for seniors");
  set("programs.1.outputs", "About 50 families"); keep("programs.1.outputs");
  set("programs.1.impact", "Seniors eat well");
  set("programs.2.name", "School Pantry"); set("programs.2.description", "Pantry at schools");
  set("programs.2.outputs", "Served 300 students in 2024"); source("programs.2.outputs", "estimate", "teacher counts");
  S.get(s, "programs.2.outputs").asks = 1; S.resolveOverlap(s, "programs.2.outputs", "same");
  set("pain.0", "If a stay costs $40/day, then 300 × 60 × $40 = $720,000"); source("pain.0", "estimate", "county shelter rates");
  set("benchmarks.0", "TBD"); keep("benchmarks.0");
  set("benchmarks.1", "Meals cost $3 each");

  var expected = [
    "Organization Info",
    "Name: Riverbend Food Bank",
    "Location (include zip): Riverbend, TX 77999",
    "Website: https://example.org",
    "Mission Statement: We feed families in need.",
    "Key Words: [Unsupported]",
    "",
    "Programs (in order of priority)",
    "1. Program Name: Weekend Meals",
    "   * Description: Weekend meal kits for students",
    "   * Outputs: 12,400 meals for 300 students in 2024 (source: 2024 annual report)",
    "   * Current Impact Statement (if any):",
    "2. Program Name: Senior Pantry",
    "   * Description: Monthly groceries for seniors",
    "   * Outputs: About 50 families [Unsupported]",
    "   * Current Impact Statement (if any): Seniors eat well",
    "3. Program Name: School Pantry",
    "   * Description: Pantry at schools",
    "   * Outputs: Served 300 students in 2024 [Estimate] (source: teacher counts)",
    "   * Current Impact Statement (if any):",
    "",
    "Pain Statements/Local Context (optional)",
    "* If a stay costs $40/day, then 300 × 60 × $40 = $720,000 [Estimate] (source: county shelter rates)",
    "",
    "Benchmarks (optional)",
    "* TBD [Unsupported]",
    "* Meals cost $3 each [Unsupported]",
    "",
    "Note: Program 3 and Program 1 both report 300 for the same group. Do not add them together.",
    "",
    Q.finalPrompt,
    "",
    Q.guardrail
  ];
  var out = E.build(Q, s), lines = out.split("\n");
  var firstDiff = -1;
  for (var i = 0; i < Math.max(lines.length, expected.length); i++) if (lines[i] !== expected[i]) { firstDiff = i; break; }
  check("matches FAC's sheet format line for line" + (firstDiff > -1 ? " (first difference at line " + (firstDiff + 1) + ": \"" + lines[firstDiff] + "\")" : ""), firstDiff === -1);
  check("order: answers, then FAC's Final Prompt word for word, then the guardrail line",
    out.indexOf("Benchmarks (optional)") < out.indexOf(Q.finalPrompt) && out.indexOf(Q.finalPrompt) < out.indexOf(Q.guardrail) && lines[lines.length - 1] === Q.guardrail);
  check("Known with a source: source in brackets, no tag", out.indexOf("in 2024 (source: 2024 annual report)") > -1);
  check("Known with no source: [Unsupported]", E.answerText(Q, { org: {}, programs: [{ outputs: { text: "90 kids in 2024", label: "known", note: "", asks: 0, skipped: false } }] }, "programs.0.outputs") === "90 kids in 2024 [Unsupported]");
  check("blank optional answers are left out of the lists", lines.filter(function (l) { return l === "* "; }).length === 0 && out.split("\n* ").length - 1 === 3);

  // Rule 2: every number in the export is one the member typed.
  var typed = S.paths(s).map(function (p) { var a = S.get(s, p); return a.text + " " + a.note; }).join(" ");
  var body = out.replace(Q.finalPrompt, "").replace(Q.guardrail, "").replace(/^\d+\. /gm, "").replace(/Program \d+/g, "");
  var strays = (body.match(/\d[\d,.]*\d|\d/g) || []).filter(function (n) { return typed.indexOf(n) === -1; });
  check("no number in the export that the member didn't type" + (strays.length ? " (found: " + strays.join(" ") + ")" : ""), strays.length === 0);
  var examples = [];
  Q.sections.forEach(function (sec) { (sec.examples || []).forEach(function (e) { examples.push(e); }); });
  check("none of FAC's example lines or figures appear", examples.every(function (e) { return out.indexOf(e) === -1; }) &&
    ["800,000", "1,680", "18,000", "25,000"].every(function (n) { return out.indexOf(n) === -1; }));
  check("FAC's Final Prompt and the guardrail line have no numbers of their own", !/\d/.test(Q.finalPrompt) && !/\d/.test(Q.guardrail));

  var blank = E.build(Q, S.blank(Q));
  check("a blank sheet exports without numbers (only the program list's \"1.\")", (blank.replace(/^\d+\. /gm, "").match(/\d/g) || []).length === 0);
  check("the download file is roi-bot-prompt-sheet.txt", E.FILE_NAME === "roi-bot-prompt-sheet.txt");
});
