import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./modules/auth/LoginPage";
import DashboardPage from "./modules/dashboard/DashboardPage";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RoleRoute from "./components/common/RoleRoute";
import PatientListPage from "./modules/patients/pages/PatientListPage";
import PatientDetailsPage from "./modules/patients/pages/PatientDetailsPage";
import AddPatientPage from "./modules/patients/pages/AddPatient";
import ConsultationPage from "./modules/clinical/pages/ConsultationPage";
import AppointmentsPage from "./modules/appointments/pages/AppointmentsPage";
import AppointmentDetailsPage from "./modules/appointments/pages/AppointmentDetailsPage";
import BookAppointmentPage from "./modules/appointments/pages/BookAppointmentPage";
import ModuleDocumentPage from "./modules/core/pages/ModuleDocumentPage";
import NewSpectaclePage from "./modules/optical/pages/NewSpectaclePage";
import SpectacleDetailsPage from "./modules/optical/pages/SpectacleDetailsPage";
import InventoryPage from "./modules/inventory/pages/InventoryPage";
import BillingPage from "./modules/billing/pages/BillingPage";
import InvoiceDetailsPage from "./modules/billing/pages/InvoiceDetailsPage";
import ContactLensPage from "./modules/contactLenses/pages/ContactLensPage";
import NewContactLensPage from "./modules/contactLenses/pages/NewContactLensPage";
import ContactLensDetailsPage from "./modules/contactLenses/pages/ContactLensDetailsPage";
import DispensingPage from "./modules/dispensing/pages/DispensingPage";
import DispensingDetailsPage from "./modules/dispensing/pages/DispensingDetailsPage";
import RecallPage from "./modules/recall/pages/RecallPage";
import CommunicationsPage from "./modules/communications/pages/CommunicationsPage";
import MarketingPage from "./modules/communications/pages/MarketingPage";
import ReportsPage from "./modules/reports/pages/ReportsPage";
import SettingsPage from "./modules/settings/pages/SettingsPage";
import FinancialManagementPage from "./modules/finance/pages/FinancialManagementPage";
import CataloguePage from "./modules/catalogue/pages/CataloguePage";
import StaffListPage from "./modules/staff/pages/StaffListPage";
import AddStaffPage from "./modules/staff/pages/AddStaffPage";
import BranchListPage from "./modules/branches/pages/BranchListPage";
import AddBranchPage from "./modules/branches/pages/AddBranchPage";
import BranchDetailsPage from "./modules/branches/pages/BranchDetailsPage";
import StaffDetailsPage from "./modules/staff/pages/StaffDetailsPage";
import EditStaffPage from "./modules/staff/pages/EditStaffPage";
import OrganizationSettingsPage from "./modules/organization/pages/organizationSettingsPage";
import AdminOrganizationDetailsPage from "./modules/organization/pages/adminOrganizationDetailsPage";
import AdminOrganizationsPage from "./modules/organization/pages/adminOrganizationPage";
import AddOrganizationPage from "./modules/organization/pages/addOrganizationPage";
import EditOrganizationPage from "./modules/organization/pages/EditOrganizationPage";
import ClinicalManagementPage from "./modules/clinical/pages/ClinicalManagementPage";
import OpticalManagementPage from "./modules/optical/pages/OpticalManagementPage";
import LaboratoryManagementPage from "./modules/laboratory/pages/LaboratoryMangementPage";

const ALL = [
  "super_admin",
  "organization_admin",
  "branch_manager",
  "optometrist",
  "doctor",
  "sales_executive",
  "cashier",
  "inventory_manager",
  "lab_technician",
  "receptionist",
];
const ADMIN = ["super_admin", "organization_admin", "branch_manager"];
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<RoleRoute roles={ALL} />}>
            <Route path="/patients" element={<PatientListPage />} />
            <Route path="/patients/new" element={<AddPatientPage />} />
            <Route
              path="/patients/:patientId"
              element={<PatientDetailsPage />}
            />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route
              path="/appointments/book"
              element={<BookAppointmentPage />}
            />
            <Route
              path="/appointments/:id"
              element={<AppointmentDetailsPage />}
            />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "optometrist",
                  "doctor",
                ]}
              />
            }
          >
            <Route
              path="/patients/:patientId/consultations/new"
              element={<ConsultationPage />}
            />
            <Route path="/clinical" element={<ClinicalManagementPage />} />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "sales_executive",
                  "optometrist",
                  "doctor",
                  "receptionist",
                  "lab_technician",
                ]}
              />
            }
          >
            <Route path="/dispensing" element={<DispensingPage />} />
            <Route path="/dispensing/:id" element={<DispensingDetailsPage />} />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "sales_executive",
                  "optometrist",
                  "doctor",
                ]}
              />
            }
          >
            <Route
              path="/optical"
              element={<OpticalManagementPage />}
            />
            <Route
              path="/optical/spectacles/new/:patientId"
              element={<NewSpectaclePage />}
            />
            <Route
              path="/optical/spectacles/:id"
              element={<SpectacleDetailsPage />}
            />
            <Route
              path="/optical/contact-lenses"
              element={<ContactLensPage />}
            />
            <Route
              path="/optical/contact-lenses/new"
              element={<NewContactLensPage />}
            />
            <Route
              path="/optical/contact-lenses/:id"
              element={<ContactLensDetailsPage />}
            />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "inventory_manager",
                ]}
              />
            }
          >
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "lab_technician",
                ]}
              />
            }
          >
            <Route path="/lab" element={<LaboratoryManagementPage />} />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "cashier",
                ]}
              />
            }
          >
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/:id" element={<InvoiceDetailsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "optometrist",
                  "doctor",
                  "receptionist",
                ]}
              />
            }
          >
            <Route path="/recall" element={<RecallPage />} />
            <Route path="/communications" element={<CommunicationsPage />} />
            <Route path="/newsletters" element={<MarketingPage />} />
          </Route>

          <Route element={<RoleRoute roles={["super_admin"]} />}>
            <Route
              path="/admin/organizations"
              element={<AdminOrganizationsPage />}
            />

            <Route
              path="/admin/organizations/new"
              element={<AddOrganizationPage />}
            />

            <Route
              path="/admin/organizations/:id"
              element={<AdminOrganizationDetailsPage />}
            />

            <Route
              path="/admin/organizations/:id/edit"
              element={<EditOrganizationPage />}
            />
          </Route>

          <Route element={<RoleRoute roles={ADMIN} />}>
            <Route path="/branches" element={<BranchListPage />} />
            <Route path="/branches/new" element={<AddBranchPage />} />

            <Route path="/branches/:id" element={<BranchDetailsPage />} />
            <Route path="/staff" element={<StaffListPage />} />

            <Route path="/staff/new" element={<AddStaffPage />} />
            <Route path="/staff/:id" element={<StaffDetailsPage />} />
            <Route path="/staff/:id/edit" element={<EditStaffPage />} />
            <Route
              path="/settings/organization"
              element={<OrganizationSettingsPage />}
            />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "cashier",
                ]}
              />
            }
          >
            <Route path="/finance" element={<FinancialManagementPage />} />
          </Route>
          <Route
            element={
              <RoleRoute
                roles={[
                  "super_admin",
                  "organization_admin",
                  "branch_manager",
                  "inventory_manager",
                  "sales_executive",
                  "optometrist",
                  "doctor",
                ]}
              />
            }
          >
            <Route path="/catalogue" element={<CataloguePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

// import { Navigate, Route, Routes } from "react-router-dom";

// import LoginPage from "./modules/auth/LoginPage";
// import DashboardPage from "./modules/dashboard/DashboardPage";
// import AppLayout from "./layouts/AppLayout";
// import ProtectedRoute from "./components/common/ProtectedRoute";
// import RoleRoute from "./components/common/RoleRoute";
// import { ALL_ROLES, ROUTE_ACCESS } from "./config/access";

// import PatientListPage from "./modules/patients/pages/PatientListPage";
// import PatientDetailsPage from "./modules/patients/pages/PatientDetailsPage";
// import AddPatientPage from "./modules/patients/pages/AddPatient";

// import ClinicalManagementPage from "./modules/clinical/pages/ClinicalManagementPage";
// import ConsultationPage from "./modules/clinical/pages/ConsultationPage";

// import AppointmentsPage from "./modules/appointments/pages/AppointmentsPage";
// import AppointmentDetailsPage from "./modules/appointments/pages/AppointmentDetailsPage";
// import BookAppointmentPage from "./modules/appointments/pages/BookAppointmentPage";

// import OpticalManagementPage from "./modules/optical/pages/OpticalManagementPage";
// import NewSpectaclePage from "./modules/optical/pages/NewSpectaclePage";
// import SpectacleDetailsPage from "./modules/optical/pages/SpectacleDetailsPage";

// import ContactLensPage from "./modules/contactLenses/pages/ContactLensPage";
// import NewContactLensPage from "./modules/contactLenses/pages/NewContactLensPage";
// import ContactLensDetailsPage from "./modules/contactLenses/pages/ContactLensDetailsPage";

// import DispensingPage from "./modules/dispensing/pages/DispensingPage";
// import DispensingDetailsPage from "./modules/dispensing/pages/DispensingDetailsPage";
// import InventoryPage from "./modules/inventory/pages/InventoryPage";
// import LaboratoryManagementPage from "./modules/laboratory/pages/LaboratoryMangementPage";
// import CataloguePage from "./modules/catalogue/pages/CataloguePage";

// import BillingPage from "./modules/billing/pages/BillingPage";
// import InvoiceDetailsPage from "./modules/billing/pages/InvoiceDetailsPage";
// import FinancialManagementPage from "./modules/finance/pages/FinancialManagementPage";
// import ReportsPage from "./modules/reports/pages/ReportsPage";

// import RecallPage from "./modules/recall/pages/RecallPage";
// import CommunicationsPage from "./modules/communications/pages/CommunicationsPage";
// import MarketingPage from "./modules/communications/pages/MarketingPage";

// import StaffListPage from "./modules/staff/pages/StaffListPage";
// import AddStaffPage from "./modules/staff/pages/AddStaffPage";
// import StaffDetailsPage from "./modules/staff/pages/StaffDetailsPage";
// import EditStaffPage from "./modules/staff/pages/EditStaffPage";

// import BranchListPage from "./modules/branches/pages/BranchListPage";
// import AddBranchPage from "./modules/branches/pages/AddBranchPage";
// import BranchDetailsPage from "./modules/branches/pages/BranchDetailsPage";

// import SettingsPage from "./modules/settings/pages/SettingsPage";
// import OrganizationSettingsPage from "./modules/organization/pages/organizationSettingsPage";
// import AdminOrganizationsPage from "./modules/organization/pages/adminOrganizationPage";
// import AdminOrganizationDetailsPage from "./modules/organization/pages/adminOrganizationDetailsPage";
// import AddOrganizationPage from "./modules/organization/pages/addOrganizationPage";
// import EditOrganizationPage from "./modules/organization/pages/EditOrganizationPage";

// export default function App() {
//   return (
//     <Routes>
//       <Route path="/login" element={<LoginPage />} />

//       <Route element={<ProtectedRoute />}>
//         <Route element={<AppLayout />}>
//           <Route path="/dashboard" element={<DashboardPage />} />

//           {/* Patient + appointment workspace */}
//           <Route element={<RoleRoute roles={ALL_ROLES} />}>
//             <Route path="/patients" element={<PatientListPage />} />
//             <Route path="/patients/new" element={<AddPatientPage />} />
//             <Route path="/patients/:patientId" element={<PatientDetailsPage />} />
//             <Route path="/appointments" element={<AppointmentsPage />} />
//             <Route path="/appointments/book" element={<BookAppointmentPage />} />
//             <Route path="/appointments/:id" element={<AppointmentDetailsPage />} />
//           </Route>

//           {/* Clinical */}
//           <Route element={<RoleRoute roles={ROUTE_ACCESS.clinical} />}>
//             <Route path="/clinical" element={<ClinicalManagementPage />} />
//             <Route path="/patients/:patientId/consultations/new" element={<ConsultationPage />} />
//           </Route>

//           {/* Optical */}
//           <Route element={<RoleRoute roles={ROUTE_ACCESS.optical} />}>
//             <Route path="/optical" element={<OpticalManagementPage />} />
//             <Route path="/optical/spectacles/new/:patientId" element={<NewSpectaclePage />} />
//             <Route path="/optical/spectacles/:id" element={<SpectacleDetailsPage />} />
//             <Route path="/optical/contact-lenses" element={<ContactLensPage />} />
//             <Route path="/optical/contact-lenses/new" element={<NewContactLensPage />} />
//             <Route path="/optical/contact-lenses/new/:patientId" element={<NewContactLensPage />} />
//             <Route path="/optical/contact-lenses/:id" element={<ContactLensDetailsPage />} />
//           </Route>

//           {/* Operations */}
//           <Route element={<RoleRoute roles={ROUTE_ACCESS.dispensing} />}>
//             <Route path="/dispensing" element={<DispensingPage />} />
//             <Route path="/dispensing/:id" element={<DispensingDetailsPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.inventory} />}>
//             <Route path="/inventory" element={<InventoryPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.laboratory} />}>
//             <Route path="/lab" element={<LaboratoryManagementPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.catalogue} />}>
//             <Route path="/catalogue" element={<CataloguePage />} />
//           </Route>

//           {/* Finance */}
//           <Route element={<RoleRoute roles={ROUTE_ACCESS.billing} />}>
//             <Route path="/billing" element={<BillingPage />} />
//             <Route path="/billing/:id" element={<InvoiceDetailsPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.finance} />}>
//             <Route path="/finance" element={<FinancialManagementPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.reports} />}>
//             <Route path="/reports" element={<ReportsPage />} />
//           </Route>

//           {/* Patient engagement */}
//           <Route element={<RoleRoute roles={ROUTE_ACCESS.recall} />}>
//             <Route path="/recall" element={<RecallPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.communications} />}>
//             <Route path="/communications" element={<CommunicationsPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.newsletters} />}>
//             <Route path="/newsletters" element={<MarketingPage />} />
//           </Route>

//           {/* Organization administration */}
//           <Route element={<RoleRoute roles={ROUTE_ACCESS.organizations} />}>
//             <Route path="/admin/organizations" element={<AdminOrganizationsPage />} />
//             <Route path="/admin/organizations/new" element={<AddOrganizationPage />} />
//             <Route path="/admin/organizations/:id" element={<AdminOrganizationDetailsPage />} />
//             <Route path="/admin/organizations/:id/edit" element={<EditOrganizationPage />} />
//           </Route>

//           <Route element={<RoleRoute roles={ROUTE_ACCESS.branches} />}>
//             <Route path="/branches" element={<BranchListPage />} />
//             <Route path="/branches/new" element={<AddBranchPage />} />
//             <Route path="/branches/:id" element={<BranchDetailsPage />} />
//             <Route path="/staff" element={<StaffListPage />} />
//             <Route path="/staff/new" element={<AddStaffPage />} />
//             <Route path="/staff/:id" element={<StaffDetailsPage />} />
//             <Route path="/staff/:id/edit" element={<EditStaffPage />} />
//             <Route path="/settings/organization" element={<OrganizationSettingsPage />} />
//             <Route path="/settings" element={<SettingsPage />} />
//           </Route>
//         </Route>
//       </Route>

//       <Route path="/" element={<Navigate to="/dashboard" replace />} />
//       <Route path="*" element={<Navigate to="/dashboard" replace />} />
//     </Routes>
//   );
// }
