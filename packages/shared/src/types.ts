export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'completed'
  | 'cancelled';

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Menu {
  id: number;
  category_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  options?: MenuOption[];
}

export interface MenuOption {
  id: number;
  menu_id: number;
  name: string;
  price: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total_price: number;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
  options: MenuOption[];
}

export interface ScreensaverConfig {
  id: number;
  idle_timeout_seconds: number;
  updated_at: string;
}

export interface ScreensaverMedia {
  id: number;
  filename: string;
  original_name: string;
  file_type: 'image' | 'video';
  file_size: number;
  display_duration_seconds: number;
  sort_order: number;
  url: string;
  created_at: string;
}

export interface ScreensaverSyncResponse {
  idle_timeout_seconds: number;
  media: ScreensaverMedia[];
}

export interface ScreensaverChangelog {
  id: number;
  action: 'media_upload' | 'media_delete' | 'media_reorder' | 'duration_update';
  description: string;
  created_at: string;
  is_published: boolean;
}

export interface ScreensaverAdminData extends ScreensaverSyncResponse {
  last_modified_at: string | null;
  last_published_at: string | null;
  has_pending_changes: boolean;
  pending_changes: ScreensaverChangelog[];
}

export interface BrandingConfig {
  id: number;
  primary_color: string;
  updated_at: string;
}
