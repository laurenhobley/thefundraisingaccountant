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
  set("org.name", "Riverbend Food Bank"); set("org.zip", "77999");
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
  var b1 = S.get(s, "benchmarks.1"); b1.src = "County food survey"; b1.prog = "Weekend Meals"; b1.how = "Sets the cost of a meal kit";
  set("constraints.tone", "Warm and hopeful"); set("constraints.audience", "Major donors");

  var expected = [
    "Context:",
    "Organization Info",
    "Name: Riverbend Food Bank",
    "Location (include zip): 77999",
    "Web Site: https://example.org",
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
    "Local Context/Data (optional)",
    "* If a stay costs $40/day, then 300 × 60 × $40 = $720,000 [Estimate] (source: county shelter rates)",
    "",
    "Benchmarks (optional)",
    "* TBD [Unsupported]",
    "* Meals cost $3 each [Unsupported]",
    "   * Source: County food survey",
    "   * Program: Weekend Meals",
    "   * How it connects: Sets the cost of a meal kit",
    "",
    "Note: Program 3 and Program 1 both report 300 for the same group. Do not add them together.",
    "",
    "Task:",
    Q.finalPrompt,
    "",
    "Constraints:",
    "Tone: Warm and hopeful",
    "Audience: Major donors",
    Q.guardrail
  ];
  // FAC's 10 rules follow the member's own constraints.
  Array.prototype.splice.apply(expected, [expected.length - 1, 0].concat(Q.rtcc.rules.map(function (r) { return "- " + r; })));
  var out = E.build(Q, s), lines = out.split("\n");
  var firstDiff = -1;
  for (var i = 0; i < Math.max(lines.length, expected.length); i++) if (lines[i] !== expected[i]) { firstDiff = i; break; }
  check("matches FAC's sheet format line for line, in RTCC parts" + (firstDiff > -1 ? " (first difference at line " + (firstDiff + 1) + ": \"" + lines[firstDiff] + "\")" : ""), firstDiff === -1);

  // The Markdown download: the same words, with headings and kept line breaks.
  var md = E.markdown(Q, out), mdLines = md.replace(/\n$/, "").split("\n");
  check("Markdown: Context, Task and Constraints become headings", ["## Context", "## Task", "## Constraints"].every(function (h) { return mdLines.indexOf(h) > -1; }) && mdLines.indexOf("Context:") === -1);
  check("Markdown: taking the headings and line breaks back out gives exactly the .txt", mdLines.map(function (l) { return /^## /.test(l) ? l.slice(3) + ":" : l.replace(/  $/, ""); }).join("\n") === out);
  check("Markdown: a line before a list item or a heading gets no forced break; other lines do",
    mdLines.every(function (l, i) { var n = mdLines[i + 1]; return !n || !l || /^#/.test(l) ? true : (/^\s*([*-]|\d+\.) |^#/.test(n) ? !/  $/.test(l) : /  $/.test(l)); }));
  check("order: Context (the answers), then Task (FAC's Final Prompt word for word), then Constraints ending with the guardrail line",
    out.indexOf("Context:") === 0 && out.indexOf("Benchmarks (optional)") < out.indexOf(Q.finalPrompt) && out.indexOf(Q.finalPrompt) < out.indexOf("Constraints:") &&
    lines[lines.length - 1] === Q.guardrail);
  check("no Role while FAC's role wording is blank", out.indexOf("Role:") === -1);
  var withRole = JSON.parse(JSON.stringify(Q)); withRole.rtcc.role = "You are a test role.";
  check("once FAC writes the Role, it comes first", E.build(withRole, s).indexOf("Role:\nYou are a test role.\n\nContext:") === 0);
  s.rank.use = "yes"; s.rank.line = 2;
  var ranked = E.build(Q, s);
  check("programs below the red line are left out of the prompt", ranked.indexOf("2. Program Name: Senior Pantry") > -1 && ranked.indexOf("School Pantry") === -1);
  check("and so is a same-group note about a program below the line", ranked.indexOf("Note: Program 3") === -1);
  s.rank.use = "no";
  check("No stack rank: every program again", E.build(Q, s).indexOf("3. Program Name: School Pantry") > -1);
  // Editable Role, Task and Constraints (the review screen).
  s.rtcc.task = "Write one donor email for each program.";
  s.rtcc.constraints = "Tone: Formal";
  s.rtcc.role = "You are a grant writer.";
  var edited = E.build(Q, s);
  check("the member's own Role comes first", edited.indexOf("Role:\nYou are a grant writer.\n\nContext:") === 0);
  check("the member's own Task replaces FAC's Final Prompt", edited.indexOf("Task:\nWrite one donor email for each program.\n") > -1 && edited.indexOf(Q.finalPrompt) === -1);
  check("the member's own Constraints, then the guardrail line, which can't be edited", edited.slice(-("Constraints:\nTone: Formal\n" + Q.guardrail).length) === "Constraints:\nTone: Formal\n" + Q.guardrail);
  s.rtcc.constraints = "";
  check("emptying Constraints still leaves the guardrail line", E.build(Q, s).slice(-("Constraints:\n" + Q.guardrail).length) === "Constraints:\n" + Q.guardrail);
  s.rtcc = { role: null, task: null, constraints: null };
  check("back to FAC's wording: the prompt is as before", E.build(Q, s) === out);
  // Step 2 in the prompt.
  check("no Step 2 answers: no Step 2 sections", out.indexOf(Q.why.exportTitle) === -1 && out.indexOf(Q.donors.regular.title) === -1 && out.indexOf(Q.wand.exportTitle) === -1);
  set("why.lost", "$95,000"); set("why.unserved", "80"); set("why.demandPct", "12%"); s.whyTypes = ["grant", "donation"];
  check("Why Now sentences use the member's own answers, as typed", JSON.stringify(E.whyNow(Q, s)) === JSON.stringify([
    "We lost $95,000 in funding. As a result, 80 people go unserved.", "Demand has increased 12%. As a result, 80 people go unserved."]));
  set("why.unserved", "");
  check("a missing number shows as a blank line, never a made-up one", E.whyNow(Q, s)[0] === "We lost $95,000 in funding. As a result, ___ people go unserved.");
  set("why.unserved", "80");
  S.setLabel(Q, s, "why.lost", "known"); S.setNote(Q, s, "why.lost", "2024 audit");
  set("donors.regular.0.amount", "500"); set("donors.regular.0.funds", "Two weeks of support"); set("donors.regular.0.result", "One survivor stays safe");
  set("donors.major.0.amount", "$5,000"); set("donors.major.0.result", "10 families housed");
  set("wand.program", "Weekend Meals"); set("wand.amount", "25,000"); set("wand.possible", "Meals all summer");
  var s2out = E.build(Q, s);
  check("the pain statement section, with labels and types of loss", s2out.indexOf(Q.why.exportTitle + "\n* Funding lost ($): $95,000 (source: 2024 audit)\n* What type of loss: Grants, Donations\n* People not served because of a lack of funding: 80 [Unsupported]") > -1);
  check("the donor tables, marked as drafts, amounts as typed", s2out.indexOf("Regular Donor Table (draft)\n* Investment: $500; What It Funds: Two weeks of support; Tangible Result: One survivor stays safe") > -1 &&
    s2out.indexOf("Major Donor Table (draft)\n* Investment: $5,000; Tangible Result: 10 families housed [Unsupported]") > -1);
  check("the magic wand", s2out.indexOf("Magic Wand\n* Program: Weekend Meals\n* Investment: $25,000\n* What would it make possible?: Meals all summer") > -1);
  check("Step 2 sits in the Context, before the Task", s2out.indexOf(Q.wand.exportTitle) < s2out.indexOf("Task:"));
  var typed2 = S.paths(s).map(function (p) { var a = S.get(s, p); return a.text + " " + a.note + " " + a.src + " " + a.how; }).join(" ");
  var strays2 = (s2out.replace(Q.finalPrompt, "").replace(Q.guardrail, "").replace(/^\d+\. /gm, "").replace(/Program \d+/g, "").match(/\d[\d,.]*\d|\d/g) || []).filter(function (n) { return typed2.indexOf(n) === -1; });
  check("still no number the member didn't type" + (strays2.length ? " (found: " + strays2.join(" ") + ")" : ""), strays2.length === 0);

  // Step 3: each step's prompt, the funder story and the package.
  var ST = Q.story;
  set("story.keyFact", "Rents rose sharply");
  var p31 = E.stepPrompt(Q, s, "challenge");
  check("3.1's prompt: FAC's line, the 2.1 answers with their labels, the key fact, then the guardrail line",
    p31.indexOf(ST.challenge.prompt + "\n\nFunding lost ($ and type): $95,000 (source: 2024 audit) (Grants, Donations)\nPeople not served: 80 [Unsupported]\nIncreased demand: 12% [Unsupported]\nKey fact: Rents rose sharply\n\n" + Q.guardrail) === 0);
  var p32 = E.stepPrompt(Q, s, "response");
  check("3.2's prompt: FAC's line and each program", p32.indexOf(ST.response.prompt + "\n\nProgram name: Weekend Meals\nDescription: Weekend meal kits for students\n") === 0 && p32.slice(-Q.guardrail.length) === Q.guardrail);
  set("story.clientStory", "A family found a safe home."); set("story.clientQuote", "\u201cWe can breathe again.\u201d");
  check("3.3's prompt: FAC's line, the story and quote", E.stepPrompt(Q, s, "outcome") === ST.outcome.prompt + "\n\nClient story: A family found a safe home.\nClient quote: \u201cWe can breathe again.\u201d\n\n" + Q.guardrail);
  set("story.investment", "$500"); set("story.roi", "$1,500 \u00f7 $500 = 3");
  check("3.4's prompt: FAC's line and the member's own figures", E.stepPrompt(Q, s, "roi") === ST.roi.prompt + "\n\nInvestment (gift amount): $500\nROI: $1,500 \u00f7 $500 = 3\n\n" + Q.guardrail);
  S.addRound(s, "challenge", "ROI.bot challenge text"); S.addRound(s, "roi", "ROI.bot ROI text");
  check("the funder story starts from the latest ROI.bot answers", E.funderText(Q, s) === "Challenge:\nROI.bot challenge text\n\nROI and ask:\nROI.bot ROI text");
  s.funder.roi = "Give $500 today.";
  check("the member's own edit replaces that part", E.funderText(Q, s).slice(-"ROI and ask:\nGive $500 today.".length) === "ROI and ask:\nGive $500 today.");
  check("no second Why Now sentence until all three blanks are filled", E.investSentence(Q, s) === "");
  set("story.investProgram", "Weekend Meals"); set("story.investOutcomes", "fuller weekends"); set("story.investDollars", "$40 a week per family");
  S.setLabel(Q, s, "story.investDollars", "estimate"); S.setNote(Q, s, "story.investDollars", "county food costs");
  check("the second Why Now sentence, with its label", E.investSentence(Q, s) === "An investment in Weekend Meals helps create fuller weekends and saves $40 a week per family [Estimate] (source: county food costs).");
  s.actions[0] = { assignee: "Lauren", title: "Share the package", date: "2026-11-20", status: "Not started" };
  s.assess.ratings = ["4", "", "2"]; s.assess.takeaway = "Lead with the pain statement";
  var pkg = E.packageText(Q, s), PS = Q.packageText.sections;
  check("the package has every section, in order", [PS.prompt, PS.whyNow, PS.programs, PS.story, PS.funder, PS.actions, PS.assess].every(function (h, i, a) {
    return pkg.indexOf("== " + h + " ==") > -1 && (i === 0 || pkg.indexOf("== " + a[i - 1] + " ==") < pkg.indexOf("== " + h + " =="));
  }));
  check("the package contains the full prompt", pkg.indexOf(E.build(Q, s)) > -1);
  var pmd = E.markdown(Q, pkg).split("\n");
  check("package as Markdown: title, sections and the prompt's own parts as headings", pmd[0] === "# " + pkg.split("\n")[0] &&
    pmd.indexOf("## " + PS.prompt) > -1 && pmd.indexOf("### Context") > -1 && pmd.indexOf("== " + PS.prompt + " ==") === -1);
  check("ROI.bot's answers are marked as ROI.bot's", pkg.indexOf("== " + PS.story + " ==\n" + ST.fromRoibot) > -1);
  check("next steps and self-assessment, only what was filled in", pkg.indexOf("* Assignee: Lauren; Title: Share the package; Date: 2026-11-20; Status: Not started") > -1 &&
    pkg.indexOf(Q.assess.statements[0] + " 4/5") > -1 && pkg.indexOf(Q.assess.statements[1]) === -1 && pkg.indexOf("Lead with the pain statement") > -1);
  check("no stack ranking section when the member didn't rank", pkg.indexOf("== " + PS.rank + " ==") === -1);
  s.rank = { use: "yes", names: { d1: "Quality", d2: "", d3: "Impact" }, line: null };
  s.rankRows[0] = { m: { d1: "1", d2: "2", d3: "1", money: "3" }, score: "6" };
  check("the package's stack ranking uses the member's driver names, then Money",
    E.packageText(Q, s).indexOf("== " + PS.rank + " ==\n" + (S.trim(s.programs[0].name.text) || Q.flow.empty) + ": Quality 1, Driver 2 2, Impact 1, Money 3; Stack Rank 6") > -1);
  s.rank = { use: "no", names: { d1: "", d2: "", d3: "" }, line: null };
  check("with no constraint answers, Constraints holds FAC's 10 rules, then the guardrail line", E.build(Q, S.blank(Q)).indexOf("Constraints:\n- " + Q.rtcc.rules[0]) > -1 && E.build(Q, S.blank(Q)).split("\n").slice(-1)[0] === Q.guardrail);
  check("Known with a source: source in brackets, no tag", out.indexOf("in 2024 (source: 2024 annual report)") > -1);
  check("Known with no source: [Unsupported]", E.answerText(Q, { org: {}, programs: [{ outputs: { text: "90 kids in 2024", label: "known", note: "", asks: 0, skipped: false } }] }, "programs.0.outputs") === "90 kids in 2024 [Unsupported]");
  check("blank optional answers are left out of the lists", lines.filter(function (l) { return l === "* "; }).length === 0 && out.split("\n* ").length - 1 === 3);
  check("a benchmark with no source, program or how-it-connects has no sub-lines", out.indexOf("* TBD [Unsupported]\n* Meals") > -1);

  // Rule 2: every number in the export is one the member typed.
  var typed = S.paths(s).map(function (p) { var a = S.get(s, p); return a.text + " " + a.note + " " + a.src + " " + a.how; }).join(" ");
  var body = out.replace(Q.finalPrompt, "").replace(Q.guardrail, "").replace(/^\d+\. /gm, "").replace(/Program \d+/g, "");
  var strays = (body.match(/\d[\d,.]*\d|\d/g) || []).filter(function (n) { return typed.indexOf(n) === -1; });
  check("no number in the export that the member didn't type" + (strays.length ? " (found: " + strays.join(" ") + ")" : ""), strays.length === 0);
  var examples = [];
  Q.sections.forEach(function (sec) { (sec.examples || []).forEach(function (e) { examples.push(e); }); });
  check("none of FAC's example lines or figures appear", examples.every(function (e) { return out.indexOf(e) === -1; }) &&
    ["18,500", "18,000", "25,000"].every(function (n) { return out.indexOf(n) === -1; }));
  check("FAC's Final Prompt and the guardrail line have no numbers of their own", !/\d/.test(Q.finalPrompt) && !/\d/.test(Q.guardrail));

  var blank = E.build(Q, S.blank(Q));
  check("a blank sheet exports without numbers (only the program list's \"1.\")", (blank.replace(/^\d+\. /gm, "").match(/\d/g) || []).length === 0);
  check("the download file is roi-bot-prompt-sheet.txt", E.FILE_NAME === "roi-bot-prompt-sheet.txt");
});
