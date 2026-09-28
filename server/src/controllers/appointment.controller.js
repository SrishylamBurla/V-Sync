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

        appointmentDate:
          new Date(
            req.body.appointmentDate,
          ),

        durationMinutes:
          req.body.durationMinutes || 30,

        type:
          req.body.type ||
          "Eye Examination",

        reason:
          req.body.reason || "",

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
    const appointment =
      await Appointment.findOne({
        _id: req.params.id,
        organizationId:
          req.user.organizationId,
      });

    if (!appointment) {
      res.status(404);
      throw new Error(
        "Appointment not found",
      );
    }

    const oldStatus =
      appointment.status;

    if (
      req.body.clinicianId !== undefined
    ) {
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

      appointment.clinicianId =
        clinician?._id || null;
    }

    [
      "appointmentDate",
      "durationMinutes",
      "type",
      "reason",
      "notes",
    ].forEach((field) => {
      if (
        req.body[field] !== undefined
      ) {
        appointment[field] =
          req.body[field];
      }
    });

    if (
      req.body.status !== undefined
    ) {
      appointment.status =
        req.body.status;
    }

    appointment.updatedBy =
      req.user._id;

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

    const populated =
      await populateAppointment(
        Appointment.findById(
          appointment._id,
        ),
      );

    res.json({
      success: true,
      message:
        "Appointment updated successfully",
      data: populated,
    });
  });