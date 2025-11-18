import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../config/s3.js";

const uploadResume = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET!,
    acl: "private",
    key: (req, file, cb) => {
      cb(null, `resumes/${Date.now()}-${file.originalname}`);
    },
  }),
});
