#include <cassert>
#include <cstdint>
#include <iostream>
#include <string>
#include <vector>

#include "../aed-trainer/trainer-core.h"

static void assert_sequence(const std::string& id, const std::vector<AnalysisOutcome>& expected) {
  TrainerCore core;
  assert(core.loadCase({id, "T0", "C0"}));
  for (const auto outcome : expected) {
    auto result = core.consumeNextOutcome();
    assert(result.has_value());
    assert(result.value() == outcome);
  }
  assert(!core.consumeNextOutcome().has_value());
}

int main() {
  assert_sequence("A1", {AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK});
  assert_sequence("A2", {AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK});
  assert_sequence("A3", {AnalysisOutcome::CONTACT_FAULT, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK});
  assert_sequence("A4", {AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK});
  assert_sequence("A5", {AnalysisOutcome::NO_SHOCK, AnalysisOutcome::NO_SHOCK});
  assert_sequence("A6", {AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK});
  assert_sequence("A7", {AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK});
  assert_sequence("A8", {AnalysisOutcome::CONTACT_FAULT, AnalysisOutcome::SHOCK, AnalysisOutcome::SHOCK, AnalysisOutcome::NO_SHOCK});

  {
    TrainerCore core;
    assert(core.loadCase({"A1", "T0", "C0"}));
    assert(core.startCase());
    assert(core.enterApplyPads());
    assert(core.beginAnalysis());
    assert(core.resolveAnalysis());
    assert(core.state() == TrainerState::SHOCK_ADVISED);
    assert(!core.handleShockPress());
    assert(core.armShock());
    assert(core.state() == TrainerState::WAITING_SHOCK);
    assert(core.handleShockPress());
    assert(core.state() == TrainerState::CPR);
    assert(core.simulatedShockCount() == 1);
    assert(!core.handleShockPress());
    assert(core.simulatedShockCount() == 1);
  }

  {
    TrainerCore core;
    assert(core.loadCase({"A5", "T0", "C0"}));
    const auto first = core.applyRemoteCommand(20, "FORCE_SHOCK");
    assert(first.accepted);
    const auto duplicate = core.applyRemoteCommand(20, "FORCE_NO_SHOCK");
    assert(!duplicate.accepted);
    assert(duplicate.reason == "duplicate_seq");
    const auto outcome = core.consumeNextOutcome();
    assert(outcome.has_value());
    assert(outcome.value() == AnalysisOutcome::SHOCK);
  }

  {
    TrainerCore core;
    assert(core.loadCase({"A2", "T0", "C0"}));
    core.setBleConnected(true);
    const auto before = core.consumeNextOutcome();
    core.setBleConnected(false);
    const auto after = core.consumeNextOutcome();
    assert(before.has_value() && before.value() == AnalysisOutcome::SHOCK);
    assert(after.has_value() && after.value() == AnalysisOutcome::SHOCK);
    assert(!core.bleConnected());
  }

  {
    TrainerCore core;
    assert(core.loadCase({"A1", "T1", "C1"}));
    const auto h1 = core.requestHint();
    const auto h2 = core.requestHint();
    const auto h3 = core.requestHint();
    assert(h1.has_value() && h1.value() == "PARAMEDIC_HINT_WET_CHEST");
    assert(h2.has_value() && h2.value() == "PARAMEDIC_HINT_PREGNANCY");
    assert(!h3.has_value());
    assert(core.hintsUsed() == 2);
  }

  {
    TrainerCore core;
    assert(core.loadCase({"A1", "T0", "C0"}));
    const auto before = core.snapshot();
    const auto result = core.applyRemoteCommand(99, "NOT_A_REAL_EVENT");
    const auto after = core.snapshot();
    assert(!result.accepted);
    assert(result.reason == "invalid_command");
    assert(before == after);
  }

  std::cout << "trainer-core tests passed\n";
  return 0;
}
