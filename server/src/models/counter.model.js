import { Schema, model } from 'mongoose';

const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = model('Counter', counterSchema);

/** Atomically returns the next value of a named sequence (1, 2, 3, ...). */
export async function nextSequence(name) {
  const counter = await Counter.findOneAndUpdate({ _id: name }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return counter.seq;
}
