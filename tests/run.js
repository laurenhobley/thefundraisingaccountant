/*
  Tiny test helper for tests.html. Each check shows a green ✓ or a red ✗,
  and the total shows at the top.

  This file loads first. It puts aside any drafts already saved in this
  browser (the live form's and the builder's) so the tests start blank,
  then puts them back when every test has finished.
*/
var T = (function () {
  var DRAFTS = ["impact-prompt-draft-v1", "fac-prompt-sheet-draft-v1"];
  var kept = {}, pass = 0, fail = 0, waiting = 0, ended = false;
  try {
    DRAFTS.forEach(function (k) { kept[k] = localStorage.getItem(k); localStorage.removeItem(k); });
  } catch (e) {}

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Adds a titled section and returns a check function that writes into it.
  function section(title) {
    var report = document.getElementById("report");
    var box = el("section"), list = el("ul");
    box.appendChild(el("h2", null, title));
    box.appendChild(list);
    report.appendChild(box);
    function check(name, ok) {
      list.appendChild(el("li", ok ? "pass" : "fail", name));
      if (ok) pass++; else fail++;
      summary();
    }
    check.note = function (text) { list.appendChild(el("li", "note", text)); };
    return check;
  }

  function summary() {
    var s = document.getElementById("summary");
    var total = pass + fail;
    s.textContent = (fail ? fail + " failed · " : "") + pass + " of " + total + " passed" + (ended && !waiting ? "" : " (still running…)");
    s.className = "sum " + (fail ? "bad" : "ok");
  }

  function run(title, fn) {
    var check = section(title);
    try { fn(check); } catch (e) { check("Stopped with an error: " + e.message, false); }
  }

  // For tests that have to wait (like loading the live form in a frame).
  function runAsync(title, fn) {
    var check = section(title), finished = false;
    waiting++;
    function done() { if (finished) return; finished = true; waiting--; finishIfReady(); }
    try { fn(check, done); } catch (e) { check("Stopped with an error: " + e.message, false); done(); }
  }

  function finishIfReady() {
    if (!ended || waiting) return;
    try {
      DRAFTS.forEach(function (k) {
        if (kept[k] == null) localStorage.removeItem(k); else localStorage.setItem(k, kept[k]);
      });
    } catch (e) {}
    summary();
    document.documentElement.setAttribute("data-tests", fail ? "failed" : "passed");
  }

  // Called once at the bottom of tests.html, after every test file has loaded.
  function end() { ended = true; finishIfReady(); summary(); }

  return { run: run, runAsync: runAsync, end: end };
})();
