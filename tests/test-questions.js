/*
  questions.js: FAC's wording.
  The expected text below is copied from FAC's "ROI.bot Prompt Builder" sheet
  (and the guardrail line from the plan). If FAC changes the wording on
  purpose, update it here too; a red ✗ here means a change was noticed.
*/
T.run("Questions (js/questions.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;
  var FINAL = "Using the information above, convert outputs into outcomes and calculate community impact. Include quality-of-life and social impact changes, and where possible, add economic and socioeconomic proxies in dollars using local and state benchmarks. Generate as many concise donor impact statements as would be meaningful to an investor in this organization.";
  var GUARD = "Figures marked [Estimate] or [Unsupported] are assumptions. Do not present them as cited benchmarks or introduce new dollar figures unless labeled as your own estimate.";
  var EXAMPLES = {
    pain: [
      "In [STATE], 1 in 5 families experience housing instability each year.",
      "The average cost of homelessness services per family is $18,500 annually."
    ],
    benchmarks: [
      "The average annual cost to shelter a homeless is $18,000–$25,000.",
      "Stable housing reduces social costs (shelters, ER visits, policing) by 30–50%."
    ]
  };
  function labels(id) { return S.section(Q, id).questions.map(function (q) { return q.label; }).join(", "); }

  check("6 sections: FAC's sheet, the workbook's pain statement questions, then the flowchart's Constraints", Q.sections.map(function (s) { return s.id; }).join(",") === "org,programs,pain,benchmarks,why,constraints");
  check("Step 2 wording: pain statement questions, Why Now sentences, donor tables, magic wand", S.section(Q, "why").questions.length === 8 &&
    Q.why.lossSentence.indexOf("{amount}") > -1 && Q.why.demandSentence.indexOf("{pct}") > -1 && !!Q.why.investSentence &&
    ["amount", "funds", "result", "words"].every(function (k) { return !!Q.donors.columns[k]; }) && !!Q.wand.possible && !!Q.flow.nextButton);
  check("Constraints asks: Tone, Length, Format, Audience, all optional",
    labels("constraints") === "Tone, Length, Format, Audience" && S.section(Q, "constraints").questions.every(function (q) { return !q.required; }));
  check("step numbers follow the workbook (Version 2 plan): 1.1 org, 1.2 programs, 1.3 review, 1.4 context, 1.5 constraints, 2.5 Step 2 review",
    [Q.flow.numbers.org, Q.flow.numbers.program, Q.flow.numbers.review, Q.flow.numbers.pain, Q.flow.numbers.benchmarks, Q.flow.numbers.constraints, Q.flow.numbers.review2].join() === "1.1,1.2,1.3,1.4,1.4,1.5,2.5");
  check("the three \"Happy with…?\" checks have their wording", ["programs", "benchmarks", "constraints"].every(function (k) { return !!Q.flow.checkpoints[k].title && !!Q.flow.checkpoints[k].text; }));
  check("Version 2 buttons: \"← Previous\" and \"Next\", and the happy line for each part", Q.flow.previousButton === "← Previous" && Q.flow.nextButton === "Next" &&
    Q.flow.happyLine === "Once you are happy with your {thing}, press Next to continue." && ["keywords", "stack ranking", "outputs to outcomes", "context", "constraints", "pain statements", "Donate Now table", "Major Donor Ladder"].every(function (t) { for (var k in Q.flow.happy) if (Q.flow.happy[k] === t) return true; return false; }));
  check("stack rank: FAC's template columns (Driver 1-3, Money), matching the sheet's, and its messages",
    Q.rank.columns.map(function (c) { return c.label; }).join() === "Driver 1,Driver 2,Driver 3,Money" && Q.rank.columns.map(function (c) { return c.id; }).join() === S.RANK_COLUMNS.join() &&
    ["ask", "yes", "no", "needChoice", "needNames", "needScores", "wrongScore", "sortButton", "lineLabel", "belowLine"].every(function (k) { return !!Q.rank[k]; }));
  check("the guide's Step 3 additions have their wording: keep or revise per part, For every $1, timeframe, red line suggestion",
    ["challenge", "response", "outcome", "roi"].every(function (p) { return !!Q.story[p].revise; }) && !!Q.story.keep && !!Q.story.revise && Q.story.reviseGo.indexOf("{screen}") > -1 &&
    !!Q.story.fields.everyDollar.label && !!Q.story.fields.timeframe.label && Q.followUps.dollarWrong.length === 2 && !!Q.followUps.keptDollar &&
    ["{a}", "{x}", "{b}", "{y}"].every(function (k) { return Q.rank.suggest.indexOf(k) > -1; }) && !!Q.packageText.sections.roiAsk);
  check("FAC's Mission NE example: 8 programs, and every Stack Rank is its four scores multiplied", Q.rank.example.rows.length === 8 &&
    Q.rank.example.rows.every(function (r) { return r.length === 6 && +r[1] * +r[2] * +r[3] * +r[4] === +r[5]; }));
  check("stack rank wording follows FAC's template", Q.rank.key.join() === "1 = Most,2 = OK,3 = Least" && Q.rank.scoreLabel === "Stack Rank" &&
    Q.rank.intro === "A stack ranking grid helps you compare your programs based on any three drivers. For example:" &&
    Q.rank.instructions.join("|") === "Rank each program with a 1, 2 or 3 to which does it most, just ok, or least.|Multiply these four numbers to produce a Stack ranking.|" +
      "Sort by Stack Rank and you can quickly see which programs are most impactful to the mission. Those are likely the stories you want to tell.");
  check("the editable Role / Task / Constraints and benchmark fields have their wording", ["title", "text", "roleHelp", "reset", "resetConstraints"].every(function (k) { return !!Q.rtccEdit[k]; }) &&
    ["source", "program", "connects"].every(function (k) { return !!Q.benchmarkFields[k].label && !!Q.benchmarkFields[k].exportLabel; }));
  check("RTCC headings are there; Role is empty until FAC writes it", ["roleHeading", "contextHeading", "taskHeading", "constraintsHeading"].every(function (k) { return !!Q.rtcc[k]; }) && Q.rtcc.role === "");
  check("saved versions have their wording", ["versionsTitle", "versionsNone", "versionDownload"].every(function (k) { return !!Q.review[k]; }) &&
    Q.review.versionLabel.indexOf("{n}") > -1 && Q.review.versionLabel.indexOf("{date}") > -1);
  check("Organization Info asks: Name, ZIP code (no city and state), Website, Mission Statement, Key Words",
    labels("org") === "Name, Location: ZIP code, Web Site, Mission Statement, Key Words");
  check("every Organization Info question is required", S.section(Q, "org").questions.every(function (q) { return q.required; }));
  check("Programs ask: Program Name, Description, Outputs, Current Impact Statement",
    labels("programs") === "Program Name, Description, Outputs, Current Impact Statement");
  check("Programs repeat, in order of priority", S.section(Q, "programs").repeat === true && S.section(Q, "programs").note === "(in order of priority)");
  check("only Current Impact Statement (if any) is optional in a program",
    S.section(Q, "programs").questions.filter(function (q) { return !q.required; }).map(function (q) { return q.id + q.note; }).join() === "impact(if any)");
  check("Local Context/Data and Benchmarks are optional", S.section(Q, "pain").optional && S.section(Q, "benchmarks").optional);
  check("Final Prompt matches FAC's sheet word for word", Q.finalPrompt === FINAL);
  check("guardrail line matches the plan word for word", Q.guardrail === GUARD);
  check("intro matches FAC's updated sheet", /Once you are complete, copy \+ paste this information into ROI\.bot to generate outputs, outcomes, and donor-ready impact statements\.$/.test(Q.intro));
  check("the save-a-copy line matches FAC's sheet; its link is blank until Steve adds it",
    Q.saveCopy.before + Q.saveCopy.linkText + Q.saveCopy.after === "Save a copy in your FA community google folder and watch your story evolve." && Q.saveCopy.url === "");
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
  check("ROI.bot link goes to FAC's ROI.bot GPT in ChatGPT", Q.roiBotUrl === "https://chatgpt.com/g/g-68c9c810e72481919f05f0c6964dc678-roi-bot");
  check("the how-to page credits GeoNames for the ZIP places (their CC BY licence asks for it)", Q.howTo.zipCredit.url === "https://www.geonames.org/" && Q.howTo.zipCredit.linkText === "GeoNames" && !!Q.zipPlace.found && !!Q.zipPlace.unknown);
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
  check("review screen has its wording (checkbox, Copy, Download, messages)",
    ["title", "text", "allClear", "previewTitle", "checkbox", "locked", "copyButton", "downloadButton", "copied", "selected", "downloaded"].every(function (k) { return !!Q.review[k]; }));
  check("export uses FAC's \"Location (include zip)\" line", Q.exportText.location === "Location (include zip)");
  check("export source note and same-group note have their slots",
    Q.exportText.source.indexOf("{note}") > -1 && ["{program}", "{other}", "{number}"].every(function (k) { return Q.exportText.sameGroup.indexOf(k) > -1; }));
  check("calculation follow-ups: two lines, each quoting the {calc}", Q.followUps.mathWrong.length === 2 && Q.followUps.mathWrong.every(function (l) { return l.indexOf("{calc}") > -1; }));
  check("kept-calculation flag has wording", !!Q.followUps.keptMath);
  check("assumption words include \"if\"", Q.assumptionWords.indexOf("if") > -1);
  check("\"if…\" follow-ups: two lines", Q.followUps.ifNoSource.length === 2 && !!Q.followUps.ifNoSource[0] && !!Q.followUps.ifNoSource[1]);
  check("Different groups / Same group buttons and the noted line have wording", !!Q.followUps.overlapDifferent && !!Q.followUps.overlapSame && Q.followUps.overlapSameNote.indexOf("{program}") > -1);
  // Rule 2: example figures belong only in the examples list, never in a question's help.
  var helps = [];
  Q.sections.forEach(function (s) { helps.push(s.help || ""); (s.questions || []).forEach(function (q) { helps.push(q.help || ""); }); });
  check("no help text contains a number", helps.every(function (h) { return !/\d/.test(h); }));
  check("the how-to page has its wording: title, intro, steps, privacy note, back link",
    ["linkText", "title", "intro", "privacy", "back"].every(function (k) { return !!Q.howTo[k]; }) && Q.howTo.steps.length > 0);
  check("the how-to page has no numbers in it", !/\d/.test([Q.howTo.linkText, Q.howTo.title, Q.howTo.intro, Q.howTo.privacy, Q.howTo.back].concat(Q.howTo.steps).join(" ")));
  check("FAC's 10 rules for AI, with no numbers in them", Q.rtcc.rules.length === 10 && Q.rtcc.rules.every(function (r) { return /^Do not /.test(r) && !/\d/.test(r); }));
  check("the how-to page's AI note and 'Why now' figures, with their source", Q.howTo.aiNote.length === 2 && Q.howTo.whyNow.length === 3 && /Forvis Mazars/.test(Q.howTo.whyNowSource));
  check("FAC's four research examples, each with a source", Q.benchmarkFields.examples.length === 4 && Q.benchmarkFields.examples.every(function (x) { return !!x.finding && !!x.source && !!x.connects; }));  check("Step 3 prompts, word for word from FAC's workbook",
    Q.story.challenge.prompt === "Here is a narrative list of the challenges faced in the world that we seek to change:" &&
    Q.story.response.prompt === "Provide a narrative with our response to those challenges. Explain how our programs help make the world a better place." &&
    Q.story.outcome.prompt === "Using our challenge and response, describe the outcome for the people we serve. Include one real client story and quote." &&
    Q.story.roi.prompt === "Calculate the ROI of a gift to this program.");
  check("next steps (four columns) and the self-assessment (three statements)", Object.keys(Q.actions.columns).join() === "assignee,title,date,status" && Q.assess.statements.length === 3);  check("every question and optional section has help text",
    Q.sections.every(function (s) { return s.questions ? s.questions.every(function (q) { return !!q.help; }) : !!s.help; }));
});
