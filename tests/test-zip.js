/*
  zip-place.js: the place for a ZIP code, from our own copy of GeoNames'
  ZIP list (lib/zip-places.js), loaded in this browser. Nothing is sent.
*/
T.runAsync("ZIP code to location (zip-place.js)", function (check, done) {
  var Q = FAC_QUESTIONS, S = FACSheet, E = FACExport, Z = FACZip;
  Z.lib = "../lib/";
  var timer = setTimeout(function () { check("ZIP list loaded", false); done(); }, 10000);
  Z.load(function () {
    clearTimeout(timer);
    try {
      check("the list has every state and DC, and about 41,000 ZIPs", Object.keys(window.FAC_ZIP_PLACES).length >= 51 &&
        Object.keys(window.FAC_ZIP_PLACES).reduce(function (n, st) { return n + window.FAC_ZIP_PLACES[st].split("|").length; }, 0) > 40000);
      check("77001 is Houston, TX; 02108 is Boston, MA; 60601 is Chicago, IL", Z.place("77001") === "Houston, TX" && Z.place("02108") === "Boston, MA" && Z.place("60601") === "Chicago, IL");
      check("a ZIP starting with 0 keeps its 0: 00501 is Holtsville, NY", Z.place("00501") === "Holtsville, NY");
      check("ZIP+4 and spaces: \" 77001-1234 \" is Houston, TX", Z.place(" 77001-1234 ") === "Houston, TX");
      check("an unknown ZIP, a military APO ZIP, or not a ZIP: no place", Z.place("99999") === "" && Z.place("09001") === "" && Z.place("7700") === "" && Z.place("abc") === "");

      var s = S.blank(Q);
      S.setText(Q, s, "org.zip", "77001");
      check("the builder's prompt: Location (include zip): 77001 (Houston, TX)", E.build(Q, s).indexOf("Location (include zip): 77001 (Houston, TX)\n") > -1);
      S.setText(Q, s, "org.zip", "99999");
      check("an unknown ZIP: the ZIP alone", E.build(Q, s).indexOf("Location (include zip): 99999\n") > -1);

      // The builder's screen (its hidden copy on this page): back to Organization Info.
      var $ = function (id) { return document.getElementById(id); };
      for (var i = 0; i < 30 && !$("f-org-zip"); i++) $("back").click();
      var box = $("f-org-zip");
      function type(t) { box.value = t; box.dispatchEvent(new Event("input", { bubbles: true })); }
      type("77001");
      check("under the builder's ZIP box: Houston, TX — does this look right?", $("f-org-zip-place").textContent === Q.zipPlace.found.replace("{place}", "Houston, TX"));
      type("99999");
      check("an unknown ZIP says so", $("f-org-zip-place").textContent === Q.zipPlace.unknown);
      type("7700");
      check("an unfinished ZIP shows nothing", $("f-org-zip-place").textContent === "");
    } catch (e) { check("Stopped with an error: " + e.message, false); }
    done();
  });
});
