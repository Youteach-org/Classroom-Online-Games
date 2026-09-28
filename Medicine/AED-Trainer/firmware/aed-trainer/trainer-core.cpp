#include "trainer-core.h"

#include <algorithm>
#include <array>

namespace {

const std::vector<AnalysisOutcome>* scenarioSequence(const std::string& id) {
  static const std::vector<AnalysisOutcome> a1{AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK};
  static const std::vector<AnalysisOutcome> a2{AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK};
  static const std::vector<AnalysisOutcome> a3{AnalysisOutcome::CONTACT_FAULT, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK};
  static const std::vector<AnalysisOutcome> a4{AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK};
  static const std::vector<AnalysisOutcome> a5{AnalysisOutcome::NO_SHOCK, AnalysisOutcome::NO_SHOCK};
  static const std::vector<AnalysisOutcome> a6{AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK};
  static const std::vector<AnalysisOutcome> a7{AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK};
  static const std::vector<AnalysisOutcome> a8{AnalysisOutcome::CONTACT_FAULT, AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK};

  if (id == "A1") return &a1;
  if (id == "A2") return &a2;
  if (id == "A3") return &a3;
  if (id == "A4") return &a4;
  if (id == "A5") return &a5;
  if (id == "A6") return &a6;
  if (id == "A7") return &a7;
  if (id == "A8") return &a8;
  return nullptr;
}

std::string twistHint(const std::string& id) {
  if (id == "T1") return "PARAMEDIC_HINT_WET_CHEST";
  if (id == "T2") return "PARAMEDIC_HINT_MEDICATION_PATCH";
  if (id == "T3") return "PARAMEDIC_HINT_IMPLANTED_DEVICE";
  if (id == "T4") return "PARAMEDIC_HINT_CHEST_HAIR";
  if (id == "T5") return "PARAMEDIC_HINT_PEDIATRIC";
  if (id == "T6") return "PARAMEDIC_HINT_PERSON_TOUCHING";
  if (id == "T7") return "PARAMEDIC_HINT_MOVEMENT";
  if (id == "T8") return "PARAMEDIC_HINT_ELECTRICAL_HAZARD";
  return {};
}

std::string clinicalHint(const std::string& id) {
  if (id == "C1") return "PARAMEDIC_HINT_PREGNANCY";
  if (id == "C2") return "PARAMEDIC_HINT_OPIOID_ARREST";
  if (id == "C3") return "PARAMEDIC_HINT_OPIOID_PULSE";
  if (id == "C4") return "PARAMEDIC_HINT_DROWNING";
  if (id == "C5") return "PARAMEDIC_HINT_HYPOTHERMIA";
  if (id == "C6") return "PARAMEDIC_HINT_HYPERTHERMIA";
  if (id == "C7") return "PARAMEDIC_HINT_ELECTROCUTION";
  if (id == "C8") return "PARAMEDIC_HINT_ANAPHYLAXIS";
  if (id == "C9") return "PARAMEDIC_HINT_ASTHMA";
  if (id == "C10") return "PARAMEDIC_HINT_POISONING";
  if (id == "C11") return "PARAMEDIC_HINT_PE";
  if (id == "C12") return "PARAMEDIC_HINT_LVAD";
  if (id == "C13") return "PARAMEDIC_HINT_ELECTROLYTES";
  if (id == "C14") return "PARAMEDIC_HINT_AIRWAY_OBSTRUCTION";
  if (id == "C15") return "PARAMEDIC_HINT_ROSC_SIGNS";
  if (id == "C16") return "PARAMEDIC_HINT_REARREST";
  return {};
}

std::string twistContext(const std::string& id) {
  if (id == "T1") return "PARAMEDIC_CONTEXT_WET_CHEST";
  if (id == "T2") return "PARAMEDIC_CONTEXT_MEDICATION_PATCH";
  if (id == "T3") return "PARAMEDIC_CONTEXT_IMPLANTED_DEVICE";
  if (id == "T4") return "PARAMEDIC_CONTEXT_CHEST_HAIR";
  if (id == "T5") return "PARAMEDIC_CONTEXT_PEDIATRIC";
  if (id == "T6") return "PARAMEDIC_CONTEXT_PERSON_TOUCHING";
  if (id == "T7") return "PARAMEDIC_CONTEXT_MOVEMENT";
  if (id == "T8") return "PARAMEDIC_CONTEXT_ELECTRICAL_HAZARD";
  return {};
}

std::string clinicalContext(const std::string& id) {
  if (id == "C1") return "PARAMEDIC_CONTEXT_PREGNANCY";
  if (id == "C2") return "PARAMEDIC_CONTEXT_OPIOID_ARREST";
  if (id == "C3") return "PARAMEDIC_CONTEXT_OPIOID_PULSE";
  if (id == "C4") return "PARAMEDIC_CONTEXT_DROWNING";
  if (id == "C5") return "PARAMEDIC_CONTEXT_HYPOTHERMIA";
  if (id == "C6") return "PARAMEDIC_CONTEXT_HYPERTHERMIA";
  if (id == "C7") return "PARAMEDIC_CONTEXT_ELECTROCUTION";
  if (id == "C8") return "PARAMEDIC_CONTEXT_ANAPHYLAXIS";
  if (id == "C9") return "PARAMEDIC_CONTEXT_ASTHMA";
  if (id == "C10") return "PARAMEDIC_CONTEXT_POISONING";
  if (id == "C11") return "PARAMEDIC_CONTEXT_PE";
  if (id == "C12") return "PARAMEDIC_CONTEXT_LVAD";
  if (id == "C13") return "PARAMEDIC_CONTEXT_ELECTROLYTES";
  if (id == "C14") return "PARAMEDIC_CONTEXT_AIRWAY_OBSTRUCTION";
  if (id == "C15") return "PARAMEDIC_CONTEXT_ROSC_SIGNS";
  if (id == "C16") return "PARAMEDIC_CONTEXT_REARREST";
  return {};
}

}  // namespace

bool TrainerSnapshot::operator==(const TrainerSnapshot& other) const {
  return config.scenarioId == other.config.scenarioId &&
         config.twistId == other.config.twistId &&
         config.clinicalId == other.config.clinicalId &&
         state == other.state &&
         analysisIndex == other.analysisIndex &&
         nextOverride == other.nextOverride &&
         pendingOutcome == other.pendingOutcome &&
         hintsUsed == other.hintsUsed &&
         simulatedShockCount == other.simulatedShockCount &&
         bleConnected == other.bleConnected &&
         paused == other.paused &&
         padFault == other.padFault &&
         movement == other.movement &&
         standClearViolation == other.standClearViolation;
}

namespace {

bool validNumberedId(const std::string& id, char prefix, int maxValue) {
  if (id.size() < 2 || id[0] != prefix) return false;
  if (id.size() > 2 && id[1] == '0') return false;

  int value = 0;
  for (std::size_t i = 1; i < id.size(); ++i) {
    const char ch = id[i];
    if (ch < '0' || ch > '9') return false;
    value = value * 10 + (ch - '0');
    if (value > maxValue) return false;
  }
  return true;
}

}  // namespace

bool TrainerCore::validTwist(const std::string& id) const {
  return validNumberedId(id, 'T', 8);
}

bool TrainerCore::validClinical(const std::string& id) const {
  return validNumberedId(id, 'C', 16);
}

void TrainerCore::resetProgress() {
  analysisIndex_ = 0;
  nextOverride_.reset();
  pendingOutcome_.reset();
  hintsUsed_ = 0;
  usedHintIds_.clear();
  simulatedShockCount_ = 0;
  paused_ = false;
  padFault_ = false;
  movement_ = false;
  standClearViolation_ = false;
  seenCommandSeqs_.clear();
  promptQueue_.clear();
}

bool TrainerCore::loadCase(const CaseConfig& config) {
  if (!scenarioSequence(config.scenarioId) || !validTwist(config.twistId) || !validClinical(config.clinicalId)) {
    return false;
  }
  config_ = config;
  resetProgress();
  state_ = TrainerState::OFF;
  return true;
}

void TrainerCore::queueStartupPrompts() {
  promptQueue_.push_back("AED_STARTUP");
  promptQueue_.push_back("AED_CALL_HELP");
  promptQueue_.push_back("AED_EXPOSE_CHEST");
  const auto twist = twistContext(config_.twistId);
  const auto clinical = clinicalContext(config_.clinicalId);
  if (!twist.empty()) promptQueue_.push_back(twist);
  if (!clinical.empty()) promptQueue_.push_back(clinical);
}

bool TrainerCore::startCase() {
  if (state_ != TrainerState::OFF) return false;
  state_ = TrainerState::STARTUP;
  queueStartupPrompts();
  return true;
}

bool TrainerCore::enterApplyPads() {
  if (state_ != TrainerState::STARTUP) return false;
  state_ = TrainerState::APPLY_PADS;
  promptQueue_.push_back("AED_ATTACH_PADS");
  return true;
}

std::optional<AnalysisOutcome> TrainerCore::consumeNextOutcome() {
  const auto* sequence = scenarioSequence(config_.scenarioId);
  if (!sequence) return std::nullopt;

  if (nextOverride_.has_value()) {
    const auto outcome = nextOverride_;
    nextOverride_.reset();
    ++analysisIndex_;
    return outcome;
  }

  if (analysisIndex_ >= sequence->size()) return std::nullopt;
  return (*sequence)[analysisIndex_++];
}

bool TrainerCore::beginAnalysis() {
  if (paused_ || padFault_) return false;
  if (state_ != TrainerState::APPLY_PADS && state_ != TrainerState::REASSESS) return false;
  const auto outcome = consumeNextOutcome();
  if (!outcome.has_value()) return false;
  pendingOutcome_ = outcome;
  state_ = TrainerState::ANALYZING;
  promptQueue_.push_back("AED_ANALYZING");
  return true;
}

bool TrainerCore::resolveAnalysis() {
  if (state_ != TrainerState::ANALYZING || !pendingOutcome_.has_value()) return false;
  const auto outcome = pendingOutcome_.value();
  pendingOutcome_.reset();

  if (outcome == AnalysisOutcome::CONTACT_FAULT) {
    state_ = TrainerState::APPLY_PADS;
    promptQueue_.push_back("AED_CHECK_PADS");
  } else if (outcome == AnalysisOutcome::SHOCK) {
    state_ = TrainerState::SHOCK_ADVISED;
    promptQueue_.push_back("AED_SHOCK_ADVISED");
  } else {
    state_ = TrainerState::NO_SHOCK_ADVISED;
    promptQueue_.push_back("AED_NO_SHOCK");
  }
  return true;
}

bool TrainerCore::armShock() {
  if (state_ != TrainerState::SHOCK_ADVISED) return false;
  state_ = TrainerState::WAITING_SHOCK;
  promptQueue_.push_back("AED_PRESS_SHOCK");
  return true;
}

bool TrainerCore::beginCprAfterNoShock() {
  if (state_ != TrainerState::NO_SHOCK_ADVISED) return false;
  state_ = TrainerState::CPR;
  promptQueue_.push_back("AED_BEGIN_CPR");
  return true;
}

bool TrainerCore::handleShockPress() {
  if (state_ != TrainerState::WAITING_SHOCK || standClearViolation_) return false;
  ++simulatedShockCount_;
  state_ = TrainerState::CPR;
  promptQueue_.push_back("AED_SHOCK_DELIVERED");
  promptQueue_.push_back("AED_BEGIN_CPR");
  return true;
}

bool TrainerCore::requestReassess() {
  if (state_ != TrainerState::CPR) return false;
  state_ = TrainerState::REASSESS;
  promptQueue_.push_back("AED_REASSESS");
  return true;
}

std::vector<std::string> TrainerCore::availableHintIds() const {
  std::vector<std::string> result;
  const auto t = twistHint(config_.twistId);
  const auto c = clinicalHint(config_.clinicalId);
  if (!t.empty()) result.push_back(t);
  if (!c.empty()) result.push_back(c);
  return result;
}

std::optional<std::string> TrainerCore::requestHint() {
  for (const auto& id : availableHintIds()) {
    if (std::find(usedHintIds_.begin(), usedHintIds_.end(), id) == usedHintIds_.end()) {
      usedHintIds_.push_back(id);
      ++hintsUsed_;
      promptQueue_.push_back(id);
      return id;
    }
  }
  return std::nullopt;
}

std::optional<std::string> TrainerCore::popPrompt() {
  if (promptQueue_.empty()) return std::nullopt;
  auto value = promptQueue_.front();
  promptQueue_.pop_front();
  return value;
}

bool TrainerCore::hasPrompt() const {
  return !promptQueue_.empty();
}

CommandResult TrainerCore::applyRemoteCommand(std::uint32_t seq, const std::string& command) {
  if (seenCommandSeqs_.count(seq)) return {false, "duplicate_seq"};

  bool valid = true;
  if (command == "FORCE_SHOCK" || command == "REFIBRILLATION") {
    nextOverride_ = AnalysisOutcome::SHOCK;
  } else if (command == "FORCE_NO_SHOCK") {
    nextOverride_ = AnalysisOutcome::NO_SHOCK;
  } else if (command == "PAD_FAULT") {
    padFault_ = true;
    promptQueue_.push_back("AED_CHECK_PADS");
  } else if (command == "CLEAR_PAD_FAULT") {
    padFault_ = false;
  } else if (command == "MOVEMENT") {
    movement_ = true;
  } else if (command == "CLEAR_MOVEMENT") {
    movement_ = false;
  } else if (command == "STAND_CLEAR_VIOLATION") {
    standClearViolation_ = true;
  } else if (command == "CLEAR_STAND_CLEAR_VIOLATION") {
    standClearViolation_ = false;
  } else if (command == "PAUSE") {
    paused_ = true;
  } else if (command == "RESUME") {
    paused_ = false;
  } else if (command == "END") {
    resetProgress();
    state_ = TrainerState::OFF;
  } else if (command == "RESTART") {
    resetProgress();
    state_ = TrainerState::STARTUP;
    queueStartupPrompts();
  } else if (command == "HINT") {
    if (!requestHint().has_value()) return {false, "no_hint"};
  } else {
    valid = false;
  }

  if (!valid) return {false, "invalid_command"};
  seenCommandSeqs_.insert(seq);
  return {true, {}};
}

void TrainerCore::resetRemoteSequenceNamespace() {
  seenCommandSeqs_.clear();
}

TrainerSnapshot TrainerCore::snapshot() const {
  return {
      config_, state_, analysisIndex_, nextOverride_, pendingOutcome_, hintsUsed_, simulatedShockCount_,
      bleConnected_, paused_, padFault_, movement_, standClearViolation_};
}
