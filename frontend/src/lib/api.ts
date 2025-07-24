import customInstance from './axios-instance';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * This is the function that Orval will use to make API calls.
 * It's a simple wrapper around our configured axios instance.
 * @param config The AxiosRequestConfig from the generated client
 */
export const customApi = <T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
  return customInstance(config);
};