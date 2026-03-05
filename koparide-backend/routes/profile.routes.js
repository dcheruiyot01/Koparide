// routes/profile.routes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const uploadProfile = require("../middleware/profile.middleware");
const uploadLicense = require("../middleware/license.middleware");
const profileController = require("../controllers/profile.controller");

router.get("/", auth, profileController.getProfile);
router.put("/", auth, profileController.updateProfile);
router.post(
    "/upload-image",
    auth,
    uploadProfile.single("image"),
    profileController.uploadProfileImage
);
router.post(
    "/upload-license",
    auth,
    uploadLicense.single("license"),
    profileController.uploadLicenseImage
);


module.exports = router;
