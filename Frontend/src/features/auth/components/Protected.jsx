import { useAuth } from "../hooks/useAuth";
import { Navigate, useLocation } from "react-router";
import React from 'react'
import PageLoader from "../../../components/PageLoader";

const Protected = ({children}) => {
    const { loading, user } = useAuth()
    const location = useLocation()

    if(loading){
        return <PageLoader />
    }

    if(!user){
        return <Navigate to={'/'} state={{ from: location }} replace />
    }
    
    return children
}

export default Protected