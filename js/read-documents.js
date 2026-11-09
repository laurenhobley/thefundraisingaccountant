/*
  read-documents.js: finds suggested answers in the member's own document
  text (pasted, or read from a Word or PDF file in this browser). No AI and
  nothing is sent anywhere: it only finds what is plainly written, the way
  FAC's sheet writes it ("Mission Statement: ...", "Program Name: ..."),
  plus a web address and a ZIP code anywhere in the text.

  Each suggestion is { path, text, quote }: where it goes, the answer, and
  the exact lines of the document it came from. The member accepts, edits
  or skips each one; nothing is filled in on its own.
*/
var FACRead = (function () {
  // FAC's labels, as written on the sheet. "long" answers can run on over
  // the next lines (a wrapped paragraph in a PDF).
  var ORG = [
    { path: "org.name", re: /^name\s*:\s*/i },
    // "Location (include zip): Port Jensen, ME 04999" gives only the ZIP.
    { path: "org.zip", re: /^location\b[^:]*:\s*/i, zip: true },
    { path: "org.website", re: /^web\s?site\s*:\s*/i },
    { path: "org.mission", re: /^mission(\s+statement)?\s*:\s*/i, long: true },
    // Key Words in four groups. A plain "Key Words:" list doesn't say which
    // group, so it goes to Issue for the member to sort. "Location:" right
    // after a keyword group is that group, not the ZIP's line (below).
    { path: "org.kwIssue", re: /^key\s?words\s*:\s*/i, long: true, kw: true },
    { path: "org.kwIssue", re: /^issues?\s*:\s*/i, long: true, kw: true },
    { path: "org.kwPeople", re: /^people\s+served\s*:\s*/i, long: true, kw: true },
    { path: "org.kwServices", re: /^services\s*:\s*/i, long: true, kw: true }
  ];
  var KW_LOCATION = /^location\s*:\s*/i;
  var PROGRAM = [
    { id: "name", re: /^program\s+name\s*:\s*/i },
    { id: "description", re: /^description\s*:\s*/i, long: true },
    { id: "outputs", re: /^outputs?\s*:\s*/i, long: true },
    { id: "impact", re: /^current\s+impact\s+statement[^:]*:\s*/i, long: true }
  ];
  // Section headings: a line with no answer after it.
  var HEADINGS = [
    { list: "pain", re: /^(pain\s+statements?|local\s+context)\b/i },
    { list: "benchmarks", re: /^benchmarks?\b/i },
    { list: "", re: /^(organization\s+info|programs?\b|final\s+prompt|constraints?\b)/i }
  ];
  var BULLET = /^\s*([*•●○◦▪‣–-]|\d+[.)])\s+/;
  var ZIP = /\b(\d{5})(-\d{4})?\b/;
  var WEB = /(https?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+)/i;

  function trim(s) { return String(s || "").replace(/^\s+|\s+$/g, ""); }
  // A line without its bullet or list number.
  function bare(line) { return trim(line.replace(BULLET, "")); }
  function label(line) {
    var b = bare(line), i;
    for (i = 0; i < ORG.length; i++) if (ORG[i].re.test(b)) return { org: ORG[i] };
    for (i = 0; i < PROGRAM.length; i++) if (PROGRAM[i].re.test(b)) return { program: PROGRAM[i] };
    return null;
  }
  function heading(line) {
    var b = bare(line);
    if (!b || /:\s*\S/.test(b)) return null;
    for (var i = 0; i < HEADINGS.length; i++) if (HEADINGS[i].re.test(b)) return HEADINGS[i];
    return null;
  }

  function suggest(text) {
    var lines = String(text || "").replace(/\r\n?/g, "\n").split("\n"), out = [], seen = {};
    var program = -1, list = "", items = { pain: -1, benchmarks: -1 }, item = null, afterKw = false;
    function add(path, value, quote) {
      value = trim(value);
      if (!value || seen[path]) return;
      seen[path] = true;
      out.push({ path: path, text: value, quote: quote });
    }
    // A labelled answer and the lines it runs on to.
    function take(i, re, long) {
      var value = bare(lines[i]).replace(re, ""), quote = [lines[i]], j = i + 1;
      while (long && j < lines.length && trim(lines[j]) && !label(lines[j]) && !heading(lines[j]) && !BULLET.test(lines[j])) {
        value += " " + trim(lines[j]); quote.push(lines[j]); j++;
      }
      return { value: value, quote: quote.map(trim).join("\n"), next: j };
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!trim(line)) { item = null; continue; }
      var h = heading(line);
      if (h) { list = h.list; item = null; afterKw = false; continue; }
      var l = label(line);
      if (l && l.program) {
        afterKw = false;
        list = ""; item = null;
        if (l.program.id === "name") program++;
        var t = take(i, l.program.re, l.program.long);
        if (program < 0) program = 0;
        add("programs." + program + "." + l.program.id, t.value, t.quote);
        i = t.next - 1;
        continue;
      }
      if (l && l.org) {
        list = ""; item = null;
        if (l.org.zip && afterKw && KW_LOCATION.test(bare(line))) {
          var kl = take(i, KW_LOCATION, true);
          add("org.kwLocation", kl.value, kl.quote);
          i = kl.next - 1;
          continue;
        }
        afterKw = !!l.org.kw;
        var o = take(i, l.org.re, l.org.long);
        if (l.org.zip) {
          var z = ZIP.exec(o.value);
          if (z) add("org.zip", z[0], o.quote);
        } else add(l.org.path, l.org.path === "org.website" ? trim(o.value).replace(/[.,;:]+$/, "") : o.value, o.quote);
        i = o.next - 1;
        continue;
      }
      if (list) {
        // A bullet starts a new item; a line without one carries on the last.
        var value = bare(line).replace(/^example\s*\d*\s*:\s*/i, "");
        if (item && !BULLET.test(line)) { item.text = trim(item.text + " " + trim(line)); item.quote += "\n" + trim(line); continue; }
        // "N/a" under a heading means there's nothing there.
        if (!value || /^n\/?a\.?$/i.test(value)) { item = null; continue; }
        items[list]++;
        item = { path: list + "." + items[list], text: value, quote: trim(line) };
        out.push(item);
      }
    }

    // A web address or a ZIP code anywhere, if the labels didn't give one.
    // A ZIP only right after a state's two letters ("TX 77001"), so a
    // count like 12345 is never taken for one.
    for (i = 0; i < lines.length && !seen["org.website"]; i++) {
      var u = WEB.exec(lines[i]);
      if (u) add("org.website", u[0].replace(/[.,;:]+$/, ""), trim(lines[i]));
    }
    for (i = 0; i < lines.length && !seen["org.zip"]; i++) {
      var s = /\b[A-Z]{2}\s+(\d{5}(-\d{4})?)\b/.exec(lines[i]);
      if (s) add("org.zip", s[1], trim(lines[i]));
    }
    return out;
  }

  // ---------- Reading a file, in this browser ----------

  // Our own saved copies of the readers (lib/), each loaded only when a
  // file needs it. The test page sets this to "../lib/".
  var api = { suggest: suggest, readFile: readFile, lib: "lib/" };
  function loadLib(src, ready) {
    return new Promise(function (resolve, reject) {
      if (ready()) { resolve(); return; }
      var s = document.createElement("script");
      s.src = api.lib + src;
      s.onload = function () { if (ready()) resolve(); else reject(new Error("load")); };
      s.onerror = function () { reject(new Error("load")); };
      document.head.appendChild(s);
    });
  }

  // A PDF's text, page by page, keeping its line breaks.
  function pdfText(doc) {
    var pages = [];
    for (var n = 1; n <= doc.numPages; n++) {
      pages.push(doc.getPage(n).then(function (p) { return p.getTextContent(); }).then(function (c) {
        return c.items.map(function (it) { return it.str + (it.hasEOL ? "\n" : ""); }).join("");
      }));
    }
    return Promise.all(pages).then(function (t) { return t.join("\n"); });
  }

  // The text of a .txt, Word (.docx) or PDF file. Rejects with "type" for
  // any other kind of file. Nothing is sent anywhere.
  function readFile(file) {
    var name = String(file.name || "").toLowerCase();
    if (/\.txt$/.test(name)) return file.text();
    if (/\.pdf$/.test(name)) {
      // pdf.js comes only as a module, so it's brought in with import().
      // Its worker is loaded into this page too (window.pdfjsWorker), so it
      // runs here instead of in a separate thread: members' documents are
      // small, and it works the same inside an embedded frame.
      // isEvalSupported: false, so a PDF can never run code.
      var url = function (f) { return new URL(api.lib + f, document.baseURI).href; };
      return Promise.all([import(url("pdf.min.mjs")), import(url("pdf.worker.min.mjs"))]).then(function (m) {
        var pdfjs = m[0];
        window.pdfjsWorker = m[1];
        pdfjs.GlobalWorkerOptions.workerSrc = url("pdf.worker.min.mjs");
        return file.arrayBuffer().then(function (buf) { return pdfjs.getDocument({ data: buf, isEvalSupported: false }).promise; });
      }).then(pdfText);
    }
    if (/\.docx$/.test(name)) {
      return loadLib("mammoth.browser.min.js", function () { return !!window.mammoth; })
        .then(function () { return file.arrayBuffer(); })
        .then(function (buf) { return window.mammoth.extractRawText({ arrayBuffer: buf }); })
        .then(function (r) { return r.value; });
    }
    return Promise.reject(new Error("type"));
  }

  return api;
})();
