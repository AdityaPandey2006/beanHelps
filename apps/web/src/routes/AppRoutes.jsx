import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import AdminHome from "../pages/AdminHome.jsx";
import AdminReports from "../pages/AdminReports.jsx";
import AdminVerifications from "../pages/AdminVerifications.jsx";
import ForumDetail from "../pages/ForumDetail.jsx";
import ForumsPage from "../pages/ForumsPage.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import NotFound from "../pages/NotFound.jsx";
import PostDetail from "../pages/PostDetail.jsx";
import Signup from "../pages/Signup.jsx";
import SupportGroupDetail from "../pages/SupportGroupDetail.jsx";
import SupportGroupsPage from "../pages/SupportGroupsPage.jsx";
import TherapistHome from "../pages/TherapistHome.jsx";
import TherapistOnboarding from "../pages/TherapistOnboarding.jsx";
import UserOnboarding from "../pages/UserOnboarding.jsx";
import {
  BeanerOnboardingGuard,
  ProtectedRoute,
  PublicOnlyRoute,
  TherapistOnboardingGuard,
} from "./RouteGuards.jsx";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Route>

      <Route element={<BeanerOnboardingGuard />}>
        <Route path="/onboarding/user" element={<UserOnboarding />} />
      </Route>

      <Route element={<TherapistOnboardingGuard />}>
        <Route path="/onboarding/therapist" element={<TherapistOnboarding />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route element={<ProtectedRoute roles={["beaner"]} />}>
            <Route path="/home" element={<Home />} />
          </Route>

          <Route element={<ProtectedRoute roles={["beanpist"]} />}>
            <Route path="/therapist/home" element={<TherapistHome />} />
          </Route>

          <Route element={<ProtectedRoute roles={["beaner", "beanpist"]} />}>
            <Route path="/forums" element={<ForumsPage />} />
            <Route path="/forums/:forumKey" element={<ForumDetail />} />
            <Route path="/forums/posts/:postId" element={<PostDetail />} />
            <Route path="/support-groups" element={<SupportGroupsPage />} />
            <Route path="/support-groups/:groupId" element={<SupportGroupDetail />} />
          </Route>

          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/verifications" element={<AdminVerifications />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
