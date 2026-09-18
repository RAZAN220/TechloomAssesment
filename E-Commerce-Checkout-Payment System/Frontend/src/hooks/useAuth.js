import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Access the authentication context: { user, booting, login, register, logout, isAdmin }.
 */
const useAuth = () => useContext(AuthContext);

export default useAuth;
export { useAuth };
