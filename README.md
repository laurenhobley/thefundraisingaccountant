# FAC ROI.bot prompt builder

Web pages that help members of The Fundraising Accountant (FAC) fill in FAC's ROI.bot prompt sheet. The pages produce one finished prompt, which the member copies or downloads and pastes into ROI.bot themselves.

Live site: https://laurenhobley.github.io/thefundraisingaccountant/

## The pages

| Page | What it is |
|---|---|
| `index.html` | The pain statement form (Steps 1.1 and 1.2). |
| `builder.html` | The prompt sheet builder: organization info, programs, pain statements and benchmarks, one section per screen. |
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
| `js/builder.js` | Shows the screens, the follow-ups, the review lock, and the Copy and Download buttons. |
| `js/read-documents.js` | "Fill from a document": finds suggested answers in the member's own text, Word or PDF file, in the browser. No AI: only lines written the way FAC's sheet writes them, plus a web address and a ZIP code. |
| `lib/` | Our own saved copies of the free readers it uses, with their licences: mammoth (Word, BSD licence). Loaded only when a member chooses a file. |
| `styles.css` | How the builder and the how-to page look. |

**Every figure is labeled:**
- **Known:** a source is recorded.
- **Reasonable estimate:** a note says where it came from.
- **Unsupported:** stays visibly flagged.

**The screens** follow FAC's flowchart and workshop workbook, three steps in order:

**Step 1, Measure your ROI**
1. **1.1** Organization Info, with an optional "Fill from a document" panel: the member pastes text or chooses a Word or .txt file, and each suggested answer shows the exact lines it came from, with Accept, Edit or Skip. Nothing is filled in until they accept it, and the document is never saved or sent.
2. **1.2** one screen per program, then an optional stack rank from FAC's template (three drivers the member names, plus Money, each scored 1–3; the member types the Stack Rank, the tool checks it equals the four multiplied and sorts by it, then suggests where the Stack Ranks jump most; the member draws the red line, and programs below it are left out of the prompt), then a "Happy with your programs and keywords?" check
3. Local Context/Data, from FAC's sheet
4. **1.3** Benchmarks (with source, program and how it connects), then its check
5. **1.4** Constraints (tone, length, format, audience), then its check
6. **"Build our story"**, which leads to **1.5**, the review screen, where Role, Task and Constraints can be edited

**Step 2, Get the Right Numbers**
1. **2.1** Pain statements, with a Why Now preview. It can bring in answers from the pain statement form.
2. **2.2** Regular and Major donor tables. The member types every amount.
3. **2.3** Magic wand
4. Then the review screen again.

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

**Export.** Copy and Download stay locked until the member ticks "I reviewed this".

## Changing the wording

Edit the text between quotes in `js/questions.js`. Keep the structure the same. Then open `tests/tests.html` and check every test is still green.

- **Filler words:** add them to `vagueWords`, for example `"N/A"`.
- **Assumption words:** add them to `assumptionWords`.
- **FAC's Final Prompt or the guardrail line:** the test page keeps its own copy of both in `tests/test-questions.js`, so a change is noticed. Update that copy too.

## Testing

Open `tests/tests.html` in a browser, from the files or from the live site. The live-form tests only run on the live site.

`tests/kit/` has three made-up organizations with flaws planted on purpose: a missing ZIP, a duplicate program, double counting, a wrong calculation, a "TBD", an output with no year and an "if" figure with no source. The test page checks each flaw is caught. The `.txt` and `.docx` files are the same sheets, for trying the builder by hand and for testing "Fill from a document". From the files on your computer, Chrome needs to be started with `--allow-file-access-from-files` for the Word tests; on the live site they just run. Use made-up data for testing, never real member data.

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
