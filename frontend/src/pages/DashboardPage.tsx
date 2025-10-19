import React from 'react';
import { useApi } from '../hooks/useApi';

interface TodayResponse {
  attendance_pct: number;
  assignments_due: string[];
  birthdays: string[];
}

interface ReportsResponse {
  attendance_summary: { class_id: number; status: string; count: number }[];
  submission_summary: { assignment_id: number; status: string; count: number }[];
  late_submissions: { assignment_id: number; student_id: number; submitted_at: string | null }[];
  birthday_calendar: { name: string; date: string }[];
}

export const DashboardPage: React.FC = () => {
  const today = useApi<TodayResponse>({ url: '/dashboard/today' });
  const reports = useApi<ReportsResponse>({ url: '/dashboard/reports' });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-sm font-medium text-slate-500">Attendance today</h2>
          <p className="mt-2 text-3xl font-semibold text-primary-dark">
            {today.loading ? '…' : `${today.data?.attendance_pct ?? 0}%`}
          </p>
          {today.data?.attendance_pct !== undefined && (
            <p className="mt-1 text-xs text-slate-500">Present students / total for the day</p>
          )}
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-sm font-medium text-slate-500">Assignments due today</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {today.loading && <li>Loading…</li>}
            {!today.loading && today.data?.assignments_due.length === 0 && (
              <li className="text-slate-500">No assignments due</li>
            )}
            {today.data?.assignments_due.map((assignment) => (
              <li key={assignment} className="font-medium text-slate-800">
                {assignment}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-sm font-medium text-slate-500">Birthdays today</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {today.loading && <li>Loading…</li>}
            {!today.loading && today.data?.birthdays.length === 0 && (
              <li className="text-slate-500">No birthdays today</li>
            )}
            {today.data?.birthdays.map((name) => (
              <li key={name} className="font-medium text-slate-800">
                {name}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Attendance summary</h2>
          {reports.loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
          {!reports.loading && (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Class ID</th>
                  <th>Status</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {reports.data?.attendance_summary.map((row, idx) => (
                  <tr key={`${row.class_id}-${idx}`} className="border-t">
                    <td className="py-2">{row.class_id}</td>
                    <td className="capitalize">{row.status.replace('_', ' ')}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming birthdays</h2>
          {reports.loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
          {!reports.loading && (
            <ul className="mt-4 space-y-2 text-sm">
              {reports.data?.birthday_calendar.map((item) => (
                <li key={`${item.name}-${item.date}`} className="flex justify-between">
                  <span className="font-medium text-slate-800">{item.name}</span>
                  <span className="text-slate-500">{item.date}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Late submissions</h2>
        {reports.loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
        {!reports.loading && (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2">Assignment</th>
                <th>Student</th>
                <th>Submitted at</th>
              </tr>
            </thead>
            <tbody>
              {reports.data?.late_submissions.map((submission, idx) => (
                <tr key={`${submission.assignment_id}-${submission.student_id}-${idx}`} className="border-t">
                  <td className="py-2">{submission.assignment_id}</td>
                  <td>{submission.student_id}</td>
                  <td>{submission.submitted_at ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};
