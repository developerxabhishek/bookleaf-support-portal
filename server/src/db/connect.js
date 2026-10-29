import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  console.log(`[db] connected to "${mongoose.connection.name}"`);
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
