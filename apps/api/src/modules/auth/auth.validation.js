//this file contains the validation rules for the 
//signup and login requests
// basically defines the schema to be used by validateRequest 
// function before the routes for signup and login
const signupValidation = {
  name: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 50,
  },
  displayName: {
    required: true,
    type: "string",
    minLength: 2,
    maxLength: 40,
  },
  email: {
    required: true,
    type: "string",
    minLength: 5,
    maxLength: 100,
  },
  password: {
    required: true,
    type: "string",
    minLength: 6,
    maxLength: 128,
  },
  role: {
    required: true,
    type: "string",
    enum: ["beaner", "beanpist", "admin"],
  },
};

const loginValidation = {
  email: {
    required: true,
    type: "string",
    minLength: 5,
    maxLength: 100,
  },
  password: {
    required: true,
    type: "string",
    minLength: 6,
    maxLength: 128,
  },
};

module.exports = {
  signupValidation,
  loginValidation,
};
