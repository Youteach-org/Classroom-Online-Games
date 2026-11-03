export const CLINICAL_CASES = Object.freeze([
  { id: "C0", label: "Sin condición clínica adicional", contextPromptId: null, hintPromptIds: [] },
  { id: "C1", label: "Embarazo", contextPromptId: "PARAMEDIC_CONTEXT_PREGNANCY", hintPromptIds: ["PARAMEDIC_HINT_PREGNANCY"] },
  { id: "C2", label: "Sospecha de opioides con paro", contextPromptId: "PARAMEDIC_CONTEXT_OPIOID_ARREST", hintPromptIds: ["PARAMEDIC_HINT_OPIOID_ARREST"] },
  { id: "C3", label: "Emergencia por opioides con pulso", contextPromptId: "PARAMEDIC_CONTEXT_OPIOID_PULSE", hintPromptIds: ["PARAMEDIC_HINT_OPIOID_PULSE"] },
  { id: "C4", label: "Ahogamiento", contextPromptId: "PARAMEDIC_CONTEXT_DROWNING", hintPromptIds: ["PARAMEDIC_HINT_DROWNING"] },
  { id: "C5", label: "Hipotermia severa", contextPromptId: "PARAMEDIC_CONTEXT_HYPOTHERMIA", hintPromptIds: ["PARAMEDIC_HINT_HYPOTHERMIA"] },
  { id: "C6", label: "Hipertermia / golpe de calor", contextPromptId: "PARAMEDIC_CONTEXT_HYPERTHERMIA", hintPromptIds: ["PARAMEDIC_HINT_HYPERTHERMIA"] },
  { id: "C7", label: "Lesión eléctrica / electrocución", contextPromptId: "PARAMEDIC_CONTEXT_ELECTROCUTION", hintPromptIds: ["PARAMEDIC_HINT_ELECTROCUTION"] },
  { id: "C8", label: "Anafilaxia", contextPromptId: "PARAMEDIC_CONTEXT_ANAPHYLAXIS", hintPromptIds: ["PARAMEDIC_HINT_ANAPHYLAXIS"] },
  { id: "C9", label: "Asma grave", contextPromptId: "PARAMEDIC_CONTEXT_ASTHMA", hintPromptIds: ["PARAMEDIC_HINT_ASTHMA"] },
  { id: "C10", label: "Intoxicación / exposición tóxica", contextPromptId: "PARAMEDIC_CONTEXT_POISONING", hintPromptIds: ["PARAMEDIC_HINT_POISONING"] },
  { id: "C11", label: "Sospecha de embolia pulmonar", contextPromptId: "PARAMEDIC_CONTEXT_PE", hintPromptIds: ["PARAMEDIC_HINT_PE"] },
  { id: "C12", label: "Dispositivo de asistencia ventricular", contextPromptId: "PARAMEDIC_CONTEXT_LVAD", hintPromptIds: ["PARAMEDIC_HINT_LVAD"] },
  { id: "C13", label: "Alteración grave de potasio/electrolitos", contextPromptId: "PARAMEDIC_CONTEXT_ELECTROLYTES", hintPromptIds: ["PARAMEDIC_HINT_ELECTROLYTES"] },
  { id: "C14", label: "Obstrucción de vía aérea que progresa a paro", contextPromptId: "PARAMEDIC_CONTEXT_AIRWAY_OBSTRUCTION", hintPromptIds: ["PARAMEDIC_HINT_AIRWAY_OBSTRUCTION"] },
  { id: "C15", label: "Retorno de signos de vida durante RCP", contextPromptId: "PARAMEDIC_CONTEXT_ROSC_SIGNS", hintPromptIds: ["PARAMEDIC_HINT_ROSC_SIGNS"] },
  { id: "C16", label: "Nuevo paro tras recuperación inicial", contextPromptId: "PARAMEDIC_CONTEXT_REARREST", hintPromptIds: ["PARAMEDIC_HINT_REARREST"] }
]);
export function getClinicalCase(id) { return CLINICAL_CASES.find((entry) => entry.id === id) ?? null; }
