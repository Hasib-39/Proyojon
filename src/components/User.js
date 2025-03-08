

import React from "react";
import { FaUserCircle } from "react-icons/fa";
import "../styles/User.css";
import useSnapshot from "../utils/useSnapshot";

const User = ({ user, selectUser, chat, online, user1 }) => {
  const user2 = user.other.uid;
  const id =
    user1 > user2
      ? `${user1}.${user2}.${user.ad.adId}`
      : `${user2}.${user1}.${user.ad.adId}`;

  const { val } = useSnapshot("messages", id);

  return user ? (
    <div
      className={`d-flex justify-content-center justify-content-md-start my-2 p-1 ${
        user.ad.title === chat?.ad.title && user.other.name === chat?.other.name
          ? "gray"
          : ""
      }  ${val?.lastSender !== user1 && val?.lastUnread ? "unread" : ""}`}
      onClick={() => selectUser(user)}
      style={{ cursor: "pointer", position: "relative" }}
    >
      {user.other.photoUrl ? (
        <img
          src={user.other.photoUrl}
          alt={user.name}
          className="user2-img"
        />
      ) : (
        <FaUserCircle size={50} />
      )}
      <span
        style={{
          position: "absolute",
          width: "15px",
          height: "15px",
          top: 45,
          left: 35,
          borderRadius: "50%",
          border: "3px solid white", 
          backgroundColor: "transparent",
        }}
        className={`${online[user.other.uid] ? "bg-success" : "bg-danger"}`}
      ></span>
      <div className="d-none d-md-inline-flex flex-column ms-2">
        <h6 >
          <span className="user2-name">{user.other.name}</span>
          <br />
         <span className="user2-ad-name"> {user.ad.title}</span>
        </h6>        
        <small className="user-text">
          {val?.lastText?.length > 30
            ? val?.lastText.slice(0, 30)
            : val?.lastText}
        </small>
      </div>
    </div>
  ) : null;
};

export default User;
