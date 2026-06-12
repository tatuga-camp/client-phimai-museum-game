import { KeyboardSensor, PointerSensor } from "@dnd-kit/react";
import { PointerActivationConstraints } from "@dnd-kit/dom";

// dnd-kit's default touch behaviour is a 250ms long-press before a drag starts
// (to avoid mistaking a scroll swipe for a drag). Because every draggable row
// has a dedicated ☰ handle with `touch-action: none`, a swipe on the handle
// can never be a page scroll — so we start the drag as soon as the finger
// moves ~5px, matching the immediate feel of a mouse drag. Mouse-on-handle
// stays instant.
export const dragSensors = [
  PointerSensor.configure({
    activationConstraints(event, source) {
      const { pointerType, target } = event;
      if (
        pointerType === "mouse" &&
        target instanceof Element &&
        (source.handle === target || source.handle?.contains(target))
      ) {
        return undefined;
      }
      return [new PointerActivationConstraints.Distance({ value: 5 })];
    },
  }),
  KeyboardSensor,
];

/** Shape of a reorder/group list entry as stored in task content. */
export type DndItem = { id: string; label: string; imageUrl?: string };
