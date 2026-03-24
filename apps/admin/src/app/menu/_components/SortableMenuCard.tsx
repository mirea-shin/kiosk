'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Menu } from '@kiosk/shared';
import MenuCard from './MenuCard';

export default function SortableMenuCard({
  menu,
  onEdit,
  onDelete,
  onToggleAvailable,
}: {
  menu: Menu;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailable: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: menu.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <MenuCard
        id={menu.id}
        name={menu.name}
        description={menu.description}
        price={menu.price}
        is_available={menu.is_available}
        image_url={menu.image_url}
        handleEditMenu={onEdit}
        handleDeleteMenu={onDelete}
        handleToggleAvailable={onToggleAvailable}
        isDragging={isDragging}
      />
    </div>
  );
}
