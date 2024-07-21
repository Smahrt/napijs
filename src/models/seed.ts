import mongoose, { Document, Schema } from "mongoose";


export interface ISeedLog extends Document {
  description: string;
  collections: string[];
}

const seedSchemaDefinition = {
  description: { type: String, required: true },
}

const seedSchema = new Schema(seedSchemaDefinition, { timestamps: true });
export const SeedLog = mongoose.model<ISeedLog>("SeedLog", seedSchema);
