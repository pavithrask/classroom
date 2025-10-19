import React from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { apiClient } from '../services/api';
import { Assignment, Classroom, Student, SubmissionStatus } from '../types';

const submissionStatuses: SubmissionStatus[] = ['not_submitted', 'submitted', 'submitted_late', 'exempt'];

interface AssignmentFormValues {
  title: string;
  description?: string;
  due_date: string;
  class_id: number;
  max_score: number;
}

interface SubmissionRow {
  student: Student;
  status: SubmissionStatus;
  score: number | '';
  feedback: string;
}

export const AssignmentsPage: React.FC = () => {
  const [classes, setClasses] = React.useState<Classroom[]>([]);
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = React.useState<Assignment | null>(null);
  const [gradebook, setGradebook] = React.useState<Record<number, SubmissionRow>>({});
  const [classFilter, setClassFilter] = React.useState<number | 'all'>('all');
  const [message, setMessage] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<AssignmentFormValues>({
    defaultValues: {
      due_date: format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      max_score: 100
    }
  });

  const fetchClasses = React.useCallback(async () => {
    try {
      const response = await apiClient.get<Classroom[]>('/classes');
      setClasses(response.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAssignments = React.useCallback(async (classId: number | 'all') => {
    try {
      const response = await apiClient.get<Assignment[]>('/assignments', {
        params: classId === 'all' ? undefined : { class_id: classId }
      });
      setAssignments(response.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadGradebook = React.useCallback(
    async (assignment: Assignment) => {
      try {
        const [studentsResponse, submissionsResponse] = await Promise.all([
          apiClient.get<Student[]>(`/classes/${assignment.class_id}/students`),
          apiClient.get('/assignments/' + assignment.id + '/submissions')
        ]);
        const submissions: Record<number, SubmissionRow> = {};
        const submissionMap = new Map<number, { status: SubmissionStatus; score: number | null; feedback: string | null }>();
        (submissionsResponse.data as any[]).forEach((submission) => {
          submissionMap.set(submission.student_id, {
            status: submission.status as SubmissionStatus,
            score: submission.score,
            feedback: submission.feedback
          });
        });
        (studentsResponse.data as Student[]).forEach((student) => {
          const record = submissionMap.get(student.id);
          submissions[student.id] = {
            student,
            status: record?.status ?? 'not_submitted',
            score: record?.score ?? '',
            feedback: record?.feedback ?? ''
          };
        });
        setGradebook(submissions);
      } catch (err) {
        console.error(err);
        setGradebook({});
      }
    },
    []
  );

  React.useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  React.useEffect(() => {
    void fetchAssignments(classFilter);
  }, [fetchAssignments, classFilter]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setMessage(null);
      await apiClient.post('/assignments', values);
      setMessage('Assignment created');
      reset();
      await fetchAssignments(classFilter);
    } catch (err) {
      console.error(err);
      setMessage('Unable to create assignment');
    }
  });

  const selectAssignment = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    await loadGradebook(assignment);
  };

  const saveGradebook = async () => {
    if (!selectedAssignment) return;
    try {
      await Promise.all(
        Object.values(gradebook).map((entry) =>
          apiClient.post(`/assignments/${selectedAssignment.id}/submissions`, {
            assignment_id: selectedAssignment.id,
            student_id: entry.student.id,
            status: entry.status,
            score: entry.score === '' ? null : entry.score,
            feedback: entry.feedback || null
          })
        )
      );
      setMessage('Gradebook saved');
    } catch (err) {
      console.error(err);
      setMessage('Unable to save gradebook');
    }
  };

  const exportGradebook = async () => {
    if (!selectedAssignment) return;
    try {
      const response = await apiClient.get(`/assignments/${selectedAssignment.id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedAssignment.title}-gradebook.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Assignments</h1>
            <p className="text-sm text-slate-500">Create assignments and manage submissions per class.</p>
          </div>
          <select
            value={classFilter === 'all' ? '' : classFilter}
            onChange={(event) => setClassFilter(event.target.value ? Number(event.target.value) : 'all')}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">All classes</option>
            {classes.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name}
              </option>
            ))}
          </select>
        </div>
        {message && <p className="mt-3 text-sm text-primary-dark">{message}</p>}
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('title', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Class</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('class_id', { required: true, valueAsNumber: true })}
            >
              <option value="">Select class</option>
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Due date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('due_date', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Max score</label>
            <input
              type="number"
              min={0}
              max={100}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('max_score', { required: true, valueAsNumber: true })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('description')}
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark disabled:opacity-60"
            >
              Create assignment
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Assignment list</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <button
              key={assignment.id}
              onClick={() => void selectAssignment(assignment)}
              className={`rounded-xl border px-4 py-4 text-left transition hover:border-primary hover:shadow ${
                selectedAssignment?.id === assignment.id ? 'border-primary bg-primary/5' : 'border-slate-200'
              }`}
            >
              <div className="text-sm font-semibold text-primary-dark">{assignment.title}</div>
              <div className="mt-1 text-xs text-slate-500">Due {assignment.due_date}</div>
              <div className="mt-1 text-xs text-slate-500">Class ID: {assignment.class_id}</div>
            </button>
          ))}
        </div>
      </div>

      {selectedAssignment && (
        <div className="rounded-xl bg-white p-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{selectedAssignment.title} gradebook</h2>
              <p className="text-sm text-slate-500">Inline edit submission status and scores.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveGradebook}
                className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
              >
                Save gradebook
              </button>
              <button
                type="button"
                onClick={exportGradebook}
                className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
              >
                Export CSV
              </button>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Student</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Feedback</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(gradebook).map((entry) => (
                  <tr key={entry.student.id} className="border-t">
                    <td className="py-2 font-medium text-slate-800">
                      {entry.student.first_name} {entry.student.last_name}
                    </td>
                    <td>
                      <select
                        value={entry.status}
                        onChange={(event) =>
                          setGradebook((prev) => ({
                            ...prev,
                            [entry.student.id]: {
                              ...prev[entry.student.id],
                              status: event.target.value as SubmissionStatus
                            }
                          }))
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 capitalize focus:border-primary focus:outline-none"
                      >
                        {submissionStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={selectedAssignment.max_score}
                        value={entry.score}
                        onChange={(event) =>
                          setGradebook((prev) => ({
                            ...prev,
                            [entry.student.id]: {
                              ...prev[entry.student.id],
                              score: event.target.value === '' ? '' : Number(event.target.value)
                            }
                          }))
                        }
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none"
                      />
                    </td>
                    <td>
                      <input
                        value={entry.feedback}
                        onChange={(event) =>
                          setGradebook((prev) => ({
                            ...prev,
                            [entry.student.id]: {
                              ...prev[entry.student.id],
                              feedback: event.target.value
                            }
                          }))
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none"
                        placeholder="Feedback"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
