# FAC ROI.bot prompt builder

Web pages that help members of The Fundraising Accountant (FAC) fill in FAC's ROI.bot prompt sheet. The pages produce one finished prompt, which the member copies or downloads and pastes into ROI.bot themselves.

Live site: https://laurenhobley.github.io/thefundraisingaccountant/

## The pages

| Page | What it is |
|---|---|
| `index.html` | Let's Get Started, "Tell Your Story with Numbers" (FAC's Version 2 build plan and Steve's Step 1 flowchart), in two screens: Screen 1 asks the organization name, website and ZIP code; Screen 2 asks the member's name, title, email and phone (all required, kept in this browser only until HubSpot is connected). Until ROI.bot's chat is built, Next on Screen 2 opens the builder with the name, website and ZIP filled in. |
| `quick.html` | Only Screen 1's required fields from Steve's Step 1 flowchart (organization name, website, ZIP code), then a short prompt asking ROI.bot to research the organization (draft Task for Steve), with "I reviewed this", Copy, Download and Open ROI.bot. Shares Screen 1's saved answers. |
| `builder.html` | The prompt sheet builder: Steps 1 to 3 of the workbook, one section per screen, with the two-row progress bar. |
| `pain-statement.html` | The version 1 pain statement form, kept working but not linked (the builder's 2.1 covers it and can bring in its answers). |
| `help.html` | A short "how to use" guide for members. |
| `tests/tests.html` | The test page. Every test shows a green ✓ or a red ✗. |

## Two rules the pages never break

- **No invented numbers.** A number appears in the prompt only if the member typed it. The pages never calculate a new figure. The only math they do is check a calculation the member wrote, and when it doesn't add up, they say so without showing the right answer.
- **No secrets in the page.** The pages use no API, no key and no server. Nothing a member types is sent anywhere. Answers stay in the member's own browser until they copy or download the prompt.

## How the builder works

| File | What it does |
|---|---|
| `js/questions.js` | **All the wording members read:** questions, help, follow-ups, buttons, the how-to page, FAC's Final Prompt and the guardrail line. FAC owns this file. |
| `js/sheet.js` | Stores the answers and their labels, runs the follow-up checks, and saves the draft in the browser. |
| `js/export.js` | Builds the finished prompt in RTCC parts, with the member's answers in FAC's sheet format. |
| `js/builder.js` | Shows the screens, the follow-ups, the Step 1.1 prompt box, and the "Yes, copy my prompt" and Download buttons. |
| `js/read-documents.js` | "Fill from a document": finds suggested answers in the member's own text, Word or PDF file, in the browser. No AI: only lines written the way FAC's sheet writes them, plus a web address and a ZIP code. |
| `js/quick.js` | quick.html: the three required fields, their follow-ups, and its prompt. |
| `js/screen1.js` | Let's Get Started: the progress bar, Screen 1's three fields and the ZIP's place, Screen 2's four (the email must look like one, the phone have 10 to 15 digits), and Next (off until a screen is filled). |
| `js/zip-place.js` | Shows the place (city and state) for the ZIP code a member types, on both pages, and adds it to the prompt: "77001 (Houston, TX)". |
| `lib/` | Our own saved copies, with their licences: mammoth 1.13.0 (Word, BSD licence) and pdf.js 6.4.299 (PDF, Apache licence, by Mozilla), loaded only when a member chooses a file; and `zip-places.js`, US ZIP codes with their place and state from [GeoNames](https://www.geonames.org/) (CC BY 4.0; their readme is `geonames-readme.txt`), loaded only when a ZIP is typed. Nothing is sent anywhere. |
| `images/roi-bot-logo.png` | ROI.bot's logo, from FAC, shown top right on every page. |
| `styles.css` | How the builder and the how-to page look. |

**Every figure is labeled:**
- **Known:** a source is recorded.
- **Reasonable estimate:** a note says where it came from.
- **Unsupported:** stays visibly flagged.

**The screens** follow FAC's flowchart and workshop workbook, three steps in order. In Step 1, as in Steve's Step 1 flowchart, each section ends with its own "Happy?" check, listing the answers with Edit links.

**Step 1, Pick Your Story**
1. **1.1** Organization Info: name, ZIP code and website only (no Mission Statement or Key Words since Nov 11: ROI.bot drafts them from the website), and an optional "Fill from a document" panel: the member pastes text or chooses a Word, PDF or .txt file, and each suggested answer shows the exact lines it came from, with Accept, Edit or Skip. Nothing is filled in until they accept it, and the document is never saved or sent. Name and ZIP are required; the website is optional here because Screen 1 asks for it. Then "Happy with your organization info?", which also holds **the report prompt** (Steve's Step 1.1 and 1.2 mockups): it asks ROI.bot to read the whole website, social pages and GuideStar/990 and answer in four parts: (1) a Field / What I found / Source table (Name, Website, Location, Area served, Mission of up to 125 characters, Social media) and keywords in five groups; (2) the programs stack ranked (Mission fit × Prominence × Evidence, each 1 to 3, with why each ranks there); (3) Two things to check and sources; (4) FAC's sheet (Organization Info, Programs, Local Context/Data, Benchmarks). Copy and Open ROI.bot; a box to paste ROI.bot's answer back (kept as rounds, and in the package); and **Fill in my answers from ROI.bot's report**, which reads Part 4 like "Fill from a document": each answer is a suggestion with its quote and Accept, Edit or Skip, and **Accept all from the report** fills every blank box at once (a box the member typed is never replaced; numbers still need their labels). Once programs come from the report, Next skips the program-by-program screens (they stay open to Edit from the 1.2 check). Coming from Let's Get Started, a new draft opens straight on this screen. The same prompt is quick.html's.
2. **1.2** one screen per program (name and description, both required), then an optional stack rank from FAC's template (three drivers the member names, plus Money, each scored 1–3; the member types the Stack Rank, the tool checks it equals the four multiplied and sorts by it, then suggests where the Stack Ranks jump most; the member draws the red line, and programs below it are left out of the prompt). Then "Happy with your stack ranking?"
3. **1.3** Outputs to Outcomes, laid out like Steve's Family Promise Step 1.3 example: a table (Program | Outputs (what you did) | Outcomes (what changed)) with one row per program above the red line; each output or outcome on its own named line ("Volunteers: 2,800+ (undated, GuideStar)"), gray "Click to change" blanks for `___`, "+ Add a line" and "Edit as text"; a figure the member fills in is labeled "(From you)"; "One thing to check" lists figures over 18 months old or undated; "Next, you can go deeper…" under Next. Each box is still saved as one answer (lines joined with "; "), both required. Then "Happy with your outputs to outcomes?", which asks "Go deeper now… or skip to Step 2?"
4. **1.4** Add Context: Local Context/Data (from FAC's sheet) and Benchmarks (with source, program and how it connects), both optional. Then "Happy with your context?"
5. **1.5** Add Constraints (tone, length, format, audience), optional, with a "Skip to Step 2" button. Then "Happy with your constraints?" A member who skips at 1.3 goes straight to 2.1 and can still open 1.4 and 1.5 from the progress bar.

**Step 2, Get the Right Numbers**
1. **2.1** Pain statements, with a Why Now preview. It can bring in answers from the pain statement form.
2. **2.2** Donate Now (the Regular donor table) and **2.3** Major Donors (the Major donor table). The member types every amount.
3. **2.4** Magic wand (optional)
4. **2.5** Build the Prompt: the review screen, where Role, Task and Constraints can be edited, and the prompt is copied or downloaded.

**Step 3, Tell your story**
1. **3.1–3.4** Challenge, Response, Outcome and ROI. Each step has FAC's prompt, a Copy button and a box for ROI.bot's answer, with rounds kept, then Keep or Revise (Revise asks one question and links to the screen that feeds it). 3.4 also has the member's own "For every $1" line, checked against their investment and value, and a timeframe for the ask.
2. **3.5** Funder story
3. My Next Steps and a Self Assessment
4. **The package:** one .txt file with everything the member made.

Each check lists the answers with Edit links. Each prompt the member copies or downloads is kept in their browser as a version, so they can compare runs.

**The finished prompt** comes in RTCC parts:
- **Context:** the member's answers in FAC's sheet format, with figures tagged `[Estimate]` or `[Unsupported]`.
- **Task:** FAC's Final Prompt, word for word. It says "Using the information above", so it comes after the Context.
- **Constraints:** the member's own, then the guardrail line: "Figures marked [Estimate] or [Unsupported] are assumptions…".
- **Role:** added at the top once FAC writes it, in `rtcc.role` in `js/questions.js`.

**Follow-up checks.** When the member presses Next, the builder asks a follow-up about:
- missing answers, or a ZIP code that isn't 5 digits
- vague words ("various", "TBD")
- outputs with no number or no year
- a program with the same name or description as an earlier one
- the same number in two programs' outputs (possible double counting)
- a calculation that doesn't add up
- an "if…" figure with no source

**Export.** No review tick: the member presses "Yes, copy my prompt" (or Download), and Open ROI.bot appears once they have. The Step 3 package works the same way, with "Yes, copy my package".

## Changing the wording

Edit the text between quotes in `js/questions.js`. Keep the structure the same. Then open `tests/tests.html` and check every test is still green.

- **Filler words:** add them to `vagueWords`, for example `"N/A"`.
- **Assumption words:** add them to `assumptionWords`.
- **FAC's Final Prompt or the guardrail line:** the test page keeps its own copy of both in `tests/test-questions.js`, so a change is noticed. Update that copy too.

## Testing

Open `tests/tests.html` in a browser, from the files or from the live site. The live-form tests only run on the live site.

`tests/kit/` has three made-up organizations with flaws planted on purpose: a missing ZIP, a duplicate program, double counting, a wrong calculation, missing Outcomes, an output with no year and an "if" figure with no source. The test page checks each flaw is caught. The `.txt`, `.docx` and `.pdf` files are the same sheets, for trying the builder by hand and for testing "Fill from a document". From the files on your computer, Chrome needs to be started with `--allow-file-access-from-files` for the Word tests, and the PDF tests run only from a web address (browsers won't load pdf.js from files on the computer); on the live site they all run. Use made-up data for testing, never real member data.

## Hosting

The pages are plain files with nothing to install. They run on GitHub Pages from the `main` branch.

**To show the builder on a HubSpot page:**
1. **The simplest option is a link** to `builder.html`.
2. **To embed it instead,** use a custom HTML module:

   ```html
   <iframe src="https://laurenhobley.github.io/thefundraisingaccountant/builder.html"
           title="ROI.bot prompt builder" style="width:100%;height:1500px;border:0"></iframe>
   ```

   Some browsers (Safari especially) don't let an embedded page save its draft. Members could lose their answers if they leave the page, which is why a link is safer.
3. **Either way, in HubSpot,** make sure the setting that collects data from non-HubSpot forms is off. The builder never submits a form, but that setting should stay off.
