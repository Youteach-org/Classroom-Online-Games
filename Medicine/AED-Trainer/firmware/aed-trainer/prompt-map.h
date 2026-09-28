#pragma once

#include <cstddef>
#include <string>

struct PromptMapEntry {
  const char* id;
  const char* path;
};

inline constexpr PromptMapEntry kPromptMap[] = {
  { "AED_STARTUP", "/audio/aed-startup.wav" },
  { "AED_CALL_HELP", "/audio/aed-call-help.wav" },
  { "AED_EXPOSE_CHEST", "/audio/aed-expose-chest.wav" },
  { "AED_ATTACH_PADS", "/audio/aed-attach-pads.wav" },
  { "AED_CHECK_PADS", "/audio/aed-check-pads.wav" },
  { "AED_ANALYZING", "/audio/aed-analyzing.wav" },
  { "AED_SHOCK_ADVISED", "/audio/aed-shock-advised.wav" },
  { "AED_PRESS_SHOCK", "/audio/aed-press-shock.wav" },
  { "AED_SHOCK_DELIVERED", "/audio/aed-shock-delivered.wav" },
  { "AED_NO_SHOCK", "/audio/aed-no-shock.wav" },
  { "AED_BEGIN_CPR", "/audio/aed-begin-cpr.wav" },
  { "AED_CONTINUE_CPR", "/audio/aed-continue-cpr.wav" },
  { "AED_REASSESS", "/audio/aed-reassess.wav" },
  { "PARAMEDIC_CONTEXT_WET_CHEST", "/audio/paramedic-context-wet-chest.wav" },
  { "PARAMEDIC_HINT_WET_CHEST", "/audio/paramedic-hint-wet-chest.wav" },
  { "PARAMEDIC_CONTEXT_MEDICATION_PATCH", "/audio/paramedic-context-medication-patch.wav" },
  { "PARAMEDIC_HINT_MEDICATION_PATCH", "/audio/paramedic-hint-medication-patch.wav" },
  { "PARAMEDIC_CONTEXT_IMPLANTED_DEVICE", "/audio/paramedic-context-implanted-device.wav" },
  { "PARAMEDIC_HINT_IMPLANTED_DEVICE", "/audio/paramedic-hint-implanted-device.wav" },
  { "PARAMEDIC_CONTEXT_CHEST_HAIR", "/audio/paramedic-context-chest-hair.wav" },
  { "PARAMEDIC_HINT_CHEST_HAIR", "/audio/paramedic-hint-chest-hair.wav" },
  { "PARAMEDIC_CONTEXT_PEDIATRIC", "/audio/paramedic-context-pediatric.wav" },
  { "PARAMEDIC_HINT_PEDIATRIC", "/audio/paramedic-hint-pediatric.wav" },
  { "PARAMEDIC_CONTEXT_PERSON_TOUCHING", "/audio/paramedic-context-person-touching.wav" },
  { "PARAMEDIC_HINT_PERSON_TOUCHING", "/audio/paramedic-hint-person-touching.wav" },
  { "PARAMEDIC_CONTEXT_MOVEMENT", "/audio/paramedic-context-movement.wav" },
  { "PARAMEDIC_HINT_MOVEMENT", "/audio/paramedic-hint-movement.wav" },
  { "PARAMEDIC_CONTEXT_ELECTRICAL_HAZARD", "/audio/paramedic-context-electrical-hazard.wav" },
  { "PARAMEDIC_HINT_ELECTRICAL_HAZARD", "/audio/paramedic-hint-electrical-hazard.wav" },
  { "PARAMEDIC_CONTEXT_PREGNANCY", "/audio/paramedic-context-pregnancy.wav" },
  { "PARAMEDIC_HINT_PREGNANCY", "/audio/paramedic-hint-pregnancy.wav" },
  { "PARAMEDIC_CONTEXT_OPIOID_ARREST", "/audio/paramedic-context-opioid-arrest.wav" },
  { "PARAMEDIC_HINT_OPIOID_ARREST", "/audio/paramedic-hint-opioid-arrest.wav" },
  { "PARAMEDIC_CONTEXT_OPIOID_PULSE", "/audio/paramedic-context-opioid-pulse.wav" },
  { "PARAMEDIC_HINT_OPIOID_PULSE", "/audio/paramedic-hint-opioid-pulse.wav" },
  { "PARAMEDIC_CONTEXT_DROWNING", "/audio/paramedic-context-drowning.wav" },
  { "PARAMEDIC_HINT_DROWNING", "/audio/paramedic-hint-drowning.wav" },
  { "PARAMEDIC_CONTEXT_HYPOTHERMIA", "/audio/paramedic-context-hypothermia.wav" },
  { "PARAMEDIC_HINT_HYPOTHERMIA", "/audio/paramedic-hint-hypothermia.wav" },
  { "PARAMEDIC_CONTEXT_HYPERTHERMIA", "/audio/paramedic-context-hyperthermia.wav" },
  { "PARAMEDIC_HINT_HYPERTHERMIA", "/audio/paramedic-hint-hyperthermia.wav" },
  { "PARAMEDIC_CONTEXT_ELECTROCUTION", "/audio/paramedic-context-electrocution.wav" },
  { "PARAMEDIC_HINT_ELECTROCUTION", "/audio/paramedic-hint-electrocution.wav" },
  { "PARAMEDIC_CONTEXT_ANAPHYLAXIS", "/audio/paramedic-context-anaphylaxis.wav" },
  { "PARAMEDIC_HINT_ANAPHYLAXIS", "/audio/paramedic-hint-anaphylaxis.wav" },
  { "PARAMEDIC_CONTEXT_ASTHMA", "/audio/paramedic-context-asthma.wav" },
  { "PARAMEDIC_HINT_ASTHMA", "/audio/paramedic-hint-asthma.wav" },
  { "PARAMEDIC_CONTEXT_POISONING", "/audio/paramedic-context-poisoning.wav" },
  { "PARAMEDIC_HINT_POISONING", "/audio/paramedic-hint-poisoning.wav" },
  { "PARAMEDIC_CONTEXT_PE", "/audio/paramedic-context-pe.wav" },
  { "PARAMEDIC_HINT_PE", "/audio/paramedic-hint-pe.wav" },
  { "PARAMEDIC_CONTEXT_LVAD", "/audio/paramedic-context-lvad.wav" },
  { "PARAMEDIC_HINT_LVAD", "/audio/paramedic-hint-lvad.wav" },
  { "PARAMEDIC_CONTEXT_ELECTROLYTES", "/audio/paramedic-context-electrolytes.wav" },
  { "PARAMEDIC_HINT_ELECTROLYTES", "/audio/paramedic-hint-electrolytes.wav" },
  { "PARAMEDIC_CONTEXT_AIRWAY_OBSTRUCTION", "/audio/paramedic-context-airway-obstruction.wav" },
  { "PARAMEDIC_HINT_AIRWAY_OBSTRUCTION", "/audio/paramedic-hint-airway-obstruction.wav" },
  { "PARAMEDIC_CONTEXT_ROSC_SIGNS", "/audio/paramedic-context-rosc-signs.wav" },
  { "PARAMEDIC_HINT_ROSC_SIGNS", "/audio/paramedic-hint-rosc-signs.wav" },
  { "PARAMEDIC_CONTEXT_REARREST", "/audio/paramedic-context-rearrest.wav" },
  { "PARAMEDIC_HINT_REARREST", "/audio/paramedic-hint-rearrest.wav" }
};

inline const char* findPromptPath(const std::string& id) {
  for (const auto& entry : kPromptMap) {
    if (id == entry.id) return entry.path;
  }
  return nullptr;
}

inline constexpr std::size_t kPromptMapCount = sizeof(kPromptMap) / sizeof(kPromptMap[0]);
