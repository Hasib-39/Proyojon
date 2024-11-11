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
    const docRef = doc(db, 'favorites', ad.adId);
    const unsub = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setUsers(docSnapshot.data().users || []);
      }
    });

    return () => unsub();
  }, [ad.id]);

  const categories = [
    { value: "", label: "All", color: "#a8c7bf" }, 
    { value: "Books & Stationaries", label: "Books & Stationaries", color: "#odbec3" }, 
    { value: "Clothes", label: "Clothes", color: "#d6bf32" }, 
    { value: "Electronics", label: "Electronics", color: "#2c71bf" }, 
    { value: "Furniture", label: "Furniture", color: "#9a1d30" }, 
    { value: "Miscellaneous", label: "Miscellaneous", color: "#5c3c92" }, 
  ];

  const toggleFavorite = async () => {
    const isFav = users.includes(auth.currentUser.uid);
    await updateDoc(doc(db, 'favorites', ad.adId), {
      users: isFav ? users.filter((id) => id !== auth.currentUser.uid) : [...users, auth.currentUser.uid],
    });
  };

  const categoryColor = categories.find(cat => cat.value === ad.category)?.color || "#000000";

  return (
    <div className='card position-relative'>
      <Link to={adLink}>
        <img
          src={ad.images[0]?.url}
          alt={ad.title}
          className="card-img-top"
          style={{ width: '100%', height: '200px' }}
        />
      </Link>
      <div className="card-body">
        <p className='d-flex justify-content-between align-items-center'>
        <Link to={adLink} >
          <h5 className="card-title">{ad.title}</h5>
        </Link>
          {users?.includes(auth.currentUser?.uid) ? (
            <AiFillHeart size={30} onClick={toggleFavorite} className="text-danger" />
          ) : (
            <AiOutlineHeart size={30} onClick={toggleFavorite} className="text-danger" />
          )}
        </p>
        <small className="category" style={{backgroundColor : categoryColor}}>{ad.category}</small>
        <Link to={adLink}>
          <p className="card-text">
            {ad.location ? ad.location : "Unknown"} - <Moment fromNow>{ad.publishedAt.toDate()}</Moment>
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdCard;
