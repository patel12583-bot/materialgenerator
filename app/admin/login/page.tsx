"use client";
import {useRouter} from "next/navigation";
import {Auth} from "../../../page";
export default function AdminLogin(){const router=useRouter();return <Auth forcedRole="admin" onLogin={a=>{localStorage.setItem("eduforge_session",JSON.stringify(a));router.replace("/");}}/>}
