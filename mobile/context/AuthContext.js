import { useContext, createContext, useState, useEffect } from "react";
import { account } from "../lib/appwriteConfig.js";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        await checkAuth();
    };

    const checkAuth = async () => {
        try {
            const [currentSession, currentUser] = await Promise.all([
                account.getSession("current"),
                account.get(),
            ]);
            setSession(currentSession);
            setUser(currentUser);
        } catch (error) {
            console.log(error);
            setSession(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signin = async ({ email, password }) => {
        try {
            const responseSession = await account.createEmailPasswordSession(
                email,
                password
            );
            setSession(responseSession);
            const responseUser = await account.get();
            setUser(responseUser);
            return { session: responseSession, user: responseUser };
        } catch (error) {
            console.log(error);
            setSession(null);
            setUser(null);
            throw error;
        }
    };
    const signout = async () => {
        try {
            await account.deleteSession("current");
        } catch (error) {
            console.log(error);
        } finally {
            setSession(null);
            setUser(null);
        }
    };

    const contextData = { loading, session, user, signin, signout };
    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};

const useAuth = () => {
    return useContext(AuthContext);
};

export { useAuth, AuthContext, AuthProvider };