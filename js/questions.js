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
*/
var FAC_QUESTIONS = {
  intro: "Use this form to enter your organization’s information. Once complete, copy + paste your information into ROI.bot to generate outputs, outcomes, and donor-ready impact statements.",

  // Link from FAC's sheet. Waiting on Steve to confirm (open question 13).
  roiBotUrl: "https://chatgpt.com/g/g-68c9c810e72481919f05f0c6964dc678-fundraising-accountant-roi-impact-statements-gpt",

  sections: [
    {
      id: "org",
      title: "Organization Info",
      questions: [
        { id: "name", label: "Name", kind: "text", required: true, help: "" },
        { id: "city", label: "Location: City and state", kind: "text", required: true, help: "" },
        { id: "zip", label: "Location: ZIP code", kind: "zip", required: true, help: "" },
        { id: "website", label: "Website", kind: "url", required: true, help: "" },
        { id: "mission", label: "Mission Statement", kind: "long", required: true, help: "" },
        { id: "keywords", label: "Key Words", kind: "text", required: true, help: "" }
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
        { id: "name", label: "Program Name", kind: "text", required: true, help: "" },
        { id: "description", label: "Description", kind: "long", required: true, help: "" },
        { id: "outputs", label: "Outputs", kind: "long", required: true, help: "" },
        { id: "impact", label: "Current Impact Statement", note: "(if any)", kind: "long", required: false, help: "" }
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
      help: "",
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
      help: "",
      examples: [
        "The average annual cost to shelter a homeless is $18,000–$25,000.",
        "Stable housing reduces social costs (shelters, ER visits, policing) by 30–50%."
      ]
    }
  ],

  // Every figure gets one of these labels. Wording from the plan.
  // labelPrompt and noteLabel are draft wording for Steve to approve.
  labelPrompt: "This answer includes a number. Where does it come from?",
  labels: {
    known: { name: "Known", help: "A source is recorded.", noteLabel: "Source", tag: null }, // tag waiting on Steve (open question 7)
    estimate: { name: "Reasonable estimate", help: "Requires a note on where the number came from.", noteLabel: "Where this number came from", tag: "[Estimate]" },
    unsupported: { name: "Unsupported", help: "Stays visibly flagged.", tag: "[Unsupported]" }
  },

  // Last screen. Placeholder until the review and export stage is built.
  endScreen: {
    title: "You've reached the end of the sheet",
    text: "Your answers are saved in this browser. Review and export are coming next."
  },

  // Follow-up wording. The blank ones are for Steve (open questions 9 and 10).
  // missing and missingZip each have two lines: the first and second time the
  // member presses Next with the answer still missing. Draft wording for Steve.
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
    vague: "",
    outputNoNumber: "",
    outputNoYear: "",
    duplicateProgram: "",
    doubleCount: "",
    ifNoSource: ""
  },

  // FAC's Final Prompt, word for word. Goes under the member's answers.
  finalPrompt: "Using the information above, convert outputs into outcomes and calculate community impact. Include quality-of-life changes, and where possible, add economic and socioeconomic proxies in dollars using local and state benchmarks. Generate as many concise donor impact statements as would be meaningful to an investor in this organization.",

  // Guardrail line from the plan. Always added to the export.
  guardrail: "Figures marked [Estimate] or [Unsupported] are assumptions. Do not present them as cited benchmarks or introduce new dollar figures unless labeled as your own estimate."
};
