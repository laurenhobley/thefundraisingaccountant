/*
  questions.js: FAC's wording.
  The expected text below is copied from FAC's "ROI.bot Prompt Builder" sheet
  (and the guardrail line from the plan). If FAC changes the wording on
  purpose, update it here too; a red ✗ here means a change was noticed.
*/
T.run("Questions (js/questions.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;
  var FINAL = "Using the information above, convert outputs into outcomes and calculate community impact. Include quality-of-life changes, and where possible, add economic and socioeconomic proxies in dollars using local and state benchmarks. Generate as many concise donor impact statements as would be meaningful to an investor in this organization.";
  var GUARD = "Figures marked [Estimate] or [Unsupported] are assumptions. Do not present them as cited benchmarks or introduce new dollar figures unless labeled as your own estimate.";
  var EXAMPLES = {
    pain: [
      "We lost 800,000 in government funding, 1,680 people were denied shelter due to lack of space.",
      "In [STATE], 1 in 5 families experience housing instability each year."
    ],
    benchmarks: [
      "The average annual cost to shelter a homeless is $18,000–$25,000.",
      "Stable housing reduces social costs (shelters, ER visits, policing) by 30–50%."
    ]
  };
  function labels(id) { return S.section(Q, id).questions.map(function (q) { return q.label; }).join(", "); }

  check("4 sections in sheet order", Q.sections.map(function (s) { return s.id; }).join(",") === "org,programs,pain,benchmarks");
  check("Organization Info asks: Name, City and state, ZIP code, Website, Mission Statement, Key Words",
    labels("org") === "Name, Location: City and state, Location: ZIP code, Website, Mission Statement, Key Words");
  check("every Organization Info question is required", S.section(Q, "org").questions.every(function (q) { return q.required; }));
  check("Programs ask: Program Name, Description, Outputs, Current Impact Statement",
    labels("programs") === "Program Name, Description, Outputs, Current Impact Statement");
  check("Programs repeat, in order of priority", S.section(Q, "programs").repeat === true && S.section(Q, "programs").note === "(in order of priority)");
  check("only Current Impact Statement (if any) is optional in a program",
    S.section(Q, "programs").questions.filter(function (q) { return !q.required; }).map(function (q) { return q.id + q.note; }).join() === "impact(if any)");
  check("Pain Statements and Benchmarks are optional", S.section(Q, "pain").optional && S.section(Q, "benchmarks").optional);
  check("Final Prompt matches FAC's sheet word for word", Q.finalPrompt === FINAL);
  check("guardrail line matches the plan word for word", Q.guardrail === GUARD);
  ["pain", "benchmarks"].forEach(function (id) {
    EXAMPLES[id].forEach(function (ex, i) {
      check(S.section(Q, id).title + " example " + (i + 1) + " matches FAC's sheet", S.section(Q, id).examples[i] === ex);
    });
  });
  check("three labels: Known, Reasonable estimate, Unsupported",
    [Q.labels.known.name, Q.labels.estimate.name, Q.labels.unsupported.name].join() === "Known,Reasonable estimate,Unsupported");
  check("guardrail names the [Estimate] and [Unsupported] tags",
    Q.guardrail.indexOf(Q.labels.estimate.tag) > -1 && Q.guardrail.indexOf(Q.labels.unsupported.tag) > -1);
  check("Known and Reasonable estimate ask for a source note", !!Q.labels.known.noteLabel && !!Q.labels.estimate.noteLabel);
  check("ROI.bot link goes to ChatGPT", /^https:\/\/chatgpt\.com\//.test(Q.roiBotUrl));
  check("missing-answer follow-ups: two lines each, for any answer and for the ZIP code",
    [Q.followUps.missing, Q.followUps.missingZip].every(function (l) { return l.length === 2 && !!l[0] && !!l[1]; }));
  check("Skip button and skipped flag have wording", !!Q.followUps.skipButton && !!Q.followUps.skipped);
  check("filler words include \"various\" and \"TBD\"", Q.vagueWords.indexOf("various") > -1 && Q.vagueWords.indexOf("TBD") > -1);
  check("vague follow-ups: two lines, each naming the {word}", Q.followUps.vague.length === 2 && Q.followUps.vague.every(function (l) { return l.indexOf("{word}") > -1; }));
  check("Keep my answer button and kept-vague flag have wording", !!Q.followUps.keepButton && !!Q.followUps.keptVague);
  check("Outputs follow-ups: two lines each for no number, no year, and neither",
    ["outputNoNumber", "outputNoYear", "outputNoNumberOrYear"].every(function (k) { var l = Q.followUps[k]; return l.length === 2 && !!l[0] && !!l[1]; }));
  check("kept-output flag has wording", !!Q.followUps.keptOutput);
  check("duplicate follow-ups name the other {program}", [Q.followUps.duplicateName, Q.followUps.duplicateDescription].every(function (l) { return l.indexOf("{program}") > -1; }));
  check("These are separate programs button has wording", !!Q.followUps.separateButton);
  check("shared-number follow-up names the {program} and the {number}", Q.followUps.overlap.indexOf("{program}") > -1 && Q.followUps.overlap.indexOf("{number}") > -1);
  check("Different groups / Same group buttons and the noted line have wording", !!Q.followUps.overlapDifferent && !!Q.followUps.overlapSame && Q.followUps.overlapSameNote.indexOf("{program}") > -1);
  // Rule 2: example figures belong only in the examples list, never in a question's help.
  var helps = [];
  Q.sections.forEach(function (s) { helps.push(s.help || ""); (s.questions || []).forEach(function (q) { helps.push(q.help || ""); }); });
  check("no help text contains a number", helps.every(function (h) { return !/\d/.test(h); }));
});
