import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { db } from "../firebaseConfig";
import "../styles/Home.css"; // Add CSS file for custom styling

const Home = () => {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("");
  const [locationService, setLocationService] = useState(false);
  const categories = [
    { value: "", label: "All", color: "#000000" }, // default black
    { value: "Stationaries", label: "Stationaries", color: "#FF6347" }, // Tomato
    { value: "Books", label: "Books", color: "#442a82" }, // Violet
    { value: "Clothes", label: "Clothes", color: "#4682B4" }, // SteelBlue
    { value: "Electronics", label: "Electronics", color: "#8A2BE2" }, // BlueViolet
    { value: "Furniture", label: "Furniture", color: "#DAA520" }, // GoldenRod
    { value: "Miscellaneous", label: "Miscellaneous", color: "#FF69B4" }, // HotPink
  ];

  const handleToggle = () => {
    setLocationService(!locationService);
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

  return (
    <div className="mt-5 container">
      <h3 style={{ marginBottom: "20px" }}>Explore All Categories</h3>
      <div className="category-container d-flex justify-content-around flex-wrap mb-5">
        {categories.map((category) => (
          <div
            key={category.value}
            className="category-item text-center"
            onClick={() => setFilter(category.value)}
            style={{ cursor: "pointer" }}
          >
            <div className="category-icon-wrapper">
              <img
                src={`/icons/${category.icon}`}
                alt={category.label}
                className="category-icon"
              />
            </div>
            <p className="category-label">{category.label}</p>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-center align-items-center mb-5 form">
        <label className="form-check-label" htmlFor="locationToggle">
          <h5>Location Service: {locationService ? "On" : "Off"}</h5>
        </label>
        <div className="form-switch d-inline-block ms-2">
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
      <h3 style={{ marginBottom: "20px" }}>Recent Posts</h3>
      <div className="row" style={{ marginTop: "20px" }}>
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
