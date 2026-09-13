export type UserRole = "cliente" | "cocinero";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Dish = {
  _id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  available: boolean;
};

export type CartItem = {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

export type OrderStatus =
  | "pendiente"
  | "en_preparacion"
  | "listo"
  | "entregado";

export type OrderItem = {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  deliveryAddress: string;
  total: number;
  paypalOrderId: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
};
