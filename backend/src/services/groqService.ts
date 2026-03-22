import Groq from 'groq-sdk';
import {
  buildAssessmentPrompt,
  buildMissingAnswersPrompt,
  parseGeneratedPaper,
} from './promptBuilder';
import { AssessmentJobData } from '../config/queue';
import { IGeneratedPaper } from '../models/Assignment';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

function hasMissingAnswers(paper: IGeneratedPaper): boolean {
  return paper.sections.some((section) =>
    section.questions.some((q) => !q.answer || !q.answer.trim())
  );
}

async function fillMissingAnswers(paper: IGeneratedPaper): Promise<IGeneratedPaper> {
  const prompt = buildMissingAnswersPrompt(paper);

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You fill missing answers in educational JSON papers. Keep structure unchanged and respond with valid JSON only.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Empty response while filling missing answers');
  }

  return parseGeneratedPaper(rawContent);
}

export async function generateAssessment(data: AssessmentJobData): Promise<IGeneratedPaper> {
  const prompt = buildAssessmentPrompt(data);

  console.log(`🤖 Generating assessment for: ${data.title}`);

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are an expert educational assessment designer. Always respond with valid JSON only. Never include markdown formatting, explanations, or any text outside the JSON structure.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const rawContent = completion.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Empty response from Groq AI');
  }

  console.log(`✅ Received AI response (${rawContent.length} chars)`);
  let paper = parseGeneratedPaper(rawContent);

  if (hasMissingAnswers(paper)) {
    console.warn('⚠️ Missing answers detected. Running answer-completion pass...');
    paper = await fillMissingAnswers(paper);
  }

  return paper;
}
