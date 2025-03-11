'use client';
import { userLogin, userLogout } from "@/utils/redux/slices/authSlice";
import { RootState } from "@/utils/redux/store";
import { signOut } from "@/utils/supabase/action";
import createClientForBrowser from "@/utils/supabase/client";
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {toast} from 'sonner' ;

export default function Dashboard() {
    
    const dispatch = useDispatch();
    const router = useRouter();

    const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn);
    
    useEffect(() => {
      const checkUserSession = async () => {
        const supabase = createClientForBrowser();
        const { data: user, error } = await supabase.auth.getUser();
  
        if (user?.user?.email) {
          dispatch(userLogin({ email: user.user.email, loggedIn: true }));
        }
        else if(isLoggedIn){
          router.push('/dashboard')
        }
         else {
          console.log(error);
          toast.error("Session expired, please login again");
          router.replace("/login"); // Redirect if not authenticated
        }
      };
      checkUserSession();
    }, [dispatch, router]);


    const handleLogout = async () => {
        await signOut()
        dispatch(userLogout());
        toast.success('Log out successfully')
        router.push("/login"); // Redirect to login page
    };
    
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to the Dashboard</h1>
          <p className="text-gray-700">This is a sample dashboard.</p>
  
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-blue-500 text-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold">Users</h2>
              <p>100</p>
            </div>
            <div className="bg-green-500 text-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold">Sales</h2>
              <p>$5,000</p>
            </div>
          </div>
  
          <button        
             onClick={handleLogout}
             className="mt-6 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
           >
            Logout
          </button>
        </div>
      </div>
    );
  }
  