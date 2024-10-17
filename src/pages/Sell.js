import React, { useState } from 'react';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { storage, db, auth } from '../firebaseConfig';
import { doc, addDoc, collection, setDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const categories = ["Books & Stationaries", "Clothes", "Electronics", "Furniture", "Miscellaneous"];
const locations = [
  "Dhaka",
  "Chittagong",
  "Khulna",
  "Rajshahi",
  "Barisal",
  "Sylhet",
  "Rangpur",
  "Mymensingh"
];

const Sell = () => {
  const navigate = useNavigate();
  const [values, setValues] = useState({
    images: [],
    title: "",
    category: "",
    contactnum: "",
    location: "",
    description: "",
    error: "",
    loading: false,
  });

  const {
    images,
    title,
    category,
    contactnum,
    location,
    description,
    error,
    loading,
  } = values;

  const handleChange = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setValues({ ...values, error: "", loading: true });

    try {
      // loop through images
      let imgs = [];
      if (images.length) {
        for (let image of images) {
          const imgRef = ref(storage, `ads/${Date.now()} - ${image.name}`);
          const result = await uploadBytes(imgRef, image);
          const fileUrl = await getDownloadURL(ref(storage, result.ref.fullPath));
          imgs.push({ url: fileUrl, path: result.ref.fullPath });
        }
      }
      // add data to Firestore
      const result = await addDoc(collection(db, 'ads'), {
        images: imgs,
        title,
        category,
        contactnum,
        location,
        description,
        isDonated: false,
        publishedAt: Timestamp.fromDate(new Date()),
        postedBy: auth.currentUser.uid,
      });

      await setDoc(doc(db,'ads',result.id),
        {
          adId: result.id,
        },
        {
          merge: true,
        }
      );

      await setDoc(doc(db, 'favorites', result.id), {
        users: []
      });

      setValues({
        images: [],
        title: '',
        category: '',
        contactnum: '',
        location: '',
        description: '',
        loading: false,
      });
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
        <select name="location" className="form-select" value={location} onChange={handleChange}>
          <option value="">Select Location</option>
          {locations.map((location) => (
            <option value={location} key={location}>
              {location}
            </option>
          ))}
        </select>
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
      {error ? <p className="text-center text-danger">{error}</p> : null}
      <div className="mb-3 text-center">
        <button className="btn btn-secondary btn-sm" disabled={loading}>Create</button>
      </div>
    </form>
  );
};

export default Sell;
