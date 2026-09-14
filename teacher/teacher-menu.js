import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCpKL-4eHrqFiUntViiUB2BPs60XumC1K4",
  authDomain: "youteach-d9a79.firebaseapp.com",
  databaseURL: "https://youteach-d9a79-default-rtdb.firebaseio.com",
  projectId: "youteach-d9a79",
  storageBucket: "youteach-d9a79.firebasestorage.app",
  messagingSenderId: "302548732789",
  appId: "1:302548732789:web:b230b7f74366488d45a13c"
};

const db = getDatabase(initializeApp(firebaseConfig));
const hundredCard = document.getElementById("hundredStudentsSaidCard");
const gateMessage = document.getElementById("gameGateMessage");

function getTeamLabels(session) {
  const labelsFromAssignments = Object.values(session?.assignments || {}).filter(Boolean);
  const labels = Array.from(new Set(labelsFromAssignments));
  if (labels.length) {
    return labels.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  }
  return Object.keys(session?.activityScores || {}).sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { numeric: true })
  );
}

function showMessage(message) {
  if (gateMessage) gateMessage.textContent = message;
}

if (hundredCard) {
  hundredCard.addEventListener("click", async (event) => {
    event.preventDefault();
    const destination = hundredCard.getAttribute("href");

    hundredCard.style.pointerEvents = "none";
    hundredCard.style.opacity = "0.72";
    showMessage("Checking YouTeach teams...");

    try {
      const sessionSnap = await get(ref(db, "session/current"));
      const session = sessionSnap.val() || null;
      const teamLabels = getTeamLabels(session);

      if (!session?.active || teamLabels.length === 0) {
        showMessage("100 Students Said is locked. Create teams in YouTeach Buzzer first.");
        return;
      }

      const now = Date.now();
      await update(ref(db), {
        "session/current/connectedGame": {
          id: "100-students-said",
          status: "ready",
          openedAt: now,
          groupName: session.groupName || "",
          teamLabels
        },
        "classroomGames/hundredStudentsSaid/current/integration": {
          source: "youteach-buzzer",
          active: true,
          groupName: session.groupName || "",
          teamLabels,
          updatedAt: now
        }
      });

      window.location.href = destination;
    } catch (error) {
      console.error(error);
      showMessage("Could not verify the YouTeach teams. Try again.");
    } finally {
      hundredCard.style.pointerEvents = "";
      hundredCard.style.opacity = "";
    }
  });
}
