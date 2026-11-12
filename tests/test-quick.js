/*
  quick.html: only the required fields of Screen 1 in Steve's Step 1
  flowchart (Organization, Website, ZIP), then a short prompt. First the
  prompt and the required-answer check on their own, then the page itself
  in a hidden frame (from a web address only, like Screen 1's). The frame
  types the same made-up answers as Screen 1's test, since both pages keep
  them under the same key.
*/
T.run("Three questions: the prompt (quick.js)", function (check) {
  var Q = FAC_QUESTIONS, K = Q.quick;
  var d = { org: "Riverbend Food Bank", website: "https://example.org", zip: "77001" };
  check("only Screen 1's fields from the flowchart: Organization, Website, ZIP", FACQuick.FIELDS.join() === "org,website,zip");
  check("all three are required; the ZIP must be 5 digits", FACQuick.missing({}).join() === "org,website,zip" &&
    FACQuick.missing({ org: "A", website: " ", zip: "7700" }).join() === "website,zip" && FACQuick.missing(d).length === 0);
  var p = FACQuick.build(Q, d, "Houston, TX");
  check("Context: the three answers in FAC's sheet wording, and nothing else", p.indexOf(
    "Context:\nOrganization Info\nName: Riverbend Food Bank\nLocation (include zip): 77001 (Houston, TX)\nWeb Site: https://example.org\n\nTask:\n") === 0);
  var T11 = Q.step11.task;
  check("Task: read the whole website, then the report in five parts: Steve's Step 1.1, 1.2 and 1.3 mockups, what to check, FAC's sheet",
    p.indexOf("Task:\n" + T11 + "\n\n") > -1 &&
    T11.indexOf("Read our whole website, not just the home page") === 0 && T11.indexOf("Form 990") > -1 &&
    T11.indexOf("the columns Field, What I found and Source") > -1 &&
    T11.indexOf("Name; Website; Location (street address, and whether it matches our ZIP); Area served; Mission (our exact words, 125 characters or fewer); Social media.") > -1 &&
    T11.indexOf("in five groups: Issue, People served, Services, Location and Results.") > -1 &&
    T11.indexOf("Part 2, Step 1.2 Your Programs, Stack Ranked: a table with the columns Rank, Program, Mission fit, Prominence, Evidence, Score and Why it ranks here") > -1 &&
    T11.indexOf("(3 is the highest), multiply the three for its Score") > -1 &&
    T11.indexOf("Part 3, Step 1.3 Outputs to Outcomes: a table with the columns Program, Outputs (what you did) and Outcomes (what changed), one row per program in your Part 2 order.") > -1 &&
    T11.indexOf("write \"___\" for us to fill in") > -1 && T11.indexOf("Then One thing to check: the figures that are more than 18 months old or undated.") > -1 &&
    T11.indexOf("Part 4, Two things to check") > -1 && T11.indexOf("Part 5, our sheet, last") > -1 && T11.indexOf("Never invent a number or a source.") > -1 &&
    T11.indexOf("\"Organization Info\"") > -1 && T11.indexOf("\"Programs (in order of priority)\"") > -1 && T11.indexOf("\"Local Context/Data\"") > -1 &&
    T11.indexOf("\"Benchmarks\"") > -1 && T11.indexOf("instead of guessing") > -1);
  check("Constraints: FAC's 10 rules for AI, then the guardrail line last", p.indexOf("Constraints:\n- " + Q.rtcc.rules.join("\n- ") + "\n" + Q.guardrail) > -1 &&
    p.slice(-Q.guardrail.length) === Q.guardrail);
  check("no figure the member didn't type: the only numbers are their ZIP and FAC's own wording (step numbers, Parts 1 to 5, 125 characters, scores 1 to 3, 18 months, the 990)",
    (p.replace(Q.guardrail, "").match(/\d+/g) || []).join() === ["77001"].concat(T11.match(/\d+/g)).join() &&
    T11.match(/\d+/g).every(function (n) { return ["990", "1", "2", "3", "4", "5", "18", "125"].indexOf(n) > -1; }));
  check("with no place for the ZIP, just the ZIP", FACQuick.build(Q, d, "").indexOf("Location (include zip): 77001\n") > -1);
});

T.runAsync("Three questions: the page (quick.html)", function (check, done) {
  if (location.protocol === "file:") {
    check.note("These run only on the live site: https://laurenhobley.github.io/thefundraisingaccountant/tests/tests.html");
    done();
    return;
  }
  var Q = FAC_QUESTIONS, T1 = Q.screen1, K = Q.quick, F = Q.followUps;
  var frame = document.createElement("iframe");
  frame.className = "sandbox";
  frame.setAttribute("aria-hidden", "true");
  var timer = setTimeout(function () { check("quick.html loaded", false); done(); }, 20000);
  frame.onload = function () {
    var d = frame.contentDocument, w = frame.contentWindow;
    var $ = function (id) { return d.getElementById(id); };
    function type(id, text) { var e = $(id); e.value = text; e.dispatchEvent(new w.Event("input", { bubbles: true })); }
    function fus() { return Array.prototype.filter.call(d.querySelectorAll("#quick .fu-q"), function (p) { return p.textContent; }).length; }
    try {
      check("FAC's header and logo, the page's title and intro", $("brand").textContent === Q.brand && !!d.querySelector(".topbar .logo") &&
        $("title").textContent === K.pageTitle && $("intro").textContent === K.intro);
      check("exactly three boxes, Screen 1's from the flowchart (Organization, Website, ZIP), each marked required",
        d.querySelectorAll("#quick input").length === 3 &&
        ["org", "website", "zip"].map(function (k) { return $("q-" + k + "-label").textContent; }).join("|") === [T1.org, T1.website, T1.zip].join("|") &&
        d.querySelectorAll("#quick .req").length === 3);
      check("nothing from Screen 2: no name, title or phone", !d.querySelector('#quick input[autocomplete="name"], #quick input[autocomplete="organization-title"], #quick input[autocomplete="tel"]'));
      check("Next is orange, and the prompt waits", w.getComputedStyle($("q-next")).backgroundColor === "rgb(199, 97, 40)" && $("q-result").hidden);
      ["q-org", "q-website", "q-zip"].forEach(function (id) { type(id, ""); });
      $("q-next").click();
      check("Next with blanks: a follow-up under each of the three, and no prompt", fus() === 3 && $("q-result").hidden &&
        $("q-org-fu").textContent === F.missing[0] && $("q-zip-fu").textContent === F.missingZip[0] && d.activeElement === $("q-org"));
      type("q-org", "Riverbend Food Bank"); type("q-website", "https://example.org"); type("q-zip", "7700");
      check("answering hides each follow-up; a 4-digit ZIP keeps its own", fus() === 1 && $("q-zip-fu").textContent === F.missingZip[0]);
      $("q-next").click();
      check("still no prompt with a 4-digit ZIP", $("q-result").hidden);
      type("q-zip", "77001");
      $("q-next").click();
      check("all three in: the prompt shows, built from the answers", !$("q-result").hidden &&
        $("q-preview").textContent === w.FACQuick.build(Q, { org: "Riverbend Food Bank", website: "https://example.org", zip: "77001" }, w.FACZip.place("77001") || ""));
      check("no \"I reviewed this\" tick: \"Yes, copy my prompt\" and Download are on right away; Open ROI.bot waits", !$("q-reviewed") &&
        $("q-copy").textContent === Q.review.copyButton && !$("q-copy").disabled && !$("q-download").disabled && $("q-open").hidden);
      $("q-copy").click();
      check("one click on Yes copies it, and Open ROI.bot shows, opening FAC's ROI.bot in a new tab", !$("q-open").hidden &&
        $("q-open").getAttribute("href") === Q.roiBotUrl && $("q-open").target === "_blank");
      type("q-org", "Riverbend Food Bank ");
      check("changing an answer means copying again: Open ROI.bot waits, Yes stays on", $("q-open").hidden && !$("q-copy").disabled);
      var kept = JSON.parse(w.localStorage.getItem("roi-screen1-v1"));
      check("kept in this browser under Screen 1's key, for the builder too", kept.org === "Riverbend Food Bank" && kept.zip === "77001" && kept.website === "https://example.org");
      type("q-website", "");
      check("emptying a box after Next hides the prompt and asks again", $("q-result").hidden && $("q-website-fu").textContent === F.missing[0]);
      type("q-website", "https://example.org");
      check("a link to the full prompt builder", $("q-full").getAttribute("href") === "builder.html" && $("q-full").textContent === K.fullBuilder);
      w.FACZip.load(function () {
        try {
          check("the ZIP shows its place to confirm", $("q-zip-place").textContent === Q.zipPlace.found.replace("{place}", "Houston, TX"));
        } catch (e) { check("Stopped with an error: " + e.message, false); }
        clearTimeout(timer); frame.remove(); done();
      });
    } catch (e) { check("Stopped with an error: " + e.message, false); clearTimeout(timer); done(); }
  };
  frame.src = "../quick.html";
  document.body.appendChild(frame);
});
