"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {Auth} from "../../../page";
export default function PortalRootLogin(){const router=useRouter();useEffect(()=>{try{const s=localStorage.getItem("eduforge_session");if(s){const a=JSON.parse(s);router.replace(a.role==="super_admin"?"/":"/student/login");}}catch{}},[router]);return <Auth forcedRole="super_admin" onLogin={a=>{localStorage.setItem("eduforge_session",JSON.stringify(a));router.replace("/");}}/>}
