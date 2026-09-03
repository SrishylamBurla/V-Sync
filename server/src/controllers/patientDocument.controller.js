import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Patient from "../models/Patient.js";

const ALLOWED_CATEGORIES = new Set([
  "referral",
  "prescription",
  "clinical_report",
  "identity",
  "clinical_image",
  "insurance",
  "other",
]);

const getDb = () => mongoose.connection.db;
const getBucket = () => {
  if (!getDb()) throw new Error("MongoDB connection is not ready");
  return new mongoose.mongo.GridFSBucket(getDb(), { bucketName: "patientDocuments" });
};

const getPatientForOrg = (patientId, organizationId) =>
  Patient.findOne({ _id: patientId, organizationId });

export const getPatientDocuments = asyncHandler(async (req, res) => {
  const patient = await getPatientForOrg(req.params.id, req.user.organizationId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const documents = (patient.documents || [])
    .slice()
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .map((doc) => ({
      _id: doc._id,
      fileId: doc.fileId,
      originalName: doc.originalName,
      storedName: doc.storedName,
      mimeType: doc.mimeType,
      size: doc.size,
      category: doc.category,
      note: doc.note,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy,
      fileUrl: `/api/v1/patients/${patient._id}/documents/${doc._id}/file`,
    }));

  res.json({ success: true, data: { documents } });
});

export const uploadPatientDocument = asyncHandler(async (req, res) => {
  const patient = await getPatientForOrg(req.params.id, req.user.organizationId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  if (!req.file) {
    res.status(400);
    throw new Error("Please select a file");
  }

  const category = String(req.body.category || "other").trim().toLowerCase();
  if (!ALLOWED_CATEGORIES.has(category)) {
    res.status(400);
    throw new Error("Invalid document category");
  }

  const note = String(req.body.note || "").trim();
  const bucket = getBucket();
  const storedName = `${Date.now()}-${req.file.originalname}`;
  const uploadStream = bucket.openUploadStream(storedName, {
    contentType: req.file.mimetype,
    metadata: {
      kind: "patient-document",
      patientId: String(patient._id),
      organizationId: String(req.user.organizationId),
      uploadedBy: String(req.user._id),
    },
  });

  await new Promise((resolve, reject) => {
    uploadStream.once("finish", resolve);
    uploadStream.once("error", reject);
    uploadStream.end(req.file.buffer);
  });

  const document = {
    fileId: uploadStream.id,
    originalName: req.file.originalname,
    storedName,
    mimeType: req.file.mimetype,
    size: req.file.size,
    category,
    note,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
  };

  patient.documents.push(document);
  patient.updatedBy = req.user._id;

  try {
    await patient.save();
  } catch (error) {
    // Don't leave an orphaned GridFS file if the patient document fails to save.
    await new Promise((resolve) => {
      bucket.delete(uploadStream.id, () => resolve());
    });
    throw error;
  }

  const saved = patient.documents[patient.documents.length - 1];

  res.status(201).json({
    success: true,
    message: "Document uploaded successfully",
    data: {
      document: {
        _id: saved._id,
        fileId: saved.fileId,
        originalName: saved.originalName,
        storedName: saved.storedName,
        mimeType: saved.mimeType,
        size: saved.size,
        category: saved.category,
        note: saved.note,
        uploadedAt: saved.uploadedAt,
        uploadedBy: saved.uploadedBy,
        fileUrl: `/api/v1/patients/${patient._id}/documents/${saved._id}/file`,
      },
    },
  });
});

export const streamPatientDocument = asyncHandler(async (req, res) => {
  const patient = await getPatientForOrg(req.params.id, req.user.organizationId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const doc = patient.documents.id(req.params.documentId);
  if (!doc) {
    res.status(404);
    throw new Error("Document not found");
  }

  const bucket = getBucket();
  const file = await getDb().collection("patientDocuments.files").findOne({
    _id: new mongoose.Types.ObjectId(doc.fileId),
  });

  if (!file) {
    res.status(404);
    throw new Error("Stored document not found");
  }

  res.setHeader("Content-Type", doc.mimeType || file.contentType || "application/octet-stream");
  res.setHeader("Content-Length", String(file.length));
  res.setHeader(
    "Content-Disposition",
    `${String(doc.mimeType || "").startsWith("image/") || doc.mimeType === "application/pdf" ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(doc.originalName)}`,
  );
  bucket.openDownloadStream(new mongoose.Types.ObjectId(doc.fileId)).pipe(res);
});

export const deletePatientDocument = asyncHandler(async (req, res) => {
  const patient = await getPatientForOrg(req.params.id, req.user.organizationId);
  if (!patient) {
    res.status(404);
    throw new Error("Patient not found");
  }

  const doc = patient.documents.id(req.params.documentId);
  if (!doc) {
    res.status(404);
    throw new Error("Document not found");
  }

  const fileId = doc.fileId;
  patient.documents.pull(doc._id);
  patient.updatedBy = req.user._id;
  await patient.save();

  const bucket = getBucket();
  await new Promise((resolve) => bucket.delete(new mongoose.Types.ObjectId(fileId), () => resolve()));

  res.json({ success: true, message: "Document deleted successfully" });
});
