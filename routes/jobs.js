const express = require("express");
const router = express.Router();

const {
  createJob,
  getAllJobs,
  updateJob,
  getJob,
  deleteJob,
} = require('../controllers/jobs');

router.route('/').get(getAllJobs).post(createJob)
router.route('/new').get(createJob)
router.route('/edit:id').get(getJob)
router.route('/update:id').post(updateJob)
router.route('/delete:id').post(deleteJob)

module.exports = router;