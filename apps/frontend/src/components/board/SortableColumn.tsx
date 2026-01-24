'use client';

import { useSortable } from '@dnd-kit/sortable';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { CSS } from '@dnd-kit/utilities';
import { createDndId } from '@/utils/dnd';

export interface DragHandleProps {
  ref: (element: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

interface SortableColumnProps {
  columnId: string;
  children: (props: { dragHandleProps: DragHandleProps }) => React.ReactNode;
}

export default function SortableColumn({ columnId, children }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: createDndId('column', columnId),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        dragHandleProps: {
          ref: setActivatorNodeRef,
          attributes,
          listeners,
        },
      })}
    </div>
  );
}
