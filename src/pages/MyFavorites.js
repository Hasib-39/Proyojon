import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import AdCard from '../components/AdCard';
const MyFavorites = () => {
  const [ads, setAds] = useState([]);

  const getAds = async () => {
    const favRef = collection(db, "favorites");
    const q = query(
      favRef,
      where("users", "array-contains", auth.currentUser.uid)
    );
    const docSnap = await getDocs(q);
  
    let promises = [];
    docSnap.forEach((doc) => {
      const adsRef = collection(db, "ads");
      const adsQuery = query(adsRef, where(documentId(), "==", doc.id));
      promises.push({ docId: doc.id, usersCount: doc.data().users.length, adsQuery });
    });
  
    const docs = await Promise.all(
      promises.map(({ adsQuery }) => getDocs(adsQuery))
    );
  
    let ads = [];
    docs.forEach((dSnap, index) => {
      dSnap.forEach((adDoc) => {
        ads.push({
          ...adDoc.data(),
          adId: adDoc.id,
          usersCount: promises[index].usersCount,
        });
      });
    });
  
    setAds(ads);
  };
  

  useEffect(() => {
    getAds();
  }, []);

  return (
    <div className="mt-5 container">
      {ads.length ? <h3>Favorite Posts</h3> : <h3>No Favorite Posts</h3>}
      <div className="row">
        {ads.map((ad) => (
          <div key={ad.adId} className="col-sm-6 col-md-3 mb-3">
            <AdCard ad={ad} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyFavorites;
