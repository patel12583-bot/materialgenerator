import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "noble_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET || "noble-attendance-development-secret-change-me");

export type Session = { userId:string; role:string; institutionId:string; departmentId?:string|null };

export async function createSession(session:Session){
  const token=await new SignJWT(session).setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("8h").sign(secret());
  const jar=await cookies();
  jar.set(COOKIE_NAME,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*8});
}

export async function getSession():Promise<Session|null>{
  try{
    const token=(await cookies()).get(COOKIE_NAME)?.value;
    if(!token)return null;
    const {payload}=await jwtVerify(token,secret());
    if(typeof payload.userId!=="string"||typeof payload.role!=="string"||typeof payload.institutionId!=="string")return null;
    return {userId:payload.userId,role:payload.role,institutionId:payload.institutionId,departmentId:typeof payload.departmentId==="string"?payload.departmentId:null};
  }catch{return null}
}

export async function clearSession(){
  const jar=await cookies();
  jar.set(COOKIE_NAME,"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});
}
