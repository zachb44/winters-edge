import React from 'react';
import { ResourceRow } from './shared/ResourceRow.jsx';

export function InventoryMenu({ equipment, inventory, onEat }) {
  return (
    <>
      <div className="text-slate-300 mb-2">
        Gear: {equipment.hasKnife && '🔪'} {equipment.hasCoat && '🧥'}
        {inventory.fur_coat > 0 && ' 🧥+'}
        {inventory.hatchet > 0 && ' 🪓'}
        {inventory.hunting_bow > 0 && ' 🏹'}
        {inventory.rifle > 0 && ' 🎯'}
      </div>
      <div className="space-y-1">
        <ResourceRow icon="🪵" name="Wood" count={inventory.wood} />
        <ResourceRow icon="🪨" name="Stone" count={inventory.stone} />
        <ResourceRow icon="🔧" name="Scrap" count={inventory.scrap} />
        <ResourceRow icon="🧵" name="Cloth" count={inventory.cloth} />
        <ResourceRow icon="🦊" name="Pelts" count={inventory.pelts} />
        {inventory.rare_pelt > 0 && <ResourceRow icon="🐻" name="Bear Pelt" count={inventory.rare_pelt} />}
        <ResourceRow icon="🥫" name="Rations" count={inventory.food} action={inventory.food > 0 && (() => onEat('food'))} actionLabel="Eat +30" />
        <ResourceRow icon="🍖" name="Raw Meat" count={inventory.raw_meat} action={inventory.raw_meat > 0 && (() => onEat('raw_meat'))} actionLabel="Eat +15" />
        <ResourceRow icon="🍗" name="Cooked" count={inventory.cooked_meat} action={inventory.cooked_meat > 0 && (() => onEat('cooked_meat'))} actionLabel="Eat +40" />
        {inventory.dried_meat > 0 && <ResourceRow icon="🥓" name="Dried Meat" count={inventory.dried_meat} action={() => onEat('dried_meat')} actionLabel="Eat +35" />}
        <ResourceRow icon="🟡" name="Fat" count={inventory.fat} action={inventory.fat > 0 && (() => onEat('fat'))} actionLabel="Eat +25🔥" />
        {inventory.medkit > 0 && <ResourceRow icon="🏥" name="Medkit" count={inventory.medkit} action={() => onEat('medkit')} actionLabel="Heal" />}
      </div>
      <div className="mt-2 text-slate-400 border-t border-slate-700 pt-2">
        💡 Cook: click an active campfire while you have raw meat.
      </div>
    </>
  );
}
