import React, { useState, useEffect, useRef } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage, db, auth } from '../firebaseConfig';
import { doc, addDoc, collection, setDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import 'leaflet/dist/leaflet.css';
import "../styles/Sell.css";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41], // default size
  iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
  popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
  shadowSize: [41, 41], // size of the shadow
});

L.Marker.prototype.options.icon = defaultIcon;

const categories = ["Stationaries", "Books", "Clothes", "Electronics", "Furniture","Vehicles & Parts","Games & Hobbies" ,"Miscellaneous"];

const Sell = () => {
  const navigate = useNavigate();
  
  // const { isLoaded, loadError } = useLoadScript({
  //   googleMapsApiKey: process.env.REACT_APP_MAPS_APIKEY,
  //   libraries: ["places"], // Ensure libraries prop is provided
  // });

  const [values, setValues] = useState({
    images: [],
    title: "",
    category: "",
    Price: "",
    contactnum: "",
    description: "",
    error: "",
    loading: false,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState(""); 
  const [coordinates, setCoordinates] = useState(null); 
  const [mapCenter, setMapCenter] = useState({ lat: 23.8103, lng: 90.4125 }); // Default location (Dhaka)
  const [suggestions, setSuggestions] = useState([]); // To store dynamic search suggestions

  const searchRef = useRef(null); // Reference for the search input
  const debounceTimeout = useRef(null); // Reference for debounce timeout

  const {
    images,
    title,
    category,
    contactnum,
    Price,
    description,
    error,
    loading,
  } = values;

  useEffect(() => {
    const fetchCurrentLocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords;
  
              // Update coordinates and map center
              setCoordinates({ lat: latitude, lng: longitude });
              setMapCenter({ lat: latitude, lng: longitude });
  
              // Fetch and set location name using Nominatim API
              await fetchRegionName(latitude, longitude, setLocation);
            } catch (error) {
              console.error('Error fetching region name:', error);
            }
          },
          (error) => {
            console.error('Error getting geolocation:', error);
          }
        );
      } else {
        console.error('Geolocation is not supported by this browser.');
      }
    };
  
    fetchCurrentLocation();
  }, []);
  

  const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const MapClickHandler = ({ setCoordinates, setMapCenter, fetchRegionName }) => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng; // Get latitude and longitude from click event
        setCoordinates({ lat, lng });
        setMapCenter({ lat, lng });
        await fetchRegionName(lat, lng); // Fetch region name using the lat/lng
      },
    });
    return null;
  };

  const fetchRegionName = async (lat, lng) => {
    try {
      // Use OpenStreetMap's Nominatim Reverse Geocoding API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
  
      // Extract relevant location details
      const areaLevel3 = data.address.village || data.address.town || data.address.city;
      const areaLevel2 = data.address.state || data.address.region;
  
      let locationString = "Unknown location";
      if (areaLevel3 && areaLevel2) {
        locationString = `${areaLevel3}, ${areaLevel2}`;
      } else if (areaLevel2) {
        locationString = areaLevel2;
      }
  
      // Update location state
      setLocation(locationString);
    } catch (error) {
      console.error("Error fetching region name:", error);
    }
  };
  
  const fetchSearchSuggestions = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const results = await response.json();
      setSuggestions(results.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      })));
    } catch (error) {
      console.error("Error fetching search suggestions:", error);
    }
  };


  const handleInputChange = (e) => {
    const query = e.target.value;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (query.trim() === "") {
      setSuggestions([]);
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSearchSuggestions(query);
    }, 300); // Debounce delay
  };

  const handleSuggestionClick = (suggestion) => {
    setCoordinates({ lat: suggestion.lat, lng: suggestion.lon });
    setMapCenter({ lat: suggestion.lat, lng: suggestion.lon });
    setLocation(suggestion.display_name);
    setSuggestions([]);
    searchRef.current.value = suggestion.display_name; // Update the input field with the selected location
  };
  
  const MapUpdater = ({ center }) => {
    const map = useMap();
    map.setView(center, map.getZoom());
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location || !coordinates) {
      setValues({ ...values, error: "Please select a location on the map." });
      return;
    }

    setValues({ ...values, error: "", loading: true });

    try {
      let imgs = [];
      if (images.length) {
        for (let image of images) {
          const imgRef = ref(storage, `ads/${Date.now()} - ${image.name}`);
          const result = await uploadBytes(imgRef, image);
          const fileUrl = await getDownloadURL(ref(storage, result.ref.fullPath));
          imgs.push({ url: fileUrl, path: result.ref.fullPath });
        }
      }

      const result = await addDoc(collection(db, 'ads'), {
        images: imgs,
        title,
        category,
        Price,
        contactnum,
        location, 
        coordinates, 
        description,
        isDonated: false,
        publishedAt: Timestamp.fromDate(new Date()),
        postedBy: auth.currentUser.uid,
      });

      await setDoc(doc(db, 'ads', result.id), {
        adId: result.id,
      }, { merge: true });

      await setDoc(doc(db, 'favorites', result.id), {
        users: []
      });

      setValues({
        images: [],
        title: '',
        category: '',
        contactnum: '',
        Price:'',
        description: '',
        loading: false,
      });
      setLocation("");
      setCoordinates(null);
      navigate('/');
    } catch (error) {
      setValues({ ...values, error: error.message, loading: false });
    }
  };

  // if (!isLoaded) {
  //   return <div>Loading...</div>; // Show loading until Google Maps is fully loaded
  // }

  // if (loadError) {
  //   return <div>Error loading Google Maps API</div>; // Show an error message if there is an issue with the Google Maps API
  // }

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-10 col-xl-12">
          <form className="form shadow rounded p-3 mt-5 custom-from" 
          onSubmit={handleSubmit}
          style={{ maxWidth: '100%', width: '1000px', margin: '0 auto' }}
          >
            <h3 className="text-center mb-3">Create a Post</h3>
            <div className="form-content">
              <div className="form-fields">
                <div className="mb-3 text-center upload-box">
                  <label htmlFor="image">
                    <div className="upload-btn">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : (
                      <>
                        <FaCloudUploadAlt size={30} /> Upload Image 
                      </>
                    )}
                    </div>
                  </label>
                  <input
                    type="file"
                    id="image"
                    style={{ display: "none" }}
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setValues({ ...values, images: files });
                      if (files.length > 0) {
                        const reader = new FileReader();
                        reader.onload = () => setImagePreview(reader.result);
                        reader.readAsDataURL(files[0]);
                      }
                    }}
                  />
                  {/* {imagePreview && <img src={imagePreview} alt="Preview" className="image-preview" />} */}
                </div>
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" name="title" value={title} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <select name="category" className="form-select" value={category} onChange={handleChange}>
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input type="text" className="form-control" name="contactnum" value={contactnum} onChange={handleChange} />
                </div>

                <div className="mb-3">
                  <label className="form-label">Price</label>
                  <input type="text" className="form-control" name="Price" value={Price} onChange={handleChange} placeholder='Type Free to Donate' />
                </div>

                <div className="mb-3">
                  <label className="form-label">Item Description & Specific Address</label>
                  <textarea
                    name="description"
                    cols="30"
                    rows="3"
                    className="form-control"
                    value={description}
                    onChange={handleChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Search Location</label>
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search for a location"
                    className="form-control"
                    onChange={handleInputChange}
                  />
                  {suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="suggestion-item"
                        >
                          {suggestion.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p>Selected Location: {location || "Not selected"}</p>
                </div>
              </div>
              <div className="map-container">
                <label className="form-label">Location on Map</label>
                <div style={{ width: '100%', height: '400px' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={14}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Add the OSM Tile Layer */}
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {/* Add a Marker if Coordinates are Selected */}
                  {coordinates && (
                    <Marker position={[coordinates.lat, coordinates.lng]} />
                  )}
                  <MapUpdater center={mapCenter} />
                  {/* Handle Map Clicks */}
                  <MapClickHandler
                    setCoordinates={setCoordinates}
                    setMapCenter={setMapCenter}
                    fetchRegionName={fetchRegionName} // Pass fetchRegionName as a prop
                  />
                </MapContainer>
                </div>
              </div>
            </div>
            <div className="text-center">
              <button className="btn btn-secondary btn-sm" disabled={loading}>Create</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
};

export default Sell;
