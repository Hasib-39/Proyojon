import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Message from "../components/Message";
import MessageForm from "../components/MessageForm";
import User from "../components/User";
import { auth, db } from "../firebaseConfig";
import "../styles/Chat.css";



const Chat = () => {
  const [chat, setChat] = useState(null);
  const [text, setText] = useState("");
  const [users, setUsers] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [online, setOnline] = useState({});
  const location = useLocation();
  const user1 = auth.currentUser?.uid;

  const selectUser = async (user) => {
    if (!user || !user.ad) return;

    setChat(user);
    const user2 = user.other.uid;
    const id =
      user1 > user2
        ? `${user1}.${user2}.${user.ad.adId}`
        : `${user2}.${user1}.${user.ad.adId}`;
    const msgsRef = collection(db, "messages", id, "chat");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (querySnapshot) => {
      let msgs = [];
      querySnapshot.forEach((doc) => msgs.push(doc.data()));
      setMsgs(msgs);
    });
    const docSnap = await getDoc(doc(db, "messages", id));
    if (docSnap.exists()) {
      if (docSnap.data().lastSender !== user1 && docSnap.data().lastUnread) {
        await updateDoc(doc(db, "messages", id), {
          lastUnread: false,
        });
      }
    }
    return () => unsub();
  };

  const getChat = async (ad) => {
    if (!ad || !ad.adId) return;

    const buyer = await getDoc(doc(db, "users", user1));
    const seller = await getDoc(doc(db, "users", ad.postedBy));
    setChat({ ad, me: buyer.data(), other: seller.data() });
    // Set up listener for ad changes
    const adRef = doc(db, "ads", ad.adId);
    const unsubAd = onSnapshot(adRef, async (adSnap) => {
      if (!adSnap.exists()) {
        // Ad is deleted, delete the chat
        const chatId =
          user1 > ad.postedBy
            ? `${user1}.${ad.postedBy}.${ad.adId}`
            : `${ad.postedBy}.${user1}.${ad.adId}`;
        const chatRef = collection(db, "messages", chatId, "chat");
        const chatSnapshot = await getDocs(chatRef);
        const deletePromises = chatSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
        await deleteDoc(doc(db, "messages", chatId));
        setChat(null);
      }
    });
    return () => unsubAd();
  };

  const getList = async () => {
    const msgRef = collection(db, "messages");
    const q = query(msgRef, where("users", "array-contains", user1));
    const msgsSnap = await getDocs(q);
    const messages = msgsSnap.docs.map((doc) => doc.data());
    const users = [];
    const unsubscribes = [];
    for (const message of messages) {
      const adRef = doc(db, "ads", message.ad);
      const meRef = doc(
        db,
        "users",
        message.users.find((id) => id === user1)
      );
      const otherRef = doc(
        db,
        "users",
        message.users.find((id) => id !== user1)
      );
      const adDoc = await getDoc(adRef);
      const meDoc = await getDoc(meRef);
      const otherDoc = await getDoc(otherRef);
      if (adDoc.exists() && meDoc.exists() && otherDoc.exists()) {
        users.push({
          ad: adDoc.data(),
          me: meDoc.data(),
          other: otherDoc.data(),
        });
        const unsub = onSnapshot(otherRef, (doc) => {
          setOnline((prev) => ({
            ...prev,
            [doc.data().uid]: doc.data().isOnline,
          }));
        });
        unsubscribes.push(unsub);
      }
    }
    setUsers(users);
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  };

  useEffect(() => {
    if (location.state?.ad) {
      getChat(location.state.ad);
    }
    getList();
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chat || !chat.ad) return;

    const user2 = chat.other.uid;
    const chatId =
      user1 > user2
        ? `${user1}.${user2}.${chat.ad.adId}`
        : `${user2}.${user1}.${chat.ad.adId}`;
    await addDoc(collection(db, "messages", chatId, "chat"), {
      text,
      sender: user1,
      createdAt: Timestamp.fromDate(new Date()),
    });
    await updateDoc(doc(db, "messages", chatId), {
      lastText: text,
      lastSender: user1,
      lastUnread: true,
    });
    setText("");
  };

  return (
    <div className="row g-0">
      <div className="headline">Chats</div>
      <div
        className="col-2 col-md-2 users_container"
      >
        {users.map((user, i) => (
          <User
            key={i}
            user={user}
            selectUser={selectUser}
            chat={chat}
            online={online}
            user1={user1}
          />
        ))}
      </div>
      <div className="col-6 col-md-6 position-relative chat-inbox">
        {chat ? (
          <>
            <div className="text-center mt-1 user2-container">
              {/* <img
                src={chat.other?.photoUrl}
                alt={chat.other?.name || "User"} 
                className="user2-img"
              />
              <h3 className="user2-title">{chat.other?.name || "Unknown User"}</h3> */}
            </div>
            <div className="p-2 user2-container">
              <div className="d-flex align-items-center">
                <img
                  src={chat.ad.images[0]?.url}
                  alt={chat.ad.title}
                  className="img-thumbnail"
                />
                <div className="d-flex align-items-center justify-content-between flex-grow-1 ms-1">
                  <div>
                    <h6 className="ad-title">{chat.ad.title}</h6>
                    <small>{chat.ad.price}</small>
                  </div>
                  <Link
                    className="btn btn-secondary btn-sm"
                    to={`/${chat.ad.category.toLowerCase()}/${chat.ad.adId}`}
                  >
                    View Post
                  </Link>
                </div>
              </div>
            </div>
            <div className="messages overflow-auto">
              {msgs.map((msg, i) => (
                <Message key={i} msg={msg} user1={user1} />
              ))}
            </div>
            <MessageForm
              text={text}
              setText={setText}
              handleSubmit={handleSubmit}
            />
          </>
        ) : (
          <div className="text-center mt-5">
            <h3 className="user2-title">Select a user to start conversation</h3>
          </div>
        )}
      </div>
      <div className="col-3 col-md-3 position-relative chat-info">
        {/* <img
          src={chat.other?.photoUrl}
          alt={chat.name}
          className="user2-img-3c"
        />
        <br />
        <h3 className="chat-title">{chat.other?.name || "Unknown User"}</h3> */}
      </div>
    </div>
  );
};

export default Chat;
