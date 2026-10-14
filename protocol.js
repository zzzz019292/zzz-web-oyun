export const MAX_MESSAGE_BYTES = 1024;
const allowed = {
  join: ["type", "name", "id", "token"],
  input: ["type", "seq", "x", "y", "f", "dash", "active"],
  select_character: ["type", "cls"],
  ready: ["type", "value"],
  choose_upgrade: ["type", "index", "revision"],
  choose_bond_card: ["type", "index", "revision"],
  ping: ["type", "time"],
  sync: ["type"],
  replay: ["type"],
  leave: ["type"],
};
export function parseMessage(raw) {
  if (
    typeof raw !== "string" ||
    new TextEncoder().encode(raw).length > MAX_MESSAGE_BYTES
  )
    throw Error("Mesaj boyutu veya türü geçersiz");
  let m;
  try {
    m = JSON.parse(raw);
  } catch {
    throw Error("Geçersiz JSON");
  }
  if (
    !m ||
    Array.isArray(m) ||
    typeof m !== "object" ||
    !allowed[m.type] ||
    Object.keys(m).some((k) => !allowed[m.type].includes(k))
  )
    throw Error("Bilinmeyen mesaj veya alan");
  if (
    m.type === "join" &&
    ((m.name !== undefined &&
      (typeof m.name !== "string" || m.name.length > 24)) ||
      (m.id !== undefined && typeof m.id !== "string") ||
      (m.token !== undefined &&
        (typeof m.token !== "string" || m.token.length > 128)))
  )
    throw Error("Geçersiz oturum");
  if (
    m.type === "input" &&
    (!Number.isSafeInteger(m.seq) ||
      !Number.isFinite(m.x) ||
      !Number.isFinite(m.y) ||
      Math.abs(m.x) > 1 ||
      Math.abs(m.y) > 1 ||
      typeof m.f !== "boolean" ||
      (m.dash !== undefined && typeof m.dash !== "boolean") ||
      (m.active !== undefined && typeof m.active !== "boolean"))
  )
    throw Error("Geçersiz input");
  if (m.type === "select_character" && typeof m.cls !== "string")
    throw Error("Geçersiz sınıf");
  if (m.type === "ready" && typeof m.value !== "boolean")
    throw Error("Geçersiz hazır durumu");
  if (
    m.type.startsWith("choose_") &&
    (!Number.isInteger(m.index) ||
      m.index < 0 ||
      m.index > 2 ||
      !Number.isSafeInteger(m.revision))
  )
    throw Error("Geçersiz seçim");
  if (m.type === "ping" && (!Number.isFinite(m.time) || m.time < 0))
    throw Error("Geçersiz ping");
  return m;
}
export function deltaSnapshot(previous, next) {
  if (!previous) return { full: true, data: next };
  const data = { ...next },
    removed = {};
  for (const key of ["enemies", "bullets", "hazards", "loot"]) {
    const old = new Map(previous[key].map((v) => [v.id, JSON.stringify(v)])),
      current = new Set(next[key].map((v) => v.id));
    data[key] = next[key].filter((v) => old.get(v.id) !== JSON.stringify(v));
    removed[key] = previous[key]
      .filter((v) => !current.has(v.id))
      .map((v) => v.id);
  }
  return { full: false, data, removed };
}
