import React from "react";

const MessageForm = ({ text, setText, handleSubmit }) => {
  return (
    <form
      className="position-absolute bottom-0 start-0 end-0 p-2"
      onSubmit={handleSubmit}
    >
      <input
        type="text"
        className="form-control"
        placeholder="Write your message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%" }}
      />
    </form>
  );
};

export default MessageForm;
