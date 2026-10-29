/*
  The made-up test kit: three organizations with flaws planted on purpose,
  like the ones in FAC's FBWC example. Every name, place and number is
  made up. The matching .txt files in this folder are the same sheets
  written as a member might have them, for trying the builder by hand.

  Each flaw names the answer it's in and the follow-up the builder should ask:
  "missing", "vague", "output", "math", "assumption", "duplicate" or "overlap".
*/
var FAC_TEST_KIT = [
  {
    name: "Maple Street Youth Center",
    file: "maple-street-youth-center.txt",
    flaws: [
      { path: "org.zip", issue: "missing", what: "No ZIP code" },
      { path: "programs.1.name", issue: "duplicate", what: "Two programs named \"After-School Club\"" }
    ],
    answers: {
      org: { name: "Maple Street Youth Center", city: "Maple Falls, OH", zip: "", website: "https://example.org/maple",
        mission: "We give young people a safe place to learn and grow after school.", keywords: "youth, after-school, mentoring" },
      programs: [
        { name: "After-School Club", description: "Homework help and snacks for middle schoolers", outputs: "260 students served in 2024", impact: "" },
        { name: "After-School Club", description: "Weekend sports for teens", outputs: "140 teens took part in 2024", impact: "" }
      ],
      pain: ["We lost $95,000 in city funding in 2024, so 80 students are on our waiting list."],
      benchmarks: []
    }
  },
  {
    name: "Harbor Light Shelter",
    file: "harbor-light-shelter.txt",
    flaws: [
      { path: "programs.1.outputs", issue: "overlap", what: "620 guests counted in both programs" },
      { path: "pain.0", issue: "math", what: "620 × 30 × $45 written as $830,000" }
    ],
    answers: {
      org: { name: "Harbor Light Shelter", city: "Port Jensen, ME", zip: "04999", website: "https://example.org/harbor",
        mission: "Safe shelter and a warm meal for anyone without a home.", keywords: "shelter, homelessness, meals" },
      programs: [
        { name: "Emergency Beds", description: "Overnight beds for adults", outputs: "620 guests sheltered in 2024", impact: "" },
        { name: "Hot Meals", description: "Two hot meals a day for shelter guests", outputs: "620 guests received meals in 2024", impact: "" }
      ],
      pain: ["620 guests × 30 nights × $45 = $830,000 in shelter costs"],
      benchmarks: []
    }
  },
  {
    name: "Prairie Health Clinic",
    file: "prairie-health-clinic.txt",
    flaws: [
      { path: "org.mission", issue: "vague", what: "Mission Statement is \"TBD\"" },
      { path: "programs.0.outputs", issue: "output", what: "Outputs has no year" },
      { path: "benchmarks.0", issue: "assumption", what: "An \"if\" figure with no source" }
    ],
    answers: {
      org: { name: "Prairie Health Clinic", city: "Dune City, KS", zip: "67999", website: "https://example.org/prairie",
        mission: "TBD", keywords: "health care, rural, free clinic" },
      programs: [
        { name: "Mobile Clinic", description: "Free checkups in small rural towns", outputs: "1,150 checkups", impact: "Fewer emergency room visits" }
      ],
      pain: [],
      benchmarks: ["If an emergency room visit costs $1,200, our checkups save $1,380,000 a year"]
    }
  }
];
