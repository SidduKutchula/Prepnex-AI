/* eslint-disable react-refresh/only-export-components */
import React, { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router";
import Protected from "./features/auth/components/Protected";
import PageWrapper from "./components/PageWrapper";
import DashboardLayout from "./layouts/DashboardLayout";

// Lazy-load all page components — each becomes its own chunk
// so the user only downloads the code for the page they visit
const Intro = lazy(() => import("./features/interview/pages/Intro"));
const Login = lazy(() => import("./features/auth/pages/Login"));
const InterviewLanding = lazy(() => import("./features/interview/pages/InterviewLanding"));
const Interview = lazy(() => import("./features/interview/pages/Interview"));
const Resume = lazy(() => import("./features/interview/pages/Resume"));
const History = lazy(() => import("./features/history/pages/History"));
const CompareAnalyses = lazy(() => import("./features/history/pages/CompareAnalyses"));
const NotFound = lazy(() => import("./components/NotFound"));

import PageLoader from "./components/PageLoader";

const wrap = (element) => (
    <Suspense fallback={<PageLoader />}>
        <PageWrapper>{element}</PageWrapper>
    </Suspense>
)

export const router = createBrowserRouter([
    {
        path: "/",
        element: wrap(<Intro />)
    },
    {
        path: "/login",
        element: wrap(<Login />)
    },
    {
        element: (
            <Suspense fallback={<PageLoader />}>
                <Protected>
                    <DashboardLayout />
                </Protected>
            </Suspense>
        ),
        children: [
            {
                path: "/interview",
                element: <InterviewLanding />
            },
            {
                path: "/resume",
                element: <Resume />
            },
            {
                path: "/preparation",
                element: <InterviewLanding />
            },
            {
                path: "/history",
                element: <History />
            },
            {
                path: "/history/compare",
                element: <CompareAnalyses />
            },
            {
                path: "/interview/:interviewId",
                element: <Interview />
            }
        ]
    },
    {
        path: "*",
        element: wrap(<NotFound />)
    }
])