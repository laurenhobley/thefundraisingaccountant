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

  // Saving and loading, with a stand-in for the browser's storage.
  var store = {}, fake = { setItem: function (k, v) { store[k] = v; }, getItem: function (k) { return store[k] || null; }, removeItem: function (k) { delete store[k]; } };
  S.save(r, fake);
  check("a saved draft loads back the same", S.load(Q, fake).programs[1].name.text === "Counseling");
  S.clear(fake);
  check("Start over clears the saved draft", S.load(Q, fake).org.name.text === "");
});
