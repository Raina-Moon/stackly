import type { UniqueIdentifier } from '@dnd-kit/core';

// ID 타입 상수
export const DND_TYPE = {
  COLUMN: 'column',
  CARD: 'card',
} as const;

// 드래그 아이템 ID 생성
export function createDndId(type: 'column' | 'card', id: string): string {
  return `${type}-${id}`;
}

// ID에서 타입과 원본 ID 파싱
export function parseDndId(dndId: UniqueIdentifier): {
  type: 'column' | 'card' | null;
  id: string;
} {
  const str = String(dndId);

  if (str.startsWith('column-')) {
    return { type: 'column', id: str.replace('column-', '') };
  }

  if (str.startsWith('card-')) {
    return { type: 'card', id: str.replace('card-', '') };
  }

  return { type: null, id: str };
}

// 배열 내 아이템 재정렬
export function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = [...array];
  const [removed] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, removed);
  return newArray;
}

// 카드 위치 계산 (새 컬럼으로 이동 시)
export function calculateCardPosition(
  cards: { id: string; position: number }[],
  targetIndex: number
): number {
  if (cards.length === 0) {
    return 0;
  }

  if (targetIndex === 0) {
    return cards[0].position / 2;
  }

  if (targetIndex >= cards.length) {
    return cards[cards.length - 1].position + 1;
  }

  const prevPosition = cards[targetIndex - 1].position;
  const nextPosition = cards[targetIndex].position;
  return (prevPosition + nextPosition) / 2;
}

// 컬럼 ID 목록 추출 (position 순으로 정렬된 상태에서)
export function getColumnIds(columns: { id: string; position: number }[]): string[] {
  return [...columns]
    .sort((a, b) => a.position - b.position)
    .map((c) => c.id);
}

// 특정 컬럼의 카드 ID 목록 추출 (position 순으로 정렬된 상태에서)
export function getCardIds(
  cards: { id: string; columnId: string; position: number }[],
  columnId: string
): string[] {
  return cards
    .filter((c) => c.columnId === columnId)
    .sort((a, b) => a.position - b.position)
    .map((c) => c.id);
}
