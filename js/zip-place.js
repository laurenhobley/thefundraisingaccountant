/*
  zip-place.js: the place (city and state) for a US ZIP code, from our own
  copy of GeoNames' ZIP list (lib/zip-places.js). The list is loaded only
  when a ZIP is typed, and nothing is sent anywhere. Used by both pages.
*/
var FACZip = (function () {
  var map = null, loading = false, failed = false, waiting = [];
  // The test page sets lib to "../lib/".
  var api = { lib: "lib/", place: place, load: load };

  function build() {
    var P = window.FAC_ZIP_PLACES || {};
    map = {};
    for (var st in P) {
      if (!P.hasOwnProperty(st)) continue;
      P[st].split("|").forEach(function (e) { map[e.slice(0, 5)] = e.slice(6) + ", " + st; });
    }
  }

  // Loads the list once, then calls done(). If it can't load, it isn't
  // tried again and done() isn't called, so the page just shows no place.
  function load(done) {
    if (map) { if (done) done(); return; }
    if (failed) return;
    if (done) waiting.push(done);
    if (loading) return;
    loading = true;
    var s = document.createElement("script");
    s.src = api.lib + "zip-places.js";
    s.onload = s.onerror = function () {
      if (window.FAC_ZIP_PLACES) build(); else failed = true;
      loading = false;
      var w = waiting;
      waiting = [];
      if (map) w.forEach(function (f) { f(); });
    };
    document.head.appendChild(s);
  }

  // "Houston, TX" for "77001" or "77001-1234"; "" when it isn't a ZIP or
  // the list doesn't have it; null while the list isn't loaded yet.
  function place(zip) {
    var m = /^(\d{5})(-\d{4})?$/.exec(String(zip || "").replace(/^\s+|\s+$/g, ""));
    if (!m) return "";
    if (!map) return null;
    return map[m[1]] || "";
  }

  return api;
})();
