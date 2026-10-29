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
  check("starts on Step 1 of 5", $("counter").textContent === "Step 1 of 5");
  check("Back is off on step 1", $("back").disabled);
  check("no follow-ups before Next is pressed", shown(".fu") === 0);

  $("next").click();
  check("Next with blanks stays on Step 1", $("counter").textContent === "Step 1 of 5");
  check("first Next: a follow-up under each of the 6 required answers", shown(".fu") === 6);
  check("first follow-up wording", fu("f-org-name") === F.missing[0] && fu("f-org-zip") === F.missingZip[0]);
  check("no Skip buttons after one follow-up", shown(".fu-skip") === 0);
  check("cursor goes to the first missing answer", document.activeElement.id === "f-org-name");

  $("next").click();
  check("second Next: second follow-up wording", fu("f-org-name") === F.missing[1] && fu("f-org-zip") === F.missingZip[1]);
  check("second Next: a Skip button for each", shown(".fu-skip") === 6);

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
  check("Next still blocked by City and Key Words", $("counter").textContent === "Step 1 of 5" && shown(".fu") === 2);
  skip("f-org-city");
  type("f-org-keywords", "shelter, safety");
  $("next").click();
  check("all answered or skipped: Next goes to Program 1 of 1", $("counter").textContent === "Step 2 of 5" && /Program 1 of 1/.test(title()));
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
  check("Next blocked by the one missing answer, Description", $("counter").textContent === "Step 2 of 5" && shown(".fu") === 1 && fu("f-programs-0-description") !== "");
  check("blank optional Current Impact Statement gets no follow-up", $("f-programs-0-impact-fu").hidden);

  // ---------- Filler words ----------
  type("f-programs-0-description", "Various services");
  check("blank answer that becomes vague: follow-up waits for Next", fu("f-programs-0-description") === "");
  $("next").click();
  check("first Next: vague follow-up names the word", $("counter").textContent === "Step 2 of 5" && fu("f-programs-0-description") === F.vague[0].replace("{word}", "Various"));
  check("no Keep button after one follow-up", shown(".fu-skip") === 0);
  $("next").click();
  check("second Next: second vague follow-up", fu("f-programs-0-description") === F.vague[1].replace("{word}", "Various"));
  check("button says Keep my answer", $("f-programs-0-description-fu").querySelector(".fu-skip").textContent === F.keepButton && shown(".fu-skip") === 1);
  type("f-programs-0-description", "Beds and meals");
  check("removing the filler word hides the follow-up", fu("f-programs-0-description") === "");

  // ---------- Outputs: a number and a year ----------
  type("f-programs-0-outputs", "37,260 meals provided");
  $("next").click();
  check("Outputs with no year: Next blocked with the no-year follow-up", $("counter").textContent === "Step 2 of 5" && fu("f-programs-0-outputs") === F.outputNoYear[0] && shown(".fu") === 1);
  type("f-programs-0-outputs", "37,260 meals provided in FY24");
  check("adding a fiscal year hides it", fu("f-programs-0-outputs") === "");
  type("f-programs-0-outputs", "Served 414 families in 2024");

  act("addProgram");
  check("Add another program goes to Program 2 of 2", $("counter").textContent === "Step 3 of 6" && /Program 2 of 2/.test(title()));
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

  // ---------- Optional sections and the end screen ----------
  check("then Pain Statements", /Pain Statements/.test(title()));
  check("FAC's examples shown as hint text", document.querySelectorAll("#screen .examples li").length === 2);
  check("input box starts empty (no example numbers)", $("f-pain-0").value === "");
  act("addItem");
  check("Add another pain statement", document.querySelectorAll("#screen textarea.ans").length === 2);
  type("f-pain-1", "We lost $800,000 in 2023");
  type("f-pain-0", "TBD");
  $("next").click();
  check("optional answer \"TBD\" blocks Next with a follow-up", /Pain Statements/.test(title()) && fu("f-pain-0") === F.vague[0].replace("{word}", "TBD"));
  $("next").click();
  skip("f-pain-0");
  check("Keep my answer: text stays, flagged Unsupported: vague", $("f-pain-0").value === "TBD" && $("f-pain-0-skipped").textContent === F.keptVague && !$("f-pain-0-skipped").hidden);
  $("next").click();
  check("blank optional section doesn't block Next", /Benchmarks/.test(title()));

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

  check("end screen is last: Next is hidden", $("next").hidden && $("counter").textContent === "Step 6 of 6");
  var todo = Array.prototype.map.call(document.querySelectorAll("#screen .todo li"), function (li) { return li.textContent; });
  check("end screen lists everything still needing attention, in sheet order", todo.join(" | ") ===
    "Location: City and state was skipped (Unsupported) | Mission Statement needs a label | " +
    "Program 2: Program Name was skipped (Unsupported) | Program 2: Description was skipped (Unsupported) | " +
    "Program 2: Outputs is marked Unsupported | " +
    "Pain statement 1 is vague (Unsupported) | Pain statement 2 needs a label");

  document.querySelector('#screen .todo button[data-act="goto"]').click();
  check("clicking a listed item jumps to it", $("counter").textContent === "Step 1 of 6" && document.activeElement.id === "f-org-city");

  $("next").click(); $("next").click();
  act("removeProgram");
  check("Remove this program asks for a second click", saved().programs.length === 2);
  act("removeProgram");
  check("second click removes program 2", saved().programs.length === 1);
});
