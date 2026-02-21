import mongoose from 'mongoose';
import { SupplementStackModel, ISupplementStack } from './models/SupplementStack';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Compute expiration date for a stack. Returns null if no duration set.
 */
export function computeExpiresAt(stack: { startsAt?: Date | null; durationWeeks?: number | null }): Date | null {
  if (!stack.startsAt || !stack.durationWeeks) return null;
  return new Date(new Date(stack.startsAt).getTime() + stack.durationWeeks * MS_PER_WEEK);
}

/**
 * Enrich a stack object (plain or lean) with a computed expiresAt field.
 */
export function withExpiresAt<T extends { startsAt?: Date | null; durationWeeks?: number | null }>(
  stack: T,
): T & { expiresAt: Date | null } {
  return { ...stack, expiresAt: computeExpiresAt(stack) };
}

/**
 * Idempotent migration: convert legacy `active` boolean + `activatedAt`
 * to `status` enum + `startsAt` + `durationWeeks`.
 * Safe to call on every startup — no-ops if already migrated.
 */
export async function migrateStackStatuses(): Promise<void> {
  const collection = mongoose.connection.collection('supplement_stacks');

  const needsMigration = await collection.findOne({ active: { $exists: true } });
  if (!needsMigration) return;

  // active: true → status: 'active', startsAt from activatedAt
  await collection.updateMany(
    { active: true },
    [
      {
        $set: {
          status: 'active',
          startsAt: { $ifNull: ['$activatedAt', new Date()] },
          durationWeeks: null,
        },
      },
      { $unset: ['active', 'activatedAt'] },
    ],
  );

  // active: false → status: 'inactive'
  await collection.updateMany(
    { active: false },
    [
      {
        $set: {
          status: 'inactive',
          startsAt: null,
          durationWeeks: null,
        },
      },
      { $unset: ['active', 'activatedAt'] },
    ],
  );

  console.log('[stack-lifecycle] Migration complete: active/activatedAt → status/startsAt/durationWeeks');
}

/**
 * Process automatic stack transitions:
 * 1. Expire active stacks past their duration
 * 2. Activate scheduled stacks whose startsAt has arrived
 */
export async function processStackTransitions(): Promise<void> {
  const now = new Date();

  // 1. Expire active stacks that have surpassed their duration
  const activeStacks = await SupplementStackModel.find({
    status: 'active',
    durationWeeks: { $ne: null },
    startsAt: { $ne: null },
  }).lean();

  for (const stack of activeStacks) {
    const expiresAt = computeExpiresAt(stack);
    if (expiresAt && expiresAt <= now) {
      await SupplementStackModel.updateOne({ _id: stack._id }, { status: 'expired' });
      console.log(`[stack-lifecycle] Stack "${stack.name}" expired`);
    }
  }

  // 2. Activate scheduled stacks whose startsAt has arrived
  const readyStacks = await SupplementStackModel.find({
    status: 'scheduled',
    startsAt: { $lte: now },
  }).sort({ startsAt: -1 }); // most recent first

  if (readyStacks.length > 0) {
    // Deactivate any currently active stack
    await SupplementStackModel.updateMany({ status: 'active' }, { status: 'inactive' });

    // Activate the most recently scheduled
    readyStacks[0].status = 'active';
    await readyStacks[0].save();
    console.log(`[stack-lifecycle] Activated scheduled stack "${readyStacks[0].name}"`);

    // Mark remaining past-due scheduled stacks as inactive (they were skipped)
    for (let i = 1; i < readyStacks.length; i++) {
      readyStacks[i].status = 'inactive';
      await readyStacks[i].save();
    }
  }
}
