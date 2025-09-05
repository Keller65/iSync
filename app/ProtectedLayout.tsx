import { Redirect } from 'expo-router';
import { useAuth } from '../context/auth';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Redirect href="/login" />;
  return <>{children}</>;
}
