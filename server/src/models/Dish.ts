import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const dishSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type DishDocument = InferSchemaType<typeof dishSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Dish: Model<DishDocument> =
  mongoose.models.Dish || mongoose.model<DishDocument>("Dish", dishSchema);
