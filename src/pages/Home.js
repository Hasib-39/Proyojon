import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { db } from "../firebaseConfig";
import "../styles/Home.css"; // Import the CSS file
import { FaMapMarkerAlt } from "react-icons/fa"; 

const Home = () => {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationService, setLocationService] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState("");

  // List of divisions in Bangladesh
  const divisions = [
    "",
    "Use Current Location",
    "Dhaka",
    "Chittagong",
    "Khulna",
    "Rajshahi",
    "Barisal",
    "Sylhet",
    "Rangpur",
    "Mymensingh",
  ];

  // Define categories with image URLs
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

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleDivisionChange = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === "Use Current Location") {
      setLocationService(true);
      setSelectedDivision("");
    } else {
      setLocationService(false);
      setSelectedDivision(selectedValue);
    }
  };

  const getSectionTitle = () => {
    if (locationService) {
      return "Items near you";
    } else if (selectedDivision) {
      return `Items near ${selectedDivision}`;
    } else {
      return "Recent Posts";
    }
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

    // // Filter by selected division if available
    // if (selectedDivision) {
    //   ads = ads.filter((ad) =>
    //     ad.division && ad.division.toLowerCase() === selectedDivision.toLowerCase()
    //   );
    // }

    setAds(ads);
  };

  useEffect(() => {
    getAds();
  }, [filter, searchQuery]);

  return (
    <div className="mt-5 container">
      {/* Header with Search Box and Division Dropdown */}
      <div className="header">
        <div className="modern-select-container">
          <FaMapMarkerAlt className="select-icon" />
          <select
            value={selectedDivision || (locationService ? "Use Current Location" : "")}
            onChange={handleDivisionChange}
            className="modern-select"
          >
            {divisions.map((division) => (
              <option key={division} value={division}>
                {division || "Select Location"}
              </option>
            ))}
          </select>
        </div>
        <img src="/images/search.png" alt="Search Icon" className="search-icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="What are you looking for?"
          className="search-input"
          />
      </div>

          <h4 className="centreit-asap" >Explore All Categories</h4>
     
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
      <h3 className="section-title">{getSectionTitle()}</h3>

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
