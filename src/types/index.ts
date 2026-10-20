// Tipe-tipe domain utama Anjem UIN

export type Role = "customer" | "driver" | "admin";

export type DriverStatus = "pending" | "approved" | "blocked";

export type OrderStatus =
  | "pending"
  | "assigned"
  | "on_the_way"
  | "completed"
  | "cancelled";

export type PaymentMethod = "qris_driver" | "cash";

export type ServiceSlug =
  | "antar-jemput-motor"
  | "jastip-kuliner"
  | "jastip-belanja"
  | "kirim-dokumen";

// ---- Database row types ----

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  plate_number: string;
  vehicle_type: string;
  photo_url: string | null;
  qris_url: string | null;
  status: DriverStatus;
  is_online: boolean;
  rating_avg: number;
  total_trips: number;
  last_seen: string | null;
  profile?: Pick<Profile, "full_name" | "avatar_url" | "phone">;
}

export interface Service {
  id: string;
  slug: ServiceSlug;
  name: string;
  description: string;
  icon: string;
  badge_text: string | null;
  extra_fee: number;
  is_active: boolean;
  sort_order: number;
}

export interface FareZone {
  id: string;
  name: string;
  min_km: number;
  max_km: number | null;
  base_price: number;
  per_km_price: number;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface PopularRoute {
  id: string;
  origin_name: string;
  destination_name: string;
  distance_km: number;
  is_active: boolean;
  sort_order: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  driver_id: string | null;
  driver_name?: string;
  driver_phone?: string;
  driver_plate?: string;
  service_id: string;
  service_name?: string;
  pickup_name: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_name: string;
  dropoff_lat: number;
  dropoff_lng: number;
  distance_km: number;
  fare: number;
  fare_snapshot: FareSnapshot;
  item_notes: string | null;
  items_estimate: number | null;
  payment_method: PaymentMethod;
  status: OrderStatus;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  cancel_reason: string | null;
}

export interface OrderEvent {
  id: string;
  order_id: string;
  status_from: OrderStatus | null;
  status_to: OrderStatus;
  actor_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface FareSnapshot {
  service_name: string;
  zone_name: string;
  base_price: number;
  extra_fee: number;
  per_km_extra: number;
  total: number;
  distance_km: number;
  calculated_at: string;
}

export interface Review {
  id: string;
  order_id: string;
  customer_id: string;
  driver_id: string;
  service_id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  is_sample: boolean;
  created_at: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

export interface PublicStats {
  orders_completed: number;
  drivers_online: number;
  rating_avg: number;
  review_count: number;
}

// ---- Fare calculation ----

export interface FareConfig {
  zones: FareZone[];
  serviceExtraFee: number;
}

export interface FareResult {
  zone: FareZone;
  base_price: number;
  extra_fee: number;
  per_km_extra: number;
  total: number;
  distance_km: number;
}
