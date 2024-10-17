import React, { useEffect, useState } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import Moment from 'react-moment';
import { Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

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

  const toggleFavorite = async () => {
    const isFav = users.includes(auth.currentUser.uid);
    await updateDoc(doc(db, 'favorites', ad.adId), {
      users: isFav ? users.filter((id) => id !== auth.currentUser.uid) : [...users, auth.currentUser.uid],
    });
  };

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
        <p className="d-flex justify-content-between align-items-center">
          <small>{ad.category}</small>
          {users?.includes(auth.currentUser?.uid) ? (
            <AiFillHeart size={30} onClick={toggleFavorite} className="text-danger" />
          ) : (
            <AiOutlineHeart size={30} onClick={toggleFavorite} className="text-danger" />
          )}
        </p>
        <Link to={adLink}>
          <h5 className="card-title">{ad.title}</h5>
        </Link>
        <Link to={adLink}>
          <p className="card-text">
            {ad.location} - <Moment fromNow>{ad.publishedAt.toDate()}</Moment>
          </p>
        </Link>
      </div>
    </div>
  );
};

export default AdCard;
