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
  S.setText(m, "org.name", "   ");
  check("an answer of only spaces counts as missing", S.missing(Q, m, 0).indexOf("org.name") > -1);
  S.setText(m, "org.zip", "7700");
  check("ZIP 7700 counts as missing", S.missing(Q, m, 0).indexOf("org.zip") > -1);
  S.setText(m, "org.zip", "77001");
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
  S.setText(m, "org.website", " ");
  check("typing only a space keeps the skip", web.skipped);
  S.setText(m, "org.website", "https://example.org");
  check("a real answer clears the skip and the follow-ups", !web.skipped && web.asks === 0);
  var r2 = S.repair(Q, { org: { city: { text: "", asks: 2, skipped: true }, name: { asks: "lots", skipped: "yes" } } });
  check("old draft: follow-ups and skips kept", r2.org.city.asks === 2 && r2.org.city.skipped === true);
  check("old draft: bad follow-up values dropped", r2.org.name.asks === 0 && r2.org.name.skipped === false);

  // Saving and loading, with a stand-in for the browser's storage.
  var store = {}, fake = { setItem: function (k, v) { store[k] = v; }, getItem: function (k) { return store[k] || null; }, removeItem: function (k) { delete store[k]; } };
  S.save(r, fake);
  check("a saved draft loads back the same", S.load(Q, fake).programs[1].name.text === "Counseling");
  S.clear(fake);
  check("Start over clears the saved draft", S.load(Q, fake).org.name.text === "");
});
