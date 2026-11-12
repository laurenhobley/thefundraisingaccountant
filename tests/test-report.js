/*
  ROI.bot's report first, no program questions (Lauren, Nov 11): the member
  pastes ROI.bot's answer to the report prompt on the 1.1 check, presses
  "Fill in my answers", then "Accept all from the report". Blank boxes fill
  in (typed ones are never replaced), and with programs from the report,
  Next skips the program-by-program screens. Made-up organization only.
*/
T.run("ROI.bot's report first (sheet.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;
  var s = S.blank(Q);
  S.addProgram(Q, s);
  var all = S.steps(s), p0 = S.stepOf(s, "programs.0.name"), p1 = S.stepOf(s, "programs.1.name"), rank = S.stepOf(s, "rank.use");
  check("normally, Next from the 1.1 check goes to Program 1", S.nextStep(s, 1) === p0 && S.prevStep(s, rank) === p1);
  s.programsFromReport = true;
  check("with programs from ROI.bot's report, Next from the 1.1 check skips the program screens to the stack rank, and Previous skips back",
    S.nextStep(s, 1) === rank && S.prevStep(s, rank) === 1 && all[rank].kind === "rank");
  check("the program screens still exist, for the 1.2 check's Edit links", all[p0].kind === "program" && all[p1].kind === "program");
  check("it's saved with the draft", S.repair(Q, JSON.parse(JSON.stringify(s))).programsFromReport === true && S.blank(Q).programsFromReport === false);
});

T.run("ROI.bot's report first (builder.html)", function (check) {
  var Q = FAC_QUESTIONS, E = Q.step11;
  function $(id) { return document.getElementById(id); }
  function saved() { return JSON.parse(localStorage.getItem("fac-prompt-sheet-draft-v1")); }
  function title() { return document.querySelector("#screen h2").textContent; }
  $("clear").click(); $("clear").click();
  // Organization Info, typed by the member, then its check.
  var nm = $("f-org-name"); nm.value = "Lakeside Family Shelter"; nm.dispatchEvent(new Event("input", { bubbles: true }));
  var zp = $("f-org-zip"); zp.value = "55999"; zp.dispatchEvent(new Event("input", { bubbles: true }));
  $("next").click();
  check("on the 1.1 check, with the report prompt", title().indexOf(Q.flow.checkpoints.org.title) > -1 && !!$("s11-prompt"));
  check("no Accept all before there's a report", !$("acceptAll11"));
  var rep = [
    "## Part 4", "Organization Info", "Name: Lakeside Shelter Inc.", "Location (include zip): 12 Elm St, Lake Ruth, MN 55999",
    "Web Site: https://example.org/lakeside", "Mission Statement: A safe night for every family.",
    "Programs (in order of priority)", "1. Program Name: Shelter", "* Description: Overnight rooms for families", "* Outputs: 80 families housed in 2024",
    "* Current Impact Statement (if any): Families move to stable homes", "2. Program Name: Aftercare", "* Description: Two years of check-ins",
    "Local Context/Data", "* Rents in the county rose 12% in 2024 (County housing report, 2024)",
    "Benchmarks", "* A night of shelter costs $60 (State shelter survey, 2023)"
  ].join("\n");
  var out = $("story-out"); out.value = rep; out.dispatchEvent(new Event("input", { bubbles: true }));
  $("fill11").click();
  check("Fill in my answers offers Accept all from the report", !!$("acceptAll11") && $("acceptAll11").textContent === E.acceptAll);
  $("acceptAll11").click();
  var d = saved();
  check("Accept all fills every blank box: website, both programs, outputs, outcomes, local context and a benchmark",
    d.org.website.text === "https://example.org/lakeside" && d.programs.length === 2 && d.programs[0].name.text === "Shelter" &&
    d.programs[0].description.text === "Overnight rooms for families" && d.programs[0].outputs.text === "80 families housed in 2024" &&
    d.programs[0].impact.text === "Families move to stable homes" && d.programs[1].name.text === "Aftercare" &&
    d.pain[0].text === "Rents in the county rose 12% in 2024 (County housing report, 2024)" && d.benchmarks[0].text === "A night of shelter costs $60 (State shelter survey, 2023)");
  check("a box the member already typed is never replaced: its suggestion stays, with Replace my answer", d.org.name.text === "Lakeside Family Shelter" &&
    document.querySelectorAll('#screen .sugg [data-act="suggAccept"]').length === 1 &&
    document.querySelector('#screen .sugg [data-act="suggAccept"]').textContent === Q.documents.replace && !$("acceptAll11"));
  check("it says how many it filled", $("s11-fill-msg").textContent === E.acceptedAll.replace("{n}", "9"));
  check("programs came from the report", d.programsFromReport === true);
  check("a number from the report still needs its label (Unsupported until the member says)", FACSheet.status(d.programs[0].outputs) === "needsLabel");
  $("next").click();
  check("Next skips the program questions and goes to the stack rank", title().indexOf(Q.rank.title) > -1);
  $("back").click();
  check("Previous skips back to the 1.1 check", title().indexOf(Q.flow.checkpoints.org.title) > -1);
  $("next").click();
  document.querySelector('#screen .rank-use[value="no"]').click();
  $("next").click();
  var rows = Array.prototype.map.call(document.querySelectorAll("#screen .checklist li"), function (li) { return li.textContent; });
  check("the 1.2 check lists the report's programs, each with Edit", rows.length === 2 && rows[0].indexOf("Shelter — Overnight rooms for families") > -1 &&
    rows[1].indexOf("Aftercare") > -1);
  document.querySelectorAll('#screen .checklist button[data-act="goto"]')[1].click();
  check("and Edit still opens that program's own screen", /Program 2 of 2/.test(title()) && $("f-programs-1-description").value === "Two years of check-ins");
  $("clear").click(); $("clear").click();
});

T.run("Step 1.3 like Steve's Family Promise example (sheet.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet, now = new Date(2026, 10, 11);
  var items = S.splitItems("Volunteers: 2,800+ (undated, GuideStar); Families sheltered: ___\nNights of shelter: ___");
  check("an answer splits into named lines at \";\" or a new line; \"___\" is a blank",
    JSON.stringify(items) === JSON.stringify([{ label: "Volunteers", value: "2,800+ (undated, GuideStar)" }, { label: "Families sheltered", value: "" }, { label: "Nights of shelter", value: "" }]));
  check("a line with no name before a colon stays whole (\"86% … (Community Impact: 2019)\")",
    S.splitItems("86% of graduating families reached stable housing (Community Impact: 2019)")[0].label === "" &&
    S.splitItems("Served 414 families in 2024")[0].value === "Served 414 families in 2024");
  check("lines join back, with ___ for a named blank and empty unnamed lines dropped",
    S.joinItems([{ label: "Volunteers", value: "2,800+" }, { label: "Meals", value: "" }, { label: "", value: " " }]) === "Volunteers: 2,800+; Meals: ___");
  check("a figure with no year is undated; more than 18 months old is old; recent is fine; no number, nothing to check",
    S.figureAge("2,800+ (undated, GuideStar)", now).kind === "undated" && S.figureAge("86% housed (2019)", now).kind === "old" && S.figureAge("86% housed (2019)", now).year === 2019 &&
    S.figureAge("48 families (2025)", now).kind === "" && S.figureAge("Families save income", now).kind === "" && S.figureAge("90% in FY24", now).kind === "old");
  var st = S.blank(Q);
  S.setText(Q, st, "programs.0.name", "Shelter");
  S.setText(Q, st, "programs.0.outputs", "Volunteers: 2,800+ (undated, GuideStar); Families sheltered: 48 in 2025 (From you)");
  S.setText(Q, st, "programs.0.impact", "86% reached stable housing (2019)");
  var f = S.figuresToCheck(st, now);
  check("One thing to check lists the old and undated figures, in order", f.length === 2 && f[0].label === "Volunteers" && f[0].kind === "undated" && f[1].kind === "old" && f[1].year === 2019);
});

T.run("Step 1.3 like Steve's Family Promise example (builder.html)", function (check) {
  var Q = FAC_QUESTIONS, O = Q.outcomes;
  function $(id) { return document.getElementById(id); }
  function type(id, text) { var e = $(id); e.value = text; e.dispatchEvent(new Event("input", { bubbles: true })); }
  function saved() { return JSON.parse(localStorage.getItem("fac-prompt-sheet-draft-v1")); }
  function title() { return document.querySelector("#screen h2").textContent; }
  $("clear").click(); $("clear").click();
  type("f-org-name", "Lakeside Family Shelter"); type("f-org-zip", "55999");
  $("next").click(); $("next").click();
  type("f-programs-0-name", "Shelter"); type("f-programs-0-description", "Overnight rooms for families");
  $("next").click();
  document.querySelector('#screen .rank-use[value="no"]').click();
  $("next").click(); $("next").click();
  check("on 1.3", title() === Q.flow.numbers.outcomes + O.title);
  check("Steve's intro, and a table: Program | Outputs (what you did) | Outcomes (what changed)",
    document.querySelector("#screen .hint").textContent === O.intro &&
    Array.prototype.map.call(document.querySelectorAll("#screen .oo-head [role=columnheader]"), function (h) { return h.textContent.replace("*", ""); }).join("|") ===
      "Program|Outputs (what you did)|Outcomes (what changed)" && document.querySelector("#oo-row-0 .oo-prog").textContent === "Program 1: Shelter");
  check("an empty cell is one gray \"Click to change\" line", document.querySelectorAll('#oo-row-0 .oo-item[data-path="programs.0.outputs"]').length === 1 &&
    document.querySelector('#oo-row-0 .oo-item[data-path="programs.0.outputs"]').placeholder === O.placeholder);
  type("f-programs-0-outputs", "Volunteers: 2,800+ (undated, GuideStar); Families sheltered: ___");
  var lines = document.querySelectorAll('#oo-row-0 .oo-item[data-path="programs.0.outputs"]');
  check("each output shows on its own named line, and a ___ is a gray blank", lines.length === 2 &&
    document.querySelectorAll("#oo-row-0 .oo-name")[0].textContent === "Volunteers:" && lines[0].value === "2,800+ (undated, GuideStar)" &&
    document.querySelectorAll("#oo-row-0 .oo-name")[1].textContent === "Families sheltered:" && lines[1].value === "");
  lines[1].value = "48 in 2025"; lines[1].dispatchEvent(new Event("input", { bubbles: true })); lines[1].dispatchEvent(new Event("change", { bubbles: true }));
  check("a figure the member fills in is labeled (From you), and saved in the answer",
    lines[1].value === "48 in 2025 " + O.fromYou && saved().programs[0].outputs.text === "Volunteers: 2,800+ (undated, GuideStar); Families sheltered: 48 in 2025 (From you)");
  type("f-programs-0-impact", "86% of families reached stable housing (Community Impact, 2019)");
  check("One thing to check lists the undated and old figures, and asks for newer numbers", !$("oo-check").hidden &&
    $("oo-check").querySelector(".lbl").textContent === O.checkTitle &&
    $("oo-check-text").textContent === O.checkText.replace("{list}", "Shelter: Volunteers (undated); Shelter: 86% of families reached stable housing (Community Impact, 2019) (2019)"));
  check("Gray tags can be filled in later, and under Next: go deeper or skip", document.querySelector("#screen").textContent.indexOf(O.later) > -1 &&
    !$("afterNext").hidden && $("afterNext").textContent === O.nextNote);
  document.querySelector('#oo-row-0 [data-act="ooAdd"][data-path="programs.0.impact"]').click();
  check("+ Add a line adds a blank line and puts the cursor there", document.querySelectorAll('#oo-row-0 .oo-item[data-path="programs.0.impact"]').length === 2 &&
    document.activeElement === document.querySelectorAll('#oo-row-0 .oo-item[data-path="programs.0.impact"]')[1]);
  $("next").click();
  check("Next goes on to the 1.3 check, and the line under Next goes away", title().indexOf(Q.flow.checkpoints.outcomes.title) > -1 && $("afterNext").hidden);
  $("clear").click(); $("clear").click();
});
