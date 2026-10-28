/*
  builder.js: the screens. builder.js runs on a hidden copy of builder.html's
  controls at the bottom of tests.html, and these tests type and click on it.
*/
T.run("Builder screens (builder.html)", function (check) {
  function $(id) { return document.getElementById(id); }
  function type(id, text) { var e = $(id); e.value = text; e.dispatchEvent(new Event("input", { bubbles: true })); }
  function pick(id, value) {
    var r = document.querySelector('input[name="' + id + '-lab"][value="' + value + '"]');
    r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true }));
  }
  function act(a) { document.querySelector('#screen button[data-act="' + a + '"]').click(); }
  function title() { return document.querySelector("#screen h2").textContent; }
  function saved() { return JSON.parse(localStorage.getItem("fac-prompt-sheet-draft-v1")); }

  check("starts on Step 1 of 5", $("counter").textContent === "Step 1 of 5");
  check("Back is off on step 1", $("back").disabled);
  type("f-org-mission", "We help families");
  check("no number: no label box", $("f-org-mission-lab").hidden);
  type("f-org-mission", "We help 400 families");
  check("number typed: label box appears", !$("f-org-mission-lab").hidden);
  type("f-org-zip", "77001");
  check("ZIP code has no label box", !$("f-org-zip-lab"));
  check("answer saved in the browser", saved().org.mission.text === "We help 400 families");

  $("next").click();
  check("Next goes to Program 1 of 1", $("counter").textContent === "Step 2 of 5" && /Program 1 of 1/.test(title()));
  check("no Remove button with only one program", !document.querySelector('#screen [data-act="removeProgram"]'));
  type("f-programs-0-name", "Emergency shelter");
  type("f-programs-0-outputs", "Served 414 families in 2024");
  pick("f-programs-0-outputs", "known");
  check("Known shows the Source box", !$("f-programs-0-outputs-lab").querySelector(".lab-note-wrap").hidden);
  check("Known with no source is flagged", $("f-programs-0-outputs-lab").getAttribute("data-status") === "needsNote");
  type("f-programs-0-outputs-note", "2024 annual report");
  check("source filled in: no longer flagged", $("f-programs-0-outputs-lab").getAttribute("data-status") === "ok");

  act("addProgram");
  check("Add another program goes to Program 2 of 2", $("counter").textContent === "Step 3 of 6" && /Program 2 of 2/.test(title()));
  type("f-programs-1-outputs", "About 50 people");
  pick("f-programs-1-outputs", "unsupported");
  check("Unsupported stays flagged", $("f-programs-1-outputs-lab").getAttribute("data-status") === "unsupported");

  $("back").click();
  check("Back keeps program 1's answers", $("f-programs-0-name").value === "Emergency shelter" && $("f-programs-0-outputs-note").value === "2024 annual report");
  $("next").click(); $("next").click();
  check("then Pain Statements", /Pain Statements/.test(title()));
  check("FAC's examples shown as hint text", document.querySelectorAll("#screen .examples li").length === 2);
  check("input box starts empty (no example numbers)", $("f-pain-0").value === "");
  act("addItem");
  check("Add another pain statement", document.querySelectorAll("#screen textarea.ans").length === 2);
  type("f-pain-1", "We lost $800,000 in 2023");

  $("next").click(); $("next").click();
  check("end screen is last: Next is hidden", $("next").hidden && $("counter").textContent === "Step 6 of 6");
  var todo = Array.prototype.map.call(document.querySelectorAll("#screen .todo li"), function (li) { return li.textContent; });
  check("end screen lists the 3 figures needing attention", todo.join(" | ") ===
    "Mission Statement needs a label | Program 2: Outputs is marked Unsupported | Pain statement 2 needs a label");

  document.querySelector('#screen .todo button[data-act="goto"]').click();
  check("clicking a listed figure jumps to it", $("counter").textContent === "Step 1 of 6" && document.activeElement.id === "f-org-mission");

  $("next").click(); $("next").click();
  act("removeProgram");
  check("Remove this program asks for a second click", saved().programs.length === 2);
  act("removeProgram");
  check("second click removes program 2", saved().programs.length === 1);
});
