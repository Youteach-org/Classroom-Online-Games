function ensureLocalRuntime(runtime) {
  if (!runtime || runtime.kind !== "local" || typeof runtime.generate !== "function") {
    throw new Error("Talk Talk local AI requires a local runtime.");
  }
  return runtime;
}

export function createLocalAiAdapter(runtime) {
  const localRuntime = ensureLocalRuntime(runtime);

  return Object.freeze({
    available() {
      return true;
    },

    async respond({ context = {}, fallback } = {}) {
      if (typeof fallback !== "function") {
        throw new Error("Talk Talk local AI requires a fallback conversation function.");
      }

      try {
        const generated = await localRuntime.generate(context);
        const reply = typeof generated === "string"
          ? generated.trim()
          : String(generated?.reply || "").trim();

        if (!reply) throw new Error("empty-local-ai-reply");

        return {
          reply,
          usedFallback: false,
          source: "local-ai"
        };
      } catch (error) {
        const fallbackResult = await fallback(error);
        return {
          ...(fallbackResult || {}),
          reply: String(fallbackResult?.reply || "").trim(),
          usedFallback: true,
          source: "talk-engine-lite"
        };
      }
    }
  });
}
