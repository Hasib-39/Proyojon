import React, { useRef, useEffect } from "react";
import Moment from "react-moment";

const Message = ({ msg, user1 }) => {
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msg]);

  return (
    <div
      className={`mb-1 p-1 ${msg.sender === user1 ? "text-end" : ""}`}
      ref={scrollRef}
    >
      <p
        className={`p-2 ${
          msg.sender === user1 ? "bg-secondary text-white" : "gray"
        }`}
        style={{
          maxWidth: "50%",
          display: "inline-block",
          borderRadius: "5px",
        }}
      >
        {msg.text}
        <br />
        <small>
          <Moment fromNow>{msg.createdAt.toDate()}</Moment>
        </small>
      </p>
    </div>
  );
};

export default Message;
