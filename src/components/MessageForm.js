import React from "react";
import "../styles/Messageform.css";

const MessageForm = ({ text, setText, handleSubmit }) => {
  return (
    <form
      className="position-absolute bottom-0 start-0 end-0 p-2"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        className="form-control"
        placeholder="Type here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </form>
  );
};

export default MessageForm;
