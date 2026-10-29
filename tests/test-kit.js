/*
  The made-up test kit (tests/kit/): each organization's planted flaws must
  be caught, and nothing else in it should get a follow-up.
*/
T.run("Test kit (tests/kit/)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;

  // Fills a blank sheet with one organization's answers, the way a member would type them.
  function load(org) {
    var s = S.blank(Q), A = org.answers, id, i;
    for (i = 1; i < A.programs.length; i++) S.addProgram(Q, s);
    for (i = 1; i < A.pain.length; i++) S.addItem(s, "pain");
    for (i = 1; i < A.benchmarks.length; i++) S.addItem(s, "benchmarks");
    for (id in A.org) S.setText(Q, s, "org." + id, A.org[id]);
    A.programs.forEach(function (p, n) { for (var k in p) S.setText(Q, s, "programs." + n + "." + k, p[k]); });
    A.pain.forEach(function (t, n) { S.setText(Q, s, "pain." + n, t); });
    A.benchmarks.forEach(function (t, n) { S.setText(Q, s, "benchmarks." + n, t); });
    return s;
  }

  check("three made-up organizations", FAC_TEST_KIT.length === 3);
  FAC_TEST_KIT.forEach(function (org) {
    var s = load(org);
    org.flaws.forEach(function (f) {
      var got = S.issueOf(Q, f.path, S.get(s, f.path), s);
      check(org.name + ": " + f.what + " → " + f.issue + " follow-up" + (got === f.issue ? "" : " (got \"" + got + "\")"), got === f.issue);
    });
    var caught = S.paths(s).filter(function (p) { return S.issueOf(Q, p, S.get(s, p), s); }).sort().join();
    var planted = org.flaws.map(function (f) { return f.path; }).sort().join();
    check(org.name + ": nothing else gets a follow-up" + (caught === planted ? "" : " (also: " + caught + ")"), caught === planted);
  });
  var kinds = {};
  FAC_TEST_KIT.forEach(function (org) { org.flaws.forEach(function (f) { kinds[f.issue] = true; }); });
  check("together they cover all seven kinds of follow-up",
    ["missing", "vague", "output", "math", "assumption", "duplicate", "overlap"].every(function (k) { return kinds[k]; }));
});
