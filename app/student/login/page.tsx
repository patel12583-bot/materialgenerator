"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {Auth} from "../../../page";
export default function StudentLogin(){const router=useRouter();useEffect(()=>{try{const s=localStorage.getItem("eduforge_session");if(s){const a=JSON.parse(s);if(a.role==="student")router.replace("/");}}catch{}},[router]);return <Auth forcedRole="student" onLogin={a=>{localStorage.setItem("eduforge_session",JSON.stringify(a));router.replace("/");}}/>}
