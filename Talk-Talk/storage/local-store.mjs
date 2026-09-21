function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function createMemoryLocalStore(initial = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, clone(value)]));
  return Object.freeze({
    async get(key) {
      return values.has(String(key)) ? clone(values.get(String(key))) : null;
    },
    async set(key, value) {
      values.set(String(key), clone(value));
      return clone(value);
    },
    async remove(key) {
      values.delete(String(key));
    },
    async entries() {
      return Array.from(values.entries()).map(([key, value]) => [key, clone(value)]);
    },
    async clear() {
      values.clear();
    }
  });
}

export function createLocalStore({
  storage = globalThis.localStorage,
  namespace = "talkTalk.localStore.v1"
} = {}) {
  if (!storage?.getItem || !storage?.setItem) {
    return createMemoryLocalStore();
  }

  function readAll() {
    try {
      const parsed = JSON.parse(storage.getItem(namespace) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeAll(value) {
    storage.setItem(namespace, JSON.stringify(value || {}));
  }

  return Object.freeze({
    async get(key) {
      const all = readAll();
      return Object.prototype.hasOwnProperty.call(all, key) ? clone(all[key]) : null;
    },
    async set(key, value) {
      const all = readAll();
      all[String(key)] = clone(value);
      writeAll(all);
      return clone(value);
    },
    async remove(key) {
      const all = readAll();
      delete all[String(key)];
      writeAll(all);
    },
    async entries() {
      return Object.entries(readAll()).map(([key, value]) => [key, clone(value)]);
    },
    async clear() {
      writeAll({});
    }
  });
}
