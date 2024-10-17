import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import { db, storage, auth } from "../firebaseConfig";
import { FaUserAlt, FaCloudUploadAlt } from "react-icons/fa";
import moment from "moment";
import AdCard from "../components/AdCard";
import useSnapshot from "../utils/useSnapshot";

const monthAndYear = (date) =>
  `${moment(date).format("MMMM").slice(0, 3)} ${moment(date).format("YYYY")}`;

const Profile = () => {
  const { id } = useParams();  
  const [img, setImg] = useState("");
  const [ads, setAds] = useState([]);

  const { val: user } = useSnapshot("users", id);

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
    if (img) {
      uploadImage();
    }
    getAds();
  }, [img]);

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
            style={{ widht: "100px", height: "100px", borderRadius: "50%" }}
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
