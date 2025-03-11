'use client'; // Ensure it runs on the client side

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import './Loader.css';

// Dynamically import Player to avoid SSR issues
const Player = dynamic(() => import('@lottiefiles/react-lottie-player').then(mod => mod.Player), {
  ssr: false, // Disable server-side rendering for this component
});

const Loader = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Prevent rendering on the server

  return (
    <div className="loader-container">
      <Player
        autoplay
        loop
        src="https://lottie.host/93eec4a5-c104-4a36-ab77-111184367fb5/3mDcjHdLMi.json"
        style={{ height: '100%', width: '100%', background: "transparent" }}
      />
    </div>
  );
};

export default Loader;
