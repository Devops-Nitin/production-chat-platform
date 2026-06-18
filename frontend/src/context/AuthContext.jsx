import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeUser = (userData) => {
    if (!userData) return null;

    return {
      ...userData,
      _id:
        userData._id ||
        userData.id ||
        userData.userId ||
        userData.user?._id ||
        userData.user?.id ||
        "",
      id:
        userData.id ||
        userData._id ||
        userData.userId ||
        userData.user?._id ||
        userData.user?.id ||
        "",
      username:
        userData.username ||
        userData.name ||
        userData.email ||
        "User",
      name:
        userData.name ||
        userData.username ||
        userData.email ||
        "User",
      email: userData.email || "",
      profilePicture: userData.profilePicture || "",
      statusMessage: userData.statusMessage || "",
      about: userData.about || "",
      department: userData.department || "",
      phone: userData.phone || "",
      isOnline: userData.isOnline || false,
      lastSeen: userData.lastSeen || null,
    };
  };

  const saveUser = (userData) => {
    const normalizedUser = normalizeUser(userData);

    setUserState(normalizedUser);

    if (normalizedUser) {
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem("user");
    }
  };

  const saveToken = (tokenData) => {
    setTokenState(tokenData || null);

    if (tokenData) {
      localStorage.setItem("token", tokenData);
    } else {
      localStorage.removeItem("token");
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserState(normalizeUser(parsedUser));
      } catch (error) {
        console.error("Stored user parse error:", error);
        localStorage.removeItem("user");
      }
    }

    if (storedToken) {
      setTokenState(storedToken);
    }

    setLoading(false);
  }, []);

  const login = (userData, tokenData) => {
    saveUser(userData);
    saveToken(tokenData);
  };

  const logout = () => {
    saveUser(null);
    saveToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        setUser: saveUser,
        setToken: saveToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
