import { AssessmentJobData } from '../config/queueShared';
import { IGeneratedPaper } from '../models/Assignment';

export function buildAssessmentPrompt(data: AssessmentJobData): string {
  const questionTypeMap: Record<string, string> = {
    mcq: 'Multiple Choice Questions (MCQ) with 4 options each',
    short_answer: 'Short Answer Questions (2-3 sentences)',
    long_answer: 'Long Answer / Essay Questions',
    true_false: 'True or False Questions',
    fill_blank: 'Fill in the Blank Questions',
  };

  const selectedTypes = data.questionTypes
    .map((t) => questionTypeMap[t] || t)
    .join(', ');

  const difficultyDist =
    data.difficulty === 'mixed'
      ? '40% easy, 40% medium, 20% hard'
      : `100% ${data.difficulty}`;

  const contextSection = data.fileContent
    ? `\nCONTEXT/TOPIC MATERIAL:\n"""\n${data.fileContent.slice(0, 3000)}\n"""\nBase questions on the above material.\n`
    : '';

  return `You are an expert educational assessment designer. Create a comprehensive question paper.

ASSIGNMENT DETAILS:
- Subject: ${data.subject}
- Grade/Level: ${data.gradeLevel}
- Total Questions: ${data.totalQuestions}
- Total Marks: ${data.totalMarks}
- Question Types: ${selectedTypes}
- Difficulty Distribution: ${difficultyDist}
- Additional Instructions: ${data.additionalInstructions || 'None'}
${contextSection}

INSTRUCTIONS:
1. Distribute questions into logical sections (Section A, B, C etc.) based on question types
2. Each section should have a clear instruction line
3. Assign marks proportionally (harder questions = more marks)
4. Ensure questions are clear, unambiguous, and age-appropriate for ${data.gradeLevel}
5. For MCQs, provide exactly 4 options (A, B, C, D)
6. Total marks across ALL sections must equal EXACTLY ${data.totalMarks}
7. Total questions across ALL sections must equal EXACTLY ${data.totalQuestions}
8. EVERY question MUST include a non-empty "answer" field
9. Answer format rules by type:
  - mcq: provide the correct option text (and optionally option letter)
  - true_false: answer must be exactly "True" or "False"
  - fill_blank: provide the exact word/phrase for the blank
  - short_answer: provide a concise model answer (2-4 lines)
  - long_answer: provide a structured model answer (key points or paragraph)

Return ONLY valid JSON in this EXACT structure (no markdown, no explanation):
{
  "title": "${data.title}",
  "subject": "${data.subject}",
  "duration": "estimated exam duration like '2 Hours'",
  "totalMarks": ${data.totalMarks},
  "instructions": ["General instruction 1", "General instruction 2", "General instruction 3"],
  "sections": [
    {
      "id": "section-a",
      "title": "Section A",
      "instruction": "Attempt all questions. Each question carries N marks.",
      "totalMarks": 20,
      "questions": [
        {
          "id": "q1",
          "text": "Question text here",
          "type": "mcq",
          "difficulty": "easy",
          "marks": 2,
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answer": "Option A"
        },
        {
          "id": "q2",
          "text": "What is photosynthesis?",
          "type": "short_answer",
          "difficulty": "easy",
          "marks": 2,
          "answer": "Photosynthesis is the process by which green plants make food using sunlight, carbon dioxide, and water, producing oxygen as a by-product."
        }
      ]
    }
  ]
}`;
}

export function buildMissingAnswersPrompt(paper: IGeneratedPaper): string {
  return `You are an expert teacher. Fill missing answers in the given question paper JSON.

RULES:
1. Return ONLY valid JSON with the same structure.
2. Do not remove any sections/questions.
3. Keep existing answers unchanged.
4. For every question where "answer" is missing or empty, generate a correct concise model answer.
5. For true_false, answer must be exactly "True" or "False".
6. For fill_blank, answer must be only the missing word/phrase.
7. For mcq, answer should match one of the option texts.

INPUT JSON:
${JSON.stringify(paper)}`;
}

export function parseGeneratedPaper(rawResponse: string): IGeneratedPaper {
  // Strip markdown code fences if present
  let cleaned = rawResponse.trim();
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  let parsed: IGeneratedPaper;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }
    parsed = JSON.parse(jsonMatch[0]);
  }

  // Validate required fields
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid paper structure: missing sections');
  }

  // Sanitize and normalize
  parsed.sections = parsed.sections.map((section, sIdx) => ({
    id: section.id || `section-${String.fromCharCode(97 + sIdx)}`,
    title: section.title || `Section ${String.fromCharCode(65 + sIdx)}`,
    instruction: section.instruction || 'Attempt all questions.',
    totalMarks: section.totalMarks || 0,
    questions: (section.questions || []).map((q, qIdx) => ({
      id: q.id || `q${sIdx + 1}-${qIdx + 1}`,
      text: q.text || 'Question text unavailable',
      type: q.type || 'short_answer',
      difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
      marks: q.marks || 1,
      options: q.options,
      answer: typeof q.answer === 'string' ? q.answer.trim() : '',
    })),
  }));

  return parsed;
}
