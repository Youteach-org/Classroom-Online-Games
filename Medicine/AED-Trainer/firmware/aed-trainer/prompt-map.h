#pragma once

#include <cstddef>
#include <string>

struct PromptMapEntry {
  const char* id;
  const char* path;
  const char* text;
};

inline constexpr PromptMapEntry kPromptMap[] = {
  { "AED_STARTUP", "/audio/aed-startup.wav", "Mantenga la calma. Siga estas instrucciones." },
  { "AED_CALL_HELP", "/audio/aed-call-help.wav", "Solicite ayuda médica de emergencia." },
  { "AED_EXPOSE_CHEST", "/audio/aed-expose-chest.wav", "Descubra el pecho del paciente." },
  { "AED_ATTACH_PADS", "/audio/aed-attach-pads.wav", "Coloque los electrodos como se muestra." },
  { "AED_CHECK_PADS", "/audio/aed-check-pads.wav", "Revise los electrodos." },
  { "AED_ANALYZING", "/audio/aed-analyzing.wav", "No toque al paciente. Analizando ritmo cardíaco." },
  { "AED_SHOCK_ADVISED", "/audio/aed-shock-advised.wav", "Se recomienda una descarga. No toque al paciente." },
  { "AED_PRESS_SHOCK", "/audio/aed-press-shock.wav", "Presione el botón de descarga." },
  { "AED_SHOCK_DELIVERED", "/audio/aed-shock-delivered.wav", "Descarga aplicada." },
  { "AED_NO_SHOCK", "/audio/aed-no-shock.wav", "No se recomienda una descarga." },
  { "AED_BEGIN_CPR", "/audio/aed-begin-cpr.wav", "Inicie RCP." },
  { "AED_CONTINUE_CPR", "/audio/aed-continue-cpr.wav", "Continúe RCP." },
  { "AED_REASSESS", "/audio/aed-reassess.wav", "Prepárese para un nuevo análisis." },
  { "PARAMEDIC_CONTEXT_WET_CHEST", "/audio/paramedic-context-wet-chest.wav", "Compañero, acabamos de sacar al paciente del agua. Tiene el tórax mojado." },
  { "PARAMEDIC_HINT_WET_CHEST", "/audio/paramedic-hint-wet-chest.wav", "Compañero, revisa si las condiciones permiten colocar correctamente los electrodos." },
  { "PARAMEDIC_CONTEXT_MEDICATION_PATCH", "/audio/paramedic-context-medication-patch.wav", "Compañero, veo un parche adherido justo donde iría uno de los electrodos." },
  { "PARAMEDIC_HINT_MEDICATION_PATCH", "/audio/paramedic-hint-medication-patch.wav", "Compañero, revisa qué hay sobre la piel antes de colocar ese electrodo." },
  { "PARAMEDIC_CONTEXT_IMPLANTED_DEVICE", "/audio/paramedic-context-implanted-device.wav", "Compañero, noto un dispositivo implantado debajo de la piel del pecho." },
  { "PARAMEDIC_HINT_IMPLANTED_DEVICE", "/audio/paramedic-hint-implanted-device.wav", "Compañero, observa con cuidado la zona antes de decidir dónde colocar el electrodo." },
  { "PARAMEDIC_CONTEXT_CHEST_HAIR", "/audio/paramedic-context-chest-hair.wav", "Compañero, el vello del tórax está impidiendo que el electrodo se adhiera bien." },
  { "PARAMEDIC_HINT_CHEST_HAIR", "/audio/paramedic-hint-chest-hair.wav", "Compañero, revisa por qué el electrodo no está haciendo buen contacto." },
  { "PARAMEDIC_CONTEXT_PEDIATRIC", "/audio/paramedic-context-pediatric.wav", "Compañero, nuestro paciente es un niño." },
  { "PARAMEDIC_HINT_PEDIATRIC", "/audio/paramedic-hint-pediatric.wav", "Compañero, confirma que el equipo y la colocación sean apropiados para el tamaño del paciente." },
  { "PARAMEDIC_CONTEXT_PERSON_TOUCHING", "/audio/paramedic-context-person-touching.wav", "Compañero, hay una persona tocando al paciente." },
  { "PARAMEDIC_HINT_PERSON_TOUCHING", "/audio/paramedic-hint-person-touching.wav", "Compañero, mira quién está en contacto con el paciente antes de continuar." },
  { "PARAMEDIC_CONTEXT_MOVEMENT", "/audio/paramedic-context-movement.wav", "Compañero, están moviendo al paciente durante el análisis." },
  { "PARAMEDIC_HINT_MOVEMENT", "/audio/paramedic-hint-movement.wav", "Compañero, piensa qué puede alterar un análisis confiable del ritmo." },
  { "PARAMEDIC_CONTEXT_ELECTRICAL_HAZARD", "/audio/paramedic-context-electrical-hazard.wav", "Compañero, la fuente eléctrica de la escena sigue energizada." },
  { "PARAMEDIC_HINT_ELECTRICAL_HAZARD", "/audio/paramedic-hint-electrical-hazard.wav", "Compañero, revisa primero si la escena es segura para acercarnos." },
  { "PARAMEDIC_CONTEXT_PREGNANCY", "/audio/paramedic-context-pregnancy.wav", "Compañero, observo que la paciente parece estar embarazada." },
  { "PARAMEDIC_HINT_PREGNANCY", "/audio/paramedic-hint-pregnancy.wav", "Compañero, considera esta condición mientras continúas el algoritmo de reanimación." },
  { "PARAMEDIC_CONTEXT_OPIOID_ARREST", "/audio/paramedic-context-opioid-arrest.wav", "Compañero, encontramos indicios de consumo de opioides junto al paciente y no presenta signos de circulación." },
  { "PARAMEDIC_HINT_OPIOID_ARREST", "/audio/paramedic-hint-opioid-arrest.wav", "Compañero, no pierdas de vista qué intervención tiene prioridad cuando ya hay paro." },
  { "PARAMEDIC_CONTEXT_OPIOID_PULSE", "/audio/paramedic-context-opioid-pulse.wav", "Compañero, respira de forma muy lenta, pero todavía tiene pulso." },
  { "PARAMEDIC_HINT_OPIOID_PULSE", "/audio/paramedic-hint-opioid-pulse.wav", "Compañero, confirma si realmente estamos ante un paro antes de tratarlo como uno." },
  { "PARAMEDIC_CONTEXT_DROWNING", "/audio/paramedic-context-drowning.wav", "Compañero, el colapso ocurrió después de un episodio de ahogamiento." },
  { "PARAMEDIC_HINT_DROWNING", "/audio/paramedic-hint-drowning.wav", "Compañero, recuerda que en este mecanismo la falta de oxígeno es una parte central del problema." },
  { "PARAMEDIC_CONTEXT_HYPOTHERMIA", "/audio/paramedic-context-hypothermia.wav", "Compañero, estuvo expuesto al frío durante mucho tiempo y está muy frío al tacto." },
  { "PARAMEDIC_HINT_HYPOTHERMIA", "/audio/paramedic-hint-hypothermia.wav", "Compañero, ten presente que el frío intenso puede hacer muy difíciles de valorar los signos de vida." },
  { "PARAMEDIC_CONTEXT_HYPERTHERMIA", "/audio/paramedic-context-hyperthermia.wav", "Compañero, estuvo expuesto a calor extremo antes del colapso." },
  { "PARAMEDIC_HINT_HYPERTHERMIA", "/audio/paramedic-hint-hyperthermia.wav", "Compañero, además del paro, busca la causa reversible que nos está mostrando la escena." },
  { "PARAMEDIC_CONTEXT_ELECTROCUTION", "/audio/paramedic-context-electrocution.wav", "Compañero, el colapso ocurrió tras una descarga eléctrica." },
  { "PARAMEDIC_HINT_ELECTROCUTION", "/audio/paramedic-hint-electrocution.wav", "Compañero, antes de tocar al paciente confirma que el peligro eléctrico ya fue eliminado." },
  { "PARAMEDIC_CONTEXT_ANAPHYLAXIS", "/audio/paramedic-context-anaphylaxis.wav", "Compañero, antes del colapso presentó una reacción alérgica grave y dificultad para respirar." },
  { "PARAMEDIC_HINT_ANAPHYLAXIS", "/audio/paramedic-hint-anaphylaxis.wav", "Compañero, relaciona los hallazgos previos con una posible causa reversible del paro." },
  { "PARAMEDIC_CONTEXT_ASTHMA", "/audio/paramedic-context-asthma.wav", "Compañero, tenía una crisis asmática intensa antes de deteriorarse." },
  { "PARAMEDIC_HINT_ASTHMA", "/audio/paramedic-hint-asthma.wav", "Compañero, piensa qué problema respiratorio pudo llevar a este deterioro." },
  { "PARAMEDIC_CONTEXT_POISONING", "/audio/paramedic-context-poisoning.wav", "Compañero, hay evidencia de una posible exposición a una sustancia tóxica." },
  { "PARAMEDIC_HINT_POISONING", "/audio/paramedic-hint-poisoning.wav", "Compañero, usa las pistas de la escena para buscar una causa tratable además del algoritmo del paro." },
  { "PARAMEDIC_CONTEXT_PE", "/audio/paramedic-context-pe.wav", "Compañero, el cuadro previo hace sospechar un evento tromboembólico." },
  { "PARAMEDIC_HINT_PE", "/audio/paramedic-hint-pe.wav", "Compañero, considera si una causa obstructiva puede explicar el deterioro." },
  { "PARAMEDIC_CONTEXT_LVAD", "/audio/paramedic-context-lvad.wav", "Compañero, el paciente tiene un dispositivo de asistencia ventricular implantado." },
  { "PARAMEDIC_HINT_LVAD", "/audio/paramedic-hint-lvad.wav", "Compañero, no te bases en un solo signo para decidir si hay circulación." },
  { "PARAMEDIC_CONTEXT_ELECTROLYTES", "/audio/paramedic-context-electrolytes.wav", "Compañero, el paciente tiene antecedentes que hacen pensar en una alteración grave de electrolitos." },
  { "PARAMEDIC_HINT_ELECTROLYTES", "/audio/paramedic-hint-electrolytes.wav", "Compañero, busca una causa reversible relacionada con sus antecedentes." },
  { "PARAMEDIC_CONTEXT_AIRWAY_OBSTRUCTION", "/audio/paramedic-context-airway-obstruction.wav", "Compañero, el paciente se estaba atragantando antes de perder la respuesta." },
  { "PARAMEDIC_HINT_AIRWAY_OBSTRUCTION", "/audio/paramedic-hint-airway-obstruction.wav", "Compañero, reconstruye qué ocurrió antes del paro y qué problema pudo iniciarlo." },
  { "PARAMEDIC_CONTEXT_ROSC_SIGNS", "/audio/paramedic-context-rosc-signs.wav", "Compañero, noto que el paciente empieza a moverse y aparecen signos de vida." },
  { "PARAMEDIC_HINT_ROSC_SIGNS", "/audio/paramedic-hint-rosc-signs.wav", "Compañero, reevalúa al paciente antes de seguir actuando de forma automática." },
  { "PARAMEDIC_CONTEXT_REARREST", "/audio/paramedic-context-rearrest.wav", "Compañero, el paciente que había recuperado signos de vida vuelve a quedar sin respuesta." },
  { "PARAMEDIC_HINT_REARREST", "/audio/paramedic-hint-rearrest.wav", "Compañero, vuelve a valorar desde el principio qué estado tiene ahora." }
};

inline const PromptMapEntry* findPromptEntry(const std::string& id) {
  for (const auto& entry : kPromptMap) {
    if (id == entry.id) return &entry;
  }
  return nullptr;
}

inline const char* findPromptPath(const std::string& id) {
  const auto* entry = findPromptEntry(id);
  return entry ? entry->path : nullptr;
}

inline const char* findPromptText(const std::string& id) {
  const auto* entry = findPromptEntry(id);
  return entry ? entry->text : nullptr;
}

inline constexpr std::size_t kPromptMapCount = sizeof(kPromptMap) / sizeof(kPromptMap[0]);
