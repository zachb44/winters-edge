// Pure helpers for profession abilities. State shape:
//   state.player.abilities       -- array of unlocked ability ids
//   state.player.abilityCooldowns -- { [id]: { day, time } }   (game-time end)
//   state.player.abilityCharges  -- { [id]: number }           (multi-use abilities)
//   state.player.nextAttackMult  -- one-shot multiplier consumed by next swing
//
// Cooldowns are stored as game-time pairs so they automatically pause with
// state.time when the game is paused.

import { getAbilityDef } from '../data/abilities.js';

export function hasAbility(state, id) {
  return Array.isArray(state.player?.abilities) && state.player.abilities.includes(id);
}

export function isCooldownReady(state, id) {
  const cd = state.player?.abilityCooldowns?.[id];
  if (!cd) return true;
  const now = (state.day || 1) * 24 + (state.time || 0);
  const end = cd.day * 24 + cd.time;
  return now >= end;
}

export function getRemainingCooldown(state, id) {
  const cd = state.player?.abilityCooldowns?.[id];
  if (!cd) return null;
  const now = (state.day || 1) * 24 + (state.time || 0);
  const end = cd.day * 24 + cd.time;
  const remaining = end - now;
  if (remaining <= 0) return null;
  return remaining;
}

// Format remaining game-hours as a short label. <1h → minutes; <1m → seconds.
// Game-second = 1/60 of a game-minute = 1/3600 of a game-hour.
export function formatCooldown(remainingHours) {
  if (remainingHours == null || remainingHours <= 0) return '';
  if (remainingHours >= 1) {
    const h = Math.floor(remainingHours);
    const m = Math.floor((remainingHours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const minutes = remainingHours * 60;
  if (minutes >= 1) {
    const m = Math.floor(minutes);
    const s = Math.floor((minutes - m) * 60);
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const seconds = Math.max(1, Math.floor(minutes * 60));
  return `${seconds}s`;
}

// Returns new state with the cooldown for `id` set to expire `hours` from now.
export function setCooldown(state, id, hours) {
  if (!hours || hours <= 0) return state;
  const currentGameHours = (state.day || 1) * 24 + (state.time || 0);
  const endGameHours = currentGameHours + hours;
  const endDay = Math.floor(endGameHours / 24);
  const endTime = endGameHours - endDay * 24;
  return {
    ...state,
    player: {
      ...state.player,
      abilityCooldowns: {
        ...(state.player.abilityCooldowns || {}),
        [id]: { day: endDay, time: endTime },
      },
    },
  };
}

export function setCharges(state, id, count) {
  return {
    ...state,
    player: {
      ...state.player,
      abilityCharges: {
        ...(state.player.abilityCharges || {}),
        [id]: count,
      },
    },
  };
}

export function consumeCharge(state, id) {
  const remaining = (state.player.abilityCharges?.[id] || 0) - 1;
  const next = { ...(state.player.abilityCharges || {}) };
  if (remaining <= 0) delete next[id];
  else next[id] = remaining;
  return {
    ...state,
    player: { ...state.player, abilityCharges: next },
  };
}

export function getCharges(state, id) {
  return state.player?.abilityCharges?.[id] || 0;
}

// Returns a non-null def if the ability is unlocked AND off cooldown AND
// (if it has charges) doesn't already have charges active.
export function canActivate(state, id) {
  const def = getAbilityDef(id);
  if (!def || def.kind !== 'active') return null;
  if (!hasAbility(state, id)) return null;
  if (!isCooldownReady(state, id)) return null;
  if (def.charges && getCharges(state, id) > 0) return null;
  return def;
}
