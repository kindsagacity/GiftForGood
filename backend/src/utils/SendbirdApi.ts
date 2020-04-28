import axios, { AxiosInstance } from 'axios';

let instance: AxiosInstance = generateAxiosInstance();

/**
 * Function to create Axios instance
 */
function generateAxiosInstance(): AxiosInstance {
  return axios.create({
    baseURL: process.env.SENDBIRD_API_URL,
    headers: {
      'Api-Token': process.env.SENDBIRD_API_TOKEN,
      'Content-type': 'application/json',
    },
  });
}

/**
 * Function to implement GET method without auth information
 */
export function get(url: string) {
  return instance.get(url);
}

/**
 * Function to implement POST method without auth information
 */
export function post(url: string, data: any) {
  return instance.post(url, data);
}

/**
 * Function to implement PUT method without auth information
 */
export function put(url: string, data: any) {
  return instance.put(url, data);
}

/**
 * Function to implement DELETE method without auth information
 */
export function del(url: string) {
  return instance.delete(url);
}

/**
 * Summary of HTTP Methods for RESTful APIs
 */
export const api = {
  get,
  post,
  put,
  delete: del,
};
