export const PRODUCTION_STAGES = [
  'Manuscript Received',
  'Editing',
  'Cover Design',
  'Typesetting',
  'Proofreading',
  'ISBN Assignment',
  'Printing',
  'Distribution Setup',
  'Published & Live',
];

export const PUBLISHED_STATUS = 'Published & Live';

export function parseProductionStage(status) {
  const name = status.replace(/^In Production\s*-\s*/i, '').trim();
  const index = PRODUCTION_STAGES.findIndex((stage) => stage.toLowerCase() === name.toLowerCase());
  return {
    name,
    step: index === -1 ? null : index + 1,
    totalSteps: PRODUCTION_STAGES.length,
    isPublished: status === PUBLISHED_STATUS,
  };
}
