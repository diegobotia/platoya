import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { config } from "./config.js";
import { User } from "./models/User.js";
import { Dish } from "./models/Dish.js";
import { Order } from "./models/Order.js";

const dishes = [
  {
    name: "Ceviche clásico",
    description: "Pescado fresco marinado en limón con cebolla morada y cilantro.",
    price: 12.5,
    imageUrl:
      "https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&q=80",
    category: "Entradas",
  },
  {
    name: "Empanadas de carne",
    description: "Tres empanadas horneadas con carne jugosa y especias.",
    price: 8.0,
    imageUrl:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80",
    category: "Entradas",
  },
  {
    name: "Lomo saltado",
    description: "Tiras de res salteadas con cebolla, tomate y papas fritas.",
    price: 16.9,
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
    category: "Principales",
  },
  {
    name: "Pollo a la brasa",
    description: "Cuarto de pollo con papas y ensalada fresca.",
    price: 14.5,
    imageUrl:
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80",
    category: "Principales",
  },
  {
    name: "Pasta alfredo",
    description: "Fettuccine cremoso con parmesano y un toque de pimienta.",
    price: 13.0,
    imageUrl:
      "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=800&q=80",
    category: "Principales",
  },
  {
    name: "Bowl vegetariano",
    description: "Quinoa, aguacate, garbanzos, vegetales asados y tahini.",
    price: 11.5,
    imageUrl:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    category: "Principales",
  },
  {
    name: "Hamburguesa PlatoYa",
    description: "Carne 180g, queso cheddar, bacon y salsa de la casa.",
    price: 12.0,
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80",
    category: "Principales",
  },
  {
    name: "Tiramisú",
    description: "Postre italiano con café, mascarpone y cacao.",
    price: 6.5,
    imageUrl:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&q=80",
    category: "Postres",
  },
  {
    name: "Brownie con helado",
    description: "Brownie caliente con helado de vainilla.",
    price: 7.0,
    imageUrl:
      "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&q=80",
    category: "Postres",
  },
  {
    name: "Limonada de hierbabuena",
    description: "Refrescante, natural y ligeramente efervescente.",
    price: 3.5,
    imageUrl:
      "https://images.unsplash.com/photo-1523677011780-c8eeac26f8ea?w=800&q=80",
    category: "Bebidas",
  },
  {
    name: "Café espresso",
    description: "Doble shot con crema densa.",
    price: 2.8,
    imageUrl:
      "https://images.unsplash.com/photo-1510590337439-92e8c1293d6b?w=800&q=80",
    category: "Bebidas",
  },
  {
    name: "Chicha morada",
    description: "Bebida tradicional de maíz morado con especias.",
    price: 3.2,
    imageUrl:
      "https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80",
    category: "Bebidas",
  },
];

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected for seed");

  await Promise.all([User.deleteMany({}), Dish.deleteMany({}), Order.deleteMany({})]);

  const passwordHash = await bcrypt.hash("password123", 10);

  const [cocinero, cliente] = await User.create([
    {
      name: "Ana Cocina",
      email: "cocinero@platoya.com",
      passwordHash,
      role: "cocinero",
    },
    {
      name: "Diego Cliente",
      email: "cliente@platoya.com",
      passwordHash,
      role: "cliente",
    },
  ]);

  await Dish.insertMany(dishes.map((d) => ({ ...d, available: true })));

  console.log("Seed completo");
  console.log(`Cocinero: ${cocinero.email} / password123`);
  console.log(`Cliente:  ${cliente.email} / password123`);

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
