export interface HealthOkResponseDto {
  status: 'ok';
  database: 'connected';
  wordCount: number;
}

export interface HealthDegradedResponseDto {
  status: 'degraded';
  database: 'disconnected';
}

export type HealthResponseDto = HealthOkResponseDto | HealthDegradedResponseDto;
