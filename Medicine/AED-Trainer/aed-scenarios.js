export const AED_SCENARIOS = Object.freeze([
  { id: "A1", label: "Conversión con una descarga", analysisSequence: ["SHOCK", "NO_SHOCK"] },
  { id: "A2", label: "Ritmo desfibrilable persistente", analysisSequence: ["SHOCK", "SHOCK", "NO_SHOCK"] },
  { id: "A3", label: "Problema de contacto antes del análisis", analysisSequence: ["CONTACT_FAULT", "SHOCK", "NO_SHOCK"] },
  { id: "A4", label: "Refibrilación", analysisSequence: ["SHOCK", "NO_SHOCK", "SHOCK", "NO_SHOCK"] },
  { id: "A5", label: "Ritmo no desfibrilable", analysisSequence: ["NO_SHOCK", "NO_SHOCK"] },
  { id: "A6", label: "Dos descargas requeridas", analysisSequence: ["SHOCK", "SHOCK", "NO_SHOCK"] },
  { id: "A7", label: "Paro recurrente complejo", analysisSequence: ["SHOCK", "SHOCK", "NO_SHOCK", "SHOCK", "NO_SHOCK"] },
  { id: "A8", label: "Contacto deficiente y ritmo persistente", analysisSequence: ["CONTACT_FAULT", "SHOCK", "SHOCK", "NO_SHOCK"] }
]);
export function getAedScenario(id) { return AED_SCENARIOS.find((entry) => entry.id === id) ?? null; }
