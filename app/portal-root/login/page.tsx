"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {Auth} from "../../page";
export default function PortalRootLogin(){const router=useRouter();useEffect(()=>{try{const s=localStorage.getItem("eduforge_session");if(s){const a=JSON.parse(s);if(a.role==="super_admin")router.replace("/");else localStorage.removeItem("eduforge_session");}}catch{localStorage.removeItem("eduforge_session")}},[router]);return <Auth forcedRole="super_admin" onLogin={a=>{localStorage.setItem("eduforge_session",JSON.stringify(a));router.replace("/");}}/>}