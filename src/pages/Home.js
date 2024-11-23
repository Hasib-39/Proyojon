import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { db } from "../firebaseConfig";
import "../styles/Home.css";
import { FaMapMarkerAlt } from "react-icons/fa";

const Home = () => {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationService, setLocationService] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [center, setCenter] = useState({ lat: 23.8103, lng: 90.4125 }); // Default: Dhaka
  const radius = 10; // 10 km radius

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

  const categories = [
    { value: "", label: "All", image: "/images/all.png" },
    { value: "Stationaries", label: "Stationaries", image: "/images/stationaries.png" },
    { value: "Books", label: "Books", image: "/images/books.png" },
    { value: "Clothes", label: "Clothes", image: "/images/clothes.png" },
    { value: "Electronics", label: "Electronics", image: "/images/electronics.jpeg" },
    { value: "Furniture", label: "Furniture", image: "/images/furniture.png" },
    { value: "Vehicles & Parts", label: "Vehicles & Parts", image: "/images/Vehicles.png" },
    { value: "Games & Hobbies", label: "Games & Hobbies", image: "/images/Controller.png" },
    { value: "Miscellaneous", label: "Miscellaneous", image: "/images/misc.png" },
  ];

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c ; // Distance in meters
  };

  const isWithinRadius = (adLocation, centerLocation, radius) => {
    const distance = haversineDistance(
      centerLocation.lat,
      centerLocation.lng,
      adLocation.lat,
      adLocation.lng
    );
    return distance <= radius;
  };

  const handleSearch = (event) => setSearchQuery(event.target.value);

  const handleDivisionChange = async (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === "Use Current Location") {
      setLocationService(true);
      getUserLocation();
      setSelectedDivision("");
    } else {
      setLocationService(false);
      setSelectedDivision(selectedValue);
      await updateCenterForDivision(selectedValue);
    }
  };

  const getUserLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCenter({ lat, lng });

        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        setSelectedDivision(data.address?.city || data.address?.state || "Unknown Location");
      });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const updateCenterForDivision = async (division) => {
    if (!division) return;

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        division
      )}&format=json`
    );
    const data = await response.json();

    if (data.length > 0) {
      setCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
    } else {
      console.error("Division not found");
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
    let q = filter
      ? query(adsRef, where("category", "==", filter), orderBy("publishedAt", "desc"))
      : query(adsRef, orderBy("publishedAt", "desc"));

    const adDocs = await getDocs(q);
    let ads = [];
    adDocs.forEach((doc) => ads.push({ ...doc.data() }));

    if (searchQuery) {
      ads = ads.filter((ad) =>
        ad.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    ads = ads.filter((ad) => isWithinRadius(ad.coordinates, center, radius));
    setAds(ads);
  };

  useEffect(() => {
    getAds();
  }, [filter, searchQuery, center]);

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
            <p className={`category-label ${filter === category.value ? 'selected' : ''}`}>{category.label}</p>
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
