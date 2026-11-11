/*
  FAC ROI.bot Prompt Builder: all question and help wording.

  This file is owned by FAC (Steve King). Edit the wording here and the
  builder page picks it up. Keep the structure the same: only change text
  between quotes.

  Wording comes word for word from FAC's "ROI.bot Prompt Builder" sheet.
  The one change is Location, which asks only for the ZIP code (decided
  2026-11-07; it was City and state plus ZIP code from 2026-10-27).

  "required: true" means the builder asks a follow-up if the answer is
  missing. After two follow-ups the member can skip, and the field is marked
  Unsupported.

  Steve approved all wording in this file on 2026-10-28. Anything added after
  that is marked "draft for Steve".
*/
var FAC_QUESTIONS = {
  // The bar across the top, the page title and the progress bar, from FAC's
  // "ROI.bot Agent — Version 2 Build Plan" and its mockups, word for word.
  // Step and part names match the United Way workbook.
  brand: "FUNDRAISING ACCOUNTANT COMMUNITY — ROI.BOT",
  title: "Tell Your Story with Numbers",
  progress: {
    steps: [
      { n: "1", name: "Pick Your Story", parts: ["Your Organization", "Your Programs", "Outputs to Outcomes", "Add Context", "Add Constraints"] },
      { n: "2", name: "Get the Right #s", parts: ["Pain Statements", "Donate Now", "Major Donors", "Magic Wand", "Build the Prompt"] },
      { n: "3", name: "Tell Your Story", parts: ["Challenge", "Response", "Outcome", "ROI", "Funder Story"] }
    ],
    // For screen readers. Draft for Steve.
    stepLabel: "Step {n}",
    done: "done",
    current: "you are here"
  },
  intro:"Use this form to enter your organization’s information. Once you are complete, copy + paste this information into ROI.bot to generate outputs, outcomes, and donor-ready impact statements.",

  // From FAC's prompt sheet. Shown beside Download. Steve to add the folder's link (url).
  saveCopy: { before: "Save a copy in your ", linkText: "FA community google folder", after: " and watch your story evolve.", url: "" },

  // Let's Get Started (index.html), from FAC's Version 2 build plan: two
  // screens, both 1.1 in the progress bar. Screen 1 is the organization,
  // Screen 2 who the member is; Next stays off until a screen's fields are
  // all filled. Until ROI.bot's chat exists, Next on Screen 2 goes to the
  // builder. Draft for Steve: intro2, the placeholders, and nextLine (the
  // plan's line promises reading the website, which isn't built yet). The
  // plan's phone hint ("We'll text you a code…") waits until a code can be sent.
  screen1: {
    intro: "To get started, just enter your basic organizational information.",
    org: "Organization name",
    orgPlaceholder: "e.g. Northeast Houston Food Pantry",
    website: "Website",
    websitePlaceholder: "https://",
    zip: "ZIP code",
    zipPlaceholder: "5-digit ZIP",
    intro2: "Now, a little about you.",
    name: "Name",
    namePlaceholder: "First and last name",
    jobTitle: "Title",
    jobTitlePlaceholder: "e.g. Executive Director",
    // Steve's flowchart Screen 2: Name · Title · Email · Phone (Lauren, Nov 11). Kept in this
    // browser only until HubSpot is connected. Placeholder: draft for Steve.
    email: "Email",
    emailPlaceholder: "name@yourorganization.org",
    phone: "Phone",
    phonePlaceholder: "Cell phone number",
    // Steve's wording, word for word (Nov 11).
    nextLine: "Next we will scrub the web to learn about your programs",
    // On 1.1, when Screen 1 now says something different from the box
    // (the member went back and changed it). Kit v3 Fix 2; draft for Steve.
    changed: "On Screen 1 you typed “{value}”.",
    useChanged: "Use what I typed on Screen 1",
    keepChanged: "Keep this answer"
  },

  // quick.html: only the required fields of Screen 1 in Steve's Step 1
  // flowchart (Organization, Website, ZIP; Lauren, 2026-11-09), then the
  // Step 1.1 prompt (step11.task, below). The labels are screen1's.
  // Draft for Steve, all of it.
  quick: {
    pageTitle: "Get started in three questions",
    intro: "Answer these three questions and press Next. You'll get a prompt that asks ROI.bot to research your organization.",
    promptTitle: "Your prompt",
    promptIntro: "When it looks right, press “Yes, copy my prompt” and paste it into ROI.bot.",
    fileName: "roi-bot-quick-prompt.txt",
    fullBuilder: "Want to tell the whole story? Use the full prompt builder."
  },

  // Step 1.1's deliverable (Lauren, 2026-11-11): the 1.1 prompt asks ROI.bot
  // to answer in the layout of Steve's Step 1.1 mockup (Field / What I found
  // / Source; keywords in five groups; "Two things to check"). Used by
  // quick.html and by the builder's 1.1 check, where the member pastes the
  // answer back. Draft for Steve, all of it.
  // Nov 11 (later): one prompt has ROI.bot read the whole website and fill
  // the whole report: Part 1 = Steve's Step 1.1 mockup, Part 2 = his Step
  // 1.2 mockup (programs stack ranked), Part 3 = what to check and sources,
  // Part 4 = FAC's sheet, written so the builder can offer each answer as a
  // suggestion (Accept, Edit, Skip). Draft for Steve, all of it.
  step11: {
    title: "Get your report from ROI.bot",
    intro: "Copy this prompt into ROI.bot. It reads your whole website and public profiles and sends back your organization info, your programs ranked, local context and benchmarks, each with its source. Then paste its answer below.",
    copyButton: "Copy the report prompt",
    outputLabel: "Paste ROI.bot's answer here",
    outputHelp: "Each new answer you paste is kept as a round, in this browser only, and goes into your package. Then press the button below to fill in your answers from it.",
    fillButton: "Fill in my answers from ROI.bot's report",
    found: "Found {n} answers in ROI.bot's report. Check each one below: Accept, Edit or Skip. Nothing is filled in until you accept it, and a number still needs its label.",
    none: "No answers found. Check that ROI.bot's answer has Part 4 (\"Organization Info\", \"Programs\", \"Local Context/Data\", \"Benchmarks\"), or type your answers instead.",
    noPaste: "Paste ROI.bot's answer in the box first.",
    acceptAll: "Accept all from the report",
    acceptedAll: "Filled in {n} blank boxes from ROI.bot's report. Your own answers weren't changed: any suggestion left below is for a box you'd already filled. Each number still needs its label.",
    listTitle: "From ROI.bot's report",
    quoteLabel: "In ROI.bot's report:",
    task: "Read our whole website, not just the home page: the About, Mission, Programs or Services, Impact, Results or Annual Report, News, Locations and Contact pages, and any reports linked from them. " +
      "Also read our social media pages and our GuideStar (Candid) profile or Form 990. Then give us our report in four parts, in this order. " +
      "Part 1, Step 1.1 Your Organization: a table with the columns Field, What I found and Source, and these rows: Name; Website; " +
      "Location (street address, and whether it matches our ZIP); Area served; Mission (our exact words, 125 characters or fewer); Social media. " +
      "Then our keywords, in our own words, in five groups: Issue, People served, Services, Location and Results. " +
      "Part 2, Step 1.2 Your Programs, Stack Ranked: a table with the columns Rank, Program, Mission fit, Prominence, Evidence, Score and Why it ranks here. " +
      "Score each program from 1 to 3 on Mission fit, Prominence and Evidence (3 is the highest), multiply the three for its Score, and rank from the highest Score down. " +
      "In Why it ranks here, name the program's strongest result and its source, or say that no result is published. " +
      "Part 3, Two things to check: what you couldn't find or confirm, as questions for us. Then list your sources with their dates. " +
      "Part 4, our sheet, last, in plain text with no tables or bold, exactly like this: a line \"Organization Info\", then \"Name: \", \"Location (include zip): \", \"Web Site: \" and \"Mission Statement: \"; " +
      "a line \"Programs (in order of priority)\", then for each program in your Part 2 order \"1. Program Name: \", \"* Description: \", \"* Outputs: \" (how many, of what, and the year) and \"* Current Impact Statement (if any): \"; " +
      "a line \"Local Context/Data\", then one \"* \" line for each local fact, with its source and year; " +
      "a line \"Benchmarks\", then one \"* \" line for each benchmark, with its source and year. End with the last benchmark. " +
      "Write only what you found. If you can't find something, leave it blank and say so in Part 3 instead of guessing.",
    packageSection: "Steps 1.1 and 1.2 from ROI.bot"
  },

  // Under the ZIP box: the place for that ZIP, from GeoNames' free ZIP list
  // (lib/zip-places.js). {place} is e.g. "Houston, TX". Draft for Steve.
  zipPlace: {
    found: "{place} — does this look right?",
    unknown: "We couldn't find this ZIP code. Check it, or leave it as is."
  },

  // "Fill from a document" on Organization Info (FAC's plan). Draft for Steve.
  documents: {
    title: "Fill from a document (optional)",
    intro: "Paste text from your own document, or choose a file. The builder finds answers written the way FAC's sheet writes them (for example “Name: …” or “Program Name: …”), plus a web address and a ZIP code. Nothing is uploaded or saved: the document is read in this browser only.",
    fileLabel: "Choose a file (Word .docx, PDF or .txt)",
    reading: "Reading {file}…",
    readDone: "Read {file}.",
    wrongType: "This kind of file can't be read here. Choose a Word (.docx), PDF or .txt file, or copy its text into the box below.",
    readFailed: "This file couldn't be read. Try copying its text into the box below instead.",
    pasteLabel: "Or paste text",
    findButton: "Find answers",
    found: "{n} suggested answers. Accept, edit or skip each one. Suggestions for later screens also show on those screens.",
    none: "No answers found. The builder looks for lines like “Name:”, “Program Name:” or “Outputs:”.",
    listTitle: "From your document",
    quoteLabel: "From your document:",
    accept: "Accept",
    replace: "Replace my answer",
    edit: "Edit",
    skip: "Skip",
    accepted: "Accepted",
    skipped: "Skipped",
    sameAlready: "Already your answer"
  },

  // Where members run their finished prompt: ROI.bot, FAC's custom GPT in
  // ChatGPT (Lauren, 2026-11-05; open question 13).
  roiBotUrl: "https://chatgpt.com/g/g-68c9c810e72481919f05f0c6964dc678-roi-bot",
  // The link beside Copy on the review screen and the Step 3 screens. Draft for Steve.
  openRoiBot: "Open ROI.bot",

  // The "how to use" page (help.html) and the link to it. Draft for Steve.
  howTo: {
    linkText: "New here? Read how to use this page.",
    title: "How to use the ROI.bot prompt builder",
    intro: "This page walks you through FAC's ROI.bot prompt sheet, then gives you one finished prompt to paste into ROI.bot.",
    steps: [
      "Gather what you need: your programs in order of priority, and what each program delivered, with numbers and the year.",
      "Answer one section at a time and press Next. Your answers are saved in this browser, so you can stop and come back later.",
      "If a question appears under an answer, it's asking for something ROI.bot needs, such as a year or a source. Fix the answer, or keep it as it is and it will be marked Unsupported.",
      "Whenever an answer includes a number, say where it comes from: Known (add the source), Reasonable estimate (say how you got it) or Unsupported.",
      "On the last screen, read your finished prompt. Press “Yes, copy my prompt”, or download it.",
      "Open ROI.bot and paste the prompt in."
    ],
    privacy: "Nothing you type is sent anywhere. Your answers stay in this browser until you copy or download them.",
    back: "Back to the prompt builder",
    // From FAC's workshop workbook (United Way, Oct 2026), with Steve's second-round wording.
    aiNoteTitle: "A Note About AI",
    aiNote: [
      "AI has real environmental and resource impacts, and there are risks that come with the rapid growth of this technology.",
      "This guide is designed to take safe steps that leverage AI for good. Use it to help you make a difference in the world."
    ],
    whyNowTitle: "Why does this matter now?",
    whyNowIntro: "According to Forvis Mazars, here is the state of the nonprofit sector in 2025:",
    whyNow: [
      "3 out of 4 nonprofits have eliminated staff or reduced programs and services.",
      "77% of nonprofits have seen an increase in demand for their services.",
      "Almost half of nonprofits lack the funds to deliver programs and services."
    ],
    whyNowSource: "Source: Forvis Mazars, 2025 Annual Report – State of the Nonprofit Sector",
    // The credit GeoNames' licence asks for (CC BY 4.0), for the ZIP code places.
    zipCredit: { before: "The place shown for a ZIP code comes from ", linkText: "GeoNames", url: "https://www.geonames.org/", after: " (CC BY 4.0)." }
  },

  // Help under each question is draft wording for Steve (added 2026-10-28).
  sections: [
    {
      id: "org",
      title: "Organization Info",
      questions: [
        { id: "name", label: "Name", kind: "text", required: true, help: "Your organization's name, as donors know it." },
        // Only the ZIP code, no city and state (Lauren, 2026-11-07). Help: draft for Steve.
        { id: "zip", label: "Location: ZIP code", kind: "zip", required: true, placeholder: "5-digit ZIP", help: "Where you do most of your work. ROI.bot uses your ZIP code to find local and state figures." },
        // The place shown under the ZIP box comes from GeoNames' ZIP list (zipPlace, below).
        // Not required here: Screen 1 already asks for it (Steve's Step 1 flowchart,
        // Nov 8).
        { id: "website", label: "Web Site", kind: "url", required: false, help: "Your main web address." }
        // No Mission Statement or Key Words here (Lauren, 2026-11-11): ROI.bot
        // drafts them from the website (Steve's Step 1 flowchart, 1.1).
      ]
    },
    {
      id: "programs",
      title: "Programs",
      note: "(in order of priority)",
      repeat: true,
      itemLabel: "Program",
      addLabel: "Add another program",
      questions: [
        { id: "name", label: "Program Name", kind: "text", required: true, help: "Start with your most important program. You can add more after this one." },
        { id: "description", label: "Description", kind: "long", required: true, help: "What the program does and who it serves, in a sentence or two." },
        // Outputs and Outcomes are asked on 1.3 Outputs to Outcomes, not on each
        // program's screen (Steve's Step 1 flowchart, Nov 8): screen: "outcomes".
        // screenLabel: what 1.3 calls the box; label stays FAC's sheet line in the prompt.
        { id: "outputs", label: "Outputs", screenLabel: "Outputs (what you did)", kind: "long", required: true, screen: "outcomes", help: "What the program delivered: how many, of what, and in which year." },
        // "(if any)" stays because the prompt keeps FAC's sheet line word for word;
        // on screen, 1.3 calls it "Outcomes (what changed)".
        { id: "impact", label: "Current Impact Statement", screenLabel: "Outcomes (what changed)", note: "(if any)", kind: "long", required: true, screen: "outcomes", help: "A short statement you already use about this program's impact." }
      ]
    },
    {
      id: "pain",
      title: "Local Context/Data",
      note: "(optional)",
      optional: true,
      kind: "list",
      itemLabel: "Local context",
      addLabel: "Add more local context",
      help: "Local facts or data that show the need in your community. Add where each figure comes from.",
      examples: [
        "In [STATE], 1 in 5 families experience housing instability each year.",
        "The average cost of homelessness services per family is $18,500 annually."
      ]
    },
    {
      id: "benchmarks",
      title: "Benchmarks",
      note: "(optional)",
      optional: true,
      kind: "list",
      itemLabel: "Benchmark",
      addLabel: "Add another benchmark",
      help: "Costs or values from a trusted source that help put a dollar value on your work. Add the source for each one.",
      examples: [
        "The average annual cost to shelter a homeless is $18,000–$25,000.",
        "Stable housing reduces social costs (shelters, ER visits, policing) by 30–50%."
      ]
    },
    {
      // Step 2.1 in FAC's workshop workbook: the pain statement questions.
      // All optional ("sample metrics"). Draft help for Steve.
      id: "why",
      title: "What are your pain statements?",
      optional: true,
      questions: [
        { id: "lost", label: "Funding lost ($)", kind: "text", required: false, help: "If you lost funding, how much did you lose?" },
        { id: "unserved", label: "People not served because of a lack of funding", kind: "text", required: false, help: "How many people you couldn't serve." },
        { id: "servicesLost", label: "What did they lose? (in a word or two)", kind: "text", required: false, help: "The services those people went without." },
        { id: "couldNot", label: "What were you NOT able to do?", kind: "text", required: false, help: "For example, no more food, space or seats." },
        { id: "demandPct", label: "Increase in demand (%)", kind: "text", required: false, help: "If demand for your services went up, by how much." },
        { id: "demandServices", label: "Which services are in higher demand?", kind: "text", required: false, help: "The services people are asking for more." },
        { id: "served", label: "How many people do you serve now?", kind: "text", required: false, help: "The number of people you currently serve." },
        { id: "period", label: "Over what period of time?", kind: "text", required: false, help: "For example, per year or per month." }
      ]
    },
    {
      // Step 1.4 in FAC's flowchart. FAC's workbook section is still blank,
      // so these four come from FAC's process guide. Draft for Steve.
      id: "constraints",
      title: "Constraints",
      note: "(optional)",
      optional: true,
      questions: [
        { id: "tone", label: "Tone", kind: "text", required: false, help: "How the story should sound, for example warm, urgent or formal." },
        { id: "length", label: "Length", kind: "text", required: false, help: "How long it should be, for example a short paragraph or one page." },
        { id: "format", label: "Format", kind: "text", required: false, help: "The shape you need, for example a donor email, a grant paragraph or social posts." },
        { id: "audience", label: "Audience", kind: "text", required: false, help: "Who will read it, for example major donors, a foundation or your board." }
      ]
    }
  ],

  // Every figure gets one of these labels. Wording from the plan.
  labelPrompt: "This answer includes a number. Where does it come from?",
  labels: {
    known: { name: "Known", help: "A source is recorded.", noteLabel: "Source", tag: null }, // tag waiting on Steve (open question 7)
    estimate: { name: "Reasonable estimate", help: "Requires a note on where the number came from.", noteLabel: "Where this number came from", tag: "[Estimate]" },
    unsupported: { name: "Unsupported", help: "Stays visibly flagged.", tag: "[Unsupported]" }
  },

  // Last screen: review, then Copy or Download. Draft for Steve.
  review: {
    title: "Review your prompt",
    // The Step 2 review is the workbook's 2.5 Build the Prompt.
    title2: "Build the Prompt",
    // No "I reviewed this" tick: members just press Yes (Lauren, 2026-11-09). Draft for Steve.
    text: "Check the list and the finished prompt below. When it looks right, press “Yes, copy my prompt” and paste it into ROI.bot.",
    allClear: "Every answer and figure is settled.",
    previewTitle: "Your finished prompt",
    copyButton: "Yes, copy my prompt",
    downloadButton: "Download .txt",
    downloadMdButton: "Download .md",
    copied: "Copied. Paste it into ROI.bot.",
    selected: "The prompt is selected. Press Ctrl+C (or ⌘C) to copy it.",
    downloaded: "Downloaded. Open the file and paste the prompt into ROI.bot.",
    // Each copied or downloaded prompt is kept in this browser, so members can
    // compare runs (the flowchart's "Prompt history"). Draft for Steve.
    versionsTitle: "Your saved versions",
    versionsNone: "Each prompt you copy or download is saved here, so you can compare versions.",
    versionLabel: "Version {n}, saved {date}",
    versionDownload: "Download this version"
  },

  // The screens follow Step 1 of FAC's flowchart (Draft v3, Oct 25, 2026),
  // which Steve approved. Draft wording for Steve.
  flow: {
    // Step numbers shown on each screen, from the workbook's parts (Version 2
    // plan and Steve's Step 1.3 instructions): 1.3 Outputs to Outcomes; 1.4 Add
    // Context is Local Context/Data and Benchmarks; 1.5 Add Constraints; 2.5
    // Build the Prompt is the review screen.
    numbers: { org: "1.1", program: "1.2", pain: "1.4", benchmarks: "1.4", constraints: "1.5", outcomes: "1.3", review2: "2.5", check: "◆" },
    // Version 2 plan: every screen ends with "← Previous" (left) and "Next"
    // (right); every forward button says Next.
    nextButton: "Next",
    previousButton: "← Previous",
    startOver: "Start over",
    startOverConfirm: "Click again to clear everything",
    // Above Next on each part's main screen (Version 2 plan, word for word).
    happyLine: "Once you are happy with your {thing}, press Next to continue.",
    // 1.5 is optional, so it also offers the flowchart's "Skip to Step 2".
    skipToStep2: "Skip to Step 2",
    happy: { org: "organization info", rank: "stack ranking", outcomes: "outputs to outcomes", pain: "context", benchmarks: "context", constraints: "constraints",
      why: "pain statements", regular: "Donate Now table", major: "Major Donor Ladder" },
    editLink: "Edit",
    empty: "(blank)",
    // One "Happy?" check after each section, as in Steve's Step 1 flowchart
    // (Nov 8): Keywords (1.1), Stack Ranking (1.2), Outputs to Outcomes (1.3,
    // with the go deeper or skip choice), Context (1.4) and constraints (1.5).
    // Titles from the flowchart; the rest is draft for Steve.
    checkpoints: {
      // Laid out like Steve's Step 1.1 mockup (Nov 9); "Your answer" stands in
      // for its "What I found" until ROI.bot does the research. Draft for Steve.
      org: { title: "Happy with your organization info?", text: "Check your organization info. Edit anything that isn't right, then continue.",
        fieldHead: "Field", answerHead: "Your answer" },
      programs: { title: "Happy with your stack ranking?", titleUnranked: "Happy with your programs?", text: "Check your programs and their order. Edit anything that isn't right, then continue." },
      outcomes: { title: "Happy with your outputs to outcomes?", text: "Check what each program did and what changed. Edit anything that isn't right." },
      benchmarks: { title: "Happy with your context?", text: "Check your local context and benchmarks. Edit anything that isn't right, then continue.", none: "No context or benchmarks added." },
      constraints: { title: "Happy with your constraints?", text: "Check how you want your story written. When you're happy, build your story.", none: "None set. ROI.bot will choose." }
    }
  },

  // Step 2 of FAC's workshop workbook: "Get the Right Numbers". Comes after
  // the 1.5 review; the prompt gets these too. Draft wording for Steve.
  why: {
    number: "2.1",
    intro: "Pain statements create urgency. They help a donor understand what is happening right now and what is at risk if funding doesn't come through.",
    importButton: "Use my answers from the pain statement form",
    imported: "Brought in your answers from the pain statement form. Check them below.",
    typesLabel: "What type of loss",
    types: [{ id: "government", label: "Government" }, { id: "grant", label: "Grants" }, { id: "donation", label: "Donations" }],
    previewTitle: "Your Why Now statement",
    // {amount}, {unserved} and {pct} are the member's own answers, as typed.
    lossSentence: "We lost ${amount} in funding. As a result, {unserved} people go unserved.",
    demandSentence: "Demand has increased {pct}%. As a result, {unserved} people go unserved.",
    blank: "___",
    investSentence: "An investment in <our programs> helps create <Y Outcomes> and saves <Y Dollars>",
    investNote: "You'll fill in this part in Step 3.",
    exportTitle: "Pain Statement (Why Now)"
  },
  donors: {
    number: "2.2",
    title: "Tangible results",
    intro: "Donors want to know exactly what their gift produces. Tangible results link dollar amounts to real program outcomes.",
    tableIntro: "Start with the gift amount, then connect it to something specific and tangible. What does a gift fund? What are the outcomes (tangible results) that occur? Then change that into an emotional story.",
    example: "Example from the Fort Bend Women's Center: $500 provides 2 weeks of support; $250, 25 crisis calls; $125, 1 night of safety; $50, 1 day of meals.",
    regular: { number: "2.2", screenTitle: "Donate Now", title: "Regular Donor Table", levelsHint: "FAC's suggested levels: $500, $250, $125, $50. Type your own amounts." },
    major: { number: "2.3", screenTitle: "Major Donors", title: "Major Donor Table", intro: "For major donors, you do the same thing with larger program opportunities.", levelsHint: "FAC's suggested levels: $5,000, $10,000, $25,000, $50,000. Type your own amounts." },
    columns: { amount: "Investment ($)", funds: "What It Funds", result: "Tangible Result", words: "Donor Friendly Language" },
    rowLabel: "Row",
    addRow: "Add a row",
    draftNote: "(draft)"
  },
  wand: {
    number: "2.4",
    title: "Wave a magic wand",
    // Optional in Steve's Step 1 flowchart (Nov 8): "Magic Wand (optional)".
    note: "(optional)",
    intro: "If you could make a wish, what would you want your donors to invest in?",
    program: "Program",
    programHelp: "Pick one of your programs or type another.",
    amount: "Investment ($)",
    possible: "What would it make possible?",
    exportTitle: "Magic Wand"
  },

  // Step 3 of FAC's workshop workbook: "Use AI to Get Numbers to Tell Your
  // Story". FAC's prompts are word for word from the workbook. Draft help for Steve.
  story: {
    intro: "A strong funder story connects four things: CHALLENGE → RESPONSE → OUTCOME → ROI. Copy each step's prompt into the same ROI.bot chat as your main prompt, then paste what ROI.bot gives back. Expect two or three rounds.",
    promptTitle: "This step's prompt",
    copyButton: "Copy this step's prompt",
    copied: "Copied. Paste it into ROI.bot.",
    outputLabel: "Paste ROI.bot's answer here",
    outputHelp: "Each time you paste a new answer, it's kept as a new round so you can compare.",
    roundsTitle: "Your rounds",
    roundLabel: "Round {n}",
    // Keep or revise each part (FAC's process guide, the Step 3 loop).
    // Each part's own "revise" question is below. Draft for Steve.
    choiceLabel: "Is this part right?",
    keep: "Keep this part",
    revise: "Revise this part",
    reviseNext: "Then copy this step's prompt again and paste ROI.bot's new answer. Each answer is kept as a round.",
    reviseGo: "Go to {screen}",
    fromRoibot: "From ROI.bot: check its figures before using them.",
    challenge: {
      number: "3.1", title: "Define the challenge",
      intro: "Your answers from Step 2.1 are brought in so ROI.bot can write the challenge part of your story.",
      prompt: "Here is a narrative list of the challenges faced in the world that we seek to change:",
      revise: "Add a local fact or benchmark that shows the need?",
      inputs: { lost: "Funding lost ($ and type)", unserved: "People not served", demand: "Increased demand", served: "Currently served", keyFact: "Key fact" }
    },
    response: {
      number: "3.2", title: "Define your response",
      intro: "Your program information is brought in so ROI.bot can show how your programs respond to the challenge.",
      prompt: "Provide a narrative with our response to those challenges. Explain how our programs help make the world a better place.",
      revise: "Add more detail to a program's outputs?",
      inputs: { name: "Program name", description: "Description", outputs: "Outputs", impact: "Impact statement" }
    },
    outcome: {
      number: "3.3", title: "Define the outcome",
      intro: "Show what changed for one real person. A single story with a quote does more than a page of statistics.",
      prompt: "Using our challenge and response, describe the outcome for the people we serve. Include one real client story and quote.",
      revise: "Add or strengthen the client story or quote above?",
      approved: "This story and quote are anonymized and approved for public use.",
      needApproved: "Tick the box above before copying this prompt."
    },
    roi: {
      number: "3.4", title: "Calculate the ROI",
      intro: "Turn the outcome into a number a funder can compare.",
      prompt: "Calculate the ROI of a gift to this program.",
      revise: "Check the value created above and where it comes from?",
      example: "Illustrative example from FAC's workbook: $500 toward survivor support; $1,500 in documented equivalent service value; $1,500 ÷ $500 = 3:1; $5,000 funds 10 survivor support packages at $500 each."
    },
    // The new boxes in Step 3. Only the key fact, value created and dollars saved get a Known / Estimate / Unsupported box.
    fields: {
      keyFact: { label: "Key fact", help: "One fact that shows what's at stake for the people you serve." },
      clientStory: { label: "Client story", help: "An anonymized, approved story describing the journey from crisis toward safety and stability." },
      clientQuote: { label: "Client quote", help: "An authentic quote approved for public use." },
      secondQuote: { label: "Second quote", note: "(optional)", help: "A second verified quote about healing, independence, or hope." },
      investment: { label: "Investment (gift amount)", help: "The gift you're asking for." },
      value: { label: "Value created or cost avoided", help: "What the gift creates or saves, with where the figure comes from." },
      roi: { label: "ROI", help: "Type your own calculation: the value divided by the investment. The builder checks the math." },
      // Draft for Steve: the "For every $1" line and the timeframe (FAC's process guide, 3.4 and 3.6).
      everyDollar: { label: "For every $1", help: "Type your own line, for example “For every $1 invested, $3 of value is created.” The builder checks it against your investment and value above." },
      ask: { label: "The ask", help: "What you're asking a funder to give, and what it funds." },
      timeframe: { label: "Timeframe", note: "(optional)", help: "When the gift would be used, for example over 12 months." },
      investProgram: { label: "An investment in…", help: "Your program." },
      investOutcomes: { label: "helps create…", help: "The outcomes, in your words or from ROI.bot's answers." },
      investDollars: { label: "and saves…", help: "The dollars saved, with where the figure comes from." }
    },
    funder: {
      number: "3.5", title: "Put it together: your funder story",
      intro: "Combine your four outputs into one short story, in order, and end with a clear ask. Each part starts with your latest ROI.bot answer; edit it as you like.",
      parts: { challenge: "Challenge", response: "Response", outcome: "Outcome", roi: "ROI and ask" },
      reset: "Use my latest ROI.bot answer",
      investTitle: "Finish your Why Now statement",
      investSentence: "An investment in {program} helps create {outcomes} and saves {dollars}.",
      copyButton: "Copy funder story"
    }
  },
  actions: {
    title: "My next steps",
    intro: "Based on today's workshop, commit to one to three actions you will take in the next 30 days.",
    rowLabel: "Action",
    columns: { assignee: "Assignee", title: "Title", date: "Date", status: "Status" },
    statuses: ["Not started", "In progress", "Done"]
  },
  assess: {
    title: "Self assessment",
    intro: "Rate yourself honestly: 1 = there's lots of work to do here, 5 = we nail this part.",
    statements: [
      "We have a diversified DEVELOPMENT PLAN (not too dependent on 1-3 sources).",
      "We can show donors the TANGIBLE OUTCOMES from their gift.",
      "Our CASE STATEMENT uses numbers to measure the impact of those outcomes."
    ],
    takeaway: "What is your biggest takeaway from today's workshop?"
  },
  packageText: {
    title: "Your package",
    text: "Everything you made, in one file you can keep.",
    copyButton: "Yes, copy my package",
    downloadButton: "Download package (.txt)",
    downloadMdButton: "Download package (.md)",
    heading: "ROI.bot package",
    sections: { prompt: "Your ROI.bot prompt", whyNow: "Why Now statement", programs: "Programs in priority order", rank: "Stack ranking", roiAsk: "Your ROI and ask", story: "Your story parts", funder: "Your funder story", actions: "My next steps", assess: "Self assessment" }
  },

  // Optional stack rank (FAC's process guide, form 1.2), after the programs.
  // Members type every score themselves; the tool only checks the math and
  // sorts by the scores they typed. Draft for Steve. The guide says 3
  // measures but its example uses 4 (a gap for Steve to close).
  rank: {
    // From FAC's Stack Ranking Template (4 Drivers), word for word, except
    // "four numbers" (the template says "three" but has four columns) and
    // the doubled full stop after "drivers". Draft for Steve where marked.
    title: "Compare your programs",
    ask: "Do you want to stack rank your programs?",
    yes: "Yes, rank them",
    no: "No, keep the order I typed",
    needChoice: "Please choose whether to rank your programs.",
    intro: "A stack ranking grid helps you compare your programs based on any three drivers. For example:",
    introExamples: [
      "Do they increase the QUALITY of services provided to existing clients?",
      "Do they help increase the QUANTITY of clients you can serve?",
      "Do they bring in MONEY, through earned income or donations?"
    ],
    instructions: [
      "Rank each program with a 1, 2 or 3 to which does it most, just ok, or least.",
      "Multiply these four numbers to produce a Stack ranking.",
      "Sort by Stack Rank and you can quickly see which programs are most impactful to the mission. Those are likely the stories you want to tell."
    ],
    keyTitle: "Key",
    key: ["1 = Most", "2 = OK", "3 = Least"],
    // The columns, in order. The member names each "named" one (Driver 1-3);
    // Money is always there.
    columns: [
      { id: "d1", label: "Driver 1", named: true },
      { id: "d2", label: "Driver 2", named: true },
      { id: "d3", label: "Driver 3", named: true },
      { id: "money", label: "Money" }
    ],
    // Draft for Steve.
    namesLabel: "Name your three drivers",
    namesHelp: "Example: Quality, Quantity, Uniqueness, Impact",
    needNames: "Please name all three drivers.",
    // FAC's filled-in template for Mission NE, shown as a grey table only.
    // Each row: program, the four scores, then the Stack Rank.
    example: {
      title: "Example: Mission NE",
      headings: ["Program", "Quantity ×", "Impact ×", "Unique ×", "Money =", "Stack Rank"],
      rows: [
        ["Food Distribution", "1", "1", "1", "1", "1"],
        ["Buddy Backpack", "2", "1", "1", "1", "2"],
        ["Rental/Utility Assistance", "1", "1", "3", "1", "3"],
        ["Mental Health (ISS)", "3", "1", "1", "1", "3"],
        ["Childcare", "3", "1", "1", "1", "3"],
        ["Scholarship Program", "2", "1", "2", "2", "8"],
        ["College Classes", "3", "1", "2", "2", "12"],
        ["Senior Citizen Delivery", "3", "3", "3", "1", "27"]
      ]
    },
    scoreLabel: "Stack Rank",
    // Draft for Steve.
    needScores: "Please score every program on each driver and Money, and type its Stack Rank.",
    wrongScore: "This Stack Rank doesn't match the four numbers multiplied together. Please check it.",
    sortButton: "Sort by Stack Rank, lowest first",
    sorted: "Sorted. The programs at the top are most impactful to the mission.",
    // Draft for Steve. Shown once the list is sorted; only the member's own Stack Ranks.
    suggest: "Suggestion: your Stack Ranks jump most between {a} ({x}) and {b} ({y}). You could draw the red line after {a}.",
    lineLabel: "Draw the red line after",
    lineHelp: "Programs below the red line are left out of the prompt. They stay saved, so you can move the line later.",
    belowLine: "below the red line"
  },

  // 1.3 Outputs to Outcomes (Steve's Step 1.3 instructions): one row per
  // program above the red line, in rank order. Outcomes is each program's
  // Current Impact Statement. Then go deeper (1.4, 1.5) or skip to 2.1.
  // Draft for Steve, apart from the title, "later" and choiceAsk.
  outcomes: {
    title: "Outputs to Outcomes",
    intro: "One row per program, in your ranked order. Check what each program did and what changed.",

    placeholder: "Click to change",
    later: "Gray tags can be filled in later.",
    choiceAsk: "Go deeper now with your files and research (1.4 Add Context), or skip to Step 2?",
    deeper: "Go deeper (1.4 Add Context)",
    skip: "Skip to Step 2",
    needChoice: "Please choose whether to go deeper or skip to Step 2."
  },

  // Extra fields for each benchmark (FAC's process guide, form 2.3). Draft for Steve.
  benchmarkFields: {
    // exportLabel is how each one is named in the finished prompt.
    source: { label: "Source", exportLabel: "Source", help: "Where the finding comes from: a report, study or website." },
    program: { label: "Which program it connects to", exportLabel: "Program", none: "Choose a program" },
    connects: { label: "How it connects to the program", exportLabel: "How it connects", help: "A sentence on why this finding matters for that program." },
    // FAC's research examples from the workshop workbook (FBWC). Shown as grey hints only.
    examplesTitle: "Research examples from FAC's workbook",
    findingLabel: "Research benchmark",
    examples: [
      { finding: "Economic Cost of Domestic Violence", source: "CDC – Lifetime Economic Burden of Intimate Partner Violence Among U.S. Adults (2018)", connects: "Quantifies healthcare costs, lost productivity, and criminal justice expenses associated with domestic violence." },
      { finding: "Unmet Demand for Shelter", source: "National Network to End Domestic Violence – Domestic Violence Counts Report", connects: "Documents survivors requesting shelter and services who cannot be accommodated because of limited resources." },
      { finding: "Law Enforcement Costs", source: "Local police and criminal justice cost data", connects: "Helps estimate potential public savings from reducing repeat domestic violence incidents." },
      { finding: "Cost of Homelessness", source: "HUD and local homelessness research", connects: "Provides benchmarks for estimating the economic benefits of helping survivors avoid homelessness." }
    ]
  },

  // The review screen's editable RTCC parts (FAC's process guide, step 2.5).
  // Draft for Steve.
  rtccEdit: {
    title: "Edit your prompt",
    text: "You can change the Role, Task and Constraints below. To change the Context, use the Edit links above to go back to that answer. The guardrail line is always added at the end.",
    roleHelp: "Who ROI.bot should act as. FAC's wording is coming; you can write your own.",
    reset: "Use FAC's wording",
    resetConstraints: "Use my constraint answers"
  },

  // The finished prompt in RTCC parts: Role, Context, Task, Constraints.
  // Context comes before Task because FAC's Final Prompt (the Task) says
  // "Using the information above". Role is left out until FAC writes it
  // (FAC's guide: wording for Peter to set). Draft for Steve.
  rtcc: {
    // FAC's 10 rules for AI, from the workshop workbook. Added to the
    // Constraints after the member's own; members can edit them there.
    rules: [
      "Do not make things up. Use accurate, verifiable information.",
      "Do not assume. Ask questions if important information is missing.",
      "Do not invent sources, statistics, or quotes.",
      "Do not give generic answers. Be specific and relevant.",
      "Do not overcomplicate. Use clear, simple language.",
      "Do not ignore my instructions. Follow the requested format, tone, and length.",
      "Do not present guesses as facts. Clearly identify uncertainty.",
      "Do not agree with me just to agree. Challenge incorrect assumptions respectfully.",
      "Do not repeat mistakes. If your approach is fundamentally wrong, reconsider the original instructions.",
      "Do not sacrifice accuracy for speed. Prioritize quality and verify important claims."
    ],
    role: "",
    roleHeading: "Role",
    contextHeading: "Context",
    taskHeading: "Task",
    constraintsHeading: "Constraints"
  },

  // The finished prompt follows FAC's sheet, in plain text. Draft for Steve
  // where it adds wording the sheet doesn't have.
  exportText: {
    location: "Location (include zip)",
    source: "(source: {note})",
    // {program} and {other} are e.g. "Program 2" and "Program 1".
    sameGroup: "Note: {program} and {other} both report {number} for the same group. Do not add them together."
  },

  // Filler words that get a follow-up wherever they appear in an answer.
  // Whole words only, in any capitals. Steve can add more (open question 9).
  // "a lot", "many" and "several": draft for Steve (the plan's own example).
  vagueWords: ["various", "TBD", "N/A", "a lot", "many", "several"],

  // Filler words that mean "nothing here". On an optional answer the
  // follow-up suggests leaving the box blank (followUps.notNeeded) instead.
  // Each one must also be in vagueWords. Draft for Steve.
  notNeededWords: ["N/A"],

  // Words that mark an assumption ("If a stay costs $50/day..."). An answer
  // with one of these and a figure needs a source or the Unsupported label.
  // Whole words only, in any capitals. Draft for Steve.
  assumptionWords: ["if"],

  // Follow-up wording. missing and missingZip each have two lines: the first
  // and second time the member presses Next with the answer still missing.
  followUps: {
    missing: [
      "This question is still blank. Please add an answer.",
      "We still need this answer. If you don't have it, you can skip it, and it will be marked Unsupported."
    ],
    missingZip: [
      "Please enter a 5-digit ZIP code.",
      "We still need a 5-digit ZIP code. If you don't have it, you can skip it, and it will be marked Unsupported."
    ],
    skipButton: "Skip this question",
    skipped: "Unsupported: skipped. Add an answer any time to clear this.",
    // {word} is replaced with the filler word the member typed.
    vague: [
      "“{word}” is vague. Can you be more specific?",
      "We still need more detail than “{word}”. If you can't be more specific, you can keep your answer, and it will be marked Unsupported."
    ],
    // For a notNeededWords word on an optional answer. Draft for Steve.
    notNeeded: [
      "“{word}” isn't needed. If you don't have one, leave this box blank.",
      "If you don't have one, you can leave this box blank. Or keep your answer, and it will be marked Unsupported."
    ],
    keepButton: "Keep my answer",
    keptVague: "Unsupported: vague. Edit your answer any time to clear this.",
    // A program's Outputs needs a number and a year (2024, 2023-24, FY24).
    outputNoNumber: [
      "This output has no number. How many did the program provide or serve?",
      "We still need a number for this output. If you don't have one, you can keep your answer, and it will be marked Unsupported."
    ],
    outputNoYear: [
      "This output has no year. Which year (or fiscal year) is it from?",
      "We still need the year for this output. If you don't have it, you can keep your answer, and it will be marked Unsupported."
    ],
    outputNoNumberOrYear: [
      "This output has no number and no year. How many, and in which year?",
      "We still need a number and a year for this output. If you don't have them, you can keep your answer, and it will be marked Unsupported."
    ],
    keptOutput: "Unsupported: missing a number or year. Edit your answer any time to clear this.",
    // Draft for Steve. {program} becomes the earlier program, e.g. "Program 4".
    duplicateName: "{program} has the same name. Is this a separate program? If it is, give it a different name, or confirm below.",
    duplicateDescription: "{program} has the same description. Is this a separate program? If it is, describe what's different, or confirm below.",
    separateButton: "These are separate programs",
    // Draft for Steve. {program} is the earlier program, {number} the shared number.
    overlap: "{program} also reports {number}. Is this the same group counted in both programs?",
    overlapDifferent: "Different groups",
    overlapSame: "Same group, both programs",
    overlapSameNote: "Noted: {program} counts the same group. The finished prompt will tell ROI.bot not to add the two together.",
    // Draft for Steve. {calc} is the member's own calculation, quoted. The
    // correct result is never shown: that would be a figure the member didn't type.
    mathWrong: [
      "Please check this calculation: “{calc}”. It doesn't come out to the result written.",
      "This calculation still doesn't come out to the result written: “{calc}”. If you can't check it now, you can keep your answer, and it will be marked Unsupported."
    ],
    keptMath: "Unsupported: a calculation doesn't add up. Edit your answer any time to clear this.",
    // Draft for Steve. The "For every $1" line checked against the member's
    // own investment and value. The right figure is never shown.
    dollarWrong: [
      "This doesn't match your investment and value created above. Please check it.",
      "This still doesn't match your investment and value created. If you can't check it now, you can keep your answer, and it will be marked Unsupported."
    ],
    keptDollar: "Unsupported: doesn't match your investment and value. Edit your answer any time to clear this.",
    // Draft for Steve. Settled with the label box, so there is no button.
    ifNoSource: [
      "This answer is based on an “if…” assumption. Where does the figure come from? Choose a label below and add the source, or mark it Unsupported.",
      "We still need a source for this assumption. If you don't have one, choose Unsupported below."
    ]
  },

  // FAC's Final Prompt, word for word. Goes under the member's answers.
  finalPrompt: "Using the information above, convert outputs into outcomes and calculate community impact. Include quality-of-life and social impact changes, and where possible, add economic and socioeconomic proxies in dollars using local and state benchmarks. Generate as many concise donor impact statements as would be meaningful to an investor in this organization.",

  // Guardrail line from the plan. Always added to the export.
  guardrail: "Figures marked [Estimate] or [Unsupported] are assumptions. Do not present them as cited benchmarks or introduce new dollar figures unless labeled as your own estimate."
};
