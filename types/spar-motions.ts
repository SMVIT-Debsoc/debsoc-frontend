export type SparMotionOption = {
  id: string;
  category: string;
  label: string;
  motion: string;
  description?: string;
  infoslide?: string;
  examples?: readonly string[];
  coreThemes?: readonly string[];
  extension?: readonly string[];
  removal?: readonly string[];
};

export type SparMotionCategory = {
  id: string;
  label: string;
  description: string;
  motionCount: number;
  searchTerms: readonly string[];
};

export const approvedSparMotions: readonly SparMotionOption[] = [
  {
    id: "disaster-relief",
    category: "Economics / Development",
    label: "Disaster Relief",
    motion: "This House Would replace all state rebuilding and reconstruction efforts with direct cash transfers to affected citizens.",
    description: "Disaster recovery · Welfare economics · Government efficiency · Autonomy vs state planning",
    coreThemes: ["Disaster recovery", "Welfare economics", "Government efficiency", "Autonomy vs state planning"],
  },
  {
    id: "esports-development",
    category: "Economics / Development",
    label: "Esports Development",
    motion: "This House believes that developing nations with budding esports communities (e.g., Turkey, Vietnam, Pakistan) should cut funding for popular sports that they perform poorly in (e.g., tennis, football) and invest in the development of esports instead.",
    description: "Comparative advantage · National investment · Sports economics · Digital industries",
    coreThemes: ["Comparative advantage", "National investment", "Sports economics", "Digital industries"],
  },
  {
    id: "reverse-sexism-in-media",
    category: "Feminism",
    label: "Reverse Sexism in Media",
    infoslide: "Reverse sexism is the practice of flipping sexist behaviours that typically apply to one gender so that they are instead applied to another.",
    examples: ["Barbieland's matriarchy from Barbie", "Older woman–younger man romance from The Idea of You", "Gender-inverted “nagging wife” trope from Killing Eve"],
    motion: "This House believes that the feminist movement should actively support depictions of reverse sexism in the media.",
    description: "Reverse sexism in media · Barbieland, The Idea of You, and Killing Eve examples",
  },
  {
    id: "empowerment-and-traditional-femininity",
    category: "Feminism",
    label: "Empowerment and Traditional Femininity",
    motion: "This House opposes attempts by the feminist movement to redefine traditionally feminine roles and behaviours as empowering.",
    description: "Examples: wearing makeup, wearing heels, and wanting to be a housewife",
    examples: ["Wearing makeup", "Wearing heels", "Wanting to be a housewife"],
  },
  {
    id: "gender-pay-gap-taxation",
    category: "Feminism",
    label: "Gender Pay Gap Taxation",
    infoslide: "The gender pay gap is the average difference in remuneration between men and women in the workforce.",
    motion: "In order to address the wage gap, This House would impose a higher tax on men.",
    description: "Gender pay gap · Average remuneration difference between men and women",
  },
  {
    id: "modesty-standards",
    category: "Feminism",
    label: "Modesty Standards",
    motion: "In conservative areas, This House believes that the feminist movement should advocate for extending modesty standards to men rather than removing modesty standards imposed on women.",
    description: "Extension and removal approaches to gendered modesty standards",
    extension: ["Slut-shaming men", "Mocking promiscuous men", "Advocating men to cover up"],
    removal: ["Opposing slut-shaming women", "Advocating women's freedom in clothing"],
  },
  {
    id: "utility-vs-character-based-religion",
    category: "Religion",
    label: "Utility vs Character-Based Religion",
    infoslide: "Religion X: Heaven determined by overall utility produced. Religion Y: Heaven determined by intentions and character.",
    motion: "This House would prefer a world where the dominant religion is Religion X rather than Religion Y.",
    description: "Religion X: utility · Religion Y: intentions and character",
  },
  {
    id: "organised-religion",
    category: "Religion",
    label: "Organised Religion",
    infoslide: "Organised religion refers to religions with formally established institutions, belief systems, and rituals.",
    motion: "This House regrets organised religions.",
    description: "Formally established religious institutions, belief systems, and rituals",
  },
  {
    id: "emotional-healing",
    category: "Religion",
    label: "Emotional Healing",
    motion: "This House regrets the decline of religion's role in emotional healing, replaced by professional psychological help (therapy).",
    description: "Religion's role in emotional healing versus professional therapy",
  },
  {
    id: "conscientious-objection",
    category: "Philosophy / Medical Ethics",
    label: "Conscientious Objection",
    infoslide: "Conscientious objection is the legal right of medical professionals to refuse participation in procedures due to religious or moral beliefs. Common examples include abortion, euthanasia, contraception, assisted reproduction, and infant circumcision.",
    motion: "This House regrets the use of conscientious objection in medical practice.",
    description: "Medical professionals refusing procedures due to religious or moral beliefs",
  },
];

export const sparMotionCategories = [
  {
    id: "economics-development",
    label: "Economics / Development",
    description: "Economics, development policy, welfare, investment, and government decision-making.",
    motionCount: 2,
    searchTerms: ["economics", "development", "welfare", "investment", "government", "disaster", "sports economics"],
  },
  {
    id: "feminism",
    label: "Feminism",
    description: "Gender roles, representation, equality, empowerment, and feminist policy debates.",
    motionCount: 4,
    searchTerms: ["feminism", "gender", "equality", "media", "empowerment", "pay gap", "modesty"],
  },
  {
    id: "religion",
    label: "Religion",
    description: "Religious institutions, morality, emotional healing, and competing religious values.",
    motionCount: 3,
    searchTerms: ["religion", "morality", "institutions", "therapy", "healing", "utility", "character"],
  },
  {
    id: "philosophy-medical-ethics",
    label: "Philosophy / Medical Ethics",
    description: "Moral philosophy, medical autonomy, conscientious objection, and healthcare ethics.",
    motionCount: 1,
    searchTerms: ["philosophy", "medical", "ethics", "healthcare", "objection", "abortion", "euthanasia", "contraception"],
  },
  {
    id: "family-parenting-children",
    label: "Family / Parenting / Children",
    description: "Parenting, childhood, education, school safety, competition, and children's media.",
    motionCount: 4,
    searchTerms: ["family", "parenting", "children", "school", "education", "competition", "Disney", "Ghibli"],
  },
  {
    id: "environment",
    label: "Environment",
    description: "Climate change, adaptation, restoration, tourism, reparations, and sustainability.",
    motionCount: 4,
    searchTerms: ["environment", "climate", "tourism", "reparations", "sustainability", "carbon", "clean energy"],
  },
  {
    id: "art",
    label: "Art",
    description: "Artistic authenticity, audience understanding, museums, and support for new artists.",
    motionCount: 2,
    searchTerms: ["art", "museum", "authenticity", "artists", "self-expression", "accessibility"],
  },
  {
    id: "sports",
    label: "Sports",
    description: "Sports economics, esports, salary caps, league structures, and competitive balance.",
    motionCount: 2,
    searchTerms: ["sports", "esports", "salary", "league", "teams", "competitive balance"],
  },
  {
    id: "media",
    label: "Media",
    description: "True crime, digital creators, online platforms, and the creator economy.",
    motionCount: 2,
    searchTerms: ["media", "true crime", "creator", "YouTube", "Twitch", "TikTok", "Instagram", "Patreon", "Substack"],
  },
  {
    id: "culture",
    label: "Culture",
    description: "Food, happiness, technology, music, political expression, and commercialised wellbeing.",
    motionCount: 5,
    searchTerms: ["culture", "food", "happiness", "technology", "music", "self-care", "wellbeing", "activism"],
  },
  {
    id: "international-relations",
    label: "International Relations (IR)",
    description: "Regional politics, alliances, sovereignty, trade, military strategy, and global affairs.",
    motionCount: 4,
    searchTerms: ["IR", "international", "China", "Myanmar", "ASEAN", "NATO", "Ukraine", "junta", "sovereignty"],
  },
  {
    id: "hypotheticals",
    label: "Hypotheticals",
    description: "Scenario-based debates involving magic, secrecy, discovery, aliens, and future societies.",
    motionCount: 5,
    searchTerms: ["hypothetical", "scenario", "magic", "Atlantis", "aliens", "future", "Prime Directive", "generation ships"],
  },
] as const satisfies readonly SparMotionCategory[];

export const approvedSparMotionCategoryValues = sparMotionCategories.map((category) => category.label) as [string, ...string[]];
