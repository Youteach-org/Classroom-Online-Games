import {
  authenticateStandaloneUser,
  routeForStandaloneRole,
  saveStandaloneSession
} from "./standalone-auth.mjs";

const form=document.getElementById("standaloneLoginForm");
const username=document.getElementById("standaloneUsername");
const password=document.getElementById("standalonePassword");
const error=document.getElementById("standaloneLoginError");

document.querySelectorAll("[data-fill-user]").forEach(button=>{
  button.addEventListener("click",()=>{
    username.value=button.dataset.fillUser;
    password.value="talktalk";
    username.focus();
  });
});

form?.addEventListener("submit",event=>{
  event.preventDefault();
  const user=authenticateStandaloneUser(username.value,password.value);
  if(!user){
    error.hidden=false;
    password.select();
    return;
  }
  error.hidden=true;
  saveStandaloneSession(user);
  location.href=routeForStandaloneRole(user.role);
});
