'use client';

import { useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signinWithEmailPassword, signinWithGithub } from '@/action';
import { useSelector } from 'react-redux';
import { RootState } from '@/utils/redux/store';
import {toast} from 'sonner' ;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const router = useRouter();

  const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn);

  useLayoutEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, router]);

  const handleSignIn = async (e:React.FormEvent<HTMLFormElement>)  => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const { error } = await signinWithEmailPassword(null, formData);

    if (error) {
        setError(error); 
        toast.error(error)
        setLoading(false);
    } else {
        toast.success('Login Successfull')
        router.push('/dashboard');
        router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 justify-center items-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
            <h2 className="text-3xl text-blue-700 font-extrabold text-center mb-3">Log Processing App</h2>
            <p className="text-gray-500 text-center mb-6">Sign in to your account</p>

            {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-center">
                {error}
            </div>
            )}

            <form onSubmit={handleSignIn}>
            <div className="mb-5">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                Email
                </label>
                <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-gray-800 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                required
                />
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2" htmlFor="password">
                Password
                </label>
                <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-gray-800 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                required
                />
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition duration-300 ease-in-out"
                disabled={loading}
            >
                {loading ? 'Signing in...' : 'Sign In'}
            </button>
            </form>

            {/* OR Divider */}
            <div className="mt-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* GitHub Login */}
            <div className="mt-6">
            <button
                onClick={signinWithGithub}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-300 ease-in-out"
            >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V19c0 .27.16.59.67.5C17.14 18.16 20 14.42 20 10A10 10 0 0010 0z" clipRule="evenodd" />
                </svg>
                Sign in with GitHub
            </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
            <p className="text-gray-600">Don't have an account?</p>
            <button
                onClick={() => router.push('/signup')}
                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-lg transition duration-300 ease-in-out"
            >
                Sign Up
            </button>
            </div>
        </div>
    </div>

  );
}