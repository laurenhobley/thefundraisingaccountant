/*
  index.html: the live pain statement form. Rule 2: every number in the
  prompt is one the member typed, exactly as typed.

  The form is loaded in a hidden frame. Browsers don't let a page opened
  from a drive look inside a frame, so these run only on the live site.
*/
T.runAsync("Live form numbers (index.html)", function (check, done) {
  if (location.protocol === "file:") {
    check.note("These run only on the live site: https://laurenhobley.github.io/thefundraisingaccountant/tests/tests.html");
    done();
    return;
  }
  var frame = document.createElement("iframe");
  frame.className = "sandbox";
  frame.setAttribute("aria-hidden", "true");
  var timer = setTimeout(function () { check("live form loaded", false); done(); }, 15000);

  frame.onload = function () {
    clearTimeout(timer);
    try {
      var d = frame.contentDocument, w = frame.contentWindow;
      var $ = function (id) { return d.getElementById(id); };
      var type = function (e, text) { e.value = text; e.dispatchEvent(new w.Event("input", { bubbles: true })); };
      var prompt = function () { return $("prompt").textContent; };
      var ready = function () { return $("pill").className.indexOf("ok") > -1; };

      $("driverBoth").click();
      type($("orgName"), "Test Org"); type($("city"), "Houston, TX"); type($("zip"), "77001"); type($("program"), "Shelter");
      $("lossGov").click();
      type($("servicesLost"), "Beds"); type($("outcomes"), "Safety");
      $("servedPeriod").value = "per year"; $("servedPeriod").dispatchEvent(new w.Event("change", { bubbles: true }));
      type(d.querySelector(".r-what"), "a night of safety");

      type($("lossAmount"), "1234.5678");
      check("decimals kept exactly: $1,234.5678", prompt().indexOf("Funding lost: $1,234.5678") > -1);
      type($("lossAmount"), "800000");
      check("whole number gets commas only: $800,000", prompt().indexOf("Funding lost: $800,000\n") > -1);
      type($("unserved"), "1e3");
      check("1e3 is not turned into 1,000", $("unserved").value === "1e3" && prompt().indexOf("1,000") === -1);
      check("1e3 shows as MISSING", /People who go unserved: \[MISSING/.test(prompt()));
      type($("unserved"), "-5");
      check("-5 shows as MISSING", /People who go unserved: \[MISSING/.test(prompt()));
      type($("unserved"), "1680");
      check("1680 shows as 1,680", prompt().indexOf("People who go unserved: 1,680") > -1);
      type($("demandPct"), "12.5");
      check("percent kept exactly: 12.5%", prompt().indexOf("Increase in demand for services: 12.5%") > -1);
      type($("demandPct"), "1e1");
      check("percent 1e1 shows as MISSING", /Increase in demand for services: \[MISSING/.test(prompt()));
      type($("demandPct"), "12.5");
      type($("servedCount"), "414");
      type(d.querySelector(".r-amt"), "125");
      check("gift amount: $125 provides…", prompt().indexOf("- $125 provides a night of safety") > -1);
      check("ZIP code in the prompt: Houston, TX 77001", prompt().indexOf("Location: Houston, TX 77001") > -1);
      check("everything filled in: ready to copy", ready());

      type($("zip"), "7700");
      check("ZIP 7700: not ready", !ready() && /Location: Houston, TX \[MISSING/.test(prompt()));
      type($("zip"), "77001");
      type($("saves"), "2e6");
      check("optional dollars saved 2e6: not ready", !ready());
      check("2e6 shows as MISSING, not $2,000,000", /Dollars saved: \[MISSING/.test(prompt()) && prompt().indexOf("2,000,000") === -1);
      $("copy").click();
      check("Copy refuses and asks for digits only", /Dollars saved \(digits only\)/.test($("msg").textContent));
      type($("saves"), "");
      check("empty dollars saved: ready, prompt says not provided", ready() && prompt().indexOf("Dollars saved: not provided") > -1);
      type(d.querySelector(".r-amt"), "1e2");
      check("gift amount 1e2: not ready, no $100", !ready() && prompt().indexOf("$100") === -1);
      type(d.querySelector(".r-amt"), "125");

      // Every number in the prompt must be one typed above, or a fixed section or list number.
      var typed = ["800,000", "12.5", "1,680", "414", "125", "77001"];
      var fixed = ["1.1", "1.2", "1", "2", "3", "4"];
      var found = prompt().match(/\d[\d,.]*\d|\d/g) || [];
      var strays = found.filter(function (n) { return typed.indexOf(n) === -1 && fixed.indexOf(n) === -1; });
      check("no number in the prompt that wasn't typed" + (strays.length ? " (found: " + strays.join(" ") + ")" : ""), strays.length === 0);
    } catch (e) { check("Stopped with an error: " + e.message, false); }
    done();
  };
  frame.src = "../index.html";
  document.body.appendChild(frame);
});
