import Job from "../models/Job.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "../errors/index.js";
import mongoose from "mongoose";
import moment from "moment";
import checkPermissions from "../utils/checkPermissions.js";

//*************************************** CREATE-JOB-START ********************************************************
const createJob = async (req, res) => {
  const { position, company } = req.body;

  if (!position || !company) {
    throw new BadRequestError("Please Provide All Values");
  }
  req.body.createdBy = req.user.userId;

  const job = await Job.create(req.body);
  res.status(StatusCodes.CREATED).json({ job });
};
//*************************************** CREATE-JOB-END ********************************************************

//***************************************** GET-ALL-JOBS-START ****************************************************

const getAllJobs = async (req, res) => {
  const { status, jobType, sort, search } = req.query;

  const queryObject = {
    createdBy: req.user.userId,
  };

  if (status && status !== "all") {
    queryObject.status = status;
  }

  if (jobType && jobType !== "all") {
    queryObject.jobType = jobType;
  }

  if (search) {
    queryObject.position = { $regex: search, $options: 'i' }
  }
  //Not await
  let result = Job.find(queryObject);

  // chain sort conditions
  if (sort==='latest') {
    result = result.sort('-createdAt')
  }

  if (sort==='oldest') {
    result = result.sort('createdAt')
  }

  if (sort==='a-z') {
    result = result.sort('position')
  }

  if (sort==='z-a') {
    result = result.sort('-position')
  }

  const jobs = await result;

  // const jobs = await Job.find({createdBy: req.user.userId})

  res
    .status(StatusCodes.OK)
    .json({ jobs, totalJobs: jobs.length, numOfPages: 1 });
};
//*************************************** GET-ALL-JOBS-END ****************************************************

//*************************************** UPDATE-JOB-START ****************************************************

const updateJob = async (req, res) => {
  const { id: jobId } = req.params;
  const { company, position } = req.body;

  if (!company || !position) {
    throw new BadRequestError("Please provide all values");
  }

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    throw new NotFoundError(`No job with id : ${jobId}`);
  }

  console.log(typeof req.user.userId);
  console.log(typeof job.createdBy);

  checkPermissions(req.user, job.createdBy);

  const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ updatedJob });
};
//*************************************** UPDATE-JOB-END ******************************************************

//*************************************** DELETE-JOB-START ****************************************************

const deleteJob = async (req, res) => {
  const { id: jobId } = req.params;

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    throw new NotFoundError(`No job with id : ${jobId}`);
  }

  checkPermissions(req.user, job.createdBy);

  job.remove();

  res.status(StatusCodes.OK).json({ msg: "Success!..Job removed.." });
};

//*************************************** DELETE-JOB-END ****************************************************

//*************************************** SHOW-STATS-START **************************************************

const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": -1, "_id.month": -1 },
    },
    {
      $limit: 6,
    },
  ]);

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      // accepts 0-11
      const date = moment()
        .month(month - 1)
        .year(year)
        .format("MMM Y");
      return { date, count };
    })
    .reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};

//*************************************** SHOW-STATS-END **************************************************

export { createJob, deleteJob, getAllJobs, updateJob, showStats };

// ______________________________ GET-ALL-JOBS-START ______________________________________

// const getAllJobs = async (req, res) => {
//   const { search, status, jobType, sort } = req.query
//   const queryObject = {
//     createdBy: req.user.userId,
//   }
//   if (search) {
//     queryObject.position = { $regex: search, $options: 'i' }
//   }
//   if (status !== 'all') {
//     queryObject.status = status
//   }
//   if (jobType !== 'all') {
//     queryObject.jobType = jobType
//   }
//   let result = Job.find(queryObject)

//   if (sort === 'latest') {
//     result = result.sort('-createdAt')
//   }
//   if (sort === 'oldest') {
//     result = result.sort('createdAt')
//   }
//   if (sort === 'a-z') {
//     result = result.sort('position')
//   }
//   if (sort === 'z-a') {
//     result = result.sort('-position')
//   }

//   const totalJobs = await result

//   // setup pagination
//   const page = Number(req.query.page) || 1
//   const limit = Number(req.query.limit) || 10
//   const skip = (page - 1) * limit
//   const numOfPages = Math.ceil(totalJobs.length / limit)
//   result = result.skip(skip).limit(limit)
//   // 23
//   // 4 7 7 7 2
//   const jobs = await result
//   res
//     .status(StatusCodes.OK)
//     .json({ jobs, totalJobs: totalJobs.length, numOfPages })
// }

// ______________________________ GET-ALL-JOBS-END _____________________________________

// ______________________________ UPDATE-JOB-START _____________________________________

// const updateJob = async (req, res) => {
//   const {
//     body,
//     user: { userId },
//     params: { id: jobId },
//   } = req

//   const job = await Job.findByIdAndUpdate(
//     { _id: jobId, createdBy: userId },
//     body,
//     { new: true, runValidators: true }
//   )
//   if (!job) {
//     throw new NotFoundError(`No job with id ${jobId}`)
//   }
//   res.status(StatusCodes.OK).json({ job })
// }
// ______________________________ UPDATE-JOB-END________________________________________

// ______________________________ DELETE-JOB-START _____________________________________

// const deleteJob = async (req, res) => {
//   const {
//     user: { userId },
//     params: { id: jobId },
//   } = req;

//   const job = await Job.findByIdAndRemove({
//     _id: jobId,
//     createdBy: userId,
//   });
//   if (!job) {
//     throw new NotFoundError(`No job with id ${jobId}`);
//   }
//   res.status(StatusCodes.OK).send();
// };

// ______________________________ DELETE-JOB-END _____________________________________

// ______________________________ SHOW-STATS-START _____________________________________

// const showStats = async (req, res) => {
//   let stats = await Job.aggregate([
//     { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
//     { $group: { _id: "$status", count: { $sum: 1 } } },
//   ]);
//   stats = stats.reduce((acc, curr) => {
//     const { _id: title, count } = curr;
//     acc[title] = count;
//     return acc;
//   }, {});

//   const defaultStats = {
//     pending: stats.pending || 0,
//     interview: stats.interview || 0,
//     declined: stats.declined || 0,
//   };

//   // setup default

//   let monthlyApplications = await Job.aggregate([
//     { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
//     {
//       $group: {
//         _id: {
//           year: {
//             $year: "$createdAt",
//           },
//           month: {
//             $month: "$createdAt",
//           },
//         },
//         count: { $sum: 1 },
//       },
//     },
//     { $sort: { "_id.year": -1, "_id.month": -1 } },
//     { $limit: 6 },
//   ]);

// monthlyApplications = monthlyApplications
//   .map((item) => {
//     const {
//       _id: { year, month },
//       count,
//     } = item;
//     // accepts 0-11
//     const date = moment()
//       .month(month - 1)
//       .year(year)
//       .format("MMM Y");
//     return { date, count };
//   })
//   .reverse();

//   res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
// };

// ______________________________ SHOW-STATS-END _____________________________________
