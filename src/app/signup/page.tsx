'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signupWithEmailPassword } from '@/utils/supabase/action';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/utils/redux/store';
import { userLogin } from '@/utils/redux/slices/authSlice';
import {toast} from 'sonner' ;

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const dispatch = useDispatch();
  const router = useRouter();
  
  const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn);

  useEffect(() => {
      if (isLoggedIn) {
        router.push('/dashboard');
      }
    }, [isLoggedIn, router]);
    
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    const { error,success,message } = await signupWithEmailPassword(null, formData);

    if (error) {
      setError(error.toString());
      toast.error(error.toString())
      setLoading(false);
    } else {
      dispatch(userLogin({ email, loggedIn: true }));
      toast.success('Login Successfull')
      toast.success('User successfully created')
      if(success){
          toast.info(message)
      }
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 justify-center items-center p-6">
        <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md">
            <h2 className="text-3xl text-blue-700 font-bold text-center mb-3">Log Processing App</h2>
            <p className="text-gray-500 text-center mb-6">Create your account</p>

            {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-sm">
                {error}
            </div>
            )}

            <form onSubmit={handleSignUp} className="space-y-5">
            <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="email">Email</label>
                <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                />
            </div>

            <div>
                <label className="block text-gray-700 font-medium mb-1" htmlFor="password">Password</label>
                <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-gray-800 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
                />
            </div>

            <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out shadow-md disabled:opacity-50"
                disabled={loading}
            >
                {loading ? 'Signing up...' : 'Sign Up'}
            </button>
            </form>

            <div className="mt-6 text-center">
            <p className="text-gray-600">Already have an account?</p>
            <button
                onClick={() => router.push('/login')}
                className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out shadow-md"
            >
                Sign In
            </button>
            </div>
        </div>
    </div>

  );
}

