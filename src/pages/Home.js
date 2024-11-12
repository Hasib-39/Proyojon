import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { db } from "../firebaseConfig";
import "../styles/Home.css"; // Import the CSS file

const Home = () => {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("");
  const [locationService, setLocationService] = useState(false);

  // Define categories with image URLs
  const categories = [
    { value: "", label: "All", color: "#000000", image: "/images/all.jpg" },
    { value: "Stationaries", label: "Stationaries", color: "#FF6347", image: "/images/stationaries.png" },
    { value: "Books", label: "Books", color: "#442a82", image: "/images/books.jpg" },
    { value: "Clothes", label: "Clothes", color: "#4682B4", image: "/images/clothes.jpg" },
    { value: "Electronics", label: "Electronics", color: "#8A2BE2", image: "/images/electronics.jpg" },
    { value: "Furniture", label: "Furniture", color: "#DAA520", image: "/images/furniture.jpg" },
    { value: "Miscellaneous", label: "Miscellaneous", color: "#FF69B4", image: "/images/miscellaneous.jpg" },
  ];

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

  return (
    <div className="mt-5 container">
      <h3 className="section-title">Explore All Categories</h3>
      <div className="category-container">
        {categories.map((category) => (
          <div
            key={category.value}
            className="category-item"
            onClick={() => setFilter(category.value)}
          >
            <div
              className="category-icon-wrapper"
              style={{
                backgroundImage: `url(${category.image})`,
              }}
            ></div>
            <p className="category-label">{category.label}</p>
          </div>
        ))}
      </div>
      
      <div className="filter-container">
        <h5>Filter By Category</h5>
        <select
          className="form-select filter-select"
          onChange={(e) => setFilter(e.target.value)}
        >
          {categories.map((category) => (
            <option
              key={category.value}
              value={category.value}
            >
              {category.label}
            </option>
          ))}
        </select>
        <label className="location-toggle">
          <h5>Location Service: {locationService ? "On" : "Off"}</h5>
          <input
            type="checkbox"
            className="toggle-checkbox"
            onChange={handleToggle}
            checked={locationService}
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      <h3 className="section-title">Recent Posts</h3>
      <div className="row ads-container">
        {ads.map((ad) => (
          <div className="size_ad" key={ad.adId}>
            <AdCard ad={ad} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
