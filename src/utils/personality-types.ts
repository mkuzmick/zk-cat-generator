/**
 * Myers-Briggs Type Indicator (MBTI) personality type definitions
 */
export interface MBTIType {
  code: string;    // e.g., "INFJ"
  title: string;   // e.g., "The Advocate"
  description: string; // Brief description of the personality type
}

/**
 * Comprehensive collection of MBTI personality types with short descriptions
 */
export const mbtiTypes: Record<string, MBTIType> = {
  "INFJ": {
    code: "INFJ",
    title: "The Advocate",
    description: "Quiet, mystical, and insightful. INFJs are thoughtful, idealistic, and deeply committed to their values and those they care about."
  },
  "INFP": {
    code: "INFP",
    title: "The Mediator",
    description: "Imaginative, open-minded, and caring. INFPs are creative idealists who seek inner harmony and meaningful connections."
  },
  "INTJ": {
    code: "INTJ",
    title: "The Architect",
    description: "Independent, innovative, and strategic. INTJs are analytical problem-solvers who value knowledge and competence."
  },
  "INTP": {
    code: "INTP",
    title: "The Logician",
    description: "Inventive, curious, and theoretical. INTPs are logical thinkers who enjoy exploring ideas and solving complex problems."
  },
  "ISFJ": {
    code: "ISFJ",
    title: "The Defender",
    description: "Warm, considerate, and dedicated. ISFJs are practical helpers who are committed to meeting others' needs with care."
  },
  "ISFP": {
    code: "ISFP",
    title: "The Adventurer",
    description: "Gentle, artistic, and sensitive. ISFPs are spontaneous creators who live in the moment and value personal freedom."
  },
  "ISTJ": {
    code: "ISTJ",
    title: "The Logistician",
    description: "Reliable, precise, and organized. ISTJs are practical planners who value tradition, order, and follow-through."
  },
  "ISTP": {
    code: "ISTP",
    title: "The Virtuoso",
    description: "Adaptable, observant, and practical. ISTPs are skilled troubleshooters who enjoy exploring how things work."
  },
  "ENFJ": {
    code: "ENFJ",
    title: "The Protagonist",
    description: "Charismatic, inspiring, and empathetic. ENFJs are natural leaders who help others fulfill their potential."
  },
  "ENFP": {
    code: "ENFP",
    title: "The Campaigner",
    description: "Enthusiastic, creative, and sociable. ENFPs are energetic idea-generators who see possibilities everywhere."
  },
  "ENTJ": {
    code: "ENTJ",
    title: "The Commander",
    description: "Decisive, strategic, and assertive. ENTJs are natural leaders who organize people and resources to achieve goals."
  },
  "ENTP": {
    code: "ENTP",
    title: "The Debater",
    description: "Quick, clever, and argumentative. ENTPs are intellectual explorers who enjoy challenging assumptions."
  },
  "ESFJ": {
    code: "ESFJ",
    title: "The Consul",
    description: "Warm, social, and supportive. ESFJs are attentive caregivers who value harmony and create welcoming environments."
  },
  "ESFP": {
    code: "ESFP",
    title: "The Entertainer",
    description: "Spontaneous, energetic, and playful. ESFPs are vivacious performers who enjoy making life fun for others."
  },
  "ESTJ": {
    code: "ESTJ",
    title: "The Executive",
    description: "Efficient, organized, and direct. ESTJs are practical implementers who value order and work to establish stability."
  },
  "ESTP": {
    code: "ESTP",
    title: "The Entrepreneur",
    description: "Energetic, action-oriented, and perceptive. ESTPs are risk-takers who love excitement and solving immediate problems."
  }
};

/**
 * Get a personality type definition by its code (e.g., "INFJ")
 * @param code The MBTI code to look up
 * @returns The full personality type data or undefined if not found
 */
export function getPersonalityTypeByCode(code: string): MBTIType | undefined {
  if (!code) return undefined;
  return mbtiTypes[code.toUpperCase()];
}
