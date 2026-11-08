/*
  index.html: Screen 1 of FAC's ROI.bot Version 2 build plan. Loaded in a
  hidden frame, typed into, then Continue: the builder should open with the
  name, website and ZIP filled in. Browsers don't let a page opened from a
  drive look inside a frame, so these run only from a web address.
*/
T.runAsync("Screen 1 (index.html)", function (check, done) {
  if (location.protocol === "file:") {
    check.note("These run only on the live site: https://laurenhobley.github.io/thefundraisingaccountant/tests/tests.html");
    done();
    return;
  }
  var Q = FAC_QUESTIONS, T1 = Q.screen1;
  var frame = document.createElement("iframe");
  frame.className = "sandbox";
  frame.setAttribute("aria-hidden", "true");
  var stage = "screen1";
  var timer = setTimeout(function () { check("Screen 1 loaded (" + stage + ")", false); done(); }, 20000);

  frame.onload = function () {
    var d = frame.contentDocument, w = frame.contentWindow;
    var $ = function (id) { return d.getElementById(id); };
    try {
      if (stage === "builder") {
        clearTimeout(timer);
        check("Continue opens the builder with the name, website and ZIP filled in", /builder\.html$/.test(w.location.pathname) &&
          $("f-org-name").value === "Riverbend Food Bank" && $("f-org-website").value === "https://example.org" && $("f-org-zip").value === "77001");
        done();
        return;
      }
      var type = function (id, text) { var e = $(id); e.value = text; e.dispatchEvent(new w.Event("input", { bubbles: true })); };
      var text = d.body.textContent;
      check("FAC's header, title and one-line instruction", $("brand").textContent === Q.brand && $("title").textContent === Q.title && $("intro").textContent === T1.intro);
      check("progress bar: Step 1 current, part 1.1 Your Organization current", d.querySelector("#stepsTabs .current").textContent.indexOf("Measure Your ROI") > -1 &&
        d.querySelectorAll("#parts li").length === 5 && d.querySelector("#parts .current .part-label").textContent === "Your Organization");
      check("only four fields: Your name, Organization name, Website, ZIP code (Step 1.0's inputs)", d.querySelectorAll("#s1 input").length === 4 && $("s1-name-label").textContent === T1.name &&
        $("s1-org-label").textContent === T1.org && $("s1-website-label").textContent === T1.website && $("s1-zip-label").textContent === T1.zip);
      check("no prompt, MISSING tags, counters or asterisks for members", !/prompt|MISSING|required|\*/i.test(text));
      check("Continue is off until the fields are filled", $("continue").disabled);
      type("s1-org", "Riverbend Food Bank"); type("s1-website", "https://example.org");
      check("still off without a ZIP", $("continue").disabled);
      type("s1-zip", "7700");
      check("still off with a 4-digit ZIP", $("continue").disabled);
      type("s1-zip", "77001");
      check("still off without your name", $("continue").disabled);
      type("s1-name", "Jordan Rivera");
      check("all four filled: Continue is on", !$("continue").disabled);
      check("what's typed is kept in this browser, your name too (not sent anywhere)", JSON.parse(w.localStorage.getItem("roi-screen1-v1")).org === "Riverbend Food Bank" && JSON.parse(w.localStorage.getItem("roi-screen1-v1")).name === "Jordan Rivera");
      w.FACZip.load(function () {
        try {
          type("s1-zip", "77001");
          check("the ZIP shows its place to confirm", $("s1-zip-place").textContent === Q.zipPlace.found.replace("{place}", "Houston, TX"));
          // A fresh builder (the builder tests above saved one with a name in it).
          w.localStorage.removeItem("fac-prompt-sheet-draft-v1");
          stage = "builder";
          $("continue").click();
        } catch (e) { check("Stopped with an error: " + e.message, false); done(); }
      });
    } catch (e) { check("Stopped with an error: " + e.message, false); clearTimeout(timer); done(); }
  };
  frame.src = "../index.html";
  document.body.appendChild(frame);
});
