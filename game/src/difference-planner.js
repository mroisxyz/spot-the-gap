// Turns one scene definition into the edited picture. The left panel gets scene.elements as-is;
// this module makes an independent copy and applies the seven changes to it, so no drawing code
// needs to know what a difference is. It also owns the click-to-region hit test.

/** Copy every element and apply each change's edits to the copy. Returns the copy and its targets. */
export function planEditedPicture(scene) {
  const elements = scene.elements.map((element) => ({ ...element }));
  const byId = new Map(elements.map((element) => [element.id, element]));

  for (const difference of scene.differences) {
    for (const edit of difference.ops) {
      const target = byId.get(edit.id);
      if (!target) throw new Error(`Difference ${difference.id} names a missing element ${edit.id}`);
      switch (edit.op) {
        case 'set':
          target[edit.prop] = edit.value;
          break;
        case 'hide':
          target.hidden = true;
          break;
        case 'show':
          target.hidden = false;
          break;
        case 'shift':
          target.x += edit.dx;
          target.y += edit.dy;
          break;
        case 'scale':
          target.w *= edit.factor;
          target.h *= edit.factor;
          break;
        default:
          throw new Error(`Unknown edit operation ${edit.op}`);
      }
    }
  }

  return {
    elements,
    targets: scene.differences.map((difference) => ({
      id: difference.id,
      label: difference.label,
      region: { ...difference.region },
    })),
  };
}

/** The nearest change to a click, provided the click is inside its generous hit circle. */
export function nearestTarget(targets, found, x, y, radius) {
  let best = -1;
  let bestDistance = radius;
  for (let index = 0; index < targets.length; index += 1) {
    if (found.has(index)) continue;
    const region = targets[index].region;
    const distance = Math.hypot(x - region.x, y - region.y);
    if (distance <= region.r && distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

/** Three spread-out indices, used by ?demo=play so markers are visible in screenshots. */
export function demoFindIndices(count) {
  return [0, Math.round((count - 1) / 2), count - 1].filter((index, position, list) => list.indexOf(index) === position);
}
