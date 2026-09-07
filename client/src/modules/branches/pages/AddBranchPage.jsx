import { useState } from "react";
import { ArrowLeft, Building2, Save } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { createBranch } from "../api/branch.api";

const initialForm = {
  name: "",
  code: "",
  phone: "",
  email: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },
  gstin: "",
};

export default function AddBranchPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAddress = (field, value) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Branch name is required.");
      return;
    }

    if (!form.code.trim()) {
      setError("Branch code is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        address: {
          line1: form.address.line1.trim(),
          line2: form.address.line2.trim(),
          city: form.address.city.trim(),
          state: form.address.state.trim(),
          pincode: form.address.pincode.trim(),
          country: form.address.country.trim() || "India",
        },
        gstin: form.gstin.trim().toUpperCase(),
      };

      const response = await createBranch(payload);

      const branchId = response?.data?._id;

      if (branchId) {
        navigate(`/branches/${branchId}`);
      } else {
        navigate("/branches");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create branch."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <main className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            to="/branches"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Back to branches
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Building2 size={20} />
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Administration
              </div>

              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Add Branch
              </h1>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic information */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Branch information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Basic identification and contact information.
              </p>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <Field
                label="Branch name"
                required
                value={form.name}
                onChange={(value) =>
                  updateField("name", value)
                }
                placeholder="VividOpt Hyderabad"
              />

              <Field
                label="Branch code"
                required
                value={form.code}
                onChange={(value) =>
                  updateField(
                    "code",
                    value.toUpperCase()
                  )
                }
                placeholder="HYD01"
                helper="Unique within your organization."
              />

              <Field
                label="Phone"
                value={form.phone}
                onChange={(value) =>
                  updateField("phone", value)
                }
                placeholder="+91 98765 43210"
              />

              <Field
                label="Email"
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField("email", value)
                }
                placeholder="hyderabad@vividopt.in"
              />

              <div className="md:col-span-2">
                <Field
                  label="GSTIN"
                  value={form.gstin}
                  onChange={(value) =>
                    updateField(
                      "gstin",
                      value.toUpperCase()
                    )
                  }
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-slate-900">
                Branch address
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Physical location of this branch.
              </p>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Address line 1"
                  value={form.address.line1}
                  onChange={(value) =>
                    updateAddress("line1", value)
                  }
                  placeholder="12, Main Road"
                />
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Address line 2"
                  value={form.address.line2}
                  onChange={(value) =>
                    updateAddress("line2", value)
                  }
                  placeholder="Near Central Mall"
                />
              </div>

              <Field
                label="City"
                value={form.address.city}
                onChange={(value) =>
                  updateAddress("city", value)
                }
                placeholder="Hyderabad"
              />

              <Field
                label="State"
                value={form.address.state}
                onChange={(value) =>
                  updateAddress("state", value)
                }
                placeholder="Telangana"
              />

              <Field
                label="Pincode"
                value={form.address.pincode}
                onChange={(value) =>
                  updateAddress("pincode", value)
                }
                placeholder="500001"
              />

              <Field
                label="Country"
                value={form.address.country}
                onChange={(value) =>
                  updateAddress("country", value)
                }
                placeholder="India"
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              to="/branches"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />

              {saving ? "Creating..." : "Create Branch"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  type = "text",
  helper,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />

      {helper && (
        <span className="mt-1.5 block text-xs text-slate-400">
          {helper}
        </span>
      )}
    </label>
  );
}