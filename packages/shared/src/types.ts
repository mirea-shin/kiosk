export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'completed' | 'cancelled'

export interface Category {
  id: number
  name: string
  sort_order: number
  created_at: string
}

export interface Menu {
  id: number
  category_id: number
  name: string
  description: string
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  created_at: string
}

export interface MenuOption {
  id: number
  menu_id: number
  name: string
  price: number
}

export interface Order {
  id: number
  status: OrderStatus
  total_price: number
  created_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  menu_id: number
  menu_name: string
  quantity: number
  unit_price: number
  options: MenuOption[]
}

export interface ScreensaverConfig {
  id: number
  idle_timeout_seconds: number
  updated_at: string
}
