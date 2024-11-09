import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import AdCard from "../components/AdCard";
import { db } from "../firebaseConfig";

const Home = () => {
  const [ads, setAds] = useState([]);
  const [filter, setFilter] = useState("");
  const [locationService, setLocationService] = useState(false); // Manage location service toggle
  const categories = [
    { value: "", label: "All", color: "#a8c7bf" }, 
    { value: "Books & Stationaries", label: "Books & Stationaries", color: "#518341" }, 
    { value: "Clothes", label: "Clothes", color: "#d6bf32" }, 
    { value: "Electronics", label: "Electronics", color: "#2c71bf" }, 
    { value: "Furniture", label: "Furniture", color: "#9a1d30" }, 
    { value: "Miscellaneous", label: "Miscellaneous", color: "#5c3c92" }, 
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
            {categories.map((category) => (
              <option
                key={category.value}
                value={category.value}
              >
                {category.label}
              </option>
            ))}
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
      <h3 style={{marginBottom : "20px"}}>Recent Posts</h3>
      <div className="row" style={{marginTop : "20px"}}>
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
