import type { API_VERSION } from './api-version.js';

export interface HealthOkResponseDto {
  status: 'ok';
  database: 'connected';
  wordCount: number;
  apiVersion: typeof API_VERSION;
}

export interface HealthDegradedResponseDto {
  status: 'degraded';
  database: 'disconnected';
  apiVersion: typeof API_VERSION;
}

export type HealthResponseDto = HealthOkResponseDto | HealthDegradedResponseDto;

export interface InfraHealthOkResponseDto {
  status: 'ok';
  database: 'connected';
}

export interface InfraHealthDegradedResponseDto {
  status: 'degraded';
  database: 'disconnected';
}

export type InfraHealthResponseDto = InfraHealthOkResponseDto | InfraHealthDegradedResponseDto;
