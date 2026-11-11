/*
  screen1.js: Let's Get Started (index.html), from FAC's ROI.bot Version 2
  build plan. Two screens, both 1.1 in the progress bar: Screen 1 asks for
  the organization name, website and ZIP (the ZIP shows its place to
  confirm); Screen 2 asks for the member's name, title, email and phone. Each
  screen's Next stays off until its fields are filled; Screen 2 has
  ← Previous. What the member types is kept in this browser
  (FACSheet.SCREEN1's key), and Next on Screen 2 goes to the builder, which
  fills its blank boxes from it. Nothing is sent anywhere.
*/
(function () {
  var Q = FAC_QUESTIONS, T = Q.screen1, P = Q.progress;
  var STORE = "roi-screen1-v1";
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function v(id) { return $(id).value.replace(/^\s+|\s+$/g, ""); }
  function zipOk() { return /^\d{5}(-\d{4})?$/.test(v("s1-zip")); }
  // An email looks like name@place.org: no spaces, one @, a dot after it.
  function emailOk() { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("s2-email")); }
  // A phone number has 10 to 15 digits, whatever else is typed around them.
  function phoneOk() { var n = v("s2-phone").replace(/\D/g, "").length; return n >= 10 && n <= 15; }

  // The progress bar: Step 1 current, part 1.1 current, the rest to come.
  // Here the numbers aren't links: Next is the way on.
  $("stepsTabs").innerHTML = P.steps.map(function (s, i) {
    return '<li class="' + (i ? "todo" : "current") + '"' + (i ? "" : ' aria-current="step"') + '><span class="num" aria-hidden="true">' + esc(s.n) + '</span>' +
      '<span><span class="sr">' + esc(P.stepLabel.replace(/\{n\}/g, s.n)) + ' </span>' + esc(s.name) + '</span></li>';
  }).join("");
  $("parts").innerHTML = P.steps[0].parts.map(function (name, i) {
    return '<li class="' + (i ? "todo" : "current") + '"' + (i ? "" : ' aria-current="step"') + '><span class="dot">' + esc("1." + (i + 1)) + '</span>' +
      '<span class="part-label">' + esc(name) + '</span></li>';
  }).join("");

  var labels = { "s1-org": "org", "s1-website": "website", "s1-zip": "zip", "s2-name": "name", "s2-title": "jobTitle", "s2-email": "email", "s2-phone": "phone" };
  $("brand").textContent = Q.brand;
  $("title").textContent = Q.title;
  for (var id in labels) { $(id + "-label").textContent = T[labels[id]]; $(id).placeholder = T[labels[id] + "Placeholder"]; }
  $("next1").textContent = $("next2").textContent = Q.flow.nextButton;
  $("prev2").textContent = Q.flow.previousButton;
  $("nextLine").textContent = T.nextLine;

  // What the member typed before, if they come back.
  var keys = { org: "s1-org", website: "s1-website", zip: "s1-zip", name: "s2-name", title: "s2-title", email: "s2-email", phone: "s2-phone" };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved) for (var k in keys) $(keys[k]).value = saved[k] || "";
  } catch (e) {}

  // Screen 1 or Screen 2; the intro and the next-step line go with it.
  function show(n) {
    $("s1").hidden = n !== 1;
    $("s2").hidden = n !== 2;
    $("intro").textContent = n === 1 ? T.intro : T.intro2;
    $("nextLine").hidden = n !== 2;
    $(n === 1 ? "s1-org" : "s2-name").focus();
  }

  // The place for the ZIP, from our own copy of GeoNames' ZIP list.
  function showPlace() {
    var where = window.FACZip ? FACZip.place(v("s1-zip")) : "";
    if (where === null) FACZip.load(showPlace);
    $("s1-zip-place").textContent = where ? Q.zipPlace.found.replace(/\{place\}/g, where) : where === "" && zipOk() ? Q.zipPlace.unknown : "";
  }

  function update() {
    $("next1").disabled = !(v("s1-org") && v("s1-website") && zipOk());
    $("next2").disabled = !(v("s2-name") && v("s2-title") && emailOk() && phoneOk());
    showPlace();
    var data = {};
    for (var k in keys) data[k] = v(keys[k]);
    try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (e) {}
  }
  $("s1").addEventListener("input", update);
  $("s2").addEventListener("input", update);
  $("s1").addEventListener("submit", function (e) {
    e.preventDefault();
    if (!$("next1").disabled) show(2);
  });
  $("prev2").addEventListener("click", function () { show(1); });
  $("s2").addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("next2").disabled) return;
    update();
    location.href = "builder.html";
  });
  update();
  $("intro").textContent = T.intro;
  // The builder's ← Previous comes back here as index.html#you: Screen 2,
  // if Screen 1 is already filled in.
  if (location.hash === "#you" && !$("next1").disabled) show(2);
})();
