/*
  index.html: Let's Get Started, from FAC's ROI.bot Version 2 build plan.
  Two screens, loaded in a hidden frame and typed into; Next on Screen 2
  should open the builder with the organization's name, website and ZIP
  filled in. Browsers don't let a page opened from a drive look inside a
  frame, so these run only from a web address.
*/
T.runAsync("Let's Get Started (index.html)", function (check, done) {
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
  var timer = setTimeout(function () { check("Let's Get Started loaded (" + stage + ")", false); done(); }, 20000);

  frame.onload = function () {
    var d = frame.contentDocument, w = frame.contentWindow;
    var $ = function (id) { return d.getElementById(id); };
    try {
      if (stage === "builder") {
        clearTimeout(timer);
        var draft = JSON.parse(w.localStorage.getItem("fac-prompt-sheet-draft-v1"));
        check("Next on Screen 2 opens the builder with the name, website and ZIP filled in", /builder\.html$/.test(w.location.pathname) &&
          draft.org.name.text === "Riverbend Food Bank" && draft.org.website.text === "https://example.org" && draft.org.zip.text === "77001");
        check("it opens straight on the report screen (the 1.1 check), not the same three questions again (Nov 11)",
          d.querySelector("#screen h2").textContent.indexOf(Q.flow.checkpoints.org.title) > -1 && !!$("s11-prompt") &&
          $("s11-prompt").textContent.indexOf("Name: Riverbend Food Bank") > -1);
        $("back").click();
        check("← Previous goes to Organization Info, and from there back to Screen 2", $("f-org-name").value === "Riverbend Food Bank" &&
          $("back").getAttribute("data-to") === "index.html#you");
        var bl = d.querySelector(".topbar .logo");
        check("the builder shows ROI.bot's logo top right", !!bl && bl.alt === "ROI.bot" && bl.complete && bl.naturalWidth > 0);
        done();
        return;
      }
      var type = function (id, text) { var e = $(id); e.value = text; e.dispatchEvent(new w.Event("input", { bubbles: true })); };
      check("FAC's header, title and one-line instruction", $("brand").textContent === Q.brand && $("title").textContent === Q.title && $("intro").textContent === T1.intro);
      var logo = d.querySelector(".topbar .logo"), lr = logo && logo.getBoundingClientRect(), br = $("brand").getBoundingClientRect();
      check("ROI.bot's logo loads, top right across from FAC's name, 56px tall", !!logo && logo.alt === "ROI.bot" && logo.complete && logo.naturalWidth > 0 &&
        lr.left > br.right && Math.round(lr.height) === 56);
      check("progress bar: Step 1 Pick Your Story current, part 1.1 Your Organization current", d.querySelector("#stepsTabs .current").textContent.indexOf("Pick Your Story") > -1 &&
        d.querySelectorAll("#parts li").length === 5 && d.querySelector("#parts .current .part-label").textContent === "Your Organization");
      check("Screen 1: Organization name, Website, ZIP code, and Next with no Previous", !$("s1").hidden && $("s2").hidden &&
        d.querySelectorAll("#s1 input").length === 3 && $("s1-org-label").textContent === T1.org && $("s1-website-label").textContent === T1.website &&
        $("s1-zip-label").textContent === T1.zip && $("next1").textContent === "Next" && !d.querySelector("#s1 .ghost"));
      check("Next is orange; nothing else on the page is", w.getComputedStyle($("next1")).backgroundColor === "rgb(199, 97, 40)" &&
        w.getComputedStyle($("prev2")).backgroundColor !== "rgb(199, 97, 40)");
      check("no prompt, MISSING tags, counters or asterisks for members", !/prompt|MISSING|required|\*/i.test(d.body.textContent));
      check("the next-step line waits for Screen 2, and has Steve's wording", $("nextLine").hidden && T1.nextLine === "Next we will scrub the web to learn about your programs");
      // Start blank: quick.html's test may have saved answers under the same key.
      ["s1-org", "s1-website", "s1-zip"].forEach(function (id) { type(id, ""); });
      check("Next is off until Screen 1 is filled", $("next1").disabled);
      type("s1-org", "Riverbend Food Bank"); type("s1-website", "https://example.org");
      check("still off without a ZIP", $("next1").disabled);
      type("s1-zip", "7700");
      check("still off with a 4-digit ZIP", $("next1").disabled);
      type("s1-zip", "77001");
      check("Screen 1 filled: Next is on", !$("next1").disabled);
      $("next1").click();
      check("Next goes to Screen 2: Name, Title, Email, Phone (Steve's flowchart), with ← Previous, the new intro and the next-step line", $("s1").hidden && !$("s2").hidden &&
        Array.prototype.map.call(d.querySelectorAll("#s2 input"), function (e) { return e.id; }).join() === "s2-name,s2-title,s2-email,s2-phone" &&
        $("s2-name-label").textContent === T1.name && $("s2-title-label").textContent === T1.jobTitle && $("s2-email-label").textContent === T1.email &&
        $("s2-email").type === "email" && $("s2-email").getAttribute("autocomplete") === "email" && w.getComputedStyle($("s2-email")).minHeight === w.getComputedStyle($("s2-name")).minHeight &&
        $("s2-phone-label").textContent === T1.phone &&
        $("prev2").textContent === Q.flow.previousButton && $("intro").textContent === T1.intro2 && !$("nextLine").hidden && $("nextLine").textContent === T1.nextLine);
      check("no promise of a texted code until one can be sent", !/text you a code/i.test(d.body.textContent));
      $("prev2").click();
      check("← Previous goes back to Screen 1, answers kept", !$("s1").hidden && $("s2").hidden && $("s1-org").value === "Riverbend Food Bank");
      $("next1").click();
      ["s2-name", "s2-title", "s2-email", "s2-phone"].forEach(function (id) { type(id, ""); });
      check("Next on Screen 2 is off until it's filled", $("next2").disabled);
      type("s2-name", "Jordan Rivera"); type("s2-title", "Executive Director"); type("s2-phone", "(713) 555-0100");
      check("still off without an email (required)", $("next2").disabled);
      type("s2-email", "jordan@example");
      check("still off with an email that isn't one (no dot after the @)", $("next2").disabled);
      type("s2-email", "jordan@example.org");
      type("s2-phone", "713-555");
      check("still off with a phone number too short", $("next2").disabled);
      type("s2-phone", "(713) 555-0100");
      check("all filled: Next is on", !$("next2").disabled);
      var kept = JSON.parse(w.localStorage.getItem("roi-screen1-v1"));
      check("everything is kept in this browser only, for later", kept.org === "Riverbend Food Bank" && kept.name === "Jordan Rivera" && kept.title === "Executive Director" &&
        kept.email === "jordan@example.org" && kept.phone === "(713) 555-0100");
      w.FACZip.load(function () {
        try {
          type("s1-zip", "77001");
          check("the ZIP shows its place to confirm", $("s1-zip-place").textContent === Q.zipPlace.found.replace("{place}", "Houston, TX"));
          // A fresh builder (the builder tests above saved one with a name in it).
          w.localStorage.removeItem("fac-prompt-sheet-draft-v1");
          stage = "builder";
          $("next2").click();
        } catch (e) { check("Stopped with an error: " + e.message, false); done(); }
      });
    } catch (e) { check("Stopped with an error: " + e.message, false); clearTimeout(timer); done(); }
  };
  frame.src = "../index.html";
  document.body.appendChild(frame);
});
