import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-navy">Settings</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Signed in as</p>
        <p className="mt-1 font-medium text-slate-800">{user?.name}</p>
        <p className="text-sm text-slate-500">{user?.email}</p>
        <p className="mt-2 text-xs uppercase tracking-wide text-teal">{user?.role}</p>
      </div>
    </div>
  );
}