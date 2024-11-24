import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { FaCloudUploadAlt, FaUserAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import AdCard from "../components/AdCard";
import { auth, db, storage } from "../firebaseConfig";
import useSnapshot from "../utils/useSnapshot";

const categories = ["Stationaries", "Books", "Clothes", "Electronics", "Furniture","Vehicles & Parts","Games & Hobbies" ,"Miscellaneous"];


const monthAndYear = (date) =>
  `${moment(date).format("MMMM").slice(0, 3)} ${moment(date).format("YYYY")}`;

const Profile = () => {
  const { id } = useParams();  
  const [img, setImg] = useState("");
  const [ads, setAds] = useState([]);
  const [interests, setInterests] = useState([]); // Default to user's saved interests

  const { val: user } = useSnapshot("users", id);

  const handleInterestChange = (category) => {
    setInterests((prev) =>
      prev.includes(category)
        ? prev.filter((interest) => interest !== category) // Remove if unchecked
        : [...prev, category] // Add if checked
    );
  };

  const saveInterests = async () => {
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        interests,
      });
      alert("Interests updated successfully!");
    } catch (error) {
      console.error("Error updating interests:", error);
      alert("Failed to update interests. Please try again.");
    }
  };
  
  
  const uploadImage = async () => {
    // create image reference
    const imgRef = ref(storage, `profile/${Date.now()} - ${img.name}`);
    if (user.photoUrl) {
      await deleteObject(ref(storage, user.photoPath));
    }
    // upload image
    const result = await uploadBytes(imgRef, img);
    // get download url
    const url = await getDownloadURL(ref(storage, result.ref.fullPath));
    // update user doc
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      photoUrl: url,
      photoPath: result.ref.fullPath,
    });
    setImg("");
  };

  const getAds = async () => {
    // create collection reference
    const adsRef = collection(db, "ads");
    // execute query
    const q = query(
      adsRef,
      where("postedBy", "==", id),
      orderBy("publishedAt", "desc")
    );
    // get data from firestore
    const docs = await getDocs(q);
    let ads = [];
    docs.forEach((doc) => {
      ads.push({ ...doc.data() });
    });
    setAds(ads);
  };

  useEffect(() => {
    if (user) {
      setInterests(user.interests || []);
    }
    if (img) {
      uploadImage();
    }
    getAds();
  }, [img, user]);

  const deletePhoto = async () => {
    const confirm = window.confirm("Delete photo permanently?");
    if (confirm) {
      await deleteObject(ref(storage, user.photoPath));
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoUrl: "",
        photoPath: "",
      });
    }
  };

  return user ? (
    <div className="mt-5 container row">
      <div className="text-center col-sm-2 col-md-3">
        {user.photoUrl ? (
          <img
            src={user.photoUrl}
            alt={user.name}
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
              margin: "0 auto"
            }}
          />
        ) : (
          <FaUserAlt size={50} />
        )}

        <div className="dropdown my-3 text-center">
          <button
            className="btn btn-secondary btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Edit
          </button>
          <ul className="dropdown-menu">
            <li>
              <label htmlFor="photo" className="dropdown-item">
                <FaCloudUploadAlt size={30} /> Upload Photo
              </label>
              <input
                type="file"
                id="photo"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setImg(e.target.files[0])}
              />
            </li>
            {user.photoUrl ? (
              <li className="dropdown-item btn" onClick={deletePhoto}>
                Remove Photo
              </li>
            ) : null}
          </ul>
        </div>

        <div className="dropdown my-3 text-center">
          <button
            className="btn btn-secondary btn-sm dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Select Interests
          </button>
          <ul className="dropdown-menu">
            {categories.map((category) => (
              <li key={category} className="dropdown-item">
                <input
                  type="checkbox"
                  id={category}
                  value={category}
                  checked={interests.includes(category)}
                  onChange={(e) => handleInterestChange(e.target.value)}
                />
                <label htmlFor={category} className="ms-2">{category}</label>
              </li>
            ))}
          </ul>
        </div>
        <h4>Interests</h4>
        <p>{interests.length ? interests.join(", ") : "No interests selected yet."}</p>
        <button className="btn btn-primary btn-sm mt-2" onClick={saveInterests}>
          Save Interests
        </button>

        <p>Member since {monthAndYear(user.createdAt.toDate())}</p>
      </div>
      <div className="col-sm-10 col-md-9">
        <h3>{user.name}</h3>
        <hr />
        {ads.length ? (
          <h4>Published Ads</h4>
        ) : (
          <h4>There are no ads published by this user</h4>
        )}
        <div className="row">
          {ads?.map((ad) => (
            <div key={ad.adId} className="col-sm-6 col-md-4 mb-3">
              <AdCard ad={ad} />
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;
};

export default Profile;
