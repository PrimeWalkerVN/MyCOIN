import axios from 'axios';
import queryString from 'query-string';
const axiosClient = axios.create({
  baseURL: `http://localhost:${process.env.REACT_APP_API_PORT || 4000}`,
  headers: {
    'content-type': 'application/json'
  },
  paramsSerializer: params => queryString.stringify(params)
});

axiosClient.interceptors.request.use(async config => {
  return {
    ...config,
    headers: {
      ...config.headers // but you can override for some requests
    }
  };
});

axiosClient.interceptors.response.use(
  response => {
    if (response && response.data) {
      return response.data;
    }

    return response;
  },
  error => {
    throw error;
  }
);

export default axiosClient;
