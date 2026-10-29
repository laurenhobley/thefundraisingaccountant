/*
  FAC ROI.bot Prompt Builder: all question and help wording.

  This file is owned by FAC (Steve King). Edit the wording here and the
  builder page picks it up. Keep the structure the same: only change text
  between quotes.

  Wording comes word for word from FAC's "ROI.bot Prompt Builder" sheet.
  The one change is Location, which is split into City and state and ZIP code
  (decided 2026-10-27).

  "required: true" means the builder asks a follow-up if the answer is
  missing. After two follow-ups the member can skip, and the field is marked
  Unsupported.

  Steve approved all wording in this file on 2026-10-28. Anything added after
  that is marked "draft for Steve".
*/
var FAC_QUESTIONS = {
  intro: "Use this form to enter your organization’s information. Once complete, copy + paste your information into ROI.bot to generate outputs, outcomes, and donor-ready impact statements.",

  // Link from FAC's sheet. Waiting on Steve to confirm (open question 13).
  roiBotUrl: "https://chatgpt.com/g/g-68c9c810e72481919f05f0c6964dc678-fundraising-accountant-roi-impact-statements-gpt",

  // The "how to use" page (help.html) and the link to it. Draft for Steve.
  howTo: {
    linkText: "New here? Read how to use this page.",
    title: "How to use the ROI.bot prompt builder",
    intro: "This page walks you through FAC's ROI.bot prompt sheet, then gives you one finished prompt to paste into ROI.bot.",
    steps: [
      "Gather what you need: your mission statement, your programs in order of priority, and what each program delivered, with numbers and the year.",
      "Answer one section at a time and press Next. Your answers are saved in this browser, so you can stop and come back later.",
      "If a question appears under an answer, it's asking for something ROI.bot needs, such as a year or a source. Fix the answer, or keep it as it is and it will be marked Unsupported.",
      "Whenever an answer includes a number, say where it comes from: Known (add the source), Reasonable estimate (say how you got it) or Unsupported.",
      "On the last screen, read your finished prompt. Tick “I reviewed this”, then copy it or download it.",
      "Open ROI.bot and paste the prompt in."
    ],
    privacy: "Nothing you type is sent anywhere. Your answers stay in this browser until you copy or download them.",
    back: "Back to the prompt builder"
  },

  // Help under each question is draft wording for Steve (added 2026-10-28).
  sections: [
    {
      id: "org",
      title: "Organization Info",
      questions: [
        { id: "name", label: "Name", kind: "text", required: true, help: "Your organization's name, as donors know it." },
        { id: "city", label: "Location: City and state", kind: "text", required: true, help: "Where you do most of your work. ROI.bot uses your location to find local and state figures." },
        { id: "zip", label: "Location: ZIP code", kind: "zip", required: true, help: "The ZIP code of your main office." },
        { id: "website", label: "Website", kind: "url", required: true, help: "Your main web address." },
        { id: "mission", label: "Mission Statement", kind: "long", required: true, help: "Your mission statement, as you share it with donors." },
        { id: "keywords", label: "Key Words", kind: "text", required: true, help: "A few words about your work, separated by commas." }
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
        { id: "outputs", label: "Outputs", kind: "long", required: true, help: "What the program delivered: how many, of what, and in which year." },
        { id: "impact", label: "Current Impact Statement", note: "(if any)", kind: "long", required: false, help: "A short statement you already use about this program's impact. Leave it blank if you don't have one." }
      ]
    },
    {
      id: "pain",
      title: "Pain Statements/Local Context",
      note: "(optional)",
      optional: true,
      kind: "list",
      itemLabel: "Pain statement",
      addLabel: "Add another pain statement",
      help: "Local facts that show the need, such as funding you lost or people you couldn't serve. Add where each figure comes from.",
      examples: [
        "We lost 800,000 in government funding, 1,680 people were denied shelter due to lack of space.",
        "In [STATE], 1 in 5 families experience housing instability each year."
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
    text: "Check the list and the finished prompt below. When it looks right, tick the box to unlock Copy and Download, then paste the prompt into ROI.bot.",
    allClear: "Every answer and figure is settled.",
    previewTitle: "Your finished prompt",
    checkbox: "I reviewed this",
    locked: "Tick “I reviewed this” to unlock Copy and Download.",
    copyButton: "Copy prompt",
    downloadButton: "Download .txt",
    copied: "Copied. Paste it into ROI.bot.",
    selected: "The prompt is selected. Press Ctrl+C (or ⌘C) to copy it.",
    downloaded: "Downloaded. Open the file and paste the prompt into ROI.bot."
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
  vagueWords: ["various", "TBD"],

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
    // Draft for Steve. Settled with the label box, so there is no button.
    ifNoSource: [
      "This answer is based on an “if…” assumption. Where does the figure come from? Choose a label below and add the source, or mark it Unsupported.",
      "We still need a source for this assumption. If you don't have one, choose Unsupported below."
    ]
  },

  // FAC's Final Prompt, word for word. Goes under the member's answers.
  finalPrompt: "Using the information above, convert outputs into outcomes and calculate community impact. Include quality-of-life changes, and where possible, add economic and socioeconomic proxies in dollars using local and state benchmarks. Generate as many concise donor impact statements as would be meaningful to an investor in this organization.",

  // Guardrail line from the plan. Always added to the export.
  guardrail: "Figures marked [Estimate] or [Unsupported] are assumptions. Do not present them as cited benchmarks or introduce new dollar figures unless labeled as your own estimate."
};
