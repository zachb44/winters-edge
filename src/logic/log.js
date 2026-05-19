// Pure log helper. Returns a new state with the message prepended to the log
// (capped at 50 entries). Used by combat, progression, and the main tick loop.
export function pushLog(state, msg) {
  return {
    ...state,
    log: [{ msg, day: state.day, time: Math.floor(state.time) }, ...state.log].slice(0, 50),
  };
}
