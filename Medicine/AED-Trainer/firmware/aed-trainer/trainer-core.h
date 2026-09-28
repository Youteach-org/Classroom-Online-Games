#pragma once

#include <cstddef>
#include <cstdint>
#include <deque>
#include <optional>
#include <string>
#include <unordered_set>
#include <vector>

enum class TrainerState {
  OFF,
  STARTUP,
  APPLY_PADS,
  ANALYZING,
  SHOCK_ADVISED,
  NO_SHOCK_ADVISED,
  WAITING_SHOCK,
  CPR,
  REASSESS
};

enum class AnalysisOutcome {
  SHOCK,
  NO_SHOCK,
  CONTACT_FAULT
};

struct CaseConfig {
  std::string scenarioId{"A1"};
  std::string twistId{"T0"};
  std::string clinicalId{"C0"};
};

struct CommandResult {
  bool accepted{false};
  std::string reason;
};

struct TrainerSnapshot {
  CaseConfig config;
  TrainerState state{TrainerState::OFF};
  std::size_t analysisIndex{0};
  std::optional<AnalysisOutcome> nextOverride;
  std::optional<AnalysisOutcome> pendingOutcome;
  std::size_t hintsUsed{0};
  std::uint32_t simulatedShockCount{0};
  bool bleConnected{false};
  bool paused{false};
  bool padFault{false};
  bool movement{false};
  bool standClearViolation{false};

  bool operator==(const TrainerSnapshot& other) const;
};

class TrainerCore {
 public:
  TrainerCore() = default;

  bool loadCase(const CaseConfig& config);
  bool startCase();
  bool enterApplyPads();
  bool beginAnalysis();
  bool resolveAnalysis();
  bool armShock();
  bool beginCprAfterNoShock();
  bool handleShockPress();
  bool requestReassess();

  // Local physical controls. These do not require BLE.
  bool pauseCase();
  bool resumeCase();
  bool endCase();

  std::optional<AnalysisOutcome> consumeNextOutcome();
  std::optional<std::string> requestHint();
  std::optional<std::string> popPrompt();
  bool hasPrompt() const;

  CommandResult applyRemoteCommand(std::uint32_t seq, const std::string& command);
  void resetRemoteSequenceNamespace();

  void setBleConnected(bool connected) { bleConnected_ = connected; }
  bool bleConnected() const { return bleConnected_; }

  TrainerState state() const { return state_; }
  std::size_t hintsUsed() const { return hintsUsed_; }
  std::uint32_t simulatedShockCount() const { return simulatedShockCount_; }
  const CaseConfig& config() const { return config_; }
  TrainerSnapshot snapshot() const;

 private:
  bool validTwist(const std::string& id) const;
  bool validClinical(const std::string& id) const;
  void resetProgress();
  void queueStartupPrompts();
  std::vector<std::string> availableHintIds() const;

  CaseConfig config_{};
  TrainerState state_{TrainerState::OFF};
  std::size_t analysisIndex_{0};
  std::optional<AnalysisOutcome> nextOverride_;
  std::optional<AnalysisOutcome> pendingOutcome_;
  std::size_t hintsUsed_{0};
  std::vector<std::string> usedHintIds_;
  std::uint32_t simulatedShockCount_{0};
  bool bleConnected_{false};
  bool paused_{false};
  bool padFault_{false};
  bool movement_{false};
  bool standClearViolation_{false};
  std::unordered_set<std::uint32_t> seenCommandSeqs_;
  std::deque<std::string> promptQueue_;
};
