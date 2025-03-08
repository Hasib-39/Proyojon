import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import '../styles/AdCard.css';

const AdCard = ({ ad }) => {
  const adLink = `/${ad.category.toLowerCase()}/${ad.adId}`;
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const docRef = doc(db, "favorites", ad.adId);
    const unsub = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setUsers(docSnapshot.data().users || []);
      }
    });

    return () => unsub();
  }, [ad.adId]);

  const categories = [
    { value: "", label: "All", color: "#000000", image: "/images/all.png" },
    { value: "Stationaries", label: "Stationaries", color: "#FF6347", image: "/images/stationaries.png" },
    { value: "Books", label: "Books", color: "#442a82", image: "/images/books.png" },
    { value: "Clothes", label: "Clothes", color: "#4682B4", image: "/images/clothes.png" },
    { value: "Electronics", label: "Electronics", color: "#8A2BE2", image: "/images/electronics.jpeg" },
    { value: "Furniture", label: "Furniture", color: "#DAA520", image: "/images/furniture.png" },
    { value: "Vehicles & Parts", label: "Vehicles & Parts", color: "#FF4500", image: "/images/Vehicles.png" },
    { value: "Games & Hobbies", label: "Games & Hobbies", color: "#32CD32", image: "/images/Controller.png" },
    { value: "Miscellaneous", label: "Miscellaneous", color: "#FF69B4", image: "/images/misc.png" },
  ];

  const toggleFavorite = async () => {
    const isFav = users.includes(auth.currentUser.uid);
    await updateDoc(doc(db, "favorites", ad.adId), {
      users: isFav ? users.filter((id) => id !== auth.currentUser.uid) : [...users, auth.currentUser.uid],
    });
  };

  const categoryColor = categories.find(cat => cat.value === ad.category)?.color || "#000000";

  return (
    <div className="card position-relative">
      {/* Booked Badge */}
      {ad.isDonated && (
        <div className="booked-badge">Booked</div>
      )}

      <Link to={adLink}>
        <img
          src={ad.images[0]?.url}
          alt={ad.title}
          className="card-img-top"
          style={{ width: "100%", height: "200px" }}
        />
      </Link>
      <div className="card-body">
        <p className="d-flex justify-content-between align-items-center">
          <Link to={adLink}>
            <h5 className="card-title">{ad.title}</h5>
          </Link>
          <div className="d-flex flex-column align-items-center">
            {users?.includes(auth.currentUser?.uid) ? (
              <AiFillHeart size={30} onClick={toggleFavorite} className="text-danger" />
            ) : (
              <AiOutlineHeart size={30} onClick={toggleFavorite} className="text-danger" />
            )}
            <small className="text-muted">{users.length} </small> {/* Display favorite count */}
          </div>
        </p>
        {/* Displaying Price */}
        {ad.Price ? (
          <h6 className="card-text">
            {ad.Price.toLowerCase() === "free" ? "Free" : ` ৳${ad.Price}`}
          </h6>
        ) : (
          <h6 className="card-text">Free</h6>
        )}
        <Link to={adLink}>
          <p className="card-text">{ad.location ? ad.location : "Unknown"}</p>
          <p className="card-text-moment">
            ~ <Moment fromNow>{ad.publishedAt.toDate()}</Moment>
            <br />
            <small className="category" style={{ backgroundColor: categoryColor }}>{ad.category}</small>
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdCard;
