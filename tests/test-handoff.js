/*
  Screen 1 (index.html) and the builder's 1.1 share the name, website and
  ZIP. A Screen 1 answer fills a blank box; a changed Screen 1 answer is
  shown on 1.1 with "Use what I typed on Screen 1" and "Keep this answer",
  and is never copied over what the member typed in the builder.
*/
T.run("Screen 1 to builder handoff (sheet.js)", function (check) {
  var Q = FAC_QUESTIONS, S = FACSheet;
  var st = S.blank(Q);
  var n = S.importScreen1(Q, st, { org: "Riverbend Food Bank", website: "https://example.org", zip: "77001" });
  check("blank boxes take Screen 1's name, website and ZIP", n === 3 && st.org.name.text === "Riverbend Food Bank" && st.org.zip.text === "77001");
  check("nothing to ask while the two agree", JSON.stringify(S.screen1Changes(st, { org: "Riverbend Food Bank", website: "https://example.org", zip: "77001" })) === "{}");
  var s1 = { org: "Riverbend Food Bank of Texas", website: "https://example.org", zip: "77002" };
  n = S.importScreen1(Q, st, s1);
  check("a changed Screen 1 answer is never copied over a typed one", n === 0 && st.org.name.text === "Riverbend Food Bank" && st.org.zip.text === "77001");
  var ch = S.screen1Changes(st, s1);
  check("the changed answers are listed to ask about (name and ZIP, not the website)", ch.name === "Riverbend Food Bank of Texas" && ch.zip === "77002" && !("website" in ch));
  S.useScreen1(Q, st, "name", ch.name);
  check("Use what I typed on Screen 1: the box takes it", st.org.name.text === "Riverbend Food Bank of Texas" && !("name" in S.screen1Changes(st, s1)));
  S.keepScreen1(st, "zip", ch.zip);
  check("Keep this answer: the box keeps its own, and that Screen 1 answer isn't asked about again", st.org.zip.text === "77001" && !("zip" in S.screen1Changes(st, s1)));
  check("a newer Screen 1 answer is asked about again", S.screen1Changes(st, { org: "Riverbend Food Bank of Texas", website: "https://example.org", zip: "77003" }).zip === "77003");
  check("a blank Screen 1 answer asks nothing", JSON.stringify(S.screen1Changes(st, { org: "", website: "", zip: "" })) === "{}");
  var again = S.repair(Q, JSON.parse(JSON.stringify(st)));
  check("what was taken or kept is saved with the draft", again.screen1.name === "Riverbend Food Bank of Texas" && again.screen1.zip === "77002");
  var old = S.repair(Q, { org: { name: { text: "Old Name" } } });
  check("a draft from before this asks once about a different Screen 1 name", S.screen1Changes(old, { org: "New Name" }).name === "New Name");

  // The other way (Lauren, Nov 11): a change made in the builder updates Screen 1.
  var mem = { d: {}, getItem: function (k) { return k in this.d ? this.d[k] : null; }, setItem: function (k, v) { this.d[k] = String(v); } };
  mem.setItem(S.SCREEN1, JSON.stringify({ org: "Old Org", website: "https://old.example.org", zip: "77001", name: "Jordan Rivera", title: "Director", email: "j@example.org", phone: "7135550100" }));
  var b = S.blank(Q);
  S.setText(Q, b, "org.name", "  New Org  ");
  var wrote = S.toScreen1(b, "name", mem), s1now = JSON.parse(mem.getItem(S.SCREEN1));
  check("a name changed in the builder is saved for Screen 1 (trimmed), and nothing else there changes", wrote && s1now.org === "New Org" &&
    s1now.website === "https://old.example.org" && s1now.zip === "77001" && s1now.name === "Jordan Rivera" && s1now.email === "j@example.org" && s1now.phone === "7135550100");
  check("so the builder doesn't then ask about its own change", JSON.stringify(S.screen1Changes(b, s1now)) === "{}" || !("name" in S.screen1Changes(b, s1now)));
  S.setText(Q, b, "org.website", "https://new.example.org"); S.setText(Q, b, "org.zip", "77002");
  S.toScreen1(b, "website", mem); S.toScreen1(b, "zip", mem);
  s1now = JSON.parse(mem.getItem(S.SCREEN1));
  check("the website and ZIP work the same way", s1now.website === "https://new.example.org" && s1now.zip === "77002" && s1now.org === "New Org");
  S.setText(Q, b, "org.name", "");
  check("a blank builder answer never wipes Screen 1's", !S.toScreen1(b, "name", mem) && JSON.parse(mem.getItem(S.SCREEN1)).org === "New Org");
  var fresh = { d: {}, getItem: mem.getItem, setItem: mem.setItem };
  S.setText(Q, b, "org.name", "First Org");
  check("with nothing saved for Screen 1 yet, it starts one", S.toScreen1(b, "name", fresh) && JSON.parse(fresh.getItem(S.SCREEN1)).org === "First Org");
  check("only Screen 1's three boxes: anything else is refused", !S.toScreen1(b, "mission", mem));
});

T.run("Screen 1 to builder handoff (builder.html)", function (check) {
  var Q = FAC_QUESTIONS, T1 = Q.screen1, KEY = "roi-screen1-v1";
  function $(id) { return document.getElementById(id); }
  function saved() { return JSON.parse(localStorage.getItem("fac-prompt-sheet-draft-v1")); }
  function toStep1() { document.querySelectorAll("#parts .dot")[0].click(); }
  function note() { return $("f-org-name-s1"); }
  var before = localStorage.getItem(KEY);
  try {
    toStep1();
    var mine = $("f-org-name").value;
    check("on Organization Info with a name in the box", /^Step 1 of /.test($("counter").textContent) && mine !== "");
    localStorage.setItem(KEY, JSON.stringify({ org: mine, website: "", zip: "" }));
    toStep1();
    check("the same name on Screen 1: nothing to ask", !note());
    localStorage.setItem(KEY, JSON.stringify({ org: "Harbor Light Shelter", website: "", zip: "" }));
    toStep1();
    check("a different name on Screen 1 shows under the box, with Use and Keep", !!note() &&
      note().querySelector(".sugg-text").textContent === T1.changed.replace("{value}", "Harbor Light Shelter") &&
      note().querySelector('[data-act="s1Use"]').textContent === T1.useChanged && note().querySelector('[data-act="s1Keep"]').textContent === T1.keepChanged);
    check("the box still holds what the member typed", $("f-org-name").value === mine);
    note().querySelector('[data-act="s1Keep"]').click();
    check("Keep this answer: the note goes, the box is unchanged", !note() && $("f-org-name").value === mine && saved().org.name.text === mine);
    toStep1();
    check("and it isn't asked again for the same Screen 1 name", !note());
    localStorage.setItem(KEY, JSON.stringify({ org: "Harbor Light Shelter of Texas", website: "", zip: "" }));
    toStep1();
    note().querySelector('[data-act="s1Use"]').click();
    check("Use what I typed on Screen 1: the box, the saved draft and the prompt take it", !note() && $("f-org-name").value === "Harbor Light Shelter of Texas" &&
      saved().org.name.text === "Harbor Light Shelter of Texas" && FACExport.build(Q, FACSheet.load(Q)).indexOf("Harbor Light Shelter of Texas") > -1);
    check("the cursor goes back to the name box", document.activeElement === $("f-org-name"));

    // The other way (Lauren, Nov 11): typing in the builder updates Screen 1.
    localStorage.setItem(KEY, JSON.stringify({ org: "Harbor Light Shelter of Texas", website: "", zip: "", name: "Jordan Rivera", phone: "7135550100" }));
    var nm = $("f-org-name"); nm.value = "Harbor Light Shelter of Maine"; nm.dispatchEvent(new Event("input", { bubbles: true }));
    var s1 = JSON.parse(localStorage.getItem(KEY));
    check("typing a new name on 1.1 saves it for Screen 1 and quick.html, leaving Screen 2's answers alone", s1.org === "Harbor Light Shelter of Maine" &&
      s1.name === "Jordan Rivera" && s1.phone === "7135550100");
    toStep1();
    check("and 1.1 doesn't ask about its own change", !note());
    var ws = $("f-org-website"); ws.value = "https://example.org/maine"; ws.dispatchEvent(new Event("input", { bubbles: true }));
    check("the website goes to Screen 1 the same way", JSON.parse(localStorage.getItem(KEY)).website === "https://example.org/maine");
    localStorage.setItem(KEY, JSON.stringify({ org: "Someone Else", website: "", zip: "" }));
    toStep1();
    note().querySelector('[data-act="s1Keep"]').click();
    check("Keep this answer also puts the builder's answer back on Screen 1", JSON.parse(localStorage.getItem(KEY)).org === "Harbor Light Shelter of Maine");
  } finally {
    if (before == null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, before);
  }
});
