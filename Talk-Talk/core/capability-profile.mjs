function finiteMemory(value) {
  const memory = Number(value);
  return Number.isFinite(memory) && memory > 0 ? memory : 0;
}

export function detectCapabilityProfile(env = globalThis.navigator || {}) {
  const webgpu = Boolean(env.gpu);
  const worker = typeof env.Worker === "function";
  const memoryClass = finiteMemory(env.deviceMemory);

  let tier = "basic";
  if (webgpu && worker && memoryClass >= 8) tier = "enhanced";
  else if (webgpu && worker && memoryClass >= 4) tier = "standard";

  return Object.freeze({
    tier,
    webgpu,
    worker,
    memoryClass,
    canCompleteCoreLesson: true,
    canUseLocalAI: tier === "enhanced"
  });
}
