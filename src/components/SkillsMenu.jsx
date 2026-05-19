import React from 'react';
import { SkillRow } from './shared/SkillRow.jsx';

export function SkillsMenu({ skills }) {
  return (
    <>
      <SkillRow name="Foraging" lvl={skills.foraging} xp={skills.foragingXp} max={skills.foraging * 30} desc="More wood per chop" />
      <SkillRow name="Hunting" lvl={skills.hunting} xp={skills.huntingXp} max={skills.hunting * 30} desc="More attack damage" />
      <SkillRow name="Crafting" lvl={skills.crafting} xp={skills.craftingXp} max={skills.crafting * 30} desc="(More uses coming)" />
    </>
  );
}
