import {
  authenticateStandaloneUser,
  routeForStandaloneRole,
  saveStandaloneSession
} from "./standalone-auth.mjs";
import { createOralGraderClient } from "./evaluation/oral-grader-client.mjs";
import { ORAL_GRADER_ENDPOINTS } from "./evaluation/oral-grader-config.mjs";

const form=document.getElementById("standaloneLoginForm");
const username=document.getElementById("standaloneUsername");
const password=document.getElementById("standalonePassword");
const error=document.getElementById("standaloneLoginError");
const submitButton=form?.querySelector('button[type="submit"]');

const onlineClient=createOralGraderClient({endpoints:ORAL_GRADER_ENDPOINTS});

document.querySelectorAll("[data-fill-user]").forEach(button=>{
  button.addEventListener("click",()=>{
    username.value=button.dataset.fillUser;
    password.value="talktalk";
    username.focus();
  });
});

form?.addEventListener("submit",async event=>{
  event.preventDefault();
  const user=authenticateStandaloneUser(username.value,password.value);
  if(!user){
    error.hidden=false;
    error.textContent="Incorrect username or password.";
    password.select();
    return;
  }

  error.hidden=true;
  if(submitButton){
    submitButton.disabled=true;
    submitButton.textContent="Connecting...";
  }

  try{
    const online=await onlineClient.loginPreview(username.value,password.value);
    if(online.role!==user.role){
      throw new Error("Online role does not match this test account.");
    }
    saveStandaloneSession({...user,onlineToken:online.token});
    location.href=routeForStandaloneRole(user.role);
  }catch(err){
    error.hidden=false;
    error.textContent="Online grading service is unavailable. Try again after the Firebase backend is deployed.";
    if(submitButton){
      submitButton.disabled=false;
      submitButton.textContent="Enter Talk Talk →";
    }
  }
});
