import React from 'react';
import { format } from 'date-fns';
import { apiClient } from '../services/api';
import { AttendanceStatus, Classroom, Student } from '../types';

const statusOptions: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

interface AttendanceTrend {
  date: string;
  status: string;
}

export const AttendancePage: React.FC = () => {
  const [classes, setClasses] = React.useState<Classroom[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = React.useState<number | ''>('');
  const [selectedDate, setSelectedDate] = React.useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [statuses, setStatuses] = React.useState<Record<number, AttendanceStatus>>({});
  const [notes, setNotes] = React.useState<Record<number, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [trend, setTrend] = React.useState<{ present_pct: number; trend: AttendanceTrend[] } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchClasses = React.useCallback(async () => {
    try {
      const response = await apiClient.get<Classroom[]>('/classes');
      setClasses(response.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchStudents = React.useCallback(async (classId: number) => {
    try {
      setLoading(true);
      const response = await apiClient.get<Student[]>(`/classes/${classId}/students`);
      setStudents(response.data);
      const initialStatuses: Record<number, AttendanceStatus> = {};
      response.data.forEach((student) => {
        initialStatuses[student.id] = 'present';
      });
      setStatuses(initialStatuses);
      setNotes({});
    } catch (err) {
      console.error(err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrend = React.useCallback(async (classId: number) => {
    try {
      const response = await apiClient.get<{ present_pct: number; trend: AttendanceTrend[] }>('/attendance/stats', {
        params: { class_id: classId }
      });
      setTrend(response.data);
    } catch (err) {
      console.error(err);
      setTrend(null);
    }
  }, []);

  React.useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  React.useEffect(() => {
    if (typeof selectedClass === 'number') {
      void fetchStudents(selectedClass);
      void fetchTrend(selectedClass);
    } else {
      setStudents([]);
      setTrend(null);
    }
  }, [selectedClass, fetchStudents, fetchTrend]);

  const setAllStatuses = (status: AttendanceStatus) => {
    const updated: Record<number, AttendanceStatus> = {};
    students.forEach((student) => {
      updated[student.id] = status;
    });
    setStatuses(updated);
  };

  const saveAttendance = async () => {
    if (typeof selectedClass !== 'number') return;
    try {
      const payload = students.map((student) => ({
        class_id: selectedClass,
        student_id: student.id,
        date: selectedDate,
        status: statuses[student.id] ?? 'present',
        note: notes[student.id] || undefined
      }));
      await apiClient.post('/attendance/bulk', payload);
      setMessage('Attendance saved');
      await fetchTrend(selectedClass);
    } catch (err) {
      console.error(err);
      setMessage('Unable to save attendance');
    }
  };

  const exportAttendance = async () => {
    if (typeof selectedClass !== 'number') return;
    try {
      const response = await apiClient.get('/attendance/export', {
        params: {
          class_id: selectedClass,
          start_date: selectedDate,
          end_date: selectedDate
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-${selectedDate}.csv`);
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Attendance</h1>
            <p className="text-sm text-slate-500">Mark daily attendance quickly with keyboard-friendly controls.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAllStatuses('present')}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:border-primary hover:text-primary"
            >
              Mark all present
            </button>
            <button
              type="button"
              onClick={() => setAllStatuses('absent')}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:border-primary hover:text-primary"
            >
              Mark all absent
            </button>
          </div>
        </div>
        {message && <p className="mt-3 text-sm text-primary-dark">{message}</p>}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Class</label>
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value ? Number(event.target.value) : '')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
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
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={saveAttendance}
              disabled={typeof selectedClass !== 'number'}
              className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark disabled:opacity-60"
            >
              Save attendance
            </button>
            <button
              type="button"
              onClick={exportAttendance}
              disabled={typeof selectedClass !== 'number'}
              className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          {typeof selectedClass !== 'number' ? (
            <p className="text-sm text-slate-500">Select a class to begin marking attendance.</p>
          ) : loading ? (
            <p className="text-sm text-slate-500">Loading students…</p>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Student</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t">
                    <td className="py-2 font-medium text-slate-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td>
                      <select
                        value={statuses[student.id] ?? 'present'}
                        onChange={(event) =>
                          setStatuses((prev) => ({ ...prev, [student.id]: event.target.value as AttendanceStatus }))
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={notes[student.id] ?? ''}
                        onChange={(event) =>
                          setNotes((prev) => ({ ...prev, [student.id]: event.target.value }))
                        }
                        className="w-full rounded-md border border-slate-300 px-2 py-1 focus:border-primary focus:outline-none"
                        placeholder="Optional note"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {trend && (
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-slate-900">{`Last ${trend.trend.length} attendance records`}</h2>
          <p className="mt-1 text-sm text-slate-500">Present percentage: {trend.present_pct}%</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {trend.trend.map((item) => (
              <span
                key={item.date}
                className={`rounded-full px-3 py-1 capitalize ${
                  item.status === 'present'
                    ? 'bg-green-100 text-green-700'
                    : item.status === 'late'
                      ? 'bg-amber-100 text-amber-700'
                      : item.status === 'excused'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-red-100 text-red-700'
                }`}
              >
                {item.date}: {item.status.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
