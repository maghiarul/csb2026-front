import axios from 'axios';

// IMPORTANT: Înlocuiește cu IP-ul tău local (ex: 192.168.1.15) 
// pentru ca telefonul să vadă serverul de pe PC!
const BASE_URL = 'http://192.168.0.102:8000'; 

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Această funcție va fi apelată după Login pentru a salva token-ul
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;