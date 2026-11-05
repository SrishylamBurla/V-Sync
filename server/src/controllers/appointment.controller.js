// import asyncHandler from "express-async-handler";
// import Appointment from "../models/Appointment.js";
// import Patient from "../models/Patient.js";
// import Branch from "../models/Branch.js";
// import User from "../models/User.js";

// const getSingleBranch = async (organizationId) =>
//   Branch.findOne({
//     organizationId,
//     status: "active",
//   }).sort({ createdAt: 1 });

// const ensurePatient = async (req, patientId) => {
//   if (!patientId) return null;

//   const patient = await Patient.findOne({
//     _id: patientId,
//     organizationId: req.user.organizationId,
//     status: "active",
//   });

//   if (!patient) return null;

//   const branch = await getSingleBranch(
//     req.user.organizationId,
//   );

//   if (
//     !branch ||
//     !patient.registeredBranchId ||
//     patient.registeredBranchId.toString() !==
//       branch._id.toString()
//   ) {
//     return null;
//   }

//   return patient;
// };

// const ensureClinician = async (req, clinicianId) => {
//   if (!clinicianId) return null;

//   return User.findOne({
//     _id: clinicianId,
//     organizationId: req.user.organizationId,
//     status: "active",
//     role: {
//       $in: ["optometrist", "doctor"],
//     },
//   });
// };

// const populateAppointment = (query) =>
//   query
//     .populate(
//       "patientId",
//       "patientNumber firstName middleName lastName phone mobile dateOfBirth email address city state",
//     )
//     .populate(
//       "clinicianId",
//       "firstName lastName role email phone",
//     )
//     .populate(
//       "createdBy",
//       "firstName lastName role",
//     )
//     .populate(
//       "updatedBy",
//       "firstName lastName role",
//     );

// /* =========================================================
//    GET APPOINTMENTS
//    Supports:
//    GET /appointments
//    GET /appointments?patientId=PATIENT_ID
//    ========================================================= */

// export const getAppointments = asyncHandler(
//   async (req, res) => {
//     const {
//       patientId,
//       date,
//       from,
//       to,
//       status,
//       clinicianId,
//       search,
//       limit = 100,
//     } = req.query;

//     const query = {
//       organizationId: req.user.organizationId,
//     };

//     /*
//      * PATIENT FILTER
//      *
//      * This is what makes Patient Details show only
//      * that patient's appointments.
//      */
//     if (patientId) {
//       const patient = await ensurePatient(
//         req,
//         patientId,
//       );

//       if (!patient) {
//         res.status(404);
//         throw new Error(
//           "Patient not found or you do not have access to this patient",
//         );
//       }

//       query.patientId = patient._id;
//     }

//     /*
//      * STATUS FILTER
//      */
//     if (status) {
//       query.status = status;
//     }

//     /*
//      * CLINICIAN FILTER
//      */
//     if (clinicianId) {
//       const clinician =
//         await ensureClinician(
//           req,
//           clinicianId,
//         );

//       if (!clinician) {
//         res.status(400);
//         throw new Error(
//           "Selected clinician is not a valid optometrist or doctor",
//         );
//       }

//       query.clinicianId = clinician._id;
//     }

//     /*
//      * DATE FILTER
//      */
//     if (date) {
//       const start = new Date(
//         `${date}T00:00:00`,
//       );

//       const end = new Date(
//         `${date}T23:59:59.999`,
//       );

//       query.appointmentDate = {
//         $gte: start,
//         $lte: end,
//       };
//     } else if (from || to) {
//       query.appointmentDate = {};

//       if (from) {
//         query.appointmentDate.$gte =
//           new Date(from);
//       }

//       if (to) {
//         query.appointmentDate.$lte =
//           new Date(to);
//       }
//     }

//     /*
//      * FETCH
//      */
//     let appointments =
//       await populateAppointment(
//         Appointment.find(query)
//           .sort({
//             appointmentDate: 1,
//           })
//           .limit(
//             Math.min(
//               Number(limit) || 100,
//               250,
//             ),
//           ),
//       ).lean();

//     /*
//      * SEARCH
//      */
//     if (search?.trim()) {
//       const term =
//         search.trim().toLowerCase();

//       appointments =
//         appointments.filter((a) => {
//           const patientName = [
//             a.patientId?.firstName,
//             a.patientId?.middleName,
//             a.patientId?.lastName,
//           ]
//             .filter(Boolean)
//             .join(" ")
//             .toLowerCase();

//           return (
//             patientName.includes(term) ||
//             a.patientId?.patientNumber
//               ?.toLowerCase()
//               .includes(term) ||
//             a.patientId?.phone
//               ?.toLowerCase()
//               .includes(term) ||
//             a.patientId?.mobile
//               ?.toLowerCase()
//               .includes(term)
//           );
//         });
//     }

//     res.json({
//       success: true,
//       data: appointments,
//     });
//   },
// );
// export const getPatientAppointments = asyncHandler(
//   async (req, res) => {
//     const { patientId } = req.params;

//     const patient = await Patient.findOne({
//       _id: patientId,
//       organizationId: req.user.organizationId,
//       status: "active",
//     });

//     if (!patient) {
//       res.status(404);
//       throw new Error("Patient not found");
//     }

//     const appointments = await populateAppointment(
//       Appointment.find({
//         organizationId: req.user.organizationId,
//         patientId: patient._id,
//       }).sort({
//         appointmentDate: -1,
//       }),
//     ).lean();

//     res.json({
//       success: true,
//       data: appointments,
//     });
//   },
// );

// /* =========================================================
//    GET ONE APPOINTMENT BY ID
//    GET /appointments/:id
//    ========================================================= */

// export const getAppointment = asyncHandler(
//   async (req, res) => {
//     const { id } = req.params;

//     const appointment =
//       await populateAppointment(
//         Appointment.findOne({
//           _id: id,
//           organizationId:
//             req.user.organizationId,
//         }),
//       ).lean();

//     if (!appointment) {
//       res.status(404);
//       throw new Error(
//         "Appointment not found",
//       );
//     }

//     res.json({
//       success: true,
//       data: appointment,
//     });
//   },
// );

// /* =========================================================
//    GET CLINICIANS
//    ========================================================= */

// export const getClinicians = asyncHandler(
//   async (req, res) => {
//     const clinicians = await User.find({
//       organizationId:
//         req.user.organizationId,
//       status: "active",
//       role: {
//         $in: ["optometrist", "doctor"],
//       },
//     })
//       .select(
//         "firstName lastName email phone role",
//       )
//       .sort({
//         firstName: 1,
//         lastName: 1,
//       })
//       .lean();

//     res.json({
//       success: true,
//       data: clinicians,
//     });
//   },
// );

// /* =========================================================
//    CREATE APPOINTMENT
//    ========================================================= */

// export const createAppointment =
//   asyncHandler(async (req, res) => {
//     const patient = await ensurePatient(
//       req,
//       req.body.patientId,
//     );

//     if (!patient) {
//       res.status(404);
//       throw new Error(
//         "Patient not found",
//       );
//     }

//     const branch =
//       await getSingleBranch(
//         req.user.organizationId,
//       );

//     if (!branch) {
//       res.status(400);
//       throw new Error(
//         "An active practice branch is required",
//       );
//     }

//     if (!req.body.appointmentDate) {
//       res.status(400);
//       throw new Error(
//         "Appointment date and time are required",
//       );
//     }

//     const clinician =
//       await ensureClinician(
//         req,
//         req.body.clinicianId,
//       );

//     if (
//       req.body.clinicianId &&
//       !clinician
//     ) {
//       res.status(400);
//       throw new Error(
//         "Selected clinician is not a valid optometrist or doctor",
//       );
//     }

//     const appointment =
//       await Appointment.create({
//         organizationId:
//           req.user.organizationId,

//         branchId:
//           branch._id,

//         patientId:
//           patient._id,

//         clinicianId:
//           clinician?._id || null,

//         appointmentDate:
//           new Date(
//             req.body.appointmentDate,
//           ),

//         durationMinutes:
//           req.body.durationMinutes || 30,

//         type:
//           req.body.type ||
//           "Eye Examination",

//         reason:
//           req.body.reason || "",

//         notes:
//           req.body.notes || "",

//         status: "booked",

//         history: [
//           {
//             status: "booked",
//             note: "Appointment created",
//             changedBy: req.user._id,
//           },
//         ],

//         createdBy:
//           req.user._id,
//       });

//     const populated =
//       await populateAppointment(
//         Appointment.findById(
//           appointment._id,
//         ),
//       );

//     res.status(201).json({
//       success: true,
//       message:
//         "Appointment created successfully",
//       data: populated,
//     });
//   });

// /* =========================================================
//    UPDATE APPOINTMENT
//    ========================================================= */

// export const updateAppointment =
//   asyncHandler(async (req, res) => {
//     const appointment =
//       await Appointment.findOne({
//         _id: req.params.id,
//         organizationId:
//           req.user.organizationId,
//       });

//     if (!appointment) {
//       res.status(404);
//       throw new Error(
//         "Appointment not found",
//       );
//     }

//     const oldStatus =
//       appointment.status;

//     if (
//       req.body.clinicianId !== undefined
//     ) {
//       const clinician =
//         await ensureClinician(
//           req,
//           req.body.clinicianId,
//         );

//       if (
//         req.body.clinicianId &&
//         !clinician
//       ) {
//         res.status(400);
//         throw new Error(
//           "Selected clinician is not a valid optometrist or doctor",
//         );
//       }

//       appointment.clinicianId =
//         clinician?._id || null;
//     }

//     [
//       "appointmentDate",
//       "durationMinutes",
//       "type",
//       "reason",
//       "notes",
//     ].forEach((field) => {
//       if (
//         req.body[field] !== undefined
//       ) {
//         appointment[field] =
//           req.body[field];
//       }
//     });

//     if (
//       req.body.status !== undefined
//     ) {
//       appointment.status =
//         req.body.status;
//     }

//     appointment.updatedBy =
//       req.user._id;

//     if (
//       req.body.status !== undefined &&
//       req.body.status !== oldStatus
//     ) {
//       appointment.history.push({
//         status: req.body.status,
//         note:
//           req.body.statusNote ||
//           `Status changed from ${oldStatus} to ${req.body.status}`,
//         changedBy: req.user._id,
//       });
//     }

//     await appointment.save();

//     const populated =
//       await populateAppointment(
//         Appointment.findById(
//           appointment._id,
//         ),
//       );

//     res.json({
//       success: true,
//       message:
//         "Appointment updated successfully",
//       data: populated,
//     });
//   });


import asyncHandler from "express-async-handler";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

const getSingleBranch = async (organizationId) =>
  Branch.findOne({
    organizationId,
    status: "active",
  }).sort({ createdAt: 1 });

const ensurePatient = async (req, patientId) => {
  if (!patientId) return null;

  const patient = await Patient.findOne({
    _id: patientId,
    organizationId: req.user.organizationId,
    status: "active",
  });

  if (!patient) return null;

  const branch = await getSingleBranch(
    req.user.organizationId,
  );

  if (
    !branch ||
    !patient.registeredBranchId ||
    patient.registeredBranchId.toString() !==
      branch._id.toString()
  ) {
    return null;
  }

  return patient;
};

const ensureClinician = async (req, clinicianId) => {
  if (!clinicianId) return null;

  return User.findOne({
    _id: clinicianId,
    organizationId: req.user.organizationId,
    status: "active",
    role: {
      $in: ["optometrist", "doctor"],
    },
  });
};

const populateAppointment = (query) =>
  query
    .select("-reason")
    .populate(
      "patientId",
      "patientNumber firstName middleName lastName phone mobile dateOfBirth email address city state",
    )
    .populate(
      "clinicianId",
      "firstName lastName role email phone",
    )
    .populate(
      "createdBy",
      "firstName lastName role",
    )
    .populate(
      "updatedBy",
      "firstName lastName role",
    );


const ACTIVE_APPOINTMENT_STATUSES = [
  "booked",
  "confirmed",
  "here",
  "examining",
];
const MAX_APPOINTMENT_DURATION_MINUTES = 480;

const normalizeClinicianId = (clinician) =>
  clinician?._id || clinician || null;

/**
 * Find an active appointment that overlaps the proposed time interval.
 *
 * Appointments assigned to different clinicians may overlap. An
 * unassigned appointment is treated as shared branch capacity, so it
 * conflicts with every overlapping active appointment.
 */
const findOverlappingAppointment = async ({
  organizationId,
  branchId,
  clinicianId,
  appointmentDate,
  durationMinutes,
  excludeAppointmentId = null,
}) => {
  const start = new Date(appointmentDate);
  const duration = Number(durationMinutes);

  // The caller validates these values and returns an HTTP 400 response.
  if (
    Number.isNaN(start.getTime()) ||
    !Number.isFinite(duration) ||
    duration < 5 ||
    duration > MAX_APPOINTMENT_DURATION_MINUTES
  ) {
    return null;
  }

  const startMs = start.getTime();
  const endMs = startMs + duration * 60_000;
  const lookbackMs =
    startMs - MAX_APPOINTMENT_DURATION_MINUTES * 60_000;
  const proposedClinicianId = normalizeClinicianId(clinicianId);

  const query = {
    organizationId,
    branchId,
    status: { $in: ACTIVE_APPOINTMENT_STATUSES },
    appointmentDate: {
      $gte: new Date(lookbackMs),
      $lt: new Date(endMs),
    },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  // A named clinician only shares capacity with their own appointments
  // and unassigned appointments. Unassigned candidates check the whole branch.
  if (proposedClinicianId) {
    query.$or = [
      { clinicianId: proposedClinicianId },
      { clinicianId: null },
    ];
  }

  const candidates = await Appointment.find(query)
    .select("_id appointmentDate durationMinutes clinicianId patientId")
    .populate("patientId", "firstName middleName lastName patientNumber")
    .sort({ appointmentDate: 1 })
    .lean();

  const proposedClinicianKey = proposedClinicianId
    ? String(proposedClinicianId)
    : "";

  return (
    candidates.find((existing) => {
      const existingStart = new Date(existing.appointmentDate).getTime();
      if (!Number.isFinite(existingStart)) return false;

      const rawExistingDuration = Number(existing.durationMinutes);
      const existingDuration = Math.min(
        MAX_APPOINTMENT_DURATION_MINUTES,
        Math.max(
          5,
          Number.isFinite(rawExistingDuration) && rawExistingDuration > 0
            ? rawExistingDuration
            : 30,
        ),
      );
      const existingEnd =
        existingStart + existingDuration * 60_000;

      const overlaps =
        startMs < existingEnd && endMs > existingStart;
      if (!overlaps) return false;

      const existingClinician = normalizeClinicianId(
        existing.clinicianId,
      );
      const existingClinicianKey = existingClinician
        ? String(existingClinician)
        : "";

      return (
        !proposedClinicianKey ||
        !existingClinicianKey ||
        proposedClinicianKey === existingClinicianKey
      );
    }) || null
  );
};

const conflictMessage = (appointment) => {
  const patientName = [
    appointment?.patientId?.firstName,
    appointment?.patientId?.middleName,
    appointment?.patientId?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return patientName
    ? `${patientName} already has an appointment overlapping this time slot. Choose another time or clinician.`
    : "This time slot is already booked. Choose another time or clinician.";
};

/* =========================================================
   GET APPOINTMENTS
   Supports:
   GET /appointments
   GET /appointments?patientId=PATIENT_ID
   ========================================================= */

export const getAppointments = asyncHandler(
  async (req, res) => {
    const {
      patientId,
      date,
      from,
      to,
      status,
      clinicianId,
      search,
      limit = 100,
    } = req.query;

    const query = {
      organizationId: req.user.organizationId,
    };

    /*
     * PATIENT FILTER
     *
     * This is what makes Patient Details show only
     * that patient's appointments.
     */
    if (patientId) {
      const patient = await ensurePatient(
        req,
        patientId,
      );

      if (!patient) {
        res.status(404);
        throw new Error(
          "Patient not found or you do not have access to this patient",
        );
      }

      query.patientId = patient._id;
    }

    /*
     * STATUS FILTER
     */
    if (status) {
      query.status = status;
    }

    /*
     * CLINICIAN FILTER
     */
    if (clinicianId) {
      const clinician =
        await ensureClinician(
          req,
          clinicianId,
        );

      if (!clinician) {
        res.status(400);
        throw new Error(
          "Selected clinician is not a valid optometrist or doctor",
        );
      }

      query.clinicianId = clinician._id;
    }

    /*
     * DATE FILTER
     */
    if (date) {
      const start = new Date(
        `${date}T00:00:00`,
      );

      const end = new Date(
        `${date}T23:59:59.999`,
      );

      query.appointmentDate = {
        $gte: start,
        $lte: end,
      };
    } else if (from || to) {
      query.appointmentDate = {};

      if (from) {
        query.appointmentDate.$gte =
          new Date(from);
      }

      if (to) {
        query.appointmentDate.$lte =
          new Date(to);
      }
    }

    /*
     * FETCH
     */
    let appointments =
      await populateAppointment(
        Appointment.find(query)
          .sort({
            appointmentDate: 1,
          })
          .limit(
            Math.min(
              Number(limit) || 100,
              250,
            ),
          ),
      ).lean();

    /*
     * SEARCH
     */
    if (search?.trim()) {
      const term =
        search.trim().toLowerCase();

      appointments =
        appointments.filter((a) => {
          const patientName = [
            a.patientId?.firstName,
            a.patientId?.middleName,
            a.patientId?.lastName,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return (
            patientName.includes(term) ||
            a.patientId?.patientNumber
              ?.toLowerCase()
              .includes(term) ||
            a.patientId?.phone
              ?.toLowerCase()
              .includes(term) ||
            a.patientId?.mobile
              ?.toLowerCase()
              .includes(term)
          );
        });
    }

    res.json({
      success: true,
      data: appointments,
    });
  },
);
export const getPatientAppointments = asyncHandler(
  async (req, res) => {
    const { patientId } = req.params;

    const patient = await Patient.findOne({
      _id: patientId,
      organizationId: req.user.organizationId,
      status: "active",
    });

    if (!patient) {
      res.status(404);
      throw new Error("Patient not found");
    }

    const appointments = await populateAppointment(
      Appointment.find({
        organizationId: req.user.organizationId,
        patientId: patient._id,
      }).sort({
        appointmentDate: -1,
      }),
    ).lean();

    res.json({
      success: true,
      data: appointments,
    });
  },
);

/* =========================================================
   GET ONE APPOINTMENT BY ID
   GET /appointments/:id
   ========================================================= */

export const getAppointment = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    const appointment =
      await populateAppointment(
        Appointment.findOne({
          _id: id,
          organizationId:
            req.user.organizationId,
        }),
      ).lean();

    if (!appointment) {
      res.status(404);
      throw new Error(
        "Appointment not found",
      );
    }

    res.json({
      success: true,
      data: appointment,
    });
  },
);

/* =========================================================
   GET CLINICIANS
   ========================================================= */

export const getClinicians = asyncHandler(
  async (req, res) => {
    const clinicians = await User.find({
      organizationId:
        req.user.organizationId,
      status: "active",
      role: {
        $in: ["optometrist", "doctor"],
      },
    })
      .select(
        "firstName lastName email phone role",
      )
      .sort({
        firstName: 1,
        lastName: 1,
      })
      .lean();

    res.json({
      success: true,
      data: clinicians,
    });
  },
);

/* =========================================================
   CREATE APPOINTMENT
   ========================================================= */

export const createAppointment =
  asyncHandler(async (req, res) => {
    const patient = await ensurePatient(
      req,
      req.body.patientId,
    );

    if (!patient) {
      res.status(404);
      throw new Error(
        "Patient not found",
      );
    }

    const branch =
      await getSingleBranch(
        req.user.organizationId,
      );

    if (!branch) {
      res.status(400);
      throw new Error(
        "An active practice branch is required",
      );
    }

    if (!req.body.appointmentDate) {
      res.status(400);
      throw new Error(
        "Appointment date and time are required",
      );
    }

    const clinician =
      await ensureClinician(
        req,
        req.body.clinicianId,
      );

    if (
      req.body.clinicianId &&
      !clinician
    ) {
      res.status(400);
      throw new Error(
        "Selected clinician is not a valid optometrist or doctor",
      );
    }

    const appointmentDate = new Date(
      req.body.appointmentDate,
    );
    const durationMinutes = Number(
      req.body.durationMinutes ?? 30,
    );

    if (Number.isNaN(appointmentDate.getTime())) {
      res.status(400);
      throw new Error("A valid appointment date and time are required.");
    }

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes < 5 ||
      durationMinutes > MAX_APPOINTMENT_DURATION_MINUTES
    ) {
      res.status(400);
      throw new Error("Appointment duration must be between 5 and 480 minutes.");
    }

    const conflict = await findOverlappingAppointment({
      organizationId: req.user.organizationId,
      branchId: branch._id,
      clinicianId: clinician?._id || null,
      appointmentDate,
      durationMinutes,
    });

    if (conflict) {
      res.status(409);
      throw new Error(conflictMessage(conflict));
    }

    const appointment =
      await Appointment.create({
        organizationId:
          req.user.organizationId,

        branchId:
          branch._id,

        patientId:
          patient._id,

        clinicianId:
          clinician?._id || null,

        appointmentDate,

        durationMinutes,

        type:
          req.body.type ||
          "Eye Examination",

        notes:
          req.body.notes || "",

        status: "booked",

        history: [
          {
            status: "booked",
            note: "Appointment created",
            changedBy: req.user._id,
          },
        ],

        createdBy:
          req.user._id,
      });

    const populated =
      await populateAppointment(
        Appointment.findById(
          appointment._id,
        ),
      );

    res.status(201).json({
      success: true,
      message:
        "Appointment created successfully",
      data: populated,
    });
  });

/* =========================================================
   UPDATE APPOINTMENT
   ========================================================= */

export const updateAppointment =
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!appointment) {
      res.status(404);
      throw new Error("Appointment not found");
    }

    const oldStatus = appointment.status || "booked";
    const nextStatus = req.body.status ?? oldStatus;

    let nextClinician = appointment.clinicianId || null;
    if (req.body.clinicianId !== undefined) {
      nextClinician = await ensureClinician(
        req,
        req.body.clinicianId,
      );

      if (req.body.clinicianId && !nextClinician) {
        res.status(400);
        throw new Error(
          "Selected clinician is not a valid optometrist or doctor",
        );
      }
    }

    const nextAppointmentDate =
      req.body.appointmentDate !== undefined
        ? new Date(req.body.appointmentDate)
        : new Date(appointment.appointmentDate);

    const nextDurationMinutes =
      req.body.durationMinutes !== undefined
        ? Number(req.body.durationMinutes)
        : Number(appointment.durationMinutes || 30);

    if (Number.isNaN(nextAppointmentDate.getTime())) {
      res.status(400);
      throw new Error("A valid appointment date and time are required.");
    }

    if (
      !Number.isFinite(nextDurationMinutes) ||
      nextDurationMinutes < 5 ||
      nextDurationMinutes > MAX_APPOINTMENT_DURATION_MINUTES
    ) {
      res.status(400);
      throw new Error("Appointment duration must be between 5 and 480 minutes.");
    }

    const scheduleFieldsChanged =
      req.body.appointmentDate !== undefined ||
      req.body.durationMinutes !== undefined ||
      req.body.clinicianId !== undefined;

    const becomesActive =
      !ACTIVE_APPOINTMENT_STATUSES.includes(oldStatus) &&
      ACTIVE_APPOINTMENT_STATUSES.includes(nextStatus);

    if (
      ACTIVE_APPOINTMENT_STATUSES.includes(nextStatus) &&
      (scheduleFieldsChanged || becomesActive)
    ) {
      const branchId =
        appointment.branchId ||
        (await getSingleBranch(req.user.organizationId))?._id;

      if (!branchId) {
        res.status(400);
        throw new Error("An active practice branch is required.");
      }

      const conflict = await findOverlappingAppointment({
        organizationId: req.user.organizationId,
        branchId,
        clinicianId: nextClinician,
        appointmentDate: nextAppointmentDate,
        durationMinutes: nextDurationMinutes,
        excludeAppointmentId: appointment._id,
      });

      if (conflict) {
        res.status(409);
        throw new Error(conflictMessage(conflict));
      }
    }

    appointment.clinicianId = normalizeClinicianId(nextClinician);
    appointment.appointmentDate = nextAppointmentDate;
    appointment.durationMinutes = nextDurationMinutes;

    if (req.body.type !== undefined) {
      appointment.type = req.body.type;
    }

    // The former "reason for visit" field is no longer part of the workflow.
    // Keep existing legacy values untouched for historical records.
    if (req.body.notes !== undefined) {
      appointment.notes = req.body.notes;
    }

    if (req.body.status !== undefined) {
      appointment.status = req.body.status;
    }

    appointment.updatedBy = req.user._id;

    if (
      req.body.status !== undefined &&
      req.body.status !== oldStatus
    ) {
      appointment.history.push({
        status: req.body.status,
        note:
          req.body.statusNote ||
          `Status changed from ${oldStatus} to ${req.body.status}`,
        changedBy: req.user._id,
      });
    }

    await appointment.save();

    const populated = await populateAppointment(
      Appointment.findById(appointment._id),
    );

    res.json({
      success: true,
      message: "Appointment updated successfully",
      data: populated,
    });
  });
