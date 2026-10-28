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
  check("Current Impact Statement (optional) has no follow-up", !$("f-programs-0-impact-fu"));
  type("f-programs-0-name", "Emergency shelter");
  type("f-programs-0-outputs", "Served 414 families in 2024");
  pick("f-programs-0-outputs", "known");
  check("Known shows the Source box", !$("f-programs-0-outputs-lab").querySelector(".lab-note-wrap").hidden);
  check("Known with no source is flagged", $("f-programs-0-outputs-lab").getAttribute("data-status") === "needsNote");
  type("f-programs-0-outputs-note", "2024 annual report");
  check("source filled in: no longer flagged", $("f-programs-0-outputs-lab").getAttribute("data-status") === "ok");
  $("next").click();
  check("Next blocked by the one missing answer, Description", $("counter").textContent === "Step 2 of 5" && shown(".fu") === 1 && fu("f-programs-0-description") !== "");
  type("f-programs-0-description", "Beds and meals");

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
  $("next").click(); $("next").click();
  skip("f-programs-1-name"); skip("f-programs-1-description");
  $("next").click();

  // ---------- Optional sections and the end screen ----------
  check("then Pain Statements", /Pain Statements/.test(title()));
  check("FAC's examples shown as hint text", document.querySelectorAll("#screen .examples li").length === 2);
  check("input box starts empty (no example numbers)", $("f-pain-0").value === "");
  act("addItem");
  check("Add another pain statement", document.querySelectorAll("#screen textarea.ans").length === 2);
  type("f-pain-1", "We lost $800,000 in 2023");
  $("next").click();
  check("blank optional section doesn't block Next", /Benchmarks/.test(title()));
  $("next").click();

  check("end screen is last: Next is hidden", $("next").hidden && $("counter").textContent === "Step 6 of 6");
  var todo = Array.prototype.map.call(document.querySelectorAll("#screen .todo li"), function (li) { return li.textContent; });
  check("end screen lists everything still needing attention, in sheet order", todo.join(" | ") ===
    "Location: City and state was skipped (Unsupported) | Mission Statement needs a label | " +
    "Program 2: Program Name was skipped (Unsupported) | Program 2: Description was skipped (Unsupported) | " +
    "Program 2: Outputs is marked Unsupported | Pain statement 2 needs a label");

  document.querySelector('#screen .todo button[data-act="goto"]').click();
  check("clicking a listed item jumps to it", $("counter").textContent === "Step 1 of 6" && document.activeElement.id === "f-org-city");

  $("next").click(); $("next").click();
  act("removeProgram");
  check("Remove this program asks for a second click", saved().programs.length === 2);
  act("removeProgram");
  check("second click removes program 2", saved().programs.length === 1);
});
