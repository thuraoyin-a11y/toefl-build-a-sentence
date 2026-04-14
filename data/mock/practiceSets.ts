import { PracticeSet, Question } from "@/lib/types";

/**
 * Helper to shuffle array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Question bank - 30 questions in dialogue/reply format
 * Format: Speaker says something -> Student needs to reply
 */
export const questionBank: Question[] = [
  // Practice Set 1 - Easy (Campus daily interactions)
  {
    id: "q001",
    context: "Your roommate says: \"I'm going to the cafeteria.\"",
    wordBank: shuffleArray(["Can", "you", "bring", "me", "a", "coffee", "please"]),
    correctAnswer: ["Can", "you", "bring", "me", "a", "coffee", "please"],
    hint: "Use a polite request starting with 'Can'.",
    explanation: "'Can you... please' is a polite way to make a request.",
  },
  {
    id: "q002",
    context: "Your classmate says: \"I missed yesterday's lecture.\"",
    wordBank: shuffleArray(["I", "can", "share", "my", "notes", "with", "you"]),
    correctAnswer: ["I", "can", "share", "my", "notes", "with", "you"],
    hint: "Offer help using 'I can'.",
    explanation: "'Can' expresses willingness and ability to help.",
  },
  {
    id: "q003",
    context: "Your professor says: \"The assignment is due Friday.\"",
    wordBank: shuffleArray(["Can", "I", "submit", "it", "on", "Monday", "instead"]),
    correctAnswer: ["Can", "I", "submit", "it", "on", "Monday", "instead"],
    hint: "Ask for permission to submit later.",
    explanation: "'Can I... instead' asks for an alternative option.",
  },
  {
    id: "q004",
    context: "Your friend says: \"I'm having trouble with this homework.\"",
    wordBank: shuffleArray(["Do", "you", "want", "to", "study", "together"]),
    correctAnswer: ["Do", "you", "want", "to", "study", "together"],
    hint: "Make a suggestion using 'Do you want to'.",
    explanation: "'Do you want to' is a friendly way to make a suggestion.",
  },
  {
    id: "q005",
    context: "The librarian says: \"The book you want is checked out.\"",
    wordBank: shuffleArray(["When", "will", "it", "be", "available"]),
    correctAnswer: ["When", "will", "it", "be", "available"],
    hint: "Ask about time using 'When'.",
    explanation: "'When will' asks about future availability.",
  },
  {
    id: "q006",
    context: "Your roommate says: \"I have a job interview tomorrow.\"",
    wordBank: shuffleArray(["Good", "luck", "with", "your", "interview"]),
    correctAnswer: ["Good", "luck", "with", "your", "interview"],
    hint: "Use the common phrase for wishing someone success.",
    explanation: "'Good luck with' is the standard way to wish someone well.",
  },
  {
    id: "q007",
    context: "Your classmate says: \"I don't understand this chapter.\"",
    wordBank: shuffleArray(["You", "should", "ask", "the", "professor", "for", "help"]),
    correctAnswer: ["You", "should", "ask", "the", "professor", "for", "help"],
    hint: "Give advice using 'You should'.",
    explanation: "'Should' is used to give advice or recommendations.",
  },
  {
    id: "q008",
    context: "Your friend texts: \"Are you coming to the party tonight?\"",
    wordBank: shuffleArray(["I", "can't", "I", "have", "an", "exam", "tomorrow"]),
    correctAnswer: ["I", "can't", "I", "have", "an", "exam", "tomorrow"],
    hint: "Decline and give a reason.",
    explanation: "'Can't' expresses inability, followed by the reason.",
  },
  {
    id: "q009",
    context: "The bookstore employee says: \"That textbook costs $80.\"",
    wordBank: shuffleArray(["Is", "there", "a", "cheaper", "used", "copy"]),
    correctAnswer: ["Is", "there", "a", "cheaper", "used", "copy"],
    hint: "Ask about availability using 'Is there'.",
    explanation: "'Is there' asks about the existence of an alternative.",
  },
  {
    id: "q010",
    context: "Your professor says: \"See me after class.\"",
    wordBank: shuffleArray(["Is", "everything", "okay"]),
    correctAnswer: ["Is", "everything", "okay"],
    hint: "Ask about the situation using 'Is'.",
    explanation: "'Is everything okay' is a common way to ask if there's a problem.",
  },

  // Practice Set 2 - Medium (More complex interactions)
  {
    id: "q011",
    context: "Your lab partner says: \"I think we need to redo this experiment.\"",
    wordBank: shuffleArray(["Why", "weren't", "the", "results", "good"]),
    correctAnswer: ["Why", "weren't", "the", "results", "good"],
    hint: "Ask for the reason using 'Why'.",
    explanation: "'Why' asks for the cause or reason.",
  },
  {
    id: "q012",
    context: "Your advisor says: \"You need to choose a major by next semester.\"",
    wordBank: shuffleArray(["Which", "major", "do", "you", "recommend"]),
    correctAnswer: ["Which", "major", "do", "you", "recommend"],
    hint: "Ask for a specific choice using 'Which'.",
    explanation: "'Which' is used when asking for a selection from options.",
  },
  {
    id: "q013",
    context: "Your classmate says: \"I'm thinking of dropping this course.\"",
    wordBank: shuffleArray(["You", "should", "talk", "to", "the", "professor", "first"]),
    correctAnswer: ["You", "should", "talk", "to", "the", "professor", "first"],
    hint: "Give advice about the order of actions.",
    explanation: "'Should' gives advice; 'first' indicates sequence.",
  },
  {
    id: "q014",
    context: "Your roommate says: \"Someone ate my food from the fridge.\"",
    wordBank: shuffleArray(["I'm", "sorry", "it", "was", "me", "I'll", "buy", "you", "more"]),
    correctAnswer: ["I'm", "sorry", "it", "was", "me", "I'll", "buy", "you", "more"],
    hint: "Apologize, admit, and offer compensation.",
    explanation: "'I'm sorry' + admission + offer to make it right.",
  },
  {
    id: "q015",
    context: "The career center advisor says: \"Your resume needs work.\"",
    wordBank: shuffleArray(["Can", "you", "help", "me", "revise", "it"]),
    correctAnswer: ["Can", "you", "help", "me", "revise", "it"],
    hint: "Ask for assistance with a specific task.",
    explanation: "'Can you help me' requests assistance with a task.",
  },
  {
    id: "q016",
    context: "Your study group member says: \"The exam is going to be really hard.\"",
    wordBank: shuffleArray(["Let's", "make", "a", "study", "plan", "together"]),
    correctAnswer: ["Let's", "make", "a", "study", "plan", "together"],
    hint: "Make a collective suggestion using 'Let's'.",
    explanation: "'Let's' is the contraction of 'let us' for making suggestions.",
  },
  {
    id: "q017",
    context: "Your professor says: \"Your essay lacks supporting evidence.\"",
    wordBank: shuffleArray(["How", "many", "sources", "do", "I", "need", "to", "add"]),
    correctAnswer: ["How", "many", "do", "I", "need", "to", "add"],
    hint: "Ask about quantity using 'How many'.",
    explanation: "'How many' asks about countable quantity.",
  },
  {
    id: "q018",
    context: "Your friend says: \"I got the internship!\"",
    wordBank: shuffleArray(["Congratulations", "When", "do", "you", "start"]),
    correctAnswer: ["Congratulations", "When", "do", "you", "start"],
    hint: "First celebrate, then ask about timing.",
    explanation: "Congratulations + follow-up question about details.",
  },
  {
    id: "q019",
    context: "The IT help desk says: \"Your laptop will be ready tomorrow.\"",
    wordBank: shuffleArray(["Can", "I", "pick", "it", "up", "this", "afternoon", "instead"]),
    correctAnswer: ["Can", "I", "pick", "it", "up", "this", "afternoon", "instead"],
    hint: "Ask for an earlier time using 'Can I'.",
    explanation: "'Pick up' is a phrasal verb meaning to collect something.",
  },
  {
    id: "q020",
    context: "Your classmate says: \"I heard the professor is changing the final exam date.\"",
    wordBank: shuffleArray(["Do", "you", "know", "what", "the", "new", "date", "is"]),
    correctAnswer: ["Do", "you", "know", "what", "the", "new", "date", "is"],
    hint: "Ask about information someone might have.",
    explanation: "'Do you know' introduces an embedded question.",
  },

  // Practice Set 3 - Hard (Complex academic situations)
  {
    id: "q021",
    context: "Your thesis advisor says: \"Your research methodology needs significant revision.\"",
    wordBank: shuffleArray(["Can", "you", "give", "me", "specific", "examples", "of", "what", "to", "fix"]),
    correctAnswer: ["Can", "you", "give", "me", "specific", "examples", "of", "what", "to", "fix"],
    hint: "Request clarification with specific details.",
    explanation: "'Examples of what to fix' asks for concrete guidance.",
  },
  {
    id: "q022",
    context: "The financial aid office says: \"Your scholarship application was denied.\"",
    wordBank: shuffleArray(["Is", "there", "any", "way", "to", "appeal", "the", "decision"]),
    correctAnswer: ["Is", "there", "any", "way", "to", "appeal", "the", "decision"],
    hint: "Ask about alternative procedures.",
    explanation: "'Is there any way to' asks if alternatives exist.",
  },
  {
    id: "q023",
    context: "Your department head says: \"We need to discuss your academic probation.\"",
    wordBank: shuffleArray(["My", "grades", "improved", "last", "semester"]),
    correctAnswer: ["My", "grades", "improved", "last", "semester"],
    hint: "State a fact about your recent performance.",
    explanation: "Past tense 'improved' shows a positive change.",
  },
  {
    id: "q024",
    context: "Your internship supervisor says: \"Your report missed several key points.\"",
    wordBank: shuffleArray(["Can", "I", "have", "until", "Friday", "to", "submit", "a", "revised", "version"]),
    correctAnswer: ["Can", "I", "have", "until", "Friday", "to", "submit", "a", "revised", "version"],
    hint: "Negotiate a deadline extension.",
    explanation: "'Have until' requests a time extension; 'revised version' is the deliverable.",
  },
  {
    id: "q025",
    context: "Your professor says: \"Only students with perfect attendance get extra credit.\"",
    wordBank: shuffleArray(["I", "missed", "one", "class", "because", "I", "was", "sick"]),
    correctAnswer: ["I", "missed", "one", "class", "because", "I", "was", "sick"],
    hint: "Explain the reason for an absence.",
    explanation: "'Because' introduces the reason for the absence.",
  },
  {
    id: "q026",
    context: "The graduate coordinator says: \"Your application is incomplete.\"",
    wordBank: shuffleArray(["Which", "documents", "are", "still", "missing"]),
    correctAnswer: ["Which", "documents", "are", "still", "missing"],
    hint: "Ask for specific missing items.",
    explanation: "'Which' asks for identification of specific items.",
  },
  {
    id: "q027",
    context: "Your research partner says: \"We should publish our findings before someone else does.\"",
    wordBank: shuffleArray(["Let's", "submit", "to", "the", "journal", "next", "month"]),
    correctAnswer: ["Let's", "submit", "to", "the", "journal", "next", "month"],
    hint: "Propose a specific timeline and action.",
    explanation: "'Let's' + action verb + specific time frame.",
  },
  {
    id: "q028",
    context: "Your academic advisor says: \"You need to retake this required course.\"",
    wordBank: shuffleArray(["Is", "there", "an", "online", "option", "for", "summer"]),
    correctAnswer: ["Is", "there", "an", "online", "option", "for", "summer"],
    hint: "Ask about alternative format and timing.",
    explanation: "'Is there an option' asks about alternatives.",
  },
  {
    id: "q029",
    context: "The dean says: \"Your appeal will be reviewed by the committee.\"",
    wordBank: shuffleArray(["When", "can", "I", "expect", "to", "hear", "the", "decision"]),
    correctAnswer: ["When", "can", "I", "expect", "to", "hear", "the", "decision"],
    hint: "Ask about the timeline for a response.",
    explanation: "'Expect to hear' asks about when news will arrive.",
  },
  {
    id: "q030",
    context: "Your professor says: \"Your presentation was the best in class.\"",
    wordBank: shuffleArray(["Thank", "you", "Can", "you", "write", "me", "a", "recommendation", "letter"]),
    correctAnswer: ["Thank", "you", "Can", "you", "write", "me", "a", "recommendation", "letter"],
    hint: "First express gratitude, then make a request.",
    explanation: "Thank you + request for a favor (recommendation letter).",
  },
];

/**
 * Practice Sets - each contains 10 questions
 */
export const practiceSets: PracticeSet[] = [
  {
    id: "set001",
    title: "Practice Set 1",
    description: "Daily campus conversations",
    questionIds: ["q001", "q002", "q003", "q004", "q005", "q006", "q007", "q008", "q009", "q010"],
    difficulty: "easy",
  },
  {
    id: "set002",
    title: "Practice Set 2",
    description: "Academic and social interactions",
    questionIds: ["q011", "q012", "q013", "q014", "q015", "q016", "q017", "q018", "q019", "q020"],
    difficulty: "medium",
  },
  {
    id: "set003",
    title: "Practice Set 3",
    description: "Complex academic situations",
    questionIds: ["q021", "q022", "q023", "q024", "q025", "q026", "q027", "q028", "q029", "q030"],
    difficulty: "hard",
  },
];

/**
 * Get practice set by ID
 */
export function getPracticeSetById(id: string): PracticeSet | undefined {
  return practiceSets.find((s) => s.id === id);
}

/**
 * Get all practice sets
 */
export function getAllPracticeSets(): PracticeSet[] {
  return practiceSets;
}

/**
 * Get question by ID from the question bank
 */
export function getQuestionById(id: string): Question | undefined {
  return questionBank.find((q) => q.id === id);
}

/**
 * Get questions for a practice set
 */
export function getQuestionsForSet(setId: string): Question[] {
  const set = getPracticeSetById(setId);
  if (!set) return [];
  
  return set.questionIds
    .map((id) => getQuestionById(id))
    .filter((q): q is Question => q !== undefined);
}
