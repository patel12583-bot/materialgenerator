"use client";
import {useRouter} from "next/navigation";
import {Auth} from "../../../page";
export default function PortalRootLogin(){const router=useRouter();return <Auth forcedRole="super_admin" onLogin={a=>{localStorage.setItem("eduforge_session",JSON.stringify(a));router.replace("/");}}/>}
