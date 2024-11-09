import React, { useEffect, useRef } from "react";
import Moment from "react-moment";
import "../styles/Message.css";

const Message = ({ msg, user1 }) => {
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msg]);

  return (
    <div
      className={`p-1 ${msg.sender === user1 ? "text-end" : ""}`}
      ref={scrollRef}
    >
      <p
        className={`message-text ${
          msg.sender === user1 ? "" : "gray"}`}
      >
        {msg.text}
      </p>
      <br />
        <small>
          <Moment fromNow className="time-label">{msg.createdAt.toDate()}</Moment>
        </small>
    </div>
  );
};

export default Message;
