/*
  read-documents.js: suggested answers from the member's own document text.
  Made-up text only. Nothing is filled in until the member accepts it.
*/

// Accepts every suggestion into a blank sheet, as the builder's Accept does.
function acceptAllSuggestions(list) {
  var Q = FAC_QUESTIONS, S = FACSheet, s = S.blank(Q);
  list.forEach(function (g) {
    var p = g.path.split("."), path = g.path;
    if (p[0] === "programs") while (s.programs.length <= +p[1]) S.addProgram(Q, s);
    if (p[0] === "pain" || p[0] === "benchmarks") {
      var at = -1; s[p[0]].forEach(function (a, i) { if (at < 0 && !S.trim(a.text)) at = i; });
      if (at < 0) { S.addItem(s, p[0]); at = s[p[0]].length - 1; }
      path = p[0] + "." + at;
    }
    S.setText(Q, s, path, g.text);
  });
  return s;
}

T.run("Fill from a document (read-documents.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet, R = FACRead, acceptAll = acceptAllSuggestions;
  function find(list, path) { return list.filter(function (s) { return s.path === path; })[0]; }

  // The three made-up kit sheets, written the way the .txt files are.
  function sheetText(org) {
    var A = org.answers, L = ["Organization Info", "Name: " + A.org.name,
      "Location (include zip): " + [A.org.city, A.org.zip].filter(function (x) { return x; }).join(" "),
      "Web Site: " + A.org.website, "Mission Statement: " + A.org.mission, "Key Words: " + A.org.keywords, "", "Programs (in order of priority)"];
    A.programs.forEach(function (p, i) {
      L.push((i + 1) + ". Program Name: " + p.name, "   * Description: " + p.description, "   * Outputs: " + p.outputs, "   * Current Impact Statement (if any): " + p.impact);
    });
    L.push("", "Local Context/Data (optional)");
    A.pain.forEach(function (t) { L.push("* " + t); });
    L.push("", "Benchmarks (optional)");
    A.benchmarks.forEach(function (t) { L.push("* " + t); });
    return L.join("\n");
  }
  FAC_TEST_KIT.forEach(function (org) {
    var text = sheetText(org), got = R.suggest(text), s = acceptAll(got), A = org.answers, same = true, k;
    for (k in A.org) if (S.trim(s.org[k].text) !== A.org[k]) same = false;
    A.programs.forEach(function (p, i) { for (var f in p) if (!s.programs[i] || S.trim(s.programs[i][f].text) !== p[f]) same = false; });
    A.pain.forEach(function (t, i) { if (S.trim(s.pain[i].text) !== t) same = false; });
    check(org.name + ": every answer found, word for word", same && s.programs.length === A.programs.length);
    check(org.name + ": each suggestion quotes a line of the document exactly", got.length > 0 && got.every(function (g) {
      return g.quote.split("\n").every(function (q) { return text.split("\n").some(function (l) { return S.trim(l) === q; }); });
    }));
    var caught = org.flaws.every(function (f) { return S.issueOf(Q, f.path, S.get(s, f.path), s) === f.issue; });
    check(org.name + ": after Accept, the planted flaws are still caught", caught);
  });

  // A made-up PDF-style paste: wrapped lines, bullets, "Example 1:", N/a.
  var pdf = [
    "Organization Info",
    "Name: Riverbend Family Services",
    "Location (include zip): Lake Ruth, MN 55999",
    "Website: www.example.org/riverbend.",
    "Mission Statement: We help families in crisis find",
    "food, housing and hope.",
    "Key Words: families, housing,",
    "food",
    "Programs (in order of priority)",
    "1. Program Name: Family Pantry",
    "○ Description: Weekly groceries",
    "○ Outputs: 410 families served",
    "in 2024",
    "○ Current Impact Statement (if any): Fewer missed meals",
    "2. Program Name: Rent Help",
    "○ Outputs: 75 households in 2024",
    "Pain Statements/Local Context (optional)",
    "● Example 1: Groceries value: 410 × $50 = $20,500",
    "● Example 2: If a night of shelter costs $60, then 75 × 30 × $60 =",
    "$130,000",
    "Benchmarks (optional)",
    "● Example 1: N/a",
    "Final Prompt",
    "Using the information above, convert outputs into outcomes."
  ].join("\n");
  var p = R.suggest(pdf);
  check("labelled answers: name, and a location split into city and ZIP", find(p, "org.name").text === "Riverbend Family Services" &&
    find(p, "org.city").text === "Lake Ruth, MN" && find(p, "org.zip").text === "55999");
  check("\"Website:\" counts as Web Site, without the full stop at the end", find(p, "org.website").text === "www.example.org/riverbend");
  check("a wrapped mission is joined, and its quote keeps both lines", find(p, "org.mission").text === "We help families in crisis find food, housing and hope." &&
    find(p, "org.mission").quote === "Mission Statement: We help families in crisis find\nfood, housing and hope.");
  check("programs follow the document's order; a wrapped output is joined", find(p, "programs.0.name").text === "Family Pantry" &&
    find(p, "programs.0.outputs").text === "410 families served in 2024" && find(p, "programs.1.name").text === "Rent Help" && find(p, "programs.1.outputs").text === "75 households in 2024");
  check("a program with no Description gets no Description suggestion", !find(p, "programs.1.description"));
  check("Local Context items: \"Example 1:\" taken off, a wrapped item joined", find(p, "pain.0").text === "Groceries value: 410 × $50 = $20,500" &&
    find(p, "pain.1").text === "If a night of shelter costs $60, then 75 × 30 × $60 = $130,000");
  check("\"N/a\" under Benchmarks is not suggested, and the Final Prompt isn't read as an answer", !p.some(function (g) { return /^benchmarks\./.test(g.path); }) &&
    !p.some(function (g) { return g.text.indexOf("Using the information above") > -1; }));
  var ps = acceptAll(p);
  check("after Accept, the wrong calculation still gets its follow-up (75 × 30 × $60 is not $130,000)", S.issueOf(Q, "pain.1", ps.pain[1], ps) === "math");

  // Plain text that isn't laid out like the sheet: only a web address and a ZIP after a state.
  var plain = R.suggest("Our 2024 report.\nWe served 12345 meals.\nVisit https://example.org/report, or write to 1 Main St, Lake Ruth, MN 55999-1234.");
  check("free text: only the web address and a ZIP after a state's letters", plain.length === 2 && find(plain, "org.website").text === "https://example.org/report" &&
    find(plain, "org.zip").text === "55999-1234");
  check("a count like 12345 is never taken for a ZIP", !R.suggest("We served 12345 meals in 2024.").length);
  check("nothing found in blank text", R.suggest("").length === 0 && R.suggest("   \n  ").length === 0);
  check("the same box is suggested once (the first one found)", R.suggest("Name: First Org\nName: Second Org").filter(function (g) { return g.path === "org.name"; }).length === 1);
});

// The kit's Word and PDF files (tests/kit/*.docx and *.pdf, made from the
// .txt sheets) are read in this browser with our own copies of mammoth and
// pdf.js. Word must give exactly the same suggestions and quotes as the
// .txt; PDF the same answers, with quotes the same apart from spacing.
T.runAsync("Fill from a document: Word and PDF files (tests/kit/)", function (check, done) {
  var R = FACRead;
  R.lib = "../lib/";
  function file(name) {
    return fetch("kit/" + name).then(function (r) { if (!r.ok) throw new Error(name); return r.arrayBuffer(); })
      .then(function (buf) { return new File([buf], name); });
  }
  function key(list) { return JSON.stringify(list); }
  // Browsers won't load pdf.js (a module) from files on the computer, so
  // the PDF checks run only from a web address, like the live site.
  var web = location.protocol !== "file:";
  if (!web) check.note("The PDF checks run only from a web address: https://laurenhobley.github.io/thefundraisingaccountant/tests/tests.html");
  var waits = FAC_TEST_KIT.map(function (org) {
    var base = org.file.replace(/\.txt$/, "");
    return Promise.all([base + ".txt", base + ".docx"].concat(web ? [base + ".pdf"] : []).map(function (n) { return file(n).then(R.readFile); })).then(function (t) {
      var fromTxt = R.suggest(t[0]), fromWord = R.suggest(t[1]), fromPdf = web && R.suggest(t[2]);
      function spaced(list) { return key(list.map(function (s) { return { path: s.path, text: s.text, quote: s.quote.replace(/\s+/g, " ") }; })); }
      check(org.name + ": the Word file gives the same suggestions and quotes as the .txt", fromWord.length > 0 && key(fromWord) === key(fromTxt));
      check(org.name + ": every program found", fromWord.filter(function (s) { return /^programs\.\d+\.name$/.test(s.path); }).length === org.answers.programs.length);
      var fromFile = acceptAllSuggestions(web ? fromPdf : fromWord), Q = FAC_QUESTIONS, S = FACSheet;
      check(org.name + ": after accepting the " + (web ? "PDF" : "Word file") + "'s suggestions, every planted flaw is still caught",
        org.flaws.every(function (f) { return S.issueOf(Q, f.path, S.get(fromFile, f.path), fromFile) === f.issue; }));
      if (web) check(org.name + ": the PDF gives the same answers as the .txt, and the same quotes apart from spacing", fromPdf.length > 0 &&
        key(fromPdf.map(function (s) { return [s.path, s.text]; })) === key(fromTxt.map(function (s) { return [s.path, s.text]; })) && spaced(fromPdf) === spaced(fromTxt));
    });
  });
  waits.push(R.readFile(new File(["x"], "old-report.doc")).then(function () { check("an old .doc file is turned away", false); },
    function (e) { check("an old .doc file is turned away with \"type\"", e.message === "type"); }));
  Promise.all(waits).then(done, function (e) {
    check("Word files couldn't be read (" + e.message + "). From the D: drive, Chrome needs --allow-file-access-from-files", false);
    done();
  });
});
