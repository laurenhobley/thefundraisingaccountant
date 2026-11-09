/*
  quick.js: quick.html, only the required fields of Screen 1 in Steve's
  Step 1 flowchart (Organization, Website, ZIP), then a short prompt for
  ROI.bot. All three are required. Next asks a follow-up under each one that's missing
  (and a ZIP that isn't 5 digits); once all three are in, the prompt shows,
  and Copy and Download stay locked until "I reviewed this" is ticked.
  The answers are kept in this browser under Screen 1's key, so the builder
  and Screen 1 share them (what Screen 1 saved for Screen 2 is left alone).
  Nothing is sent anywhere. FACQuick.build makes the prompt, for the tests.
*/
var FACQuick = (function () {
  var FIELDS = ["org", "website", "zip"];
  var STORE = "roi-screen1-v1";
  function trim(s) { return String(s || "").replace(/^\s+|\s+$/g, ""); }
  function zipOk(z) { return /^\d{5}(-\d{4})?$/.test(trim(z)); }
  function line(label, value) { return (label + ": " + value).replace(/\s+$/, ""); }

  // The prompt in RTCC parts, like the builder's: Context (the three answers,
  // in FAC's sheet wording), Task (the drafted Step 1.1 task), Constraints
  // (FAC's 10 rules for AI, then the guardrail line). place: "Houston, TX" or "".
  function build(Q, d, place) {
    var R = Q.rtcc, org = Q.sections.filter(function (s) { return s.id === "org"; })[0];
    function label(id) { return org.questions.filter(function (x) { return x.id === id; })[0].label; }
    var out = [];
    if (trim(R.role)) out.push(R.roleHeading + ":", trim(R.role), "");
    out.push(R.contextHeading + ":", org.title,
      line(label("name"), trim(d.org)),
      line(Q.exportText.location, trim(d.zip) + (place ? " (" + place + ")" : "")),
      line(label("website"), trim(d.website)), "");
    out.push(R.taskHeading + ":", Q.quick.task, "");
    out.push(R.constraintsHeading + ":");
    (R.rules || []).forEach(function (r) { out.push("- " + r); });
    out.push(Q.guardrail);
    return out.join("\n");
  }

  // Which of the three still need an answer ("zip" also when it isn't 5 digits).
  function missing(d) {
    return FIELDS.filter(function (k) { return k === "zip" ? !zipOk(d.zip) : !trim(d[k]); });
  }

  function start() {
    var Q = FAC_QUESTIONS, T = Q.screen1, K = Q.quick, F = Q.followUps;
    var $ = function (id) { return document.getElementById(id); };
    var ids = { org: "q-org", website: "q-website", zip: "q-zip" };
    var words = { org: "org", website: "website", zip: "zip" };
    var asked = false, saved = {};

    $("brand").textContent = Q.brand;
    $("title").textContent = K.pageTitle;
    $("intro").textContent = K.intro;
    FIELDS.forEach(function (k) { $(ids[k] + "-label").textContent = T[words[k]]; $(ids[k]).placeholder = T[words[k] + "Placeholder"]; });
    $("q-next").textContent = Q.flow.nextButton;
    $("q-result-title").textContent = K.promptTitle;
    $("q-result-intro").textContent = K.promptIntro;
    $("q-reviewed-label").textContent = Q.review.checkbox;
    $("q-copy").textContent = Q.review.copyButton;
    $("q-download").textContent = Q.review.downloadButton;
    $("q-open").textContent = Q.openRoiBot;
    $("q-open").href = Q.roiBotUrl;
    $("q-full").textContent = K.fullBuilder;

    // What the member typed before, here or on Screen 1.
    try { saved = JSON.parse(localStorage.getItem(STORE) || "null") || {}; } catch (e) { saved = {}; }
    FIELDS.forEach(function (k) { $(ids[k]).value = saved[k] || ""; });

    function data() { var d = {}; FIELDS.forEach(function (k) { d[k] = $(ids[k]).value; }); return d; }
    function place() { var p = window.FACZip ? FACZip.place($("q-zip").value) : ""; return p || ""; }
    function showPlace() {
      var where = window.FACZip ? FACZip.place($("q-zip").value) : "";
      if (where === null) FACZip.load(function () { showPlace(); refreshPrompt(); });
      $("q-zip-place").textContent = where ? Q.zipPlace.found.replace(/\{place\}/g, where) : where === "" && zipOk($("q-zip").value) ? Q.zipPlace.unknown : "";
    }
    // A follow-up under each missing answer, once Next has been pressed.
    function showFollowUps() {
      var m = asked ? missing(data()) : [];
      FIELDS.forEach(function (k) {
        var on = m.indexOf(k) > -1;
        $(ids[k] + "-fu").textContent = on ? (k === "zip" ? F.missingZip[0] : F.missing[0]) : "";
        $(ids[k]).setAttribute("aria-invalid", on ? "true" : "false");
      });
      return m;
    }
    function lock() {
      var ok = $("q-reviewed").checked;
      $("q-copy").disabled = $("q-download").disabled = !ok;
      $("q-open").hidden = !ok;
      $("q-msg").textContent = ok ? "" : Q.review.locked;
    }
    function refreshPrompt() {
      if ($("q-result").hidden) return;
      if (missing(data()).length) { $("q-result").hidden = true; return; }
      $("q-preview").textContent = build(Q, data(), place());
    }
    function save() {
      var d = data(), keep = {};
      for (var k in saved) if (saved.hasOwnProperty(k)) keep[k] = saved[k];
      FIELDS.forEach(function (f) { keep[f] = trim(d[f]); });
      saved = keep;
      try { localStorage.setItem(STORE, JSON.stringify(keep)); } catch (e) {}
    }

    $("quick").addEventListener("input", function () {
      save(); showPlace(); showFollowUps();
      // Any change clears the tick, so the member reviews what they copy.
      $("q-reviewed").checked = false; lock(); refreshPrompt();
    });
    $("quick").addEventListener("submit", function (e) {
      e.preventDefault();
      asked = true;
      var m = showFollowUps();
      if (m.length) { $(ids[m[0]]).focus(); return; }
      $("q-result").hidden = false;
      $("q-reviewed").checked = false; lock(); refreshPrompt();
      $("q-result-title").focus();
    });
    $("q-reviewed").addEventListener("change", lock);
    $("q-copy").addEventListener("click", function () {
      if (!$("q-reviewed").checked) return;
      var text = $("q-preview").textContent;
      function fallback() {
        var range = document.createRange(); range.selectNodeContents($("q-preview"));
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
        $("q-msg").textContent = Q.review.selected;
      }
      try { navigator.clipboard.writeText(text).then(function () { $("q-msg").textContent = Q.review.copied; }, fallback); }
      catch (e) { fallback(); }
    });
    $("q-download").addEventListener("click", function () {
      if (!$("q-reviewed").checked) return;
      var url = URL.createObjectURL(new Blob([$("q-preview").textContent], { type: "text/plain;charset=utf-8" }));
      var a = document.createElement("a"); a.href = url; a.download = K.fileName;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      $("q-msg").textContent = Q.review.downloaded;
    });
    showPlace(); lock();
  }

  if (document.getElementById("quick")) start();
  return { build: build, missing: missing, FIELDS: FIELDS };
})();
