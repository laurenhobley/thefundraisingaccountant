/*
  sheet.js: answers, labels and draft saving. No screens involved.
*/
T.run("Answers and labels (js/sheet.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;

  var s = S.blank(Q);
  check("blank sheet starts with 1 program", s.programs.length === 1);
  check("blank sheet has every Organization Info question", ["name", "city", "zip", "website", "mission", "keywords"].every(function (id) { return !!s.org[id]; }));
  check("blank sheet has no numbers in it", S.problems(s).length === 0);
  check("screens: Organization, 1 program, Pain Statements, Benchmarks, end", S.steps(s).length === 5);

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
  check("6 screens with 2 programs", S.steps(s).length === 6);
  check("program 2 is on screen 3", S.stepOf(s, "programs.1.name") === 2);
  check("Pain Statements on screen 4, Benchmarks on screen 5", S.stepOf(s, "pain.0") === 3 && S.stepOf(s, "benchmarks.0") === 4);
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
  check("Pain Statements and Benchmarks never block Next", S.missing(Q, m, 2).length === 0 && S.missing(Q, m, 3).length === 0);
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
  check("optional answers are checked too", S.issues(Q, v, 2).join() === "pain.0");
  check("blank optional answer needs no follow-up", S.issueOf(Q, "benchmarks.0", S.get(v, "benchmarks.0")) === "");
  check("Next on a program counts vague and missing together",
    S.issues(Q, v, 1).join() === "programs.0.name,programs.0.description,programs.0.outputs");
  var pain = S.get(v, "pain.0");
  S.ask(Q, v, 2); S.ask(Q, v, 2);
  check("two follow-ups, then Keep my answer is allowed", pain.asks === 2 && S.canSkip(pain));
  S.skip(v, "pain.0");
  check("kept vague answer no longer blocks Next, and its text stays", S.issues(Q, v, 2).length === 0 && pain.text === "Various cuts");
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
  check("it blocks Next on its screen", S.issues(Q, as, 3).join() === ap);
  check("end screen lists it once, not also as \"needs a label\"", S.problems(as, Q).filter(function (p) { return p.path === ap; }).map(function (p) { return p.status; }).join() === "assumption");
  S.ask(Q, as, 3);
  S.setLabel(Q, as, ap, "estimate");
  check("Reasonable estimate with no source: still open, follow-up count kept", S.issueOf(Q, ap, aa, as) === "assumption" && aa.asks === 1);
  S.setNote(Q, as, ap, "County housing authority, 2024");
  check("source added: settled, count starts again", S.issueOf(Q, ap, aa, as) === "" && aa.asks === 0 && S.problems(as, Q).every(function (p) { return p.path !== ap; }));
  S.setNote(Q, as, ap, "");
  S.setLabel(Q, as, ap, "unsupported");
  check("Unsupported settles it, and stays flagged", S.issueOf(Q, ap, aa, as) === "" && S.problems(as, Q).some(function (p) { return p.path === ap && p.status === "unsupported"; }));
  S.setText(Q, as, ap, "TBD if 50 units");
  check("\"TBD\" comes first: vague follow-up", S.issueOf(Q, ap, aa, as) === "vague");

  // Saving and loading, with a stand-in for the browser's storage.
  var store = {}, fake = { setItem: function (k, v) { store[k] = v; }, getItem: function (k) { return store[k] || null; }, removeItem: function (k) { delete store[k]; } };
  S.save(r, fake);
  check("a saved draft loads back the same", S.load(Q, fake).programs[1].name.text === "Counseling");
  S.clear(fake);
  check("Start over clears the saved draft", S.load(Q, fake).org.name.text === "");
});
