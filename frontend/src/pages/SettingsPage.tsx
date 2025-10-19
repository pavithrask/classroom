import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-slate-900">Settings & deployment checklist</h1>
        <p className="mt-2 text-sm text-slate-500">
          Configure environment variables and infrastructure tasks for the classroom management stack.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Environment</h2>
            <ul className="mt-2 space-y-2 text-sm">
              <li><span className="font-medium text-slate-800">DATABASE_URL</span> — PostgreSQL connection string.</li>
              <li><span className="font-medium text-slate-800">SMTP_HOST/PORT/USER/PASSWORD</span> — credentials for transactional email.</li>
              <li><span className="font-medium text-slate-800">TIMEZONE</span> — defaults to Asia/Colombo for scheduling jobs.</li>
              <li><span className="font-medium text-slate-800">FILE_STORAGE_URL</span> — optional S3-compatible bucket for uploads.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Operational checklist</h2>
            <ul className="mt-2 space-y-2 text-sm">
              <li>✅ Run database migrations before first start.</li>
              <li>✅ Create the initial teacher account (seeded automatically in development).</li>
              <li>✅ Configure a daily backup cron with 7-day retention.</li>
              <li>✅ Expose `/healthz` and `/readyz` for uptime monitoring.</li>
            </ul>
          </section>
        </div>
      </div>
      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">API documentation</h2>
        <p className="mt-2 text-sm text-slate-500">
          The REST API is available under <code className="rounded bg-slate-100 px-2 py-1">/api/v1</code> with an interactive Swagger UI
          at <code className="rounded bg-slate-100 px-2 py-1">/docs</code>. Use JWT bearer tokens issued via the <code className="rounded bg-slate-100 px-2 py-1">/auth/token</code>
          endpoint to authorize requests from the web client.
        </p>
      </div>
    </div>
  );
};
