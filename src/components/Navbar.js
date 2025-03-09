import { signOut } from "firebase/auth";
import { doc, updateDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useSnapshot from "../utils/useSnapshot";
import { auth, db } from "../firebaseConfig";
import "../styles/Navbar.css";

const Navbar = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const user1 = auth.currentUser?.uid; // Get the user UID
    const navigate = useNavigate();
    const { val: user } = useSnapshot("users", user1); // Avoid passing undefined


    useEffect(() => {
        if (!user1) return;

        const msgRef = collection(db, "messages");
        const q = query(msgRef, where("users", "array-contains", user1));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let count = 0;
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.lastSender !== user1 && data.lastUnread === true) {
                    count++;
                }
            });

            setUnreadCount(count);
        });

        return () => unsubscribe();
    }, [user1]);

    console.log("User in Navbar:", user1); // Debugging log

    const handleSignout = async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            await updateDoc(doc(db, "users", currentUser.uid), {
                isOnline: false,
            });
            await signOut(auth);
            navigate("/auth/login");
        }
    };

    const handleLogin = () => {
        navigate("/auth/login");
    };

    return (
        <nav className="navbar navbar-expand-md bg-light navbar-light sticky-top shadow-sm">
            <div className="container-fluid">
                <Link className="navbar-brand d-flex align-items-center" to="/">
                    <img src="/প্রয়োজন_Arin.png" alt="Logo" className="logo-image" />
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                        {user1 ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/profile/${user1}`}>
                                        {user?.photoUrl ? (
                                            <img
                                                src={user.photoUrl}
                                                alt="Profile"
                                                style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    display: "block",
                                                    margin: "0 auto"
                                                }}
                                            />
                                        ) : (
                                            <span className="placeholder-avatar">👤</span> // Default placeholder
                                        )}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link to="/chat" className="nav-link">
                                        Chat
                                        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/sell`}>
                                        Post
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/favorites`}>
                                        My Favourites
                                    </Link>
                                </li>
                                <button className="logout-btn" onClick={handleSignout}>
                                    Log out
                                </button>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/auth/register">
                                        Register
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button className="btn btn-primary" onClick={handleLogin}>
                                        Login
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;