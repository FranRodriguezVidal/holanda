export interface MatchConnectionConfig {
  roomCode: string;
  playerId: string;
}

export const buildMatchUrl = ({ roomCode, playerId }: MatchConnectionConfig): string =>
  `wss://example-holanda-worker.local/${roomCode}?playerId=${encodeURIComponent(playerId)}`;

export const prepareConnection = (_config: MatchConnectionConfig): void => {
  // This placeholder is intentionally left for future Cloudflare WebSocket integration.
};
