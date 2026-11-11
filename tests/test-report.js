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
