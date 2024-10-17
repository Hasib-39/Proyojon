

// Navbar.js
// import React, { useContext } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { AuthContext } from '../context/auth';
// import { doc, updateDoc } from 'firebase/firestore';
// import { signOut } from 'firebase/auth'; // Ensure signOut is imported from firebase/auth
// import { auth, db } from '../firebaseConfig';

// const Navbar = () => {
//     const { user, unread } = useContext(AuthContext);
//     const navigate = useNavigate();

//     console.log('User in Navbar:', user); // Debugging log

//     const handleSignout = async () => {
//         if (user) {
//             // Update user doc
//             await updateDoc(doc(db, 'users', user.uid), {
//                 isOnline: false,
//             });
//             // Logout
//             await signOut(auth);
//             // Navigate to login
//             navigate("/auth/login");
//         }
//     };

//     return (
//         <nav className="navbar navbar-expand-md bg-light navbar-light sticky-top shadow-sm">
//             <div className="container-fluid">
//                 <Link className="navbar-brand" to="/">
//                      প্রয়োজন
//                 </Link>
//                 <button
//                     className="navbar-toggler"
//                     type="button"
//                     data-bs-toggle="collapse"
//                     data-bs-target="#navbarSupportedContent"
//                     aria-controls="navbarSupportedContent"
//                     aria-expanded="false"
//                     aria-label="Toggle navigation"
//                 >
//                     <span className="navbar-toggler-icon"></span>
//                 </button>
//                 <div className="collapse navbar-collapse" id="navbarSupportedContent">
//                     <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
//                         {user ? (
//                             <>
//                                 <li className="nav-item">
//                                     <Link className="nav-link position-relative" to="/chat">
//                                        Chat
//                                        {unread.length ? (
//                                         <span className="position-absolute top-10 start-90 translate-middle p-1 bg- danger border border-light rounded circle">
//                                             <span className="Visually-hidden">New Alerts</span>
//                                         </span>
//                                        ) : null}
//                                     </Link>
//                                 </li>
//                                    <li className="nav-item">
//                                     <Link className="nav-link" to={`/profile/${user.uid}`}>
//                                        Profile
//                                     </Link>
//                                 </li>
//                                 <li className="nav-item">
//                                     <Link className="nav-link" to={`/sell`}>
//                                        Donate
//                                     </Link>
//                                 </li>
//                                 <li className="nav-item">
//                                     <Link className="nav-link" to={`/favorites`}>
//                                        My Favourites
//                                     </Link>
//                                 </li>
                                
//                                 <button className="btn btn-danger btn-sm" onClick={handleSignout}>
//                                     Log out
//                                 </button>
//                             </>
//                         ) : (
//                             <>
//                                 <li className="nav-item">
//                                     <Link className="nav-link" to="/auth/register">
//                                         Register
//                                     </Link>
//                                 </li>
//                                 <li className="nav-item">
//                                     <Link className="nav-link" to="/auth/login">
//                                         Login
//                                     </Link>
//                                 </li>
//                             </>
//                         )}
//                     </ul>
//                 </div>
//             </div>
//         </nav>
//     );
// };

// export default Navbar;


import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebaseConfig';

const Navbar = () => {
    const { user, unread } = useContext(AuthContext);
    const navigate = useNavigate();

    console.log('User in Navbar:', user); // Debugging log

    const handleSignout = async () => {
        if (user) {
            // Update user doc
            await updateDoc(doc(db, 'users', user.uid), {
                isOnline: false,
            });
            // Logout
            await signOut(auth);
            // Navigate to login
            navigate("/auth/login");
        }
    };

    return (
        <nav className="navbar navbar-expand-md bg-light navbar-light sticky-top shadow-sm">
            <div className="container-fluid">
                <Link className="navbar-brand d-flex align-items-center" to="/">
                    <img
                        src="/প্রয়োজন_Arin.png"
                        alt="Logo"
                        style={{ width: '150px', marginRight: '20px' }} // Adjust width and margin as needed
                    />
                    
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
                        {user ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link position-relative" to="/chat">
                                        Chat
                                        {unread.length ? (
                                            <span className="position-absolute top-10 start-90 translate-middle p-1 bg-danger border border-light rounded-circle">
                                                <span className="visually-hidden">New Alerts</span>
                                            </span>
                                        ) : null}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/profile/${user.uid}`}>
                                        Profile
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/sell`}>
                                        Donate
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to={`/favorites`}>
                                        My Favourites
                                    </Link>
                                </li>
                                <button className="btn btn-danger btn-sm" onClick={handleSignout}>
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
                                    <Link className="nav-link" to="/auth/login">
                                        Login
                                    </Link>
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
