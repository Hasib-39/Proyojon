import React, { useState, useEffect } from "react";
import { collection, orderBy, query, getDocs, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import AdCard from "../components/AdCard";

const Home = () => {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("");
  const [locationService, setLocationService] = useState(false); // Manage location service toggle


  const handleToggle = () => {
    setLocationService(!locationService); // Toggle between true and false
  };

  const getAds = async () => {
    const adsRef = collection(db, "ads");
    let q;

    if (filter !== "") {
      q = query(
        adsRef,
        where("category", "==", filter),
        orderBy("publishedAt", "desc")
      );
    } else {
      q = query(adsRef, orderBy("publishedAt", "desc"));
    }

    const adDocs = await getDocs(q);
    let ads = [];
    adDocs.forEach((doc) => ads.push({ ...doc.data() }));
    setAds(ads);
  };

  useEffect(() => {
    getAds();
  }, [filter]);
      //"Books & Stationaries", "Clothes", "Electronics", "Furniture", "Miscellaneous"
  return (
    <div className="mt-5 container">
      <div className="d-flex justify-content-center justify-content-md-between align-items-center flex-wrap mb-5 form">
        <div>
          <h5>Filter By Category</h5>
          <select
            className="form-select"
            style={{ width: "200px", margin: "auto" }}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Books & Stationaries">Books & Stationaries</option>
            <option value="Clothes">Clothes</option>
            <option value="Electronics">Electronics</option>
            <option value="Furniture">Furniture</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>
        <div style={{ marginTop: "20px", textAlign: "center" }}>
        <label className="form-check-label" htmlFor="locationToggle">
          <h5>Location Service: {locationService ? 'On' : 'Off'}</h5>
        </label>
        <div className="form-switch d-inline-block ms-2 ">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="locationToggle"
            onChange={handleToggle}
            checked={locationService}
          />
        </div>
      </div>
      </div>
      <h3>Recent Posts</h3>
      <div className="row">
        {ads.map((ad) => (
          <div className="col-sm-6 col-md-4 col-xl-3 mb-3" key={ad.adId}>
            <AdCard ad={ad} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
