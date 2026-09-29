const SESSION_KEY="talkTalkStandaloneSession";

const USERS=Object.freeze({
  student:Object.freeze({username:"student",password:"talktalk",role:"student"}),
  teacher:Object.freeze({username:"teacher",password:"talktalk",role:"teacher"})
});

export function authenticateStandaloneUser(username,password){
  const key=String(username||"").trim().toLowerCase();
  const candidate=USERS[key];
  if(!candidate || String(password||"")!==candidate.password) return null;
  return Object.freeze({role:candidate.role,username:candidate.username});
}

export function routeForStandaloneRole(role){
  if(role==="student") return "./index.html";
  if(role==="teacher") return "./teacher.html";
  return "./login.html";
}

export function saveStandaloneSession(user,storage=globalThis.sessionStorage){
  if(!user?.role || !user?.username || !storage?.setItem) return null;
  const session={
    role:String(user.role),
    username:String(user.username),
    onlineToken:String(user.onlineToken||"")
  };
  storage.setItem(SESSION_KEY,JSON.stringify(session));
  return session;
}

export function loadStandaloneSession(storage=globalThis.sessionStorage){
  if(!storage?.getItem) return null;
  try{
    const session=JSON.parse(storage.getItem(SESSION_KEY)||"null");
    if(!session || !["student","teacher"].includes(session.role)) return null;
    return {
      role:String(session.role),
      username:String(session.username||""),
      onlineToken:String(session.onlineToken||"")
    };
  }catch{
    return null;
  }
}

export function clearStandaloneSession(storage=globalThis.sessionStorage){
  storage?.removeItem?.(SESSION_KEY);
}

export function requireStandaloneRole(role,{
  storage=globalThis.sessionStorage,
  locationObj=globalThis.location
}={}){
  const session=loadStandaloneSession(storage);
  if(session?.role===role) return session;
  if(locationObj?.replace) locationObj.replace("./login.html");
  return null;
}
