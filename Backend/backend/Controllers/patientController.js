const { request, response } = require("express");
const { body } = require("express-validator");
const mongoose = require("mongoose");
require("../Models/patientModel");
const PatientSchema = mongoose.model("patientModel");
require("../Models/emailModel");
const emailSchema = mongoose.model("email");
const jwt = require("jsonwebtoken");
//image multer ...................
const multer = require("multer");
//const sharp = require("sharp")// this pakage for resize image to fit
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/img/patient");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
  },
});
//const storage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only JPEG and PNG is allowed!"), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadPatientImg = upload.single("image");

exports.displayPatient = async (request, response, next) => {
  let sortBy,
    feilds,
    removeFields = ["select", "sort"],
    reqQuery = { ...request.query }; //spread operator to get the data of the object
  // remove the filters from the query
  removeFields.forEach((param) => {
    delete reqQuery[param];
  });
  // including mongo operators
  let queryString = JSON.stringify(reqQuery);
  queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);
  // select
  if (request.query.select) {
    feilds = request.query.select.split(",").join(" ");
  }
  // sort
  if (request.query.sort) {
    feilds = request.query.sort.split(",").join(" ");
  } else {
    sortBy = request.body.id;
  }
  await PatientSchema.find(JSON.parse(queryString))
    .populate({ path: "appointment" })
    .select(feilds)
    .sort(sortBy)
    .then((result) => {
      response.status(200).json(result);
    })
    .catch((error) => {
      next(error);
    });
};

exports.displayPatientById = (request, response, next) => {
  PatientSchema.findOne({ _id: request.params.id }).then((data) => {
    if (data != null) {
      response.status(201).json(data);
    } else {
      next(new Error("Patient Not Found"));
    }
  });
};

exports.addPatient = (request, response, next) => {
  let newPatient = new PatientSchema({
    fname: request.body.fname,
    lname: request.body.lname,
    age: request.body.age,
    email: request.body.email,
    password: request.body.password,
    telephone: request.body.telephone,
    role: request.body.role,
    address: {
      city: request.body.address.city,
      street: request.body.address.street,
      building: request.body.address.building,
    },
    appointment: request.body.appointment,
  });
  newPatient.save().then(() => {
    response.status(201).json({ Data_Status: "Patient Inserted" });
  });
};

exports.deletePatientById = (request, response, next) => {
  PatientSchema.deleteOne({ _id: request.params.id }).then((data) => {
    if (data != null) {
      response.status(201).json({ Data_Status: "Patient Deleted" });
    } else {
      next(new Error("Patient Not Found"));
    }
  });
};

exports.updatePatient = (request, response, next) => {
  if (!request.file) return next();
  console.log(request.file);
  //     //console.log(req.body)

  request.body.image = request.file.filename;
  // PatientSchema.updateOne({
  //         _id: request.params.id
  //     }, {
  //         $set: {
  //             fname: request.body.fname,
  //             lname: request.body.lname,
  //             age: request.body.age,
  //             email: request.body.email,
  //             password: request.body.password,
  //             telephone: request.body.telephone,
  //             address: {
  //                 city: request.body.address.city,
  //                 building: request.body.address.building,
  //                 street: request.body.address.street
  //             },
  //             image: request.body.image
  //         }
  //     })
  const { id } = request.params;
  PatientSchema.findByIdAndUpdate(id, request.body, { new: true })
    .then(async (data) => {
      if (request.body.email) {
        const existingEmail = await emailSchema.findOne({ email: request.body.email });
        if (!existingEmail) {
          await emailSchema.create({ email: request.body.email });
        }
      }
      response.status(201).json({ message: "Patient Updated" });
    })
    .catch((error) => {
      new Error("Patient Can't Be Found");
    });
};

// exports.login = async(request,response,next)=>{
//     const {email,password} = request.body;
//     if(!email || !password)
//     {
//         response.status(400).json({ErrorMessage:'Please Enter Your Email and Password'})
//     }
//     const user = await userSchema.findOne({email}).select('+password');
//     if(!user)
//     {
//         response.status(401).json({ErrorMessage:'Invalid Email'})
//     }
//     const isMatch = await user.comparePassword(password);
//     if(!isMatch)
//     {
//         response.status(401).json({ErrorMessage:'Invalid Password'})
//     }
//     else
//     {
//         let token= jwt.sign({id:user._id,role:user.role},process.env.SECRET_KEY,{expiresIn:"1h"});
//          if(user.role=='Patient')
//         {
//             response.status(200).json({success:"Patient",token:token});
//         }
//         else
//         {
//             response.status(403).json({success:"failed"});
//         }

//     }
// };
