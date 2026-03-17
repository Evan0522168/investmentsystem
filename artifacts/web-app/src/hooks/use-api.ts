import { useHealthCheck } from "@workspace/api-client-react";

/**
 * Custom hooks wrapping the generated API hooks for easier consumption
 * or extended functionality in the components.
 */

export function useSystemHealth() {
  const { data, isLoading, error, refetch } = useHealthCheck();
  
  return {
    status: data?.status || 'unknown',
    isHealthy: data?.status === 'ok',
    isLoading,
    error,
    refetch
  };
}
