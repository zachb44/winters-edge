// Workbench recipes. Pure data — UI reads costs/output, logic deducts and
// adds the output to inventory.
//
// `costs` is keyed by inventory id (wood, stone, scrap, cloth, pelts,
// cooked_meat, etc.). `output.item` is the inventory key that gets +qty.
//
// Tier B items (sharp_knife, torch, arrows) currently sit in inventory
// with no game-loop effect — their hooks are deferred to future seeds.
// lantern has been a loot drop since release; crafting just adds to the
// existing count.

export const RECIPES = [
  {
    id: 'hatchet',
    name: 'Hatchet',
    icon: '🪓',
    costs: { wood: 3, stone: 2, scrap: 1 },
    output: { item: 'hatchet', qty: 1 },
    desc: '+5 damage. Chops trees faster.',
  },
  {
    id: 'hunting_bow',
    name: 'Hunting Bow',
    icon: '🏹',
    costs: { wood: 5, cloth: 2 },
    output: { item: 'hunting_bow', qty: 1 },
    desc: '+8 damage. Attack range 3 tiles.',
  },
  {
    id: 'dried_meat',
    name: 'Dried Meat',
    icon: '🥓',
    costs: { cooked_meat: 2 },
    output: { item: 'dried_meat', qty: 1 },
    desc: '+35 hunger when eaten. Shelf-stable.',
  },
  {
    id: 'fur_coat',
    name: 'Fur Coat',
    icon: '🧥',
    costs: { pelts: 3, cloth: 2 },
    output: { item: 'fur_coat', qty: 1 },
    desc: 'Slows warmth drain while equipped.',
  },
  {
    id: 'sharp_knife',
    name: 'Sharp Knife',
    icon: '🔪',
    costs: { wood: 1, scrap: 2 },
    output: { item: 'sharp_knife', qty: 1 },
    desc: 'A keen edge for close work.',
  },
  {
    id: 'torch',
    name: 'Torch',
    icon: '🔥',
    costs: { wood: 1, cloth: 1 },
    output: { item: 'torch', qty: 1 },
    desc: 'Casts light. Burns over time.',
  },
  {
    id: 'lantern',
    name: 'Lantern',
    icon: '🏮',
    costs: { wood: 1, scrap: 2, cloth: 1 },
    output: { item: 'lantern', qty: 1 },
    desc: 'Sealed flame — never burns out.',
  },
  {
    id: 'arrows',
    name: 'Arrows (×5)',
    icon: '➳',
    costs: { wood: 1, scrap: 1 },
    output: { item: 'arrows', qty: 5 },
    desc: 'Ammunition for the hunting bow.',
  },
];

export function getRecipe(id) {
  return RECIPES.find(r => r.id === id) || null;
}
