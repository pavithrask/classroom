import React from 'react';
import { useForm } from 'react-hook-form';
import { apiClient, multipartClient } from '../services/api';
import { Classroom, Student } from '../types';

interface StudentFormValues {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  guardian_name: string;
  guardian_contact: string;
  address?: string;
  notes?: string;
  class_id?: number;
}

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [classes, setClasses] = React.useState<Classroom[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [message, setMessage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<StudentFormValues>();

  const fetchStudents = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = {};
      if (search) params.search = search;
      if (activeFilter !== 'all') params.active = activeFilter === 'active';
      const response = await apiClient.get<Student[]>('/students', { params });
      setStudents(response.data);
    } catch (err) {
      console.error(err);
      setError('Unable to load students');
    } finally {
      setLoading(false);
    }
  }, [search, activeFilter]);

  const fetchClasses = React.useCallback(async () => {
    try {
      const response = await apiClient.get<Classroom[]>('/classes');
      setClasses(response.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  React.useEffect(() => {
    void fetchClasses();
  }, [fetchClasses]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setMessage(null);
      const { class_id, ...studentPayload } = values;
      const response = await apiClient.post<Student>('/students', studentPayload);
      if (class_id) {
        await apiClient.post(`/students/${response.data.id}/enroll`, null, { params: { class_id } });
      }
      setMessage('Student saved successfully');
      reset();
      await fetchStudents();
    } catch (err) {
      console.error(err);
      setMessage('Failed to save student');
    }
  });

  const archiveStudent = async (student: Student) => {
    try {
      await apiClient.post(`/students/${student.id}/archive`);
      setMessage(`Archived ${student.first_name} ${student.last_name}`);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      setMessage('Unable to archive student');
    }
  };

  const toggleActive = async (student: Student) => {
    try {
      await apiClient.put(`/students/${student.id}`, { active: !student.active });
      setMessage(`${student.first_name} ${student.last_name} marked as ${student.active ? 'inactive' : 'active'}`);
      await fetchStudents();
    } catch (err) {
      console.error(err);
      setMessage('Unable to update student');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const classId = window.prompt('Enter class ID to enroll imported students (optional):');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await multipartClient.post('/students/import', formData, {
        params: classId ? { class_id: Number(classId) } : undefined
      });
      setMessage('Import completed');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await fetchStudents();
    } catch (err) {
      console.error(err);
      setMessage('Import failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Students</h1>
            <p className="text-sm text-slate-500">Create student profiles, filter lists, and manage enrollment.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Import CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </div>
        {message && <p className="mt-3 text-sm text-primary-dark">{message}</p>}
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">First name</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('first_name', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Last name</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('last_name', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Date of birth</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('date_of_birth', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Guardian name</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('guardian_name', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Guardian contact</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('guardian_contact', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Address</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('address')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('notes')}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Enroll in class (optional)</label>
            <select
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('class_id', { valueAsNumber: true })}
            >
              <option value="">Select a class</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark disabled:opacity-60"
            >
              Add student
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name"
              className="w-56 rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
            />
            <select
              value={activeFilter}
              onChange={(event) => setActiveFilter(event.target.value as typeof activeFilter)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="button"
              onClick={() => void fetchStudents()}
              className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
            >
              Refresh
            </button>
          </div>
          <p className="text-sm text-slate-500">{students.length} students</p>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2">Name</th>
                  <th>DOB</th>
                  <th>Guardian</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t">
                    <td className="py-2 font-medium text-slate-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td>{student.date_of_birth}</td>
                    <td>{student.guardian_name}</td>
                    <td>{student.guardian_contact}</td>
                    <td>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          student.active ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {student.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="space-x-3 text-right">
                      <button onClick={() => toggleActive(student)} className="text-sm text-primary hover:underline">
                        {student.active ? 'Mark inactive' : 'Mark active'}
                      </button>
                      <button onClick={() => archiveStudent(student)} className="text-sm text-slate-600 hover:underline">
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
