'use client'; // Ensure this runs on the client-side

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/utils/redux/store";
import Loader from "@/components/shimmer/Loader"; // Import your Loader component

export default function Home() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.loggedIn);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true); 
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace("/dashboard"); 
        } else {
          router.replace("/login");
        }
        setLoading(false);
      }, 500);
    }, 1500); 

    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, [isLoggedIn, router]);

  if (loading) return <div className={`loader-container ${fadeOut ? "fade-out" : ""}`}><Loader /></div>;

  return null;
}
