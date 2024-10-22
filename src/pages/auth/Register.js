import React, {useState} from 'react';
import {auth,db} from '../../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc,doc,Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const[values,setValues]= useState({
    name: "",
    email:"",
    password:'',
    confirmPassword:'',
    error:'',
    loading: false
  })

  const navigate=useNavigate();
  const {name,email,password,confirmPassword,error,loading}=values;

  const handleChange =e => setValues({ ...values,[e.target.name]: e.target.value });

  const handleSubmit= async e => {
    e.preventDefault();

    if(!name||!email||!password||!confirmPassword){
      setValues({ ...values,error: "All fields are required"});
      return;
    }
    if(password!==confirmPassword){
      setValues({ ...values,error: "Passwords must match"});
      return;
    }

    setValues({ ...values,error: "",loading:true});

    try{
      const result=await createUserWithEmailAndPassword(auth,email,password);
      await setDoc(doc(db,"users", result.user.uid), {
        uid: result.user.uid,
        name,
        email,
        createdAt: Timestamp.fromDate(new Date()),
        isOnline: true
    })
       setValues({
        name:"",
        email:"",
        password:"",
        confirmPassword:"",
        error:"",
        loading:false,
       });

       navigate("/");
    } catch(error){
        setValues({ ...values,error:error.message,loading:false});
    }

  }

  return (
  <form className="shadow rounded p-3 mt-5 form" onSubmit={handleSubmit}>
    <h3 className='text-center mb-3'>Register!</h3>
    <div className="mb-3">
      <label htmlFor="name" classname="form-label">
        Name
      </label>
      <input type="text" className="form-control" name="name" value={name} onChange={handleChange} /> 
    </div>
    <div className="mb-3">
      <label htmlFor="email" classname="form-label">
        Email
      </label>
      <input type="email" className="form-control" name="email" value={email} onChange={handleChange} /> 
    </div>
    <div className="mb-3">
      <label htmlFor="password" classname="form-control">
        Password
      </label>
      <input type="password" className="form-control" name="password" value={password} onChange={handleChange} /> 
    </div>
    <div className="mb-3">
      <label htmlFor="confirmPassword" classname="form-label">
        Confirm Password
      </label>
      <input type="password" className="form-control" name="confirmPassword" value={confirmPassword} onChange={handleChange} /> 
    </div>
    {error ? <p className="text-center text danger"> {error}</p>:null}
    <div className="text-center mb-3">
      <button className="btn btn-secondary btn-sm" disable={loading}>
        Register
        </button>
    </div>
  </form>
  )
}

export default Register
