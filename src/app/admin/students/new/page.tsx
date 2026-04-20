import NewStudentClient from './NewStudentClient';

export default function NewStudentPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <a href="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to students
        </a>
        <h1 className="font-headline text-2xl font-semibold text-foreground">Add student</h1>
        <p className="font-body text-sm text-muted-foreground mt-1">Create a student account directly. They can set their password via the login page.</p>
      </div>
      <NewStudentClient />
    </div>
  );
}
