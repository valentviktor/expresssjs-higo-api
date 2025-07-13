import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  Number: number;
  'Name of Location': string;
  'Login Hour': string;
  'Login Date': string;
  Name: string;
  Age: number;
  Gender: string;
  Email: string;
  'No Telp': string;
  'Brand Device': string;
  'Digital Interest': string;
  'Location Type': string;
}

const CustomerSchema = new Schema<ICustomer>({
  Number: { type: Number, required: true },
  'Name of Location': { type: String, required: true },
  'Login Hour': { type: String },
  'Login Date': { type: String },
  Name: { type: String, required: true },
  Age: { type: Number },
  Gender: { type: String },
  Email: { type: String },
  'No Telp': { type: String },
  'Brand Device': { type: String },
  'Digital Interest': { type: String },
  'Location Type': { type: String },
});

CustomerSchema.index({ Name: 'text', Email: 'text', 'Name of Location': 'text', 'Brand Device': 'text' });
CustomerSchema.index({ Gender: 1 });
CustomerSchema.index({ 'Location Type': 1 });
CustomerSchema.index({ 'Brand Device': 1 });
CustomerSchema.index({ 'Digital Interest': 1 });
CustomerSchema.index({ Age: 1 });
CustomerSchema.index({ 'Login Date': 1 });

const Customer = model<ICustomer>('Customer', CustomerSchema, 'customers');

export default Customer;