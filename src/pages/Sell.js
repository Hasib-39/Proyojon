import React, { useState, useEffect } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage, db, auth } from '../firebaseConfig';
import { doc, addDoc, collection, setDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';

const categories = ["Books & Stationaries", "Clothes", "Electronics", "Furniture", "Miscellaneous"];

const Sell = () => {
  const navigate = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_MAPS_APIKEY
  });

  const [values, setValues] = useState({
    images: [],
    title: "",
    category: "",
    contactnum: "",
    description: "",
    error: "",
    loading: false,
  });

  const [location, setLocation] = useState(null); // To store the clicked location
  const [mapCenter, setMapCenter] = useState({ lat: 23.8103, lng: 90.4125 }); // Default to Dhaka initially
  const [region, setRegion] = useState(""); // New state for region

  const {
    images,
    title,
    category,
    contactnum,
    description,
    error,
    loading,
  } = values;

  // Fetch current location and region on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation(`${latitude}, ${longitude}`);
          setMapCenter({ lat: latitude, lng: longitude });
          await fetchRegionName(latitude, longitude);
        },
        (error) => {
          console.error('Error getting geolocation', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);

  const handleChange = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });

  const handleMapClick = async (event) => {
    const { latLng } = event;
    const lat = latLng.lat();
    const lng = latLng.lng();
    setLocation(`${lat}, ${lng}`);
    await fetchRegionName(lat, lng); // Fetch region based on clicked location
  };

  const fetchRegionName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_MAPS_APIKEY}`
      );
      const data = await response.json();
      const regionResult = data.results.find(result =>
        result.types.includes("administrative_area_level_3") // Area level 3 is the Neibourhood
      );
      if (regionResult) {
        const regionName = regionResult.address_components[0].long_name;
        setRegion(regionName); // Set the fetched region name
      }
    } catch (error) {
      console.error("Error fetching region name:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!location) {
      setValues({ ...values, error: "Please select a location on the map." });
      return;
    }

    setValues({ ...values, error: "", loading: true });

    try {
      // Upload images to Firebase storage
      let imgs = [];
      if (images.length) {
        for (let image of images) {
          const imgRef = ref(storage, `ads/${Date.now()} - ${image.name}`);
          const result = await uploadBytes(imgRef, image);
          const fileUrl = await getDownloadURL(ref(storage, result.ref.fullPath));
          imgs.push({ url: fileUrl, path: result.ref.fullPath });
        }
      }

      // Add data to Firestore
      const result = await addDoc(collection(db, 'ads'), {
        images: imgs,
        title,
        category,
        contactnum,
        location,
        region, // Store the selected region name
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
        description: '',
        loading: false,
      });
      setLocation(null);
      setRegion(""); // Reset region
      navigate('/');
    } catch (error) {
      setValues({ ...values, error: error.message, loading: false });
    }
  };

  return (
    <form className="form shadow rounded p-3 mt-5" onSubmit={handleSubmit}>
      <h3 className="text-center mb-3">Create a Post</h3>
      <div className="mb-3 text-center">
        <label htmlFor="image">
          <div className="btn btn-secondary btn-sm">
            <FaCloudUploadAlt size={30} /> Upload Image
          </div>
        </label>
        <input
          type="file"
          id="image"
          style={{ display: "none" }}
          accept="image/*"
          multiple
          onChange={(e) => setValues({ ...values, images: Array.from(e.target.files) })}
        />
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
        <label className="form-label">Select Location on Map</label>
        <div style={{ width: '100%', height: '300px' }}>
          {isLoaded ? (
            <GoogleMap
              center={mapCenter}
              zoom={10}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              onClick={handleMapClick}
            >
              {location && (
                <MarkerF
                  position={{
                    lat: parseFloat(location.split(", ")[0]),
                    lng: parseFloat(location.split(", ")[1])
                  }}
                />
              )}
            </GoogleMap>
          ) : <p>Loading map...</p>}
        </div>
        <p>Selected Region: {region || "Not selected"}</p>
      </div>
      {error ? <p className="text-center text-danger">{error}</p> : null}
      <div className="mb-3 text-center">
        <button className="btn btn-secondary btn-sm" disabled={loading}>Create</button>
      </div>
    </form>
  );
};

export default Sell;
