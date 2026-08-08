/**
 * Request matchers shared by the specs that assert how card grids fetch their
 * match scores.
 *
 * `GET /matching/property/:id` is the per-card route the grids used to fan out
 * over — one request per card on screen. `POST /matching/scores` is the batch
 * that replaced it: one request per grid.
 */
export const isPerCardMatch = (url: string): boolean =>
  /\/matching\/property\/[^/?]+/.test(url);

export const isBatchScores = (url: string): boolean =>
  /\/matching\/scores$/.test(url);
