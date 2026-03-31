import { useContext, createContext, useState, useEffect } from "react";
import { account } from "../lib/appwriteConfig.js";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    /** Cleared after onboarding calls `updatePhone` or on signout / failed signup. Appwrite requires password to attach phone. */
    const [pendingPhoneSetupPassword, setPendingPhoneSetupPassword] = useState(null);

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

    const rememberPasswordForPhoneSetup = (password) => {
        setPendingPhoneSetupPassword(password);
    };

    const consumePasswordForPhoneSetup = () => {
        const p = pendingPhoneSetupPassword;
        setPendingPhoneSetupPassword(null);
        return p;
    };

    const clearPasswordForPhoneSetup = () => {
        setPendingPhoneSetupPassword(null);
    };

    const refreshUser = async () => {
        const u = await account.get();
        setUser(u);
        return u;
    };

    const signout = async () => {
        try {
            await account.deleteSession("current");
        } catch (error) {
            console.log(error);
        } finally {
            setSession(null);
            setUser(null);
            setPendingPhoneSetupPassword(null);
        }
    };

    const contextData = {
        loading,
        session,
        user,
        signin,
        signout,
        rememberPasswordForPhoneSetup,
        consumePasswordForPhoneSetup,
        clearPasswordForPhoneSetup,
        refreshUser,
    };
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