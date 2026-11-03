export const SCENE_TWISTS = Object.freeze([
  { id: "T0", label: "Sin twist", contextPromptId: null, hintPromptIds: [] },
  { id: "T1", label: "Tórax mojado / recién retirado del agua", contextPromptId: "PARAMEDIC_CONTEXT_WET_CHEST", hintPromptIds: ["PARAMEDIC_HINT_WET_CHEST"] },
  { id: "T2", label: "Parche medicamentoso en zona de electrodo", contextPromptId: "PARAMEDIC_CONTEXT_MEDICATION_PATCH", hintPromptIds: ["PARAMEDIC_HINT_MEDICATION_PATCH"] },
  { id: "T3", label: "Dispositivo cardiaco implantado", contextPromptId: "PARAMEDIC_CONTEXT_IMPLANTED_DEVICE", hintPromptIds: ["PARAMEDIC_HINT_IMPLANTED_DEVICE"] },
  { id: "T4", label: "Vello excesivo / mala adhesión", contextPromptId: "PARAMEDIC_CONTEXT_CHEST_HAIR", hintPromptIds: ["PARAMEDIC_HINT_CHEST_HAIR"] },
  { id: "T5", label: "Paciente pediátrico", contextPromptId: "PARAMEDIC_CONTEXT_PEDIATRIC", hintPromptIds: ["PARAMEDIC_HINT_PEDIATRIC"] },
  { id: "T6", label: "Persona toca al paciente", contextPromptId: "PARAMEDIC_CONTEXT_PERSON_TOUCHING", hintPromptIds: ["PARAMEDIC_HINT_PERSON_TOUCHING"] },
  { id: "T7", label: "Movimiento / artefacto", contextPromptId: "PARAMEDIC_CONTEXT_MOVEMENT", hintPromptIds: ["PARAMEDIC_HINT_MOVEMENT"] },
  { id: "T8", label: "Fuente eléctrica activa en la escena", contextPromptId: "PARAMEDIC_CONTEXT_ELECTRICAL_HAZARD", hintPromptIds: ["PARAMEDIC_HINT_ELECTRICAL_HAZARD"] }
]);
export function getSceneTwist(id) { return SCENE_TWISTS.find((entry) => entry.id === id) ?? null; }
