"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { currentUser } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace(currentUser() ? "/dashboard" : "/login");
  }, [router]);
  return null;
}
