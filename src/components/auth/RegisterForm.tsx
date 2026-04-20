'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import type { StudentCategory } from '@/lib/firebase/types';

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA/Canada (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+60', label: 'Malaysia (+60)' },
];

const COURSES = [
  { id: 'hindustani-classical-vocal', label: 'Hindustani Classical Vocal Music' },
  { id: 'popular-film-music-hindi', label: 'Popular and Film Music - Hindi' },
  { id: 'devotional-hindi', label: 'Devotional - Hindi' },
  { id: 'ghazal', label: 'Ghazal' },
  { id: 'bhatkhande-full-course', label: 'Bhatkhande Sangeet Vidyapeeth - Full Course' },
];

const BATCH_TYPES = [
  { id: 'normal', label: 'Normal Batch' },
  { id: 'special', label: 'Special Batch' },
  { id: 'personal', label: 'Personal Classes' },
];

function getFirebaseAuthError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'permission-denied':
      return 'Registration is temporarily unavailable. Please contact support.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

interface FormFields {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  countryCode: string;
  category: StudentCategory;
  courseId: string;
  batchType: string;
}

type FormErrors = Partial<Record<keyof FormFields, string>>;

export default function RegisterForm() {
  const router = useRouter();

  const [isHydrated, setIsHydrated] = useState(false);
  const [fields, setFields] = useState<FormFields>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: '+91',
    category: 'india',
    courseId: '',
    batchType: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
        <div className="h-12 bg-muted rounded" />
      </div>
    );
  }

  const setField = (key: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!fields.displayName.trim()) newErrors.displayName = 'Full name is required.';
    if (!fields.email) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!fields.password) {
      newErrors.password = 'Password is required.';
    } else if (fields.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (!fields.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (fields.password !== fields.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!fields.phone.trim()) newErrors.phone = 'Phone number is required.';
    if (!fields.courseId) newErrors.courseId = 'Please select a course.';
    if (!fields.batchType) newErrors.batchType = 'Please select a batch type.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // 1. Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, fields.email, fields.password);
      const { uid } = credential.user;
      const idToken = await credential.user.getIdToken();

      // 2. Write Firestore documents
      await setDoc(doc(db, 'users', uid), {
        email: fields.email,
        role: 'student',
        studentId: uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, 'students', uid), {
        uid,
        email: fields.email,
        displayName: fields.displayName.trim(),
        phone: fields.phone.trim(),
        countryCode: fields.countryCode,
        category: fields.category,
        nriCurrencyPreference: fields.category === 'nri' ? 'usd' : 'inr-equivalent',
        courseId: fields.courseId,
        batchType: fields.batchType,
        status: 'pending',
        enrollmentDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 3. Exchange ID token for session cookie
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      });
      if (!sessionRes.ok) {
        throw new Error('session');
      }

      router.push('/student');
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? '';
      if ((error as Error).message === 'session') {
        setSubmitError('Account created but session failed. Please try signing in.');
      } else {
        setSubmitError(getFirebaseAuthError(code));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormFields) =>
    `w-full px-4 py-3 rounded-md border ${
      errors[field] ? 'border-error' : 'border-border'
    } bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`;

  return (
    <div>
      <h1 className="font-headline text-2xl font-semibold text-foreground mb-1">Create your account</h1>
      <p className="font-body text-sm text-muted-foreground mb-6">
        Your account will be reviewed and activated by the instructor.
      </p>

      {submitError && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-md text-sm mb-4">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-1">Full name</label>
          <input
            id="displayName"
            type="text"
            value={fields.displayName}
            onChange={(e) => setField('displayName', e.target.value)}
            autoComplete="name"
            className={inputClass('displayName')}
            placeholder="Arjun Sharma"
          />
          {errors.displayName && <p className="mt-1 text-sm text-error">{errors.displayName}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email address</label>
          <input
            id="email"
            type="email"
            value={fields.email}
            onChange={(e) => setField('email', e.target.value)}
            autoComplete="email"
            className={inputClass('email')}
            placeholder="you@example.com"
          />
          {errors.email && <p className="mt-1 text-sm text-error">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Phone number</label>
          <div className="flex gap-2">
            <select
              value={fields.countryCode}
              onChange={(e) => setField('countryCode', e.target.value)}
              className="w-36 px-2 py-3 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative text-sm"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              id="phone"
              type="tel"
              value={fields.phone}
              onChange={(e) => setField('phone', e.target.value)}
              autoComplete="tel"
              className={`flex-1 px-4 py-3 rounded-md border ${errors.phone ? 'border-error' : 'border-border'} bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
              placeholder="98765 43210"
            />
          </div>
          {errors.phone && <p className="mt-1 text-sm text-error">{errors.phone}</p>}
        </div>

        {/* Category */}
        <div>
          <p className="block text-sm font-medium text-foreground mb-2">I am based in</p>
          <div className="flex gap-4">
            {(['india', 'nri'] as StudentCategory[]).map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={fields.category === cat}
                  onChange={() => setField('category', cat)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground capitalize">
                  {cat === 'india' ? 'India' : 'Outside India (NRI)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Course */}
        <div>
          <label htmlFor="courseId" className="block text-sm font-medium text-foreground mb-1">Course</label>
          <select
            id="courseId"
            value={fields.courseId}
            onChange={(e) => setField('courseId', e.target.value)}
            className={inputClass('courseId')}
          >
            <option value="">Select a course…</option>
            {COURSES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          {errors.courseId && <p className="mt-1 text-sm text-error">{errors.courseId}</p>}
        </div>

        {/* Batch Type */}
        <div>
          <label htmlFor="batchType" className="block text-sm font-medium text-foreground mb-1">Batch type</label>
          <select
            id="batchType"
            value={fields.batchType}
            onChange={(e) => setField('batchType', e.target.value)}
            className={inputClass('batchType')}
          >
            <option value="">Select a batch type…</option>
            {BATCH_TYPES.map((b) => (
              <option key={b.id} value={b.id}>{b.label}</option>
            ))}
          </select>
          {errors.batchType && <p className="mt-1 text-sm text-error">{errors.batchType}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={fields.password}
              onChange={(e) => setField('password', e.target.value)}
              autoComplete="new-password"
              className={`w-full px-4 py-3 pr-12 rounded-md border ${errors.password ? 'border-error' : 'border-border'} bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
              placeholder="Min. 6 characters"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-error">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1">Confirm password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={fields.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              autoComplete="new-password"
              className={`w-full px-4 py-3 pr-12 rounded-md border ${errors.confirmPassword ? 'border-error' : 'border-border'} bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative`}
              placeholder="Repeat your password"
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {errors.confirmPassword && <p className="mt-1 text-sm text-error">{errors.confirmPassword}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-primary text-primary-foreground font-body font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition-contemplative disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating account…
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
