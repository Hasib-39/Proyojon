import React, { useState, useEffect, useRef } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage, db, auth } from '../firebaseConfig';
import { doc, addDoc, collection, setDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useLoadScript, MarkerF, Autocomplete } from '@react-google-maps/api';
import "../styles/Sell.css";


const categories = ["Stationaries", "Books", "Clothes", "Electronics", "Furniture", "Miscellaneous"];

const Sell = () => {
  const navigate = useNavigate();
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_MAPS_APIKEY,
    libraries: ["places"], // Ensure libraries prop is provided
  });

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

  const autocompleteRef = useRef(null); // Create a ref for Autocomplete

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
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates({ lat: latitude, lng: longitude });
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

  const handleChange = (e) => setValues({ ...values, [e.target.name]: e.target.value });

  const handleMapClick = async (event) => {
    const { latLng } = event;
    const lat = latLng.lat();
    const lng = latLng.lng();
    setCoordinates({ lat, lng });
    await fetchRegionName(lat, lng);
  };

  const fetchRegionName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_MAPS_APIKEY}`
      );
      const data = await response.json();
      
      const areaLevel3 = data.results.find(result =>
        result.types.includes("administrative_area_level_3")
      );
      const areaLevel2 = data.results.find(result =>
        result.types.includes("administrative_area_level_2")
      );
  
      let locationString = "Unknown location";
      if (areaLevel3 && areaLevel2) {
        locationString = `${areaLevel3.address_components[0].long_name}, ${areaLevel2.address_components[0].long_name}`;
      } else if (areaLevel2) {
        locationString = areaLevel2.address_components[0].long_name;
      }
  
      setLocation(locationString);
    } catch (error) {
      console.error("Error fetching region name:", error);
    }
  };

  // Handle the Autocomplete instance and the place change
  const handleAutocompleteLoad = (autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const handleSearchSelect = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace(); // Use the autocomplete instance here
      if (place && place.geometry) {
        const { location } = place.geometry;
        setCoordinates({
          lat: location.lat(),
          lng: location.lng(),
        });
        setMapCenter({
          lat: location.lat(),
          lng: location.lng(),
        });
        setLocation(place.formatted_address);
      } else {
        console.error("Cannot get place or place geometry");
      }
    }
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

  if (!isLoaded) {
    return <div>Loading...</div>; // Show loading until Google Maps is fully loaded
  }

  if (loadError) {
    return <div>Error loading Google Maps API</div>; // Show an error message if there is an issue with the Google Maps API
  }

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
                  {/* <Autocomplete onLoad={handleAutocompleteLoad} onPlaceChanged={handleSearchSelect}>
                    <input type="text" className="form-control" placeholder="Search for a location" />
                  </Autocomplete> */}
                  <Autocomplete
                    onLoad={handleAutocompleteLoad}
                    onPlaceChanged={handleSearchSelect}
                  >
                    <input
                      type="text"
                      placeholder="Search for a location"
                      className="form-control"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // Prevent form submission on Enter
                          handleSearchSelect(); // Manually trigger the search selection
                        }
                      }}
                    />
                  </Autocomplete>
                  <p>Selected Location: {location || "Not selected"}</p>
                </div>
              </div>
              <div className="map-container">
                <label className="form-label">Location on Map</label>
                <div style={{ width: '100%', height: '400px' }}>
                  <GoogleMap
                    zoom={14}
                    center={mapCenter}
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    onClick={handleMapClick}
                  >
                    {coordinates && <MarkerF position={coordinates} />}
                  </GoogleMap>
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
