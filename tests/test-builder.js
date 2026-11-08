/*
  builder.js: the screens. builder.js runs on a hidden copy of builder.html's
  controls at the bottom of tests.html, and these tests type and click on it.
*/
T.run("Builder screens (builder.html)", function (check) {
  var F = FAC_QUESTIONS.followUps;
  function $(id) { return document.getElementById(id); }
  function type(id, text) { var e = $(id); e.value = text; e.dispatchEvent(new Event("input", { bubbles: true })); }
  function pick(id, value) {
    var r = document.querySelector('input[name="' + id + '-lab"][value="' + value + '"]');
    r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function act(a) { document.querySelector('#screen button[data-act="' + a + '"]').click(); }
  function skip(id) { $(id + "-fu").querySelector(".fu-skip").click(); }
  function title() { return document.querySelector("#screen h2").textContent; }
  function shown(sel) { return Array.prototype.filter.call(document.querySelectorAll("#screen " + sel), function (e) { return !e.hidden; }).length; }
  function fu(id) { return $(id + "-fu").hidden ? "" : $(id + "-fu").querySelector(".fu-q").textContent; }
  function saved() { return JSON.parse(localStorage.getItem("fac-prompt-sheet-draft-v1")); }

  // ---------- Missing answers on Organization Info ----------
  check("starts on Step 1 of 23", $("counter").textContent === "Step 1 of 23");
  // The progress bar: each part as "number:state", and each step tab's state.
  function parts() { return Array.prototype.map.call(document.querySelectorAll("#parts li"), function (li) { return li.querySelector(".dot").textContent + ":" + li.className.replace(" after-done", ""); }).join(" "); }
  function tabs() { return Array.prototype.map.call(document.querySelectorAll("#stepsTabs li"), function (li) { return li.className; }).join(" "); }
  check("progress bar: Step 1 tab current, its five parts, 1.1 current", tabs() === "current todo todo" && parts() === "1.1:current 1.2:todo 1.3:todo 1.4:todo 1.5:todo" &&
    document.querySelector("#parts .current .part-label").textContent === "Your Organization");
  check("Back is off on step 1", $("back").disabled);
  check("no follow-ups before Next is pressed", shown(".fu") === 0);

  $("next").click();
  check("Next with blanks stays on Step 1", $("counter").textContent === "Step 1 of 23");
  check("first Next: a follow-up under each of the 5 required answers", shown(".fu") === 5);
  check("first follow-up wording", fu("f-org-name") === F.missing[0] && fu("f-org-zip") === F.missingZip[0]);
  check("no Skip buttons after one follow-up", shown(".fu-skip") === 0);
  check("cursor goes to the first missing answer", document.activeElement.id === "f-org-name");

  $("next").click();
  check("second Next: second follow-up wording", fu("f-org-name") === F.missing[1] && fu("f-org-zip") === F.missingZip[1]);
  check("second Next: a Skip button for each", shown(".fu-skip") === 5);

  type("f-org-name", "Test Org");
  check("answering hides its follow-up", fu("f-org-name") === "");
  type("f-org-zip", "7700");
  check("ZIP 7700 keeps its follow-up", fu("f-org-zip") !== "");
  type("f-org-zip", "77001");
  check("ZIP 77001 hides it", fu("f-org-zip") === "");
  check("ZIP code has no label box", !$("f-org-zip-lab"));
  type("f-org-mission", "We help families");
  check("no number: no label box", $("f-org-mission-lab").hidden);
  type("f-org-mission", "We help 400 families");
  check("number typed: label box appears", !$("f-org-mission-lab").hidden);

  skip("f-org-website");
  check("Skip marks it skipped and Unsupported", !$("f-org-website-skipped").hidden && fu("f-org-website") === "" && saved().org.website.skipped === true);
  $("next").click();
  check("Next still blocked by Key Words", $("counter").textContent === "Step 1 of 23" && shown(".fu") === 1);
  type("f-org-keywords", "shelter, safety");
  $("next").click();
  check("all answered or skipped: Next goes to Program 1 of 1", $("counter").textContent === "Step 2 of 23" && /Program 1 of 1/.test(title()));
  check("on a program: 1.1 done (teal line to 1.2), 1.2 current", parts() === "1.1:done 1.2:current 1.3:todo 1.4:todo 1.5:todo" && document.querySelectorAll("#parts li")[1].classList.contains("after-done"));
  check("answers saved in the browser", saved().org.mission.text === "We help 400 families");

  // ---------- Programs and labels ----------
  check("no Remove button with only one program", !document.querySelector('#screen [data-act="removeProgram"]'));
  type("f-programs-0-name", "Emergency shelter");
  type("f-programs-0-outputs", "Served 414 families in 2024");
  pick("f-programs-0-outputs", "known");
  check("Known shows the Source box", !$("f-programs-0-outputs-lab").querySelector(".lab-note-wrap").hidden);
  check("Known with no source is flagged", $("f-programs-0-outputs-lab").getAttribute("data-status") === "needsNote");
  type("f-programs-0-outputs-note", "2024 annual report");
  check("source filled in: no longer flagged", $("f-programs-0-outputs-lab").getAttribute("data-status") === "ok");
  $("next").click();
  check("Next blocked by the one missing answer, Description", $("counter").textContent === "Step 2 of 23" && shown(".fu") === 1 && fu("f-programs-0-description") !== "");
  check("blank optional Current Impact Statement gets no follow-up", $("f-programs-0-impact-fu").hidden);

  // ---------- Filler words ----------
  type("f-programs-0-description", "Various services");
  check("blank answer that becomes vague: follow-up waits for Next", fu("f-programs-0-description") === "");
  $("next").click();
  check("first Next: vague follow-up names the word", $("counter").textContent === "Step 2 of 23" && fu("f-programs-0-description") === F.vague[0].replace("{word}", "Various"));
  check("no Keep button after one follow-up", shown(".fu-skip") === 0);
  $("next").click();
  check("second Next: second vague follow-up", fu("f-programs-0-description") === F.vague[1].replace("{word}", "Various"));
  check("button says Keep my answer", $("f-programs-0-description-fu").querySelector(".fu-skip").textContent === F.keepButton && shown(".fu-skip") === 1);
  type("f-programs-0-description", "Beds and meals");
  check("removing the filler word hides the follow-up", fu("f-programs-0-description") === "");

  // ---------- Outputs: a number and a year ----------
  type("f-programs-0-outputs", "37,260 meals provided");
  $("next").click();
  check("Outputs with no year: Next blocked with the no-year follow-up", $("counter").textContent === "Step 2 of 23" && fu("f-programs-0-outputs") === F.outputNoYear[0] && shown(".fu") === 1);
  type("f-programs-0-outputs", "37,260 meals provided in FY24");
  check("adding a fiscal year hides it", fu("f-programs-0-outputs") === "");
  type("f-programs-0-outputs", "Served 414 families in 2024");

  act("addProgram");
  check("Add another program goes to Program 2 of 2", $("counter").textContent === "Step 3 of 24" && /Program 2 of 2/.test(title()));
  type("f-programs-1-outputs", "About 50 people");
  pick("f-programs-1-outputs", "unsupported");
  check("Unsupported stays flagged", $("f-programs-1-outputs-lab").getAttribute("data-status") === "unsupported");

  $("back").click();
  check("Back keeps program 1's answers", $("f-programs-0-name").value === "Emergency shelter" && $("f-programs-0-outputs-note").value === "2024 annual report");
  $("back").click();
  check("skipped Website still flagged after coming back", !$("f-org-website-skipped").hidden);
  type("f-org-website", "https://example.org");
  check("typing an answer clears the skipped flag", $("f-org-website-skipped").hidden && saved().org.website.skipped === false);

  $("next").click(); $("next").click();
  check("back on Program 2", /Program 2 of 2/.test(title()));
  // ---------- Duplicate programs ----------
  type("f-programs-1-name", "emergency  shelter.");
  $("next").click();
  check("same name as Program 1: follow-up names it", fu("f-programs-1-name") === F.duplicateName.replace("{program}", "Program 1"));
  check("\"These are separate programs\" shows after one follow-up", $("f-programs-1-name-fu").querySelector(".fu-skip").textContent === F.separateButton && !$("f-programs-1-name-fu").querySelector(".fu-skip").hidden);
  skip("f-programs-1-name");
  check("confirming hides it, with no Unsupported flag", fu("f-programs-1-name") === "" && $("f-programs-1-name-skipped").hidden && saved().programs[1].name.separate === true);
  type("f-programs-1-name", "");

  $("next").click(); $("next").click();
  check("Program 2 Outputs \"About 50 people\" asks for a year", fu("f-programs-1-outputs") === F.outputNoYear[1]);
  check("its button says Keep my answer", $("f-programs-1-outputs-fu").querySelector(".fu-skip").textContent === F.keepButton);
  skip("f-programs-1-name"); skip("f-programs-1-description"); skip("f-programs-1-outputs");
  check("kept Outputs shows the missing-number-or-year flag", $("f-programs-1-outputs-skipped").textContent === F.keptOutput);

  // ---------- The same count in two programs ----------
  type("f-programs-1-outputs", "Served 414 families in 2024");
  check("adding the year clears the kept flag", $("f-programs-1-outputs-skipped").hidden);
  $("next").click();
  check("shares 414 with Program 1: Next blocked with the follow-up", /Program 2 of 2/.test(title()) &&
    fu("f-programs-1-outputs") === F.overlap.replace("{program}", "Program 1").replace("{number}", "414"));
  var ofu = $("f-programs-1-outputs-fu");
  check("two buttons: Different groups, Same group", !ofu.querySelector(".fu-skip").hidden && !ofu.querySelector(".fu-alt").hidden &&
    ofu.querySelector(".fu-skip").textContent === F.overlapDifferent && ofu.querySelector(".fu-alt").textContent === F.overlapSame);
  ofu.querySelector(".fu-alt").click();
  check("Same group: follow-up gone, noted line shown", fu("f-programs-1-outputs") === "" &&
    $("f-programs-1-outputs-skipped").textContent === F.overlapSameNote.replace("{program}", "Program 1") && $("f-programs-1-outputs-skipped").classList.contains("noted"));
  check("saved for the export", FACSheet.sameGroups(FACSheet.load(FAC_QUESTIONS)).length === 1);
  $("next").click();

  // ---------- Optional stack rank ----------
  var RK = FAC_QUESTIONS.rank;
  function rankMsg() { return $("rank-msg").textContent; }
  function pickSel(row, m, v) { var e = document.querySelector('#screen .rank-m[data-row="' + row + '"][data-m="' + m + '"]'); e.value = v; e.dispatchEvent(new Event("change", { bubbles: true })); }
  function score(row, v) { var e = document.querySelector('#screen .rank-score[data-row="' + row + '"]'); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); }
  check("after the last program: the stack rank question", $("counter").textContent === "Step 4 of 24" && title().indexOf(RK.title) > -1);
  $("next").click();
  check("Next without choosing: asks to choose", rankMsg() === RK.needChoice && $("counter").textContent === "Step 4 of 24");
  document.querySelector('#screen .rank-use[value="yes"]').click();
  var intro = document.querySelector("#screen .rank-intro").textContent;
  check("Yes shows FAC's template instructions and key", intro.indexOf(RK.intro) > -1 && intro.indexOf(RK.instructions[2]) > -1 && intro.indexOf("1 = Most · 2 = OK · 3 = Least") > -1);
  check("three driver boxes, blank, and four columns per program", document.querySelectorAll("#screen .rank-name").length === 3 && $("rank-name-d1").value === "" &&
    document.querySelectorAll('#screen .rank-m[data-row="0"]').length === 4 && !!document.querySelector('#screen .rank-m[data-m="money"]'));
  var exTable = document.querySelector("#screen .rank-example");
  check("FAC's Mission NE example is a grey table of 8 programs, with no boxes", exTable.classList.contains("examples") && exTable.querySelectorAll("tbody tr").length === 8 &&
    exTable.querySelector("tbody tr").textContent === "Food Distribution11111" && !exTable.querySelector("input, select"));
  var row0 = $("rank-row-0").querySelector(".rank-cells");
  check("each row reads Driver 1 × Driver 2 × Driver 3 × Money = Stack Rank, signs hidden from screen readers",
    Array.prototype.map.call(row0.querySelectorAll(".rank-op"), function (e) { return e.textContent; }).join("") === "×××=" &&
    Array.prototype.every.call(row0.querySelectorAll(".rank-op"), function (e) { return e.getAttribute("aria-hidden") === "true"; }));
  $("next").click();
  check("Next with no driver names: asks for them", rankMsg() === RK.needNames);
  type("rank-name-d1", "Quality"); type("rank-name-d3", "Impact");
  var d2 = $("rank-name-d2"); d2.focus(); type("rank-name-d2", "Quantity");
  check("naming a driver renames its column, and the cursor stays in the box", document.querySelector('#screen .rank-col[data-id="d2"]').textContent === "Quantity" &&
    $("rank-name-d2") === d2 && document.activeElement === d2 && saved().rank.names.d3 === "Impact");
  $("next").click();
  check("Next with no scores: asks for them", rankMsg() === RK.needScores);
  ["d1", "d2", "d3", "money"].forEach(function (id) { pickSel(0, id, "1"); pickSel(1, id, "2"); });
  score(0, "1"); score(1, "8");
  check("no Stack Rank box is filled in by the tool", saved().rankRows[1].score === "8");
  $("next").click();
  check("a wrong Stack Rank (2 × 2 × 2 × 2 typed as 8): asks to check it, without the right answer", rankMsg() === RK.wrongScore &&
    $("rank-row-1").classList.contains("invalid-row") && !$("rank-row-0").classList.contains("invalid-row") && rankMsg().indexOf("16") === -1);
  score(1, "16");
  act("rankSort");
  check("Sort by Stack Rank keeps Program 1 first (1 before 16)", rankMsg() === RK.sorted && saved().programs[0].name.text === "Emergency shelter");
  check("once sorted, a red line suggestion with only the member's own Stack Ranks", !!$("rank-suggest") && $("rank-suggest").textContent.indexOf("Program 1: Emergency shelter (1)") > -1 &&
    $("rank-suggest").textContent.indexOf("(16)") > -1 && $("rank-suggest").textContent.indexOf("15") === -1);
  check("the suggestion doesn't move the red line", saved().rank.line === null);
  var line = $("rank-line"); line.value = "1"; line.dispatchEvent(new Event("change", { bubbles: true }));
  check("red line after Program 1: Program 2 is below it", saved().rank.line === 1 && $("rank-row-1").textContent.indexOf(RK.belowLine) > -1);
  document.querySelector('#screen .rank-use[value="no"]').click();
  check("choosing No hides the ranking again", document.querySelectorAll("#screen .rank-m").length === 0);
  $("next").click();

  // ---------- Flowchart check: "Happy with programs and keywords?" ----------
  var FL = FAC_QUESTIONS.flow;
  check("after the last program: the programs-and-keywords check", $("counter").textContent === "Step 5 of 24" && title().indexOf(FL.checkpoints.programs.title) > -1);
  check("its Next button says \"Yes, continue\"", $("next").textContent === FL.checkpointYes);
  var rows = Array.prototype.map.call(document.querySelectorAll("#screen .checklist li"), function (li) { return li.textContent; });
  check("it lists the key words and both programs, each with Edit", rows.length === 3 && rows[0].indexOf("shelter, safety") > -1 &&
    rows[1].indexOf("Emergency shelter") > -1 && rows.every(function (r) { return r.indexOf(FL.editLink) > -1; }));
  document.querySelectorAll('#screen .checklist button[data-act="goto"]')[2].click();
  check("Edit jumps to that program", /Program 2 of 2/.test(title()) && document.activeElement.id === "f-programs-1-name");
  $("next").click();
  $("next").click();
  check("Next from there passes the stack rank and comes back to the check", title().indexOf(FL.checkpoints.programs.title) > -1);
  $("next").click();

  // ---------- Optional sections and the end screen ----------
  check("then Local Context/Data", /Local Context\/Data/.test(title()));
  check("FAC's examples shown as hint text", document.querySelectorAll("#screen .examples li").length === 2);
  check("input box starts empty (no example numbers)", $("f-pain-0").value === "");
  act("addItem");
  check("Add more local context", document.querySelectorAll("#screen textarea.ans").length === 2);
  type("f-pain-1", "We lost $800,000 in 2023");
  type("f-pain-0", "TBD");
  $("next").click();
  check("optional answer \"TBD\" blocks Next with a follow-up", /Local Context\/Data/.test(title()) && fu("f-pain-0") === F.vague[0].replace("{word}", "TBD"));
  $("next").click();
  skip("f-pain-0");
  check("Keep my answer: text stays, flagged Unsupported: vague", $("f-pain-0").value === "TBD" && $("f-pain-0-skipped").textContent === F.keptVague && !$("f-pain-0-skipped").hidden);
  $("next").click();
  check("blank optional section doesn't block Next", /Benchmarks/.test(title()));
  check("FAC's research examples are shown as grey hints, never in a box", document.querySelectorAll("#screen .examples table tbody tr").length === 4 && $("f-benchmarks-0-src").value === "");
  check("each benchmark has Source, Program and How it connects", !!$("f-benchmarks-0-src") && !!$("f-benchmarks-0-prog") && !!$("f-benchmarks-0-how"));
  type("f-benchmarks-0", "N/a");
  $("next").click();
  check("benchmark \"N/a\": Next blocked, follow-up says leave it blank", /Benchmarks/.test(title()) && fu("f-benchmarks-0") === F.notNeeded[0].replace("{word}", "N/a"));
  type("f-benchmarks-0", "");
  check("clearing it hides the follow-up", fu("f-benchmarks-0") === "");
  check("the program list offers the member's own program names", Array.prototype.some.call($("f-benchmarks-0-prog").options, function (o) { return o.value === "Emergency shelter"; }));
  var bsrc = $("f-benchmarks-0-src"); bsrc.value = "County housing report"; bsrc.dispatchEvent(new Event("input", { bubbles: true }));
  var bprog = $("f-benchmarks-0-prog"); bprog.value = "Emergency shelter"; bprog.dispatchEvent(new Event("change", { bubbles: true }));
  check("they save with the draft", saved().benchmarks[0].src === "County housing report" && saved().benchmarks[0].prog === "Emergency shelter");

  // ---------- "If..." assumptions ----------
  type("f-benchmarks-0", "If a voucher costs $8,000 a year, then 200 units cost $1,600,000");
  $("next").click();
  check("\"if…\" with no source: Next blocked with the follow-up", /Benchmarks/.test(title()) && fu("f-benchmarks-0") === F.ifNoSource[0]);
  check("no button: it's settled with the label box", $("f-benchmarks-0-fu").querySelector(".fu-skip").hidden && $("f-benchmarks-0-fu").querySelector(".fu-alt").hidden);
  $("next").click();
  check("second Next: second line", fu("f-benchmarks-0") === F.ifNoSource[1]);
  pick("f-benchmarks-0", "estimate");
  check("Reasonable estimate without a source: follow-up stays", fu("f-benchmarks-0") === F.ifNoSource[1]);
  type("f-benchmarks-0-note", "County housing authority, 2024");
  check("source added: follow-up gone", fu("f-benchmarks-0") === "");

  // ---------- Arithmetic check ----------
  type("f-benchmarks-0", "If a voucher costs $8,000 a year, then 200 units × $8,000 = $1,500,000");
  $("next").click();
  check("wrong calculation: Next blocked, follow-up quotes it", /Benchmarks/.test(title()) &&
    fu("f-benchmarks-0") === F.mathWrong[0].replace("{calc}", "200 units × $8,000 = $1,500,000"));
  check("the follow-up never shows the correct result", fu("f-benchmarks-0").indexOf("1,600,000") === -1);
  type("f-benchmarks-0", "If a voucher costs $8,000 a year, then 200 units × $8,000 = $1,600,000");
  check("corrected: follow-up gone", fu("f-benchmarks-0") === "");
  $("next").click();

  // ---------- Flowchart check, 1.4 Constraints and "Build our story" ----------
  check("then the benchmarks check, listing the benchmark", title().indexOf(FL.checkpoints.benchmarks.title) > -1 &&
    document.querySelector("#screen .checklist li").textContent.indexOf("200 units") > -1);
  $("next").click();
  check("then 1.4 Constraints: Tone, Length, Format, Audience", /Constraints/.test(title()) && title().indexOf(FL.numbers.constraints) > -1 &&
    ["tone", "length", "format", "audience"].every(function (id) { return !!$("f-constraints-" + id); }));
  type("f-constraints-tone", "Warm and hopeful");
  type("f-constraints-length", "About 300 words");
  check("a number in a constraint gets no label box", !$("f-constraints-length-lab"));
  $("next").click();
  check("blank constraints don't block Next: the constraints check", title().indexOf(FL.checkpoints.constraints.title) > -1 &&
    document.querySelectorAll("#screen .checklist li").length === 2);
  check("its Next button says \"Build our story\"", $("next").textContent === FL.buildStory);
  $("next").click();

  check("1.5 review: Next says Continue to Step 2", !$("next").hidden && $("next").textContent === FAC_QUESTIONS.flow.continueStep2 && $("counter").textContent === "Step 11 of 24");
  check("the Step 1 review is 1.3 Outputs to Outcomes: 1.4 and 1.5, already passed, show done", parts() === "1.1:done 1.2:done 1.3:current 1.4:done 1.5:done" && title().indexOf("1.3") === 0);
  var todo = Array.prototype.map.call(document.querySelectorAll("#screen .todo li"), function (li) { return li.textContent; });
  check("end screen lists everything still needing attention, in sheet order", todo.join(" | ") ===
    "Mission Statement needs a label | " +
    "Program 2: Program Name was skipped (Unsupported) | Program 2: Description was skipped (Unsupported) | " +
    "Program 2: Outputs is marked Unsupported | " +
    "Local context 1 is vague (Unsupported) | Local context 2 needs a label");

  // ---------- Review and export ----------
  var R = FAC_QUESTIONS.review;
  check("review screen shows the finished prompt", $("exportPreview").textContent === FACExport.build(FAC_QUESTIONS, FACSheet.load(FAC_QUESTIONS)) &&
    $("exportPreview").textContent.indexOf("Context:\nOrganization Info") === 0 && $("exportPreview").textContent.indexOf("Tone: Warm") > -1);
  check("Copy and Download are locked until \"I reviewed this\" is ticked", $("copyPrompt").disabled && $("downloadPrompt").disabled && $("downloadPromptMd").disabled && $("exportMsg").textContent === R.locked);
  check("Open ROI.bot stays hidden until reviewed", $("openRoiBot").hidden);
  check("the save-a-copy line sits beside Download (no link until FAC adds one)",
    document.querySelector("#screen .save-copy").textContent === "Save a copy in your FA community google folder and watch your story evolve." && !document.querySelector("#screen .save-copy a"));
  $("reviewed").click();
  check("ticking it unlocks Copy and Download", !$("copyPrompt").disabled && !$("downloadPrompt").disabled && !$("downloadPromptMd").disabled && saved().reviewed === true);
  check("then Open ROI.bot shows, opening FAC's ROI.bot in a new tab", !$("openRoiBot").hidden && $("openRoiBot").getAttribute("href") === FAC_QUESTIONS.roiBotUrl && $("openRoiBot").target === "_blank" && $("openRoiBot").rel === "noopener");
  check("no saved versions yet", saved().versions.length === 0 && $("versions").textContent === R.versionsNone);
  $("copyPrompt").click();
  check("Copy keeps the prompt as version 1", saved().versions.length === 1 && saved().versions[0].text === $("exportPreview").textContent &&
    document.querySelectorAll("#versions .version").length === 1);
  $("copyPrompt").click();
  check("copying the same prompt again doesn't add a version", saved().versions.length === 1);
  check("Role, Task and Constraints are editable, starting from FAC's wording and the member's answers",
    $("rtcc-role").value === "" && $("rtcc-task").value === FAC_QUESTIONS.finalPrompt && $("rtcc-constraints").value.indexOf("Tone: Warm and hopeful") === 0);
  var tk = $("rtcc-task"); tk.value = "Write one donor email."; tk.dispatchEvent(new Event("input", { bubbles: true }));
  check("editing the Task changes the preview and clears the tick", $("exportPreview").textContent.indexOf("Task:\nWrite one donor email.") > -1 &&
    saved().reviewed === false && $("copyPrompt").disabled);
  document.querySelector('#screen button[data-act="rtccReset"][data-part="task"]').click();
  check("Use FAC's wording puts the Final Prompt back", $("rtcc-task").value === FAC_QUESTIONS.finalPrompt && saved().rtcc.task === null);
  $("reviewed").click();

  document.querySelector('#screen .todo button[data-act="goto"]').click();
  check("clicking a listed item jumps to it", $("counter").textContent === "Step 1 of 24" && document.activeElement.id === "f-org-mission");
  check("jumping there doesn't clear the tick", saved().reviewed === true);
  type("f-org-mission", "We help 450 families");
  check("changing an answer clears the tick", saved().reviewed === false);

  $("next").click(); $("next").click();
  act("removeProgram");
  check("Remove this program asks for a second click", saved().programs.length === 2);
  act("removeProgram");
  check("second click removes program 2", saved().programs.length === 1);
  for (var k = 0; k < 8; k++) $("next").click();
  check("back on the review screen: still unticked and locked", $("counter").textContent === "Step 10 of 23" && !$("reviewed").checked && $("copyPrompt").disabled);
  check("the preview now shows the new mission, and the location is the ZIP (with its place once the ZIP list has loaded)", $("exportPreview").textContent.indexOf("Mission Statement: We help 450 families") > -1 &&
    /Location \(include zip\): 77001( \(Houston, TX\))?\n/.test($("exportPreview").textContent));

  // ---------- Step 2: Get the Right Numbers ----------
  var W2 = FAC_QUESTIONS.why;
  $("next").click();
  check("Continue to Step 2: 2.1 pain statements", $("counter").textContent === "Step 11 of 23" && title().indexOf(W2.number) > -1);
  check("Step 2: Step 1 tab done with a check, Step 2 current, parts 2.1 to 2.5", tabs() === "done current todo" && document.querySelector("#stepsTabs .done .num").textContent === "✓" &&
    parts() === "2.1:current 2.2:todo 2.3:todo 2.4:todo 2.5:todo" && document.querySelectorAll("#parts .part-label")[2].textContent === "Major Donors");
  check("no pain statement form saved in this browser: no import button", !document.querySelector('#screen [data-act="importLive"]'));
  document.querySelectorAll("#parts .dot")[3].click();
  check("clicking 2.4 in the progress bar goes to the magic wand", title().indexOf(FAC_QUESTIONS.wand.number) === 0 && parts().indexOf("2.4:current") > -1);
  document.querySelectorAll("#parts .dot")[0].click();
  type("f-why-lost", "95,000"); type("f-why-unserved", "80");
  check("the Why Now sentence builds from the member's answers", $("why-black").textContent === "We lost $95,000 in funding. As a result, 80 people go unserved.");
  check("the second sentence stays grey until Step 3", document.querySelector("#screen .why-grey").textContent.indexOf(W2.investSentence) === 0);
  check("a funding figure gets a label box", !$("f-why-lost-lab").hidden);
  document.querySelector('#screen .why-type[value="grant"]').click();
  check("types of loss save", saved().whyTypes.join() === "grant");
  localStorage.setItem("impact-prompt-draft-v1", JSON.stringify({ servedCount: "300", servedPeriod: "per year", types: ["donation"] }));
  $("back").click(); $("next").click();
  document.querySelector('#screen [data-act="importLive"]').click();
  check("Use my answers from the pain statement form fills the blank boxes only", $("f-why-served").value === "300" && $("f-why-period").value === "per year" &&
    $("f-why-lost").value === "95,000" && saved().whyTypes.join() === "grant,donation" && $("why-imported").textContent === W2.imported);
  $("next").click();
  var DN = FAC_QUESTIONS.donors;
  check("blank, optional answers don't block Next: 2.2 Donate Now, the Regular donor table only", title() === DN.regular.number + DN.regular.screenTitle &&
    !document.querySelector('#screen [data-table="major"]'));
  check("four rows, with empty amount boxes (FAC's levels only as a hint)", document.querySelectorAll("#screen .donor-row").length === 4 && $("f-donors-regular-0-amount").value === "");
  type("f-donors-regular-0-amount", "500"); type("f-donors-regular-0-result", "25 crisis calls");
  check("a figure in Tangible Result gets a label box; the amount doesn't", !$("f-donors-regular-0-result-lab").hidden && !$("f-donors-regular-0-amount-lab"));
  $("next").click();
  check("then 2.3 Major Donors, the Major donor table only", title() === DN.major.number + DN.major.screenTitle && document.querySelectorAll("#screen .donor-row").length === 4 &&
    !document.querySelector('#screen [data-table="regular"]'));
  document.querySelector('#screen [data-act="addDonorRow"][data-table="major"]').click();
  check("Add a row", saved().donors.major.length === 5);
  $("next").click();
  check("2.4 magic wand, offering the member's programs", title().indexOf(FAC_QUESTIONS.wand.number) > -1 && document.querySelectorAll("#wand-programs option").length === 1);
  type("f-wand-program", "Emergency shelter"); type("f-wand-amount", "25,000"); type("f-wand-possible", "A second shelter");
  $("next").click();
  check("the review screen again, with Continue to Step 3", !$("next").hidden && $("next").textContent === FAC_QUESTIONS.flow.continueStep3 && $("counter").textContent === "Step 15 of 23");
  var pv = $("exportPreview").textContent;
  check("the prompt now has the pain statement, donor table and magic wand", pv.indexOf(W2.exportTitle) > -1 && pv.indexOf("Regular Donor Table (draft)") > -1 && pv.indexOf("Magic Wand\n* Program: Emergency shelter") > -1);

  // ---------- Step 3: Tell your story ----------
  var S3 = FAC_QUESTIONS.story;
  function paste(text) { var o = $("story-out"); o.value = text; o.dispatchEvent(new Event("input", { bubbles: true })); o.dispatchEvent(new Event("change", { bubbles: true })); }
  $("next").click();
  check("Continue to Step 3: 3.1 the challenge, with its prompt built from 2.1", $("counter").textContent === "Step 16 of 23" && title().indexOf(S3.challenge.number) > -1 &&
    $("step-prompt").textContent.indexOf(S3.challenge.prompt + "\n\nFunding lost ($ and type): $95,000") === 0);
  type("f-story-keyFact", "Rents rose sharply");
  check("the step's prompt updates as the member types, and ends with the guardrail line", $("step-prompt").textContent.indexOf("Key fact: Rents rose sharply") > -1 &&
    $("step-prompt").textContent.slice(-FAC_QUESTIONS.guardrail.length) === FAC_QUESTIONS.guardrail);
  paste("ROI.bot's first challenge");
  paste("ROI.bot's second challenge");
  check("each new paste is a round", saved().storyOut.challenge.rounds.length === 2 && document.querySelectorAll("#story-rounds .version").length === 2);
  check("3.1 has Open ROI.bot next to Copy this step's prompt", !!$("openRoiBotStep") && $("openRoiBotStep").getAttribute("href") === FAC_QUESTIONS.roiBotUrl && $("openRoiBotStep").target === "_blank");
  function choose(v) { document.querySelector('#screen .story-choice[value="' + v + '"]').click(); }
  function goLink() { return document.querySelector('#story-revise [data-act="goto"]'); }
  check("Keep or revise: neither chosen, no revise question yet", document.querySelectorAll("#screen .story-choice").length === 2 && $("story-revise").hidden);
  choose("revise");
  check("Revise: one targeted question, with a link to Local Context/Data", !$("story-revise").hidden && saved().storyOut.challenge.choice === "revise" &&
    $("story-revise").textContent.indexOf(S3.challenge.revise) > -1 && goLink().textContent === S3.reviseGo.replace("{screen}", "Local Context/Data") &&
    +goLink().getAttribute("data-step") === FACSheet.stepOf(saved(), "pain.0"));
  choose("keep");
  check("Keep hides the question and saves", $("story-revise").hidden && saved().storyOut.challenge.choice === "keep");
  $("next").click();
  check("3.2 the response, built from the programs", title().indexOf(S3.response.number) > -1 && $("step-prompt").textContent.indexOf("Program name: Emergency shelter") > -1);
  choose("revise");
  check("3.2 Revise links to the programs", $("story-revise").textContent.indexOf(S3.response.revise) > -1 && goLink().textContent === S3.reviseGo.replace("{screen}", "Program 1"));
  paste("ROI.bot's response");
  $("next").click();
  check("3.3 the outcome: Copy is locked until the story is marked anonymized and approved", title().indexOf(S3.outcome.number) > -1 && $("copyStep").disabled && $("step-msg").textContent === S3.outcome.needApproved);
  type("f-story-clientStory", "A family found a safe home.");
  document.querySelector("#screen .story-approved").click();
  check("ticking it unlocks Copy", !$("copyStep").disabled && saved().storyApproved === true);
  $("next").click();
  check("3.4 the ROI", title().indexOf(S3.roi.number) > -1);
  check("3.4 has the For every $1 and Timeframe boxes, and Revise has no link", !!$("f-story-everyDollar") && !!$("f-story-timeframe") && (choose("revise"), !goLink()));
  type("f-story-investment", "$500"); type("f-story-value", "$1,500 in documented service value");
  type("f-story-roi", "$1,500 \u00f7 $500 = 4");
  type("f-story-everyDollar", "For every $1 invested, $4 of value is created");
  $("next").click();
  check("a wrong ROI line gets the arithmetic follow-up", title().indexOf(S3.roi.number) > -1 && fu("f-story-roi") === F.mathWrong[0].replace("{calc}", "$1,500 \u00f7 $500 = 4"));
  check("a For every $1 line that doesn't match the investment and value gets its follow-up, without the right figure",
    fu("f-story-everyDollar") === F.dollarWrong[0] && fu("f-story-everyDollar").indexOf("3") === -1);
  type("f-story-everyDollar", "For every $1 invested, $3 of value is created");
  check("a matching line clears it", fu("f-story-everyDollar") === "");
  type("f-story-timeframe", "over 12 months");
  var sp = $("step-prompt").textContent;
  check("both go into the 3.4 prompt: For every $1 after the ROI line, Timeframe last", sp.indexOf("ROI: ") > -1 &&
    sp.indexOf("ROI: ") < sp.indexOf("For every $1: For every $1 invested, $3 of value is created") && /Timeframe: over 12 months\n\n/.test(sp));
  type("f-story-roi", "$1,500 \u00f7 $500 = 3");
  paste("ROI.bot's ROI");
  $("next").click();
  check("3.5 the funder story, starting from the latest ROI.bot answers", title().indexOf(S3.funder.number) > -1 && $("funder-challenge").value === "ROI.bot's second challenge" && $("funder-outcome").value === "");
  var fe = $("funder-roi"); fe.value = "Give $500 today."; fe.dispatchEvent(new Event("input", { bubbles: true }));
  check("editing a part keeps the member's own words", saved().funder.roi === "Give $500 today.");
  document.querySelector('#screen [data-act="funderReset"][data-part="roi"]').click();
  check("Use my latest ROI.bot answer puts it back", $("funder-roi").value === "ROI.bot's ROI" && saved().funder.roi === null);
  type("f-story-investProgram", "Emergency shelter"); type("f-story-investOutcomes", "safe nights"); type("f-story-investDollars", "a night of shelter");
  check("the second Why Now sentence fills in", $("invest-sentence").textContent === "An investment in Emergency shelter helps create safe nights and saves a night of shelter.");
  $("next").click();
  check("my next steps: three actions", title().indexOf(FAC_QUESTIONS.actions.title) > -1 && document.querySelectorAll("#screen .donor-row").length === 3);
  var at = document.querySelector('#screen .act[data-row="0"][data-k="title"]'); at.value = "Share the package"; at.dispatchEvent(new Event("input", { bubbles: true }));
  check("an action saves", saved().actions[0].title === "Share the package");
  $("next").click();
  check("self assessment: three statements rated 1 to 5", title().indexOf(FAC_QUESTIONS.assess.title) > -1 && document.querySelectorAll("#screen .rate").length === 15);
  document.querySelector('#screen .rate[data-row="1"][value="4"]').click();
  check("a rating saves", saved().assess.ratings[1] === "4");
  $("next").click();
  check("the package: last screen, locked until reviewed", $("next").hidden && $("counter").textContent === "Step 23 of 23" && $("copyPkg").disabled && $("downloadPkg").disabled && $("downloadPkgMd").disabled);
  var pk = $("pkgPreview").textContent;
  check("the package holds the prompt, the story and the next steps", pk.indexOf(FACExport.build(FAC_QUESTIONS, FACSheet.load(FAC_QUESTIONS))) > -1 &&
    pk.indexOf(S3.fromRoibot) > -1 && pk.indexOf("Title: Share the package") > -1);
  check("the package has the member's own ROI and ask, with the For every $1 line and timeframe", pk.indexOf("== " + FAC_QUESTIONS.packageText.sections.roiAsk + " ==\nInvestment (gift amount): $500\n") > -1 &&
    pk.indexOf("For every $1: For every $1 invested, $3 of value is created") > -1 && pk.indexOf("Timeframe: over 12 months") > -1);
  $("pkg-reviewed").click();
  check("ticking I reviewed my package unlocks Copy and Download", !$("copyPkg").disabled && !$("downloadPkg").disabled && !$("downloadPkgMd").disabled && saved().pkgReviewed === true);

  // ---------- Fill from a document (made-up text) ----------
  var DOC = FAC_QUESTIONS.documents;
  $("clear").click(); $("clear").click();
  check("Start over: back on Organization Info, with the document panel closed", $("counter").textContent === "Step 1 of 23" && !$("doc-panel").open);
  function sugg(path) {
    return Array.prototype.filter.call(document.querySelectorAll("#screen .sugg"), function (d) { return d.querySelector(".lbl").textContent === path; })[0];
  }
  function press(path, act) { sugg(path).querySelector('[data-act="' + act + '"]').click(); }
  type("f-org-website", "https://old.example.org");
  var docT = $("doc-text");
  docT.value = "Name: Riverbend Family Services\nLocation (include zip): Lake Ruth, MN 55999\nWeb Site: https://example.org/riverbend\nMission Statement: Zebra-striped secret phrase.\n" +
    "1. Program Name: Family Pantry\n2. Program Name: Rent Help\n   * Outputs: 75 households in 2024";
  docT.dispatchEvent(new Event("input", { bubbles: true }));
  act("findAnswers");
  check("Find answers: each suggestion with its exact quote, and a count", $("doc-msg").textContent === DOC.found.replace("{n}", "7") &&
    document.querySelectorAll("#screen .sugg").length === 7 && sugg("Name").querySelector(".sugg-quote").textContent === DOC.quoteLabel + "Name: Riverbend Family Services");
  check("nothing is filled in until accepted", $("f-org-name").value === "" && saved().org.name.text === "");
  check("a box with an answer says Replace my answer; a blank one says Accept", sugg("Web Site").querySelector('[data-act="suggAccept"]').textContent === DOC.replace &&
    sugg("Name").querySelector('[data-act="suggAccept"]').textContent === DOC.accept);
  press("Name", "suggAccept");
  check("Accept fills the box and marks it Accepted", $("f-org-name").value === "Riverbend Family Services" && saved().org.name.text === "Riverbend Family Services" &&
    sugg("Name").querySelector(".sugg-done").textContent === DOC.accepted);
  press("Location: ZIP code", "suggSkip");
  check("Skip leaves the box blank and marks it Skipped", $("f-org-zip").value === "" && sugg("Location: ZIP code").querySelector(".sugg-done").textContent === DOC.skipped);
  check("the document's text is never saved in the browser", JSON.stringify(localStorage).indexOf("Zebra-striped") === -1);
  press("Program 2: Program Name", "suggEdit");
  check("Edit accepts it and goes to that box, adding Program 2", title().indexOf("Program 2 of 2") > -1 && $("f-programs-1-name").value === "Rent Help" &&
    document.activeElement === $("f-programs-1-name"));
  check("a program's screen shows only its own suggestions", document.querySelectorAll("#screen .sugg").length === 2 && !!sugg("Program 2: Outputs") && !!sugg("Program 2: Program Name"));
  press("Program 2: Outputs", "suggAccept");
  check("an accepted figure still needs a label, like a typed one", $("f-programs-1-outputs").value === "75 households in 2024" && !$("f-programs-1-outputs-lab").hidden);
});
