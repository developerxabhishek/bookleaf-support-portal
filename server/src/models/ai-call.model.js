import { Schema, model } from 'mongoose';

/** One row per LLM call: the raw data for cost and reliability monitoring. */
const aiCallSchema = new Schema(
  {
    operation: { type: String, enum: ['triage', 'draft'], required: true },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    model: { type: String, required: true },
    outcome: { type: String, enum: ['success', 'error'], required: true },
    errorReason: String,
    promptTokens: { type: Number, default: 0 },
    cachedPromptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    latencyMs: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Usage logs are operational data; keep 90 days.
aiCallSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AiCall = model('AiCall', aiCallSchema);
