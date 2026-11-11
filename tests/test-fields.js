/*
  A field added, renamed or removed in questions.js must change every place
  it appears: its screen, its "Happy?" check and the finished prompt. These
  tests add made-up fields to a copy of the questions and check each place.
  (Screen 1, quick.html and pain-statement.html have their own boxes; see
  README.md.)
*/
T.run("Fields come from questions.js (1.1, 1.2, 1.3)", function (check) {
  var S = FACSheet, Q = FAC_QUESTIONS;
  function copyQ() {
    var q = JSON.parse(JSON.stringify(Q));
    for (var k in Q) if (typeof Q[k] === "function") q[k] = Q[k];
    return q;
  }
  function sec(q, id) { return q.sections.filter(function (s) { return s.id === id; })[0]; }

  check("1.1 shows every Organization Info question, in order",
    S.fieldsOf(Q, "org").map(function (q) { return q.id; }).join() === sec(Q, "org").questions.filter(function (q) { return q.kind !== "keywords"; }).map(function (q) { return q.id; }).join());
  check("the 1.3 boxes in questions.js (screen: \"outcomes\") match the ones the checks use",
    S.fieldsOf(Q, "outcomes").map(function (q) { return q.id; }).join() === S.ON_OUTCOMES.join());
  check("each 1.3 box has its on-screen name in questions.js", S.fieldsOf(Q, "outcomes").every(function (q) { return !!q.screenLabel; }));

  // A new 1.1 field and a new 1.2 field, in a copy of the questions.
  var Q2 = copyQ();
  sec(Q2, "org").questions.splice(1, 0, { id: "ein", label: "Tax ID (EIN)", kind: "text", required: false });
  sec(Q2, "programs").questions.splice(1, 0, { id: "budget", label: "Program budget", kind: "text", required: false });
  sec(Q2, "org").questions[0].label = "Organization name";
  var st = S.blank(Q2);
  st.org.name.text = "Quillfeather Test"; st.org.ein.text = "00-0000000"; st.programs[0].name.text = "Test Program"; st.programs[0].budget.text = "Budget line here";
  check("a new 1.1 field is part of 1.1 and its check", S.fieldsOf(Q2, "org").some(function (q) { return q.id === "ein"; }));
  check("a new 1.2 field is on the program's own screen and its check", S.fieldsOf(Q2, "program").some(function (q) { return q.id === "budget"; }));
  var prompt = FACExport.build(Q2, st);
  check("the prompt has the new 1.1 field with its label", prompt.indexOf("Tax ID (EIN): 00-0000000") > -1);
  check("the prompt uses a renamed 1.1 label", prompt.indexOf("Organization name: Quillfeather Test") > -1);
  check("the prompt has the new 1.2 field", prompt.indexOf("Program budget: Budget line here") > -1);
  check("the questions' own order is kept in the prompt (name, then the new field)", prompt.indexOf("Organization name:") < prompt.indexOf("Tax ID (EIN):"));
});

T.run("Fields come from questions.js (builder screens)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;
  function $(id) { return document.getElementById(id); }
  // 1.3 is the third part's dot in Step 1's progress bar.
  document.querySelectorAll("#parts .dot")[2].click();
  var outs = S.fieldsOf(Q, "outcomes");
  check("1.3 shows each box's name from questions.js", outs.every(function (q) {
    var l = document.querySelector('label[for="f-programs-0-' + q.id + '"]'); return !!l && l.textContent.indexOf(q.screenLabel) === 0;
  }));
  check("1.3 shows each box's help from questions.js", outs.every(function (q) { return document.querySelector("#screen").textContent.indexOf(q.help) > -1; }));
  check("1.3 marks a box required only when questions.js says so", outs.every(function (q) {
    return !!document.querySelector('label[for="f-programs-0-' + q.id + '"] .req') === !!q.required;
  }));
  document.querySelectorAll("#parts .dot")[0].click();
  var rows = document.querySelectorAll("#screen .chk-table tbody tr").length;
  $("next").click();
  var onCheck = !!document.querySelector("#screen .chk-table");
  check("the 1.1 check has one row per 1.1 box in questions.js", !onCheck || document.querySelectorAll("#screen .chk-table tbody tr").length === S.fieldsOf(Q, "org").length);
  check("(the 1.1 screen itself has no check table)", rows === 0);
});
