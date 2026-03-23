import { AssignmentFormData, Assignment, GeneratedPaper } from '../store/assignmentStore';

// Backend URL - hardcoded for production, can be overridden via NEXT_PUBLIC_API_URL env var
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://terrific-commitment-production-ac89.up.railway.app';

export interface CreateAssignmentResponse {
  success: boolean;
  assignmentId: string;
  jobId: string;
  message: string;
}

export interface ApiError {
  success: false;
  error?: string;
  errors?: string[];
}

export async function createAssignment(
  data: AssignmentFormData
): Promise<CreateAssignmentResponse> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('subject', data.subject);
  formData.append('gradeLevel', data.gradeLevel);
  formData.append('dueDate', data.dueDate);
  formData.append('questionTypes', JSON.stringify(data.questionTypes));
  formData.append('totalQuestions', String(data.totalQuestions));
  formData.append('totalMarks', String(data.totalMarks));
  formData.append('difficulty', data.difficulty);
  formData.append('additionalInstructions', data.additionalInstructions || '');

  if (data.file) {
    formData.append('file', data.file);
  }

  const res = await fetch(`${API_URL}/api/assignments`, {
    method: 'POST',
    body: formData,
  });

  const json = await res.json();
  if (!res.ok) {
    const msg =
      json.errors?.join(', ') || json.error || 'Failed to create assignment';
    throw new Error(msg);
  }

  return json;
}

export async function getAssignment(id: string): Promise<Assignment> {
  const res = await fetch(`${API_URL}/api/assignments/${id}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Assignment not found');
  return json.assignment;
}

export async function listAssignments(): Promise<Assignment[]> {
  const res = await fetch(`${API_URL}/api/assignments`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to fetch assignments');
  return json.assignments;
}

export async function regenerateAssignment(id: string): Promise<{ jobId: string }> {
  const res = await fetch(`${API_URL}/api/assignments/${id}/regenerate`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to regenerate');
  return json;
}

export async function deleteAssignment(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/assignments/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete assignment');
}
