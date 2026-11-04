/*
  sheet.js: answers, labels and draft saving. No screens involved.
*/
T.run("Answers and labels (js/sheet.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;

  var s = S.blank(Q);
  check("blank sheet starts with 1 program", s.programs.length === 1);
  check("blank sheet has every Organization Info question", ["name", "city", "zip", "website", "mission", "keywords"].every(function (id) { return !!s.org[id]; }));
  check("blank sheet has no numbers in it", S.problems(s).length === 0);
  check("screens: Organization, 1 program, stack rank, check, Pain Statements, Benchmarks, check, Constraints, check, review", S.steps(s).map(function (x) { return x.kind + (x.of ? ":" + x.of : ""); }).join() === "org,program,rank,check:programs,pain,benchmarks,check:benchmarks,constraints,check:constraints,end,why,donors,wand,end,story:challenge,story:response,story:outcome,story:roi,funder,actions,assess,package");

  var out = S.get(s, "programs.0.outputs");
  out.text = "Served 414 families in 2024";
  check("a number with no label needs a label", S.status(out) === "needsLabel");
  check("text with no number needs no label", S.status({ text: "Food and shelter", label: "", note: "" }) === "none");
  out.label = "known";
  check("Known with no source needs a note", S.status(out) === "needsNote");
  out.note = "   ";
  check("a source of only spaces does not count", S.status(out) === "needsNote");
  out.note = "2024 annual report";
  check("Known with a source is ok", S.status(out) === "ok");
  check("Unsupported stays flagged", S.status({ text: "about 50 people", label: "unsupported", note: "" }) === "unsupported");
  check("Reasonable estimate with no note needs a note", S.status({ text: "50", label: "estimate", note: "" }) === "needsNote");

  S.get(s, "org.zip").text = "77001";
  check("ZIP code never asks for a label", S.problems(s).length === 0);
  check("ZIP 77001 and 77001-1234 accepted", S.zipOk("77001") && S.zipOk("77001-1234"));
  check("ZIP 7700 and abcde refused", !S.zipOk("7700") && !S.zipOk("abcde"));

  var n = S.addProgram(Q, s);
  check("Add program gives program 2", n === 1 && s.programs.length === 2);
  check("23 screens with 2 programs", S.steps(s).length === 23);
  check("program 2 is on screen 3", S.stepOf(s, "programs.1.name") === 2);
  check("with 2 programs: stack rank on screen 4, check on 5, Pain on 6, Benchmarks on 7, Constraints on 9", S.steps(s)[3].kind === "rank" && S.steps(s)[4].of === "programs" && S.stepOf(s, "pain.0") === 5 && S.stepOf(s, "benchmarks.0") === 6 && S.stepOf(s, "constraints.tone") === 8);
  S.removeProgram(s, 1); S.removeProgram(s, 0);
  check("the last program can't be removed", s.programs.length === 1);

  S.get(s, "pain.0").text = "We lost $800,000";
  S.addItem(s, "pain");
  check("Add another pain statement", s.pain.length === 2);
  S.removeItem(s, "pain", 1); S.removeItem(s, "pain", 0);
  check("removing the last pain statement clears it instead", s.pain.length === 1 && s.pain[0].text === "");

  S.get(s, "benchmarks.0").text = "Costs $18,000 a year";
  var p = S.problems(s);
  check("problems list finds the unlabeled benchmark", p.length === 1 && p[0].path === "benchmarks.0" && p[0].status === "needsLabel");

  // An old or damaged draft is rebuilt against today's questions.
  var r = S.repair(Q, { step: 2, org: { name: { text: "Test Org", label: "bogus" }, oldQuestion: { text: "x" } },
    programs: [{ name: { text: "Shelter" } }, { name: { text: "Counseling" } }], pain: null });
  check("old draft: answers kept", r.org.name.text === "Test Org" && r.programs.length === 2 && r.programs[1].name.text === "Counseling");
  check("old draft: unknown labels dropped", r.org.name.label === "");
  check("old draft: questions that no longer exist dropped", !r.org.oldQuestion);
  check("old draft: missing parts filled in", r.pain.length === 1 && r.org.zip.text === "" && r.step === 2);
  check("no draft gives a blank sheet", S.repair(Q, null).programs.length === 1);

  // Missing answers: follow-ups, then skip.
  var m = S.blank(Q);
  check("blank Organization Info: all 6 required answers missing", S.missing(Q, m, 0).join() === "org.name,org.city,org.zip,org.website,org.mission,org.keywords");
  check("blank program: Program Name, Description, Outputs missing (not Current Impact Statement)",
    S.missing(Q, m, 1).join() === "programs.0.name,programs.0.description,programs.0.outputs");
  check("Pain Statements and Benchmarks never block Next", S.missing(Q, m, S.stepOf(m, "pain.0")).length === 0 && S.missing(Q, m, S.stepOf(m, "benchmarks.0")).length === 0);
  S.setText(Q, m,"org.name", "   ");
  check("an answer of only spaces counts as missing", S.missing(Q, m, 0).indexOf("org.name") > -1);
  S.setText(Q, m,"org.zip", "7700");
  check("ZIP 7700 counts as missing", S.missing(Q, m, 0).indexOf("org.zip") > -1);
  S.setText(Q, m,"org.zip", "77001");
  check("ZIP 77001 is answered", S.missing(Q, m, 0).indexOf("org.zip") === -1);
  var web = S.get(m, "org.website");
  S.ask(Q, m, 0);
  check("first Next: 1 follow-up, can't skip yet", web.asks === 1 && !S.canSkip(web));
  S.skip(m, "org.website");
  check("skip refused before the second follow-up", web.skipped === false);
  S.ask(Q, m, 0);
  check("second Next: 2 follow-ups, can skip", web.asks === 2 && S.canSkip(web));
  S.ask(Q, m, 0);
  check("follow-ups stop at 2", web.asks === 2);
  S.skip(m, "org.website");
  check("skipped answer no longer blocks Next", web.skipped && S.missing(Q, m, 0).indexOf("org.website") === -1);
  check("end screen list shows it as skipped", S.problems(m, Q).some(function (p) { return p.path === "org.website" && p.status === "skipped"; }));
  check("and other missing answers as still blank", S.problems(m, Q).some(function (p) { return p.path === "org.city" && p.status === "blank"; }));
  S.setText(Q, m,"org.website", " ");
  check("typing only a space keeps the skip", web.skipped);
  S.setText(Q, m,"org.website", "https://example.org");
  check("a real answer clears the skip and the follow-ups", !web.skipped && web.asks === 0);
  var r2 = S.repair(Q, { org: { city: { text: "", asks: 2, skipped: true }, name: { asks: "lots", skipped: "yes" } } });
  check("old draft: follow-ups and skips kept", r2.org.city.asks === 2 && r2.org.city.skipped === true);
  check("old draft: bad follow-up values dropped", r2.org.name.asks === 0 && r2.org.name.skipped === false);

  // Filler words: found as whole words, in any capitals.
  check("finds \"Various\" in \"Various programs\"", S.vagueWord(Q, "Various programs") === "Various");
  check("finds \"tbd\" and \"TBD.\"", S.vagueWord(Q, "tbd") === "tbd" && S.vagueWord(Q, "Cost: TBD.") === "TBD");
  check("ignores \"variously\" and \"T B D\"", S.vagueWord(Q, "variously") === "" && S.vagueWord(Q, "T B D") === "");
  check("nothing in a blank answer", S.vagueWord(Q, "") === "");
  var v = S.blank(Q);
  S.setText(Q, v, "programs.0.outputs", "TBD");
  S.setText(Q, v, "pain.0", "Various cuts");
  check("required answer \"TBD\" is vague, not missing", S.issueOf(Q, "programs.0.outputs", S.get(v, "programs.0.outputs")) === "vague");
  check("optional answers are checked too", S.issues(Q, v, S.stepOf(v, "pain.0")).join() === "pain.0");
  check("blank optional answer needs no follow-up", S.issueOf(Q, "benchmarks.0", S.get(v, "benchmarks.0")) === "");
  check("Next on a program counts vague and missing together",
    S.issues(Q, v, 1).join() === "programs.0.name,programs.0.description,programs.0.outputs");
  var pain = S.get(v, "pain.0");
  S.ask(Q, v, S.stepOf(v, "pain.0")); S.ask(Q, v, S.stepOf(v, "pain.0"));
  check("two follow-ups, then Keep my answer is allowed", pain.asks === 2 && S.canSkip(pain));
  S.skip(v, "pain.0");
  check("kept vague answer no longer blocks Next, and its text stays", S.issues(Q, v, S.stepOf(v, "pain.0")).length === 0 && pain.text === "Various cuts");
  check("end screen list shows it as kept vague", S.problems(v, Q).some(function (p) { return p.path === "pain.0" && p.status === "keptVague"; }));
  S.setText(Q, v, "pain.0", "Various state cuts");
  check("still vague after an edit: stays kept", pain.skipped);
  S.setText(Q, v, "pain.0", "State budget cuts");
  check("edited to remove the filler word: flag cleared", !pain.skipped && pain.asks === 0 && S.problems(v, Q).every(function (p) { return p.path !== "pain.0"; }));
  var d = S.get(v, "programs.0.description");
  S.ask(Q, v, 1);
  check("blank Description asked once", d.asks === 1);
  S.setText(Q, v, "programs.0.description", "TBD");
  check("blank answer that becomes \"TBD\" starts again at the first follow-up", d.asks === 0 && S.issueOf(Q, "programs.0.description", d) === "vague");

  // Outputs: a number and a year.
  ["2024", "in 2023–24", "2023-2024", "FY24", "FY 2024", "FY2023-24", "in 2024, we served"].forEach(function (t) {
    check("counts as a year: " + t, S.hasYear(t));
  });
  ["37,260 meals provided", "120000 visits", "$197,000 worth of goods"].forEach(function (t) {
    check("no year in: " + t, !S.hasYear(t));
  });
  check("number found: 414 clients served in 2024", S.hasCount("414 clients served in 2024"));
  check("number found: $197,000 worth of goods in 2024", S.hasCount("$197,000 worth of goods in 2024"));
  check("a year alone isn't the number: Served families in 2023–24", !S.hasCount("Served families in 2023–24"));
  check("a fiscal year alone isn't the number: Meals served in FY24", !S.hasCount("Meals served in FY24"));
  check("number and year: no follow-up", S.outputGap("414 clients served in 2024") === "");
  check("number, no year", S.outputGap("37,260 meals provided") === "outputNoYear");
  check("year, no number", S.outputGap("Therapy sessions in 2024") === "outputNoNumber");
  check("neither", S.outputGap("Meals provided") === "outputNoNumberOrYear");
  var o = S.blank(Q), op = "programs.0.outputs";
  check("blank Outputs: missing-answer follow-up first", S.issueOf(Q, op, S.get(o, op)) === "missing");
  S.setText(Q, o, op, "TBD");
  check("Outputs \"TBD\": vague follow-up first", S.issueOf(Q, op, S.get(o, op)) === "vague");
  S.setText(Q, o, op, "Meals provided");
  check("Outputs with no number or year: output follow-up", S.issueOf(Q, op, S.get(o, op)) === "output");
  S.setText(Q, o, "programs.0.description", "Meals provided");
  check("only Outputs is checked for a number and year", S.issueOf(Q, "programs.0.description", S.get(o, "programs.0.description")) === "");
  var out2 = S.get(o, op);
  S.ask(Q, o, 1); S.ask(Q, o, 1); S.skip(o, op);
  check("kept as is after two follow-ups", out2.skipped && S.issues(Q, o, 1).indexOf(op) === -1);
  check("end screen list: no number or year (Unsupported)", S.problems(o, Q).some(function (p) { return p.path === op && p.status === "outputNoNumberOrYearKept"; }));
  S.setText(Q, o, op, "Meals provided in 2024");
  check("adding only the year: still kept, now just no number", out2.skipped && S.outputGap(out2.text) === "outputNoNumber");
  S.setText(Q, o, op, "37,260 meals provided in 2024");
  check("adding the number too: flag cleared", !out2.skipped && out2.asks === 0 && S.issueOf(Q, op, out2) === "");

  // Duplicate programs: same name or description as an earlier program.
  check("\"Housing Assistance\" and \"housing  assistance.\" count as the same", S.same("Housing Assistance") === S.same("housing  assistance."));
  check("\"Housing Assistance\" and \"Housing Help\" don't", S.same("Housing Assistance") !== S.same("Housing Help"));
  var dp = S.blank(Q);
  S.addProgram(Q, dp); S.addProgram(Q, dp);
  S.setText(Q, dp, "programs.0.name", "Housing Assistance");
  S.setText(Q, dp, "programs.0.description", "Rental help for families");
  S.setText(Q, dp, "programs.1.name", "Youth Programs");
  S.setText(Q, dp, "programs.2.name", "housing assistance.");
  S.setText(Q, dp, "programs.2.description", "Rental help for families");
  check("program 3's name matches program 1", S.duplicateOf(dp, "programs.2.name") === 0);
  check("program 3's description matches program 1", S.duplicateOf(dp, "programs.2.description") === 0);
  check("program 1 is never the duplicate", S.duplicateOf(dp, "programs.0.name") === -1);
  check("a different name doesn't match", S.duplicateOf(dp, "programs.1.name") === -1);
  check("blank descriptions aren't compared", S.duplicateOf(dp, "programs.1.description") === -1);
  check("Outputs aren't compared", S.duplicateOf(dp, "programs.2.outputs") === -1);
  var dn = S.get(dp, "programs.2.name");
  check("matching name: duplicate follow-up", S.issueOf(Q, "programs.2.name", dn, dp) === "duplicate");
  S.ask(Q, dp, 3);
  check("one follow-up, then \"These are separate programs\" is allowed", dn.asks === 1 && S.canConfirmSeparate(dn));
  S.confirmSeparate(dp, "programs.2.name");
  check("confirmed separate: no longer blocks Next, no Unsupported flag", S.issues(Q, dp, 3).indexOf("programs.2.name") === -1 && !dn.skipped);
  check("end screen still lists the matching description", S.problems(dp, Q).some(function (p) { return p.path === "programs.2.description" && p.status === "duplicate" && p.other === 0; }));
  check("but not the confirmed name", S.problems(dp, Q).every(function (p) { return p.path !== "programs.2.name"; }));
  S.setText(Q, dp, "programs.2.name", "Housing Assistance");
  check("editing a confirmed name asks again", S.issueOf(Q, "programs.2.name", dn, dp) === "duplicate");
  S.setText(Q, dp, "programs.2.name", "Youth Housing");
  check("renaming it clears the follow-up", S.issueOf(Q, "programs.2.name", dn, dp) === "");
  S.removeProgram(dp, 0);
  check("removing program 1 clears the matching description", S.duplicateOf(dp, "programs.1.description") === -1);
  var dv = S.blank(Q);
  S.addProgram(Q, dv);
  S.setText(Q, dv, "programs.0.name", "TBD"); S.setText(Q, dv, "programs.1.name", "TBD");
  check("\"TBD\" in both: vague follow-up comes first", S.issueOf(Q, "programs.1.name", S.get(dv, "programs.1.name"), dv) === "vague");

  // The same count in two programs.
  function keys(t) { return S.numbersIn(t).map(function (n) { return n.key; }).join(); }
  check("numbers found, years left out: 831 youth served in 2024", keys("831 youth served in 2024") === "831");
  check("commas don't matter: 1,680 and 1680", keys("1,680 nights") === keys("1680 nights"));
  check("numbers under 10 are left out: 2 locations, 5 staff", keys("2 locations and 5 staff") === "");
  check("dollars are kept apart from counts: $831 vs 831", keys("$831 in goods") === "$831" && keys("$831 in goods") !== keys("831 children"));
  check("fiscal years left out: FY24 meals 120", keys("FY24 meals 120") === "120");
  var dc = S.blank(Q);
  S.addProgram(Q, dc); S.addProgram(Q, dc);
  S.setText(Q, dc, "programs.0.outputs", "831 youth received housing in 2024");
  S.setText(Q, dc, "programs.1.outputs", "90 families in 2024");
  S.setText(Q, dc, "programs.2.outputs", "831 children received counseling");
  var o3 = "programs.2.outputs", a3 = S.get(dc, o3);
  check("program 3 shares 831 with program 1", JSON.stringify(S.sharedCount(dc, o3)) === JSON.stringify({ value: "831", other: 0 }));
  check("program 2 shares nothing", S.sharedCount(dc, "programs.1.outputs") === null);
  check("the same year in two programs isn't a shared number", S.sharedCount(dc, "programs.1.outputs") === null && S.numbersIn("in 2024").length === 0);
  check("no year comes first: output follow-up", S.issueOf(Q, o3, a3, dc) === "output");
  S.ask(Q, dc, 3); S.ask(Q, dc, 3); S.skip(dc, o3);
  check("kept with no year: still asked about the shared 831", S.issueOf(Q, o3, a3, dc) === "overlap" && a3.asks === 0);
  check("end screen lists both: no year, then shares 831", S.problems(dc, Q).filter(function (p) { return p.path === o3; }).map(function (p) { return p.status; }).join().indexOf("outputNoYearKept,overlap") === 0);
  S.resolveOverlap(dc, o3, "same");
  check("can't answer before the follow-up is shown", a3.overlap === "");
  S.ask(Q, dc, 3);
  S.resolveOverlap(dc, o3, "same");
  check("Same group, both programs: settled, no Unsupported added", a3.overlap === "same" && S.issueOf(Q, o3, a3, dc) === "");
  check("saved for the export: 831 is the same group as program 1", JSON.stringify(S.sameGroups(dc)) === JSON.stringify([{ path: o3, value: "831", other: 0 }]));
  S.setText(Q, dc, o3, "831 children received counseling in 2024");
  check("editing the answer asks again", a3.overlap === "" && S.issueOf(Q, o3, a3, dc) === "overlap");
  S.ask(Q, dc, 3);
  S.resolveOverlap(dc, o3, "different");
  check("Different groups: settled, not saved for the export", S.issueOf(Q, o3, a3, dc) === "" && S.sameGroups(dc).length === 0);
  S.setText(Q, dc, "programs.0.outputs", "830 youth received housing in 2024");
  S.setText(Q, dc, o3, "831 kids");
  check("changing the earlier program's number clears it", S.sharedCount(dc, o3) === null);

  // Arithmetic check: only the member's own calculations, results exact.
  function calc(t) { return S.calculations(t).map(function (c) { return (c.ok ? "ok: " : "wrong: ") + c.quote; }).join(" | "); }
  check("right: 300 clients × 60 days × $40 = $720,000", calc("300 clients × 60 days × $40 = $720,000") === "ok: 300 clients × 60 days × $40 = $720,000");
  check("wrong, quoted as typed: … = ≈ $719,500", calc("300 clients × 60 days × $40 = ≈ $719,500") === "wrong: 300 clients × 60 days × $40 = ≈ $719,500");
  check("words before the calculation aren't quoted", calc("If a stay costs $40/day, then 300 × 60 × $40 = $720,000") === "ok: 300 × 60 × $40 = $720,000");
  check("\"x\" counts as times: 2,150 x $100 = $215,000", calc("2,150 x $100 = $215,000").indexOf("ok:") === 0);
  check("\"$1.2 million\" means 1,200,000", calc("150 units × $8,000 = $1.2 million") === "ok: 150 units × $8,000 = $1.2 million");
  check("\"$1.1 million\" is wrong for 150 × $8,000", calc("150 units × $8,000 = $1.1 million").indexOf("wrong:") === 0);
  check("times before plus: 1,000 + 250 × 2 = 1,500", calc("1,000 + 250 × 2 = 1,500").indexOf("ok:") === 0 && calc("1,000 + 250 × 2 = 2,500").indexOf("wrong:") === 0);
  check("exact to the decimals written: 10 ÷ 3 = 3.33 and = 3.3", calc("10 ÷ 3 = 3.33").indexOf("ok:") === 0 && calc("10 ÷ 3 = 3.3").indexOf("ok:") === 0);
  check("exact only: 300 × 60 × $40 = $700,000 is wrong", calc("300 × 60 × $40 = $700,000").indexOf("wrong:") === 0);
  check("\"$40/day\" is per day, not a division", calc("$40/day for 60 days = $2,400") === "");
  check("calculations with a % are left alone", calc("20% × 500 = 100") === "");
  check("bold marks around the result are fine: = **$6,000**", calc("1,200 meals × $5 = **$6,000**").indexOf("ok:") === 0);
  check("a year before the calculation is ignored", calc("In 2024, 300 × $10 = $3,000") === "ok: 300 × $10 = $3,000");
  check("the first wrong one is the one quoted", S.mathProblem("12 × $5 = $60. 7 × $9 = $62.") === "7 × $9 = $62");
  var mt = S.blank(Q), mp = "pain.0", ma = S.get(mt, mp);
  S.setText(Q, mt, mp, "We house 300 × 60 nights × $40 = $719,500");
  check("wrong calculation: follow-up", S.issueOf(Q, mp, ma, mt) === "math");
  check("the quote never contains the correct result", S.mathProblem(ma.text).indexOf("720,000") === -1);
  S.ask(Q, mt, S.stepOf(mt, "pain.0")); S.ask(Q, mt, S.stepOf(mt, "pain.0")); S.skip(mt, mp);
  check("kept: listed as a calculation that doesn't add up (Unsupported)", S.problems(mt, Q).some(function (p) { return p.path === mp && p.status === "keptMath"; }));
  S.setText(Q, mt, mp, "We house 300 × 60 nights × $40 = $720,000");
  check("corrected: flag cleared", !ma.skipped && S.issueOf(Q, mp, ma, mt) === "");
  S.setText(Q, mt, mp, "TBD: 3 × 4 = 13");
  check("\"TBD\" comes first: vague follow-up", S.issueOf(Q, mp, ma, mt) === "vague");

  // "If..." assumptions with no source.
  function assumed(path, text) { return S.isAssumption(Q, path, { text: text }); }
  check("\"If a stay costs $50/day, then 414 × 90 × $50\" is an assumption", assumed("pain.0", "If a stay costs $50/day, then 414 × 90 × $50"));
  check("capitals don't matter: \"IF a voucher costs $8,000\"", assumed("pain.0", "IF a voucher costs $8,000"));
  check("\"if\" with only a year isn't: \"if funding returns in 2025\"", !assumed("pain.0", "if funding returns in 2025"));
  check("\"if\" with no figure isn't: \"even if we close\"", !assumed("pain.0", "even if we close"));
  check("a word containing \"if\" isn't: \"gift of 500 blankets\"", !assumed("pain.0", "gift of 500 blankets"));
  check("the ZIP code is never an assumption", !assumed("org.zip", "if 77001"));
  var as = S.blank(Q), ap = "benchmarks.0", aa = S.get(as, ap);
  S.setText(Q, as, ap, "If a voucher costs $8,000 a year, 200 units cost $1,600,000");
  check("no label yet: assumption follow-up", S.issueOf(Q, ap, aa, as) === "assumption");
  check("it blocks Next on its screen", S.issues(Q, as, S.stepOf(as, "benchmarks.0")).join() === ap);
  check("end screen lists it once, not also as \"needs a label\"", S.problems(as, Q).filter(function (p) { return p.path === ap; }).map(function (p) { return p.status; }).join() === "assumption");
  S.ask(Q, as, S.stepOf(as, "benchmarks.0"));
  S.setLabel(Q, as, ap, "estimate");
  check("Reasonable estimate with no source: still open, follow-up count kept", S.issueOf(Q, ap, aa, as) === "assumption" && aa.asks === 1);
  S.setNote(Q, as, ap, "County housing authority, 2024");
  check("source added: settled, count starts again", S.issueOf(Q, ap, aa, as) === "" && aa.asks === 0 && S.problems(as, Q).every(function (p) { return p.path !== ap; }));
  S.setNote(Q, as, ap, "");
  S.setLabel(Q, as, ap, "unsupported");
  check("Unsupported settles it, and stays flagged", S.issueOf(Q, ap, aa, as) === "" && S.problems(as, Q).some(function (p) { return p.path === ap && p.status === "unsupported"; }));
  S.setText(Q, as, ap, "TBD if 50 units");
  check("\"TBD\" comes first: vague follow-up", S.issueOf(Q, ap, aa, as) === "vague");

  // Step 1.4 Constraints: tone, length, format, audience. All optional.
  var cs = S.blank(Q);
  check("a blank sheet has the four constraints", ["tone", "length", "format", "audience"].every(function (id) { return !!cs.constraints[id]; }));
  check("blank constraints never block Next", S.issues(Q, cs, S.stepOf(cs, "constraints.tone")).length === 0);
  S.setText(Q, cs, "constraints.length", "About 300 words");
  check("a number in a constraint needs no label (it's an instruction, not a figure)", !S.needsLabel("constraints.length") &&
    S.problems(cs, Q).every(function (p) { return p.path !== "constraints.length"; }));
  S.setText(Q, cs, "constraints.tone", "TBD");
  check("\"TBD\" as a tone still gets the vague follow-up", S.issueOf(Q, "constraints.tone", S.get(cs, "constraints.tone"), cs) === "vague");
  check("the checkpoint screens have no answers to check", S.issues(Q, cs, S.stepOf(cs, "benchmarks.0") + 1).length === 0);

  // The flowchart's "Prompt history": versions kept in the browser.
  var vs = S.blank(Q);
  S.addVersion(vs, "first prompt", "Nov 4");
  S.addVersion(vs, "first prompt", "Nov 4");
  check("the same prompt twice is kept once", vs.versions.length === 1 && vs.versions[0].n === 1);
  S.addVersion(vs, "second prompt", "Nov 5");
  check("a changed prompt is kept as version 2", vs.versions.length === 2 && vs.versions[1].n === 2 && vs.versions[1].text === "second prompt");
  var rv = S.repair(Q, { constraints: { tone: { text: "warm" } }, versions: [{ n: 1, at: "Nov 4", text: "x" }, { n: "two" }, null] });
  check("old draft: constraints and good versions kept, bad ones dropped", rv.constraints.tone.text === "warm" && rv.versions.length === 1);

  // Optional stack rank: the member types every score; the tool checks and sorts.
  var sr = S.blank(Q);
  S.addProgram(Q, sr); S.addProgram(Q, sr);
  ["Food Pantry", "Tutoring", "Shelter"].forEach(function (t, i) { S.setText(Q, sr, "programs." + i + ".name", t); });
  check("a row of scores for every program", sr.rankRows.length === 3);
  check("no choice yet: Next is blocked", S.rankCheck(sr).msg === "needChoice");
  sr.rank.use = "no";
  check("No: nothing else to do, every program goes in the prompt", S.rankCheck(sr).msg === "" && S.included(sr) === 3);
  sr.rank.use = "yes"; sr.rank.measures = ["quality", "impact"];
  check("Yes needs exactly three measures", S.rankCheck(sr).msg === "needMeasures");
  sr.rank.measures = ["quality", "impact", "money"];
  check("Yes with no scores: every row needs scoring", S.rankCheck(sr).msg === "needScores" && S.rankCheck(sr).rows.join() === "0,1,2");
  function scoreRow(i, a, b, c, typed) { sr.rankRows[i].m = { quality: a, impact: b, money: c }; sr.rankRows[i].score = typed; }
  scoreRow(0, "3", "3", "2", "18"); scoreRow(1, "1", "2", "1", "2"); scoreRow(2, "2", "2", "2", "6");
  check("a wrong score is caught (2 × 2 × 2 typed as 6)", S.rankCheck(sr).msg === "wrongScore" && S.rankCheck(sr).rows.join() === "2");
  check("sorting waits until every score checks out", S.sortByScore(sr) === false && sr.programs[0].name.text === "Food Pantry");
  sr.rankRows[2].score = "8";
  check("every score right: Next can go ahead", S.rankCheck(sr).msg === "");
  check("sort puts the lowest score first: Tutoring (2), Shelter (8), Food Pantry (18)",
    S.sortByScore(sr) && sr.programs.map(function (p) { return p.name.text; }).join() === "Tutoring,Shelter,Food Pantry" &&
    sr.rankRows.map(function (r) { return r.score; }).join() === "2,8,18");
  check("the red line starts below every program", S.included(sr) === 3);
  sr.rank.line = 2;
  check("red line after Program 2: two programs go in the prompt", S.included(sr) === 2);
  S.removeProgram(sr, 0);
  check("removing a program removes its scores too", sr.rankRows.length === 2 && sr.rankRows[0].score === "8");
  S.addProgram(Q, sr);
  check("adding a program adds an empty row of scores", sr.rankRows.length === 3 && sr.rankRows[2].score === "");
  var rr = S.repair(Q, { programs: [{ name: { text: "A" } }, { name: { text: "B" } }], rank: { use: "yes", measures: ["quality", "bogus", "impact", "money", "uniqueness"], line: 1 },
    rankRows: [{ m: { quality: "2", impact: "9" }, score: "4" }] });
  check("old draft: rank kept, bad measures and scores dropped, rows match the programs",
    rr.rank.use === "yes" && rr.rank.measures.join() === "quality,impact,money" && rr.rank.line === 1 &&
    rr.rankRows.length === 2 && rr.rankRows[0].m.quality === "2" && !rr.rankRows[0].m.impact && rr.rankRows[0].score === "4");

  // Step 2: pain statement questions, donor tables, magic wand.
  var s2 = S.blank(Q);
  check("Step 2 screens come after the 1.5 review, then the review again", S.steps(s2).slice(-13, -8).map(function (x) { return x.kind + (x.stage || ""); }).join() === "end1,why,donors,wand,end2");
  check("each donor table starts with four rows", s2.donors.regular.length === 4 && s2.donors.major.length === 4);
  S.addDonorRow(s2, "major");
  check("Add a row: five major donor rows", s2.donors.major.length === 5);
  S.removeDonorRow(s2, "major", 4);
  check("removing a row", s2.donors.major.length === 4);
  check("only the Tangible Result needs a label in the tables, not the amount", S.needsLabel("donors.regular.0.result") && !S.needsLabel("donors.regular.0.amount") && !S.needsLabel("donors.major.1.funds"));
  check("the magic wand's amount needs no label; what it makes possible does", !S.needsLabel("wand.amount") && S.needsLabel("wand.possible"));
  check("pain statement figures need a label", S.needsLabel("why.lost") && S.needsLabel("why.unserved"));
  S.setText(Q, s2, "why.lost", "95,000");
  check("an unlabeled funding figure shows up on the review list", S.problems(s2, Q).some(function (p) { return p.path === "why.lost" && p.status === "needsLabel"; }));
  check("the pain statement questions never block Next", S.issues(Q, s2, S.stepOf(s2, "why.lost")).length === 0);
  S.setText(Q, s2, "why.served", "260");
  var n2 = S.importLive(Q, s2, { lossAmount: "80,000", unserved: "40", servedCount: "999", servedPeriod: "per year", types: ["grant", "bogus"] });
  check("bringing in the live form's answers fills only the blank boxes", n2 === 3 && s2.why.lost.text === "95,000" && s2.why.unserved.text === "40" &&
    s2.why.served.text === "260" && s2.why.period.text === "per year" && s2.whyTypes.join() === "grant");
  check("no live form draft: nothing brought in", S.importLive(Q, s2, null) === 0);
  var r3 = S.repair(Q, { why: { lost: { text: "5,000" } }, whyTypes: ["donation", "x"], donors: { regular: [{ amount: { text: "50" }, result: { text: "1 day of meals" } }] }, wand: { amount: { text: "10,000" } } });
  check("old draft: Step 2 answers kept, bad loss types dropped", r3.why.lost.text === "5,000" && r3.whyTypes.join() === "donation" &&
    r3.donors.regular.length === 1 && r3.donors.regular[0].result.text === "1 day of meals" && r3.donors.major.length === 4 && r3.wand.amount.text === "10,000");
  // Step 3: rounds from ROI.bot, the funder story, next steps, self-assessment.
  var s3 = S.blank(Q);
  check("Step 3 screens come after the Step 2 review", S.steps(s3).slice(-8).map(function (x) { return x.kind + (x.of ? ":" + x.of : ""); }).join() ===
    "story:challenge,story:response,story:outcome,story:roi,funder,actions,assess,package");
  check("each Step 3 box sits on its own screen", S.stepOf(s3, "story.keyFact") === 14 && S.stepOf(s3, "story.clientQuote") === 16 && S.stepOf(s3, "story.roi") === 17 && S.stepOf(s3, "story.investDollars") === 18);
  check("a pasted ROI.bot answer becomes round 1", S.addRound(s3, "challenge", "First try") && s3.storyOut.challenge.rounds.length === 1 && S.latest(s3, "challenge") === "First try");
  check("the same paste again isn't a new round", S.addRound(s3, "challenge", "First try") === false && s3.storyOut.challenge.rounds.length === 1);
  S.addRound(s3, "challenge", "Second try");
  check("a new paste is round 2, and the latest", s3.storyOut.challenge.rounds[1].n === 2 && S.latest(s3, "challenge") === "Second try");
  check("an empty paste isn't a round", S.addRound(s3, "response", "  ") === false && s3.storyOut.response.rounds.length === 0);
  check("only the key fact, value created and dollars saved need a label in Step 3",
    S.needsLabel("story.keyFact") && S.needsLabel("story.value") && S.needsLabel("story.investDollars") && !S.needsLabel("story.investment") && !S.needsLabel("story.roi") && !S.needsLabel("story.clientQuote"));
  S.setText(Q, s3, "story.roi", "$1,500 \u00f7 $500 = 4");
  check("the member's own ROI line gets the arithmetic check", S.issueOf(Q, "story.roi", S.get(s3, "story.roi"), s3) === "math");
  S.setText(Q, s3, "story.roi", "$1,500 \u00f7 $500 = 3");
  check("a correct ROI line passes", S.issueOf(Q, "story.roi", S.get(s3, "story.roi"), s3) === "");
  var r4 = S.repair(Q, { story: { keyFact: { text: "Rents rose" } }, storyApproved: true, storyOut: { outcome: { draft: "d", happy: true, rounds: [{ n: 1, text: "A" }, { n: "x" }] } },
    funder: { roi: "My ask" }, actions: [{ title: "Call Steve", date: "2026-11-20" }], assess: { ratings: ["5", "9"], takeaway: "Numbers matter" } });
  check("old draft: Step 3 kept, bad values dropped", r4.story.keyFact.text === "Rents rose" && r4.storyApproved && r4.storyOut.outcome.rounds.length === 1 &&
    r4.storyOut.outcome.happy && r4.funder.roi === "My ask" && r4.funder.challenge === null && r4.actions.length === 3 && r4.actions[0].date === "2026-11-20" &&
    r4.assess.ratings.join() === "5,," && r4.assess.takeaway === "Numbers matter");
  // Saving and loading, with a stand-in for the browser's storage.
  var store = {}, fake = { setItem: function (k, v) { store[k] = v; }, getItem: function (k) { return store[k] || null; }, removeItem: function (k) { delete store[k]; } };
  S.save(r, fake);
  check("a saved draft loads back the same", S.load(Q, fake).programs[1].name.text === "Counseling");
  S.clear(fake);
  check("Start over clears the saved draft", S.load(Q, fake).org.name.text === "");
});
