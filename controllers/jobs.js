//I added 
const Job = require('../models/Jobs');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors')
// Job.create, Job.findOne,
//req.user._id for your createdBy
//8:20:35 to 9:34:30 


const getAllJobs = async (req, res) => {
    const jobs = await Job.find({ createdBy: req.user.userId }).sort('createdAt')
    res.status(StatusCodes.OK).json({ jobs, count: jobs.length })
  }
  const getJob = async (req, res) => {
    const {
      user: { userId },
      params: { id: jobId },
    } = req
  
    const job = await Job.findOne({
      _id: jobId,
      createdBy: userId,
    })
    if (!job) {
      throw new NotFoundError(`No job with id ${jobId}`)
    }
    res.status(StatusCodes.OK).json({ job })
  }
  //STOPPED AT 9hr12min
  
  const createJob = async (req, res) => {
    req.body.createdBy = req.user.userId
    const job = await Job.create(req.body)
    res.status(StatusCodes.CREATED).json({ job })
  }
  
  const updateJob = async (req, res) => {
    const {
      body: { company, position },
      user: { userId },
      params: { id: jobId },
    } = req
  
    if (company === '' || position === '') {
      throw new BadRequestError('Company or Position fields cannot be empty')
    }
    const job = await Job.findByIdAndUpdate(
      { _id: jobId, createdBy: userId },
      req.body,
      { new: true, runValidators: true }
    )
    if (!job) {
      throw new NotFoundError(`No job with id ${jobId}`)
    }
    res.status(StatusCodes.OK).json({ job })
  }
  
  const deleteJob = async (req, res) => {
    const {
      user: { userId },
      params: { id: jobId },
    } = req
  
    const job = await Job.findByIdAndRemove({
      _id: jobId,
      createdBy: userId,
    })
    if (!job) {
      throw new NotFoundError(`No job with id ${jobId}`)
    }
    res.status(StatusCodes.OK).send()
  }
  
  module.exports = {
    createJob,
    deleteJob,
    getAllJobs,
    updateJob,
    getJob,
  }
  
//CONTROLLER MAKES THIS CALL 
  // res.render("jobs", { jobs });