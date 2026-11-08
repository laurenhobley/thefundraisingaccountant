/*
  screen1.js: Screen 1 (index.html), from FAC's ROI.bot Version 2 build
  plan. Your name, organization name, website and ZIP (Step 1.0's inputs);
  Continue stays off until all four are filled.
  The ZIP shows its place to confirm. What the member
  types is kept in this browser (FACSheet.SCREEN1's key), and Continue goes
  to the builder, which fills its blank boxes from it. Nothing is sent
  anywhere.
*/
(function () {
  var Q = FAC_QUESTIONS, T = Q.screen1, P = Q.progress;
  var STORE = "roi-screen1-v1";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function v(id) { return $(id).value.replace(/^\s+|\s+$/g, ""); }
  function zipOk() { return /^\d{5}(-\d{4})?$/.test(v("s1-zip")); }

  // The progress bar: Step 1 current, part 1.1 current, the rest to come.
  // Here the numbers aren't links: Continue is the way on.
  $("stepsTabs").innerHTML = P.steps.map(function (s, i) {
    return '<li class="' + (i ? "todo" : "current") + '"' + (i ? "" : ' aria-current="step"') + '><span class="num" aria-hidden="true">' + esc(s.n) + '</span>' +
      '<span><span class="sr">' + esc(P.stepLabel.replace(/\{n\}/g, s.n)) + ' </span>' + esc(s.name) + '</span></li>';
  }).join("");
  $("parts").innerHTML = P.steps[0].parts.map(function (name, i) {
    return '<li class="' + (i ? "todo" : "current") + '"' + (i ? "" : ' aria-current="step"') + '><span class="dot">' + esc("1." + (i + 1)) + '</span>' +
      '<span class="part-label">' + esc(name) + '</span></li>';
  }).join("");

  $("brand").textContent = Q.brand;
  $("title").textContent = Q.title;
  $("intro").textContent = T.intro;
  $("s1-name-label").textContent = T.name;
  $("s1-org-label").textContent = T.org;
  $("s1-website-label").textContent = T.website;
  $("s1-zip-label").textContent = T.zip;
  $("s1-name").placeholder = T.namePlaceholder;
  $("s1-org").placeholder = T.orgPlaceholder;
  $("s1-website").placeholder = T.websitePlaceholder;
  $("s1-zip").placeholder = T.zipPlaceholder;
  $("continue").textContent = T.continueButton;
  $("nextLine").textContent = T.nextLine;

  // What the member typed before, if they come back.
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved) { $("s1-name").value = saved.name || ""; $("s1-org").value = saved.org || ""; $("s1-website").value = saved.website || ""; $("s1-zip").value = saved.zip || ""; }
  } catch (e) {}

  // The place for the ZIP, from our own copy of GeoNames' ZIP list.
  function showPlace() {
    var where = window.FACZip ? FACZip.place(v("s1-zip")) : "";
    if (where === null) FACZip.load(showPlace);
    $("s1-zip-place").textContent = where ? Q.zipPlace.found.replace(/\{place\}/g, where) : where === "" && zipOk() ? Q.zipPlace.unknown : "";
  }

  function update() {
    $("continue").disabled = !(v("s1-name") && v("s1-org") && v("s1-website") && zipOk());
    showPlace();
    try { localStorage.setItem(STORE, JSON.stringify({ name: v("s1-name"), org: v("s1-org"), website: v("s1-website"), zip: v("s1-zip") })); } catch (e) {}
  }
  $("s1").addEventListener("input", update);
  $("s1").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("continue").disabled) return;
    update();
    location.href = "builder.html";
  });
  update();
})();
