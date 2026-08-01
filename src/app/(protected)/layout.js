"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");// change "token" to your actual key name
    if (!token) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return null;

  return <>{children}</>;
}