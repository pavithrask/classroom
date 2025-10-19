import React from 'react';
import { format } from 'date-fns';
import { apiClient } from '../services/api';

interface EmailJob {
  id: number;
  student_id: number;
  scheduled_for: string;
  status: string;
  subject: string;
  body: string;
  last_error?: string | null;
}

export const BirthdaysPage: React.FC = () => {
  const [jobs, setJobs] = React.useState<EmailJob[]>([]);
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);

  const fetchJobs = React.useCallback(async () => {
    try {
      const response = await apiClient.get<EmailJob[]>('/birthdays/jobs');
      setJobs(response.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTemplate = React.useCallback(async () => {
    try {
      const response = await apiClient.get<{ subject: string; body: string }>('/birthdays/settings/template');
      setSubject(response.data.subject);
      setBody(response.data.body);
    } catch (err) {
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    void fetchJobs();
    void fetchTemplate();
  }, [fetchJobs, fetchTemplate]);

  const saveTemplate = async () => {
    try {
      await Promise.all([
        apiClient.post('/birthdays/settings', { key: 'birthday_subject', value: subject }),
        apiClient.post('/birthdays/settings', { key: 'birthday_body', value: body })
      ]);
      setMessage('Template updated');
    } catch (err) {
      console.error(err);
      setMessage('Unable to update template');
    }
  };

  const runJob = async () => {
    try {
      await apiClient.post('/birthdays/run');
      setMessage('Birthday greetings queued');
      await fetchJobs();
    } catch (err) {
      console.error(err);
      setMessage('Unable to run job');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Birthday automation</h1>
            <p className="text-sm text-slate-500">Customize greetings and trigger the scheduler for upcoming birthdays.</p>
          </div>
          <button
            type="button"
            onClick={runJob}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark"
          >
            Run daily job
          </button>
        </div>
        {message && <p className="mt-3 text-sm text-primary-dark">{message}</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Email subject</label>
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Email body</label>
            <textarea
              rows={6}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">
              Available variables: {'{{student_name}}'}, {'{{class_name}}'}, {'{{teacher_name}}'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={saveTemplate}
          className="mt-4 rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10"
        >
          Save template
        </button>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Delivery log</h2>
          <button
            type="button"
            onClick={() => void fetchJobs()}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:border-primary hover:text-primary"
          >
            Refresh
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2">Student</th>
                <th>Scheduled for</th>
                <th>Status</th>
                <th>Last error</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t">
                  <td className="py-2 font-medium text-slate-800">{job.student_id}</td>
                  <td>{format(new Date(job.scheduled_for), 'yyyy-MM-dd HH:mm')}</td>
                  <td className="capitalize">{job.status}</td>
                  <td className="text-xs text-red-600">{job.last_error ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
