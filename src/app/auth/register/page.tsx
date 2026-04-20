import type { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account | Raagdhara Music Academy',
  description: 'Register for your Raagdhara Academy student account.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
