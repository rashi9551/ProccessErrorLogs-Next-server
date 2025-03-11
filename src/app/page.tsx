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
      setFadeOut(true); // Start fade-out animation
      setTimeout(() => {
        if (isLoggedIn) {
          router.replace("/dashboard"); // Redirect to dashboard
        } else {
          router.replace("/login"); // Redirect to login
        }
        setLoading(false);
      }, 500); // Allow fade-out animation to complete
    }, 1500); // 1.5-second delay before fading out

    return () => clearTimeout(timer); // Cleanup timeout on unmount
  }, [isLoggedIn, router]);

  if (loading) return <div className={`loader-container ${fadeOut ? "fade-out" : ""}`}><Loader /></div>;

  return null;
}
