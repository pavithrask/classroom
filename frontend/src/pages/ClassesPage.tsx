import React from 'react';
import { useForm } from 'react-hook-form';
import { apiClient } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Classroom } from '../types';

interface ClassroomFormValues {
  name: string;
  grade: string;
  section: string;
  academic_year: string;
  homeroom_teacher?: string;
}

export const ClassesPage: React.FC = () => {
  const { data, loading, error, refetch } = useApi<Classroom[]>({ url: '/classes' });
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<ClassroomFormValues>();
  const [selected, setSelected] = React.useState<Classroom | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setMessage(null);
      if (selected) {
        await apiClient.put(`/classes/${selected.id}`, values);
        setMessage('Class updated successfully');
      } else {
        await apiClient.post('/classes', values);
        setMessage('Class created successfully');
      }
      reset();
      setSelected(null);
      await refetch();
    } catch (err) {
      console.error(err);
      setMessage('Unable to save class');
    }
  });

  const onEdit = (classroom: Classroom) => {
    setSelected(classroom);
    reset({
      name: classroom.name,
      grade: classroom.grade,
      section: classroom.section,
      academic_year: classroom.academic_year,
      homeroom_teacher: classroom.homeroom_teacher ?? ''
    });
  };

  const onDelete = async (classroom: Classroom) => {
    if (!window.confirm(`Delete ${classroom.name}?`)) return;
    try {
      await apiClient.delete(`/classes/${classroom.id}`);
      setMessage('Class deleted');
      await refetch();
    } catch (err) {
      console.error(err);
      setMessage('Unable to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Classes</h1>
          {message && <p className="text-sm text-primary-dark">{message}</p>}
        </div>
        <p className="mt-1 text-sm text-slate-500">Manage grade levels, sections, and homeroom teachers.</p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('name', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Grade</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('grade', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Section</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('section', { required: true })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Academic year</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('academic_year', { required: true })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Homeroom teacher</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
              {...register('homeroom_teacher')}
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-dark disabled:opacity-60"
            >
              {selected ? 'Update class' : 'Add class'}
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  reset();
                }}
                className="text-sm font-medium text-slate-600 hover:text-primary"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">Class list</h2>
        {loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2">Name</th>
                <th>Grade</th>
                <th>Section</th>
                <th>Year</th>
                <th>Homeroom</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((classroom) => (
                <tr key={classroom.id} className="border-t">
                  <td className="py-2 font-medium text-slate-800">{classroom.name}</td>
                  <td>{classroom.grade}</td>
                  <td>{classroom.section}</td>
                  <td>{classroom.academic_year}</td>
                  <td>{classroom.homeroom_teacher ?? '—'}</td>
                  <td className="space-x-3 text-right">
                    <button onClick={() => onEdit(classroom)} className="text-sm text-primary hover:underline">
                      Edit
                    </button>
                    <button onClick={() => onDelete(classroom)} className="text-sm text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
