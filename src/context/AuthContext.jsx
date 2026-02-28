import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, runTransaction } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    async function signup(email, password, username, address, city) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (username) {
            await updateProfile(userCredential.user, { displayName: username });
        }

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = username.length >= 2
            ? username.substring(0, 2).toUpperCase()
            : (username.charAt(0) + '0').toUpperCase();

        const sequenceRef = doc(db, "sequences", `users_${dateStr}`);

        let sequenceNumber = 1;

        try {
            await runTransaction(db, async (transaction) => {
                const seqDoc = await transaction.get(sequenceRef);
                if (!seqDoc.exists()) {
                    transaction.set(sequenceRef, { count: 1 });
                    sequenceNumber = 1;
                } else {
                    sequenceNumber = seqDoc.data().count + 1;
                    transaction.update(sequenceRef, { count: sequenceNumber });
                }
            });
        } catch (e) {
            console.error("Transaction failed: ", e);
            sequenceNumber = Math.floor(Math.random() * 999) + 1;
        }

        const seqStr = sequenceNumber.toString().padStart(3, '0');
        const customUserId = `${prefix}-${dateStr}-${seqStr}`;

        const newUserDoc = {
            userId: customUserId,
            username: username,
            email: email,
            address: address || "",
            city: city || "Kakinada",
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, "users", userCredential.user.uid), newUserDoc);
        setUserData(newUserDoc);

        return userCredential;
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        setUserData(null);
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    }
                } catch (error) {
                    console.error("Failed to fetch user data:", error);
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        setUserData,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
