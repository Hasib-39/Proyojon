import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { db } from "../firebaseConfig";
import "../styles/Home.css"; // Import the CSS file

const Home = () => {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query
  const [locationService, setLocationService] = useState(false);

  // Define categories with image URLs
  const categories = [
    { value: "", label: "All", color: "#000000", image: "/images/all.png" },
    { value: "Stationaries", label: "Stationaries", color: "#FF6347", image: "/images/stationaries.png" },
    { value: "Books", label: "Books", color: "#442a82", image: "/images/books.png" },
    { value: "Clothes", label: "Clothes", color: "#4682B4", image: "/images/clothes.png" },
    { value: "Electronics", label: "Electronics", color: "#8A2BE2", image: "/images/electronics.jpeg" },
    { value: "Furniture", label: "Furniture", color: "#DAA520", image: "/images/furniture.png" },
    { value: "Vehicles & Parts", label: "Vehicles & Parts", color: "#FF4500", image: "/images/Vehicles.png" }, // Unique color for Vehicles & Parts
    { value: "Games & Hobbies", label: "Games & Hobbies", color: "#32CD32", image: "/images/Controller.png" }, // Unique color for Games & Hobbies
    { value: "Miscellaneous", label: "Miscellaneous", color: "#FF69B4", image: "/images/misc.png" },
  ];
  const handleToggle = () => {
    setLocationService(!locationService); // Toggle between true and false
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value); // Update search query state
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
    
    // Filter by search query if available
    if (searchQuery) {
      ads = ads.filter((ad) =>
        ad.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setAds(ads);
  };

  useEffect(() => {
    getAds();
  }, [filter, searchQuery]); // Re-fetch ads when searchQuery or filter changes

  return (
    <div className="mt-5 container">
      {/* Header with Search Box */}
      <div className="header">
      <img src="/images/search.png" alt="Search Icon" className="search-icon" /> {/* Image icon */}
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="What are you looking for ?"
          className="search-input"
        />
      </div>

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
