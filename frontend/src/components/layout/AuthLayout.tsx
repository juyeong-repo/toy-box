import { type ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-background py-12 px-4">
      <div className="w-full max-w-form space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tighter">
            {title}
          </h1>
          <p className="mt-2 text-sm text-gray-400">{subtitle}</p>
        </div>

        <div className="bg-white rounded-card shadow-auth p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
