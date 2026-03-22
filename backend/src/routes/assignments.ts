import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Assignment } from '../models/Assignment';
import { assessmentQueue } from '../config/queue';
import { getCached, setCache, invalidateCache } from '../config/redis';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/assignments - Create new assignment and queue job
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      subject,
      gradeLevel,
      dueDate,
      questionTypes,
      totalQuestions,
      totalMarks,
      difficulty,
      additionalInstructions,
    } = req.body;

    // Validation
    const errors: string[] = [];
    if (!title?.trim()) errors.push('Title is required');
    if (!subject?.trim()) errors.push('Subject is required');
    if (!gradeLevel?.trim()) errors.push('Grade level is required');
    if (!dueDate) errors.push('Due date is required');
    if (!totalQuestions || Number(totalQuestions) <= 0) errors.push('Total questions must be > 0');
    if (!totalMarks || Number(totalMarks) <= 0) errors.push('Total marks must be > 0');

    const types = Array.isArray(questionTypes)
      ? questionTypes
      : typeof questionTypes === 'string'
      ? JSON.parse(questionTypes)
      : [];
    if (!types.length) errors.push('At least one question type is required');

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Parse file if provided
    let fileContent: string | undefined;
    let fileName: string | undefined;
    if (req.file) {
      fileName = req.file.originalname;
      fileContent = req.file.buffer.toString('utf-8').slice(0, 5000);
    }

    // Create assignment in DB
    const assignment = new Assignment({
      title: title.trim(),
      subject: subject.trim(),
      gradeLevel: gradeLevel.trim(),
      dueDate: new Date(dueDate),
      questionTypes: types,
      totalQuestions: Number(totalQuestions),
      totalMarks: Number(totalMarks),
      difficulty: difficulty || 'mixed',
      additionalInstructions: additionalInstructions?.trim() || '',
      fileContent,
      fileName,
      status: 'pending',
    });

    await assignment.save();

    // Add to BullMQ queue
    const job = await assessmentQueue.add(
      'generate-assessment',
      {
        assignmentId: assignment._id.toString(),
        title: assignment.title,
        subject: assignment.subject,
        gradeLevel: assignment.gradeLevel,
        questionTypes: assignment.questionTypes,
        totalQuestions: assignment.totalQuestions,
        totalMarks: assignment.totalMarks,
        difficulty: assignment.difficulty,
        additionalInstructions: assignment.additionalInstructions,
        fileContent: assignment.fileContent,
      },
      { priority: 1 }
    );

    await Assignment.findByIdAndUpdate(assignment._id, { jobId: job.id });

    return res.status(201).json({
      success: true,
      assignmentId: assignment._id.toString(),
      jobId: job.id,
      message: 'Assignment created and queued for generation',
    });
  } catch (err) {
    console.error('Create assignment error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/assignments - List all assignments
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cached = await getCached<unknown[]>('assignments:list');
    if (cached) {
      return res.json({ success: true, assignments: cached, fromCache: true });
    }

    const assignments = await Assignment.find({}, '-generatedPaper -fileContent')
      .sort({ createdAt: -1 })
      .limit(50);

    await setCache('assignments:list', assignments, 60);
    return res.json({ success: true, assignments });
  } catch (err) {
    console.error('List assignments error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/assignments/:id - Get single assignment with generated paper
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cached = await getCached<unknown>(`assignment:${id}`);
    if (cached) {
      return res.json({ success: true, assignment: cached, fromCache: true });
    }

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    if (assignment.status === 'completed') {
      await setCache(`assignment:${id}`, assignment, 3600);
    }

    return res.json({ success: true, assignment });
  } catch (err) {
    console.error('Get assignment error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/assignments/:id/regenerate - Regenerate question paper
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // Reset status
    assignment.status = 'pending';
    assignment.generatedPaper = undefined;
    assignment.errorMessage = undefined;
    await assignment.save();

    // Invalidate cache
    await invalidateCache(`assignment:${id}`);
    await invalidateCache('assignments:list');

    // Re-queue
    const job = await assessmentQueue.add('generate-assessment', {
      assignmentId: id,
      title: assignment.title,
      subject: assignment.subject,
      gradeLevel: assignment.gradeLevel,
      questionTypes: assignment.questionTypes,
      totalQuestions: assignment.totalQuestions,
      totalMarks: assignment.totalMarks,
      difficulty: assignment.difficulty,
      additionalInstructions: assignment.additionalInstructions,
      fileContent: assignment.fileContent,
    });

    return res.json({
      success: true,
      jobId: job.id,
      message: 'Regeneration queued',
    });
  } catch (err) {
    console.error('Regenerate error:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Assignment.findByIdAndDelete(id);
    await invalidateCache(`assignment:${id}`);
    await invalidateCache('assignments:list');
    return res.json({ success: true, message: 'Assignment deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
